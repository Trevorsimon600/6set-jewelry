import { supabase } from "./supabaseClient";

import {
  sendOrderCreatedNotifications,
  sendPaymentSubmittedNotifications,
  sendPaymentVerifiedNotification,
  sendPaymentRejectedNotification,
} from "../services/communicationService";

import { fetchShopSettings } from "./settingsService";

/*
|--------------------------------------------------------------------------
| GET ADMIN CONTACT
|--------------------------------------------------------------------------
|
| Pulls the admin's WhatsApp/phone and email from shop_settings for
| admin-facing notifications. Best-effort — if settings can't be
| loaded, notifications still get created, just without contact info
| attached (they're logged either way).
|
|--------------------------------------------------------------------------
*/

async function getAdminContact() {
  try {
    const settings = await fetchShopSettings();

    return {
      adminPhone:
        settings?.whatsapp_number ||
        settings?.phone ||
        null,

      adminEmail: settings?.email || null,
    };
  } catch (error) {
    console.error(
      "Could not load admin contact for notifications:",
      error
    );

    return { adminPhone: null, adminEmail: null };
  }
}

/*
|--------------------------------------------------------------------------
| RESTORE INVENTORY FOR ORDER
|--------------------------------------------------------------------------
|
| Shared by rejectPayment() and updateOrderStatus() (on cancellation).
|
| If the order's stock was deducted at checkout, this adds every
| unit back to current_stock, logs a "return" row per product in
| inventory_movements, and flips the order to inventory_status:
| "Released".
|
| No-op if the order was never deducted in the first place (e.g. it
| already failed, or was already released).
|
| Best-effort throughout: whatever already succeeded on the order
| itself (a rejection, a cancellation) is never undone by a
| restoration problem here — everything is logged, nothing throws.
|
|--------------------------------------------------------------------------
*/

async function restoreInventoryForOrder(
  order,
  normalizedOrderId,
  reasonLabel
) {
  try {
    if (!order || order.inventory_status !== "Deducted") {
      return;
    }

    const {
      data: itemsToRestore,
      error: itemsFetchError,
    } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", normalizedOrderId);

    if (itemsFetchError) {
      console.error(
        "Could not load order items to restore stock:",
        itemsFetchError
      );
      return;
    }

    let restoreFailed = false;

    for (const item of itemsToRestore || []) {
      if (!item.product_id) {
        continue;
      }

      const {
        data: product,
        error: productFetchError,
      } = await supabase
        .from("products")
        .select("current_stock")
        .eq("id", item.product_id)
        .maybeSingle();

      if (productFetchError || !product) {
        console.error(
          "Could not load product to restore stock:",
          item.product_id,
          productFetchError
        );

        restoreFailed = true;
        continue;
      }

      const previousStock =
        Number(product.current_stock) || 0;

      const newStock =
        previousStock + Number(item.quantity);

      const { error: restoreError } =
        await supabase
          .from("products")
          .update({ current_stock: newStock })
          .eq("id", item.product_id);

      if (restoreError) {
        console.error(
          "Inventory restoration failed for product:",
          item.product_id,
          restoreError
        );

        restoreFailed = true;
        continue;
      }

      const { error: movementError } =
        await supabase
          .from("inventory_movements")
          .insert({
            product_id: item.product_id,
            movement_type: "return",
            quantity_change: Number(item.quantity),
            previous_stock: previousStock,
            new_stock: newStock,
            order_id: normalizedOrderId,
            reason: reasonLabel,
          });

      if (movementError) {
        console.error(
          "Inventory movement log failed for product:",
          item.product_id,
          movementError
        );
      }
    }

    if (!restoreFailed) {
      const { error: releaseStatusError } =
        await supabase
          .from("orders")
          .update({ inventory_status: "Released" })
          .eq("id", normalizedOrderId);

      if (releaseStatusError) {
        console.error(
          "Could not update order inventory_status to Released:",
          releaseStatusError
        );
      }
    }
  } catch (error) {
    console.error(
      "restoreInventoryForOrder() failed:",
      error
    );
  }
}



export const ORDER_STATUS = {
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_SUBMITTED: "Payment Submitted",
  CONFIRMED: "Confirmed",
  READY_FOR_DELIVERY: "Ready for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS = {
  PENDING: "Pending",
  PAYMENT_SUBMITTED: "Payment Submitted",
  PAYMENT_VERIFIED: "Payment Verified",
  PAYMENT_REJECTED: "Payment Rejected",
};

/*
|--------------------------------------------------------------------------
| ORDER SERVICE
|--------------------------------------------------------------------------
| 6SET JEWELRY
|
| Step 2:
| - Customer management
| - Product validation
| - Price calculation
| - Delivery calculation
| - Order creation
| - Order item creation
|
| NOT YET:
| - Inventory deduction
| - Payment verification
| - Order status management
| - Admin operations
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| ERROR HANDLING
|--------------------------------------------------------------------------
*/

function createServiceError(message, details = null) {
  const error = new Error(message);

  error.name = "OrderServiceError";
  error.details = details;

  return error;
}


/*
|--------------------------------------------------------------------------
| BASIC VALIDATION HELPERS
|--------------------------------------------------------------------------
*/

function validateCustomerData(customer) {
  if (!customer) {
    throw createServiceError("Customer information is required.");
  }

  const name = String(customer.name || "").trim();
  const phone = String(customer.phone || "").trim();

  if (!name) {
    throw createServiceError("Customer name is required.");
  }

  if (!phone) {
    throw createServiceError("Customer phone number is required.");
  }

  return {
    name,
    phone,
    email: customer.email
      ? String(customer.email).trim()
      : null,

    location: customer.location
      ? String(customer.location).trim()
      : null,

    instructions: customer.instructions
      ? String(customer.instructions).trim()
      : null,
  };
}


/*
|--------------------------------------------------------------------------
| CART VALIDATION
|--------------------------------------------------------------------------
*/

function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createServiceError("Your cart is empty.");
  }

  return items.map((item, index) => {
    if (!item) {
      throw createServiceError(
        `Cart item ${index + 1} is invalid.`
      );
    }

    const productId =
      item.product_id ||
      item.productId ||
      item.id;

    const quantity = Number(item.quantity);

    if (!productId) {
      throw createServiceError(
        `Cart item ${index + 1} is missing a product ID.`
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createServiceError(
        `Invalid quantity for cart item ${index + 1}.`
      );
    }

    return {
      productId,
      quantity,
    };
  });
}


/*
|--------------------------------------------------------------------------
| ORDER NUMBER
|--------------------------------------------------------------------------
|
| Example:
| 6SET-20260821-AB12
|
|--------------------------------------------------------------------------
*/

function generateOrderNumber() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `6SET-${year}${month}${day}-${randomPart}`;
}


/*
|--------------------------------------------------------------------------
| BUILD ORDER VIEW
|--------------------------------------------------------------------------
|
| Takes a raw `orders` row (snake_case, as stored in Supabase) plus its
| raw `order_items` rows, and returns a superset object:
|
|   - every original snake_case column stays exactly as-is
|     (customer-facing code like OrderContext.jsx / Payment.jsx relies
|     on this and must not break)
|
|   - PLUS a nested, camelCase "admin view" shape layered on top
|     (order_number)      -> orderNumber
|     (order_status)      -> orderStatus
|     (created_at)        -> createdAt
|     (customer_*)        -> customer: { name, phone, location, instructions }
|     (payment_*)         -> payment:  { method, recipient, number,
|                                         reference, status, submittedAt,
|                                         verifiedAt, rejectionReason }
|     (delivery_*)        -> delivery: { status, location, instructions, cost }
|     (inventory_*)       -> inventory: { status, deductedAt }
|     (order_items rows)  -> items: [{ id, orderItemId, name, category,
|                                       productCode, price, quantity,
|                                       total, image }]
|
| This is what AdminOrderDetails.jsx / AdminOrders.jsx expect.
|
|--------------------------------------------------------------------------
*/

export function buildOrderView(order, items = []) {
  if (!order) {
    return null;
  }

  const mappedItems = (Array.isArray(items) ? items : []).map(
    (item) => ({
      ...item,

      id: item.id,

      orderItemId: item.id,

      name:
        item.product_name ||
        item.name ||
        "Unnamed Product",

      category:
        item.category_name ||
        item.category ||
        "",

      productCode:
        item.product_code ||
        item.productCode ||
        "",

      price: Number(item.price || 0),

      quantity: Number(item.quantity || 0),

      total: Number(
        item.item_total ??
          item.total_price ??
          Number(item.price || 0) *
            Number(item.quantity || 0)
      ),

      image:
        item.image_url ||
        item.image ||
        "",
    })
  );

  return {
    ...order,

    orderNumber: order.order_number || "",

    orderStatus: order.order_status || "",

    createdAt: order.created_at || null,

    updatedAt: order.updated_at || null,

    subtotal: Number(order.subtotal || 0),

    total: Number(order.total || 0),

    customer: {
      name: order.customer_name || "",
      phone: order.customer_phone || "",
      location: order.customer_location || "",
      instructions: order.customer_instructions || "",
    },

    payment: {
      method: order.payment_method || "",
      recipient: order.payment_recipient || "",
      number: order.payment_number || "",
      reference: order.payment_reference || "",
      status: order.payment_status || "Pending",
      submittedAt: order.payment_submitted_at || null,
      verifiedAt: order.payment_verified_at || null,
      rejectionReason: order.payment_rejection_reason || "",
    },

    delivery: {
      status: order.delivery_status || "To be arranged",
      location: order.delivery_location || "",
      instructions: order.delivery_instructions || "",
      cost:
        order.delivery_cost === null ||
        order.delivery_cost === undefined
          ? null
          : Number(order.delivery_cost),
    },

    inventory: {
      status: order.inventory_status || "Not Reserved",
      deductedAt: order.inventory_deducted_at || null,
    },

    items: mappedItems,
  };
}


/*
|--------------------------------------------------------------------------
| FIND OR CREATE CUSTOMER
|--------------------------------------------------------------------------
|
| Customers are identified by phone number.
|
|--------------------------------------------------------------------------
*/

export async function findOrCreateCustomer(customerData) {
  const customer = validateCustomerData(customerData);

  /*
  |--------------------------------------------------------------------------
  | FIND EXISTING CUSTOMER
  |--------------------------------------------------------------------------
  */

  const { data: existingCustomer, error: findError } =
    await supabase
      .from("customers")
      .select("*")
      .eq("phone", customer.phone)
      .maybeSingle();

  if (findError) {
    console.error(
      "Customer lookup failed:",
      findError
    );

    throw createServiceError(
      "Unable to find customer.",
      findError
    );
  }


  /*
  |--------------------------------------------------------------------------
  | EXISTING CUSTOMER
  |--------------------------------------------------------------------------
  */

  if (existingCustomer) {
    return existingCustomer;
  }


  /*
  |--------------------------------------------------------------------------
  | CREATE NEW CUSTOMER
  |--------------------------------------------------------------------------
  */

  const { data: newCustomer, error: createError } =
    await supabase
      .from("customers")
      .insert({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        location: customer.location,
        notes: customer.instructions,

        total_orders: 0,
        total_spent: 0,
      })
      .select()
      .single();

  if (createError) {
    /*
    |--------------------------------------------------------------------------
    | POSSIBLE RACE CONDITION
    |--------------------------------------------------------------------------
    | If another request created the same phone number at the same time,
    | try to retrieve that customer.
    |--------------------------------------------------------------------------
    */

    if (createError.code === "23505") {
      const { data: retryCustomer, error: retryError } =
        await supabase
          .from("customers")
          .select("*")
          .eq("phone", customer.phone)
          .maybeSingle();

      if (retryError || !retryCustomer) {
        throw createServiceError(
          "Customer already exists, but could not be retrieved.",
          retryError || createError
        );
      }

      return retryCustomer;
    }

    console.error(
      "Customer creation failed:",
      createError
    );

    throw createServiceError(
      "Unable to create customer.",
      createError
    );
  }

  return newCustomer;
}


/*
|--------------------------------------------------------------------------
| LOAD PRODUCTS
|--------------------------------------------------------------------------
*/

export async function loadProducts(cartItems) {
  const productIds = cartItems.map(
    (item) => item.productId
  );

  const { data: products, error } =
    await supabase
      .from("products")
      .select(`
        id,
        product_code,
        name,
        category_id,
        description,
        price,
        current_stock,
        minimum_order_quantity,
        maximum_order_quantity,
        published,
        main_image_url,
        categories (
          id,
          name
        )
      `)
      .in("id", productIds);

  if (error) {
    console.error(
      "Product loading failed:",
      error
    );

    throw createServiceError(
      "Unable to load products.",
      error
    );
  }

  if (!products || products.length === 0) {
    throw createServiceError(
      "None of the requested products could be found."
    );
  }

  return products;
}


/*
|--------------------------------------------------------------------------
| VALIDATE PRODUCTS
|--------------------------------------------------------------------------
*/

function validateProducts(cartItems, products) {
  const productMap = new Map(
    products.map((product) => [
      product.id,
      product,
    ])
  );

  const validatedItems = [];

  for (const item of cartItems) {
    const product = productMap.get(
      item.productId
    );

    // ----------------------------------------------
    // PRODUCT DOES NOT EXIST
    // ----------------------------------------------

    if (!product) {
      throw createServiceError(
        `Product ${item.productId} could not be found.`
      );
    }

    // ----------------------------------------------
    // PRODUCT MUST BE PUBLISHED
    // ----------------------------------------------

    if (!product.published) {
      throw createServiceError(
        `${product.name} is currently unavailable.`
      );
    }

    // ----------------------------------------------
    // MINIMUM QUANTITY
    // ----------------------------------------------

    if (
      item.quantity <
      product.minimum_order_quantity
    ) {
      throw createServiceError(
        `${product.name} requires a minimum quantity of ${product.minimum_order_quantity}.`
      );
    }

    // ----------------------------------------------
    // MAXIMUM QUANTITY
    // ----------------------------------------------

    if (
      item.quantity >
      product.maximum_order_quantity
    ) {
      throw createServiceError(
        `${product.name} allows a maximum quantity of ${product.maximum_order_quantity}.`
      );
    }

    // ----------------------------------------------
    // STOCK CHECK
    // ----------------------------------------------

    if (
      item.quantity >
      product.current_stock
    ) {
      throw createServiceError(
        `${product.name} only has ${product.current_stock} item(s) available.`
      );
    }

    // ----------------------------------------------
    // PRICE MUST COME FROM DATABASE
    // ----------------------------------------------

    const price = Number(product.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw createServiceError(
        `Invalid price for ${product.name}.`
      );
    }

    // ----------------------------------------------
    // CALCULATE ITEM TOTAL
    // ----------------------------------------------

    const itemTotal =
      price * item.quantity;

    // ----------------------------------------------
    // PRESERVE CART ITEM DATA
    // ----------------------------------------------

    validatedItems.push({
      product,

      // IMPORTANT:
      // Checkout uses item.image.
      // Preserve it so createOrder() can
      // save it as order_items.image_url.
      image:
        item.image ||
        product.image ||
        product.image_url ||
        product.imageUrl ||
        null,

      quantity: item.quantity,

      price,

      itemTotal,
    });
  }

  return validatedItems;
}


/*
|--------------------------------------------------------------------------
| CALCULATE SUBTOTAL
|--------------------------------------------------------------------------
*/

function calculateSubtotal(items) {
  return items.reduce(
    (total, item) => {
      return total + item.itemTotal;
    },
    0
  );
}


/*
|--------------------------------------------------------------------------
| CALCULATE DELIVERY
|--------------------------------------------------------------------------
|
| 6Set currently handles delivery manually.
|
| Therefore Step 2 uses KES 0 as the initial stored delivery cost.
|
| We will replace this with the proper delivery engine later.
|
|--------------------------------------------------------------------------
*/

function calculateDeliveryCost({
  customer,
  items,
}) {
  /*
  |--------------------------------------------------------------------------
  | FUTURE:
  |
  | - Location-based delivery
  | - Free delivery rules
  | - Delivery zones
  | - Distance pricing
  | - Special delivery fees
  |--------------------------------------------------------------------------
  */

  return 0
}


/*
|--------------------------------------------------------------------------
| CALCULATE TOTAL
|--------------------------------------------------------------------------
*/

function calculateTotal(
  subtotal,
  deliveryCost
) {
  return subtotal + deliveryCost;
}


/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
|
| MAIN PUBLIC FUNCTION
|--------------------------------------------------------------------------
*/

export async function createOrder({
  customer,
  cartItems,
  subtotal,
}) {
  try {
    // ----------------------------------------------
    // VALIDATE CUSTOMER
    // ----------------------------------------------

    const validatedCustomer =
      validateCustomerData(customer);

    // ----------------------------------------------
    // VALIDATE CART
    // ----------------------------------------------

    const validatedCartItems =
      validateCartItems(cartItems);

    // ----------------------------------------------
    // FIND OR CREATE CUSTOMER
    // ----------------------------------------------

    const customerRecord =
      await findOrCreateCustomer(
        validatedCustomer
      );

    // ----------------------------------------------
    // LOAD PRODUCTS FROM DATABASE
    // ----------------------------------------------

    const products =
      await loadProducts(
        validatedCartItems
      );

    // ----------------------------------------------
    // VALIDATE PRODUCTS
    // ----------------------------------------------

    const validatedItems =
      validateProducts(
        validatedCartItems,
        products
      );

    // ----------------------------------------------
    // CALCULATE PRICING
    // ----------------------------------------------

    const calculatedSubtotal =
      calculateSubtotal(
        validatedItems
      );

    const deliveryCost =
      calculateDeliveryCost({
        customer: validatedCustomer,
        items: validatedItems,
      });

    const total =
      calculateTotal(
        calculatedSubtotal,
        deliveryCost
      );

    // ----------------------------------------------
    // GENERATE ORDER NUMBER
    // ----------------------------------------------

    const orderNumber =
      generateOrderNumber();

    // ----------------------------------------------
    // CREATE ORDER
    // ----------------------------------------------

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,

        customer_id:
          customerRecord.id,

        customer_name:
          validatedCustomer.name,

        customer_phone:
          validatedCustomer.phone,


        customer_location:
          validatedCustomer.location,

        subtotal:
          calculatedSubtotal,

        delivery_cost:
          deliveryCost,

        total,

        order_status:
          ORDER_STATUS.AWAITING_PAYMENT,

        payment_status:
          PAYMENT_STATUS.PENDING,
      })
      .select()
      .single();

    if (orderError) {
      console.error(
        "Order creation failed:",
        orderError
      );

      throw createServiceError(
        "Unable to create order.",
        orderError
      );
    }

    // ----------------------------------------------
    // CREATE ORDER ITEMS
    // ----------------------------------------------

    const orderItemsPayload =
      validatedItems.map((item) => {

        // --------------------------------------------
        // NORMALIZE QUANTITY
        // --------------------------------------------

        const quantity =
          Number(item.quantity) || 1

        // --------------------------------------------
        // NORMALIZE PRICE
        // --------------------------------------------

        const price =
          Number(item.price) || 0

        // --------------------------------------------
        // CALCULATE ITEM TOTAL
        // --------------------------------------------

        const itemTotal =
          Number(item.itemTotal) ||
          price * quantity

        // --------------------------------------------
        // BUILD DATABASE ROW
        // --------------------------------------------

        return {
          order_id:
            order.id,

          product_id:
            item.product?.id || null,

          product_code:
            item.product?.product_code ||
            null,

          product_name:
            item.product?.name ||
            'Unknown Product',

          category_id:
            item.product?.category_id ||
            null,

          category_name:
            item.product?.categories?.name ||
            null,

          description:
            item.product?.description ||
            null,

          price,

          quantity,

          image_url:
            item.image ||
            item.product?.main_image_url ||
            null,

          item_total:
            itemTotal,

          total_price:
            itemTotal,
        }
      })

    const {
      data: createdItems,
      error: itemsError,
    } = await supabase
      .from("order_items")
      .insert(orderItemsPayload)
      .select()

    if (itemsError) {

      console.error(
        "Order items creation failed:",
        itemsError
      )

      throw createServiceError(
        "Unable to create order items.",
        itemsError
      )
    }

    // ----------------------------------------------
    // DEDUCT INVENTORY
    // ----------------------------------------------
    //
    // Stock is taken the moment the order is placed,
    // not when payment is verified. If the payment is
    // later rejected, rejectPayment() puts it back.
    //
    // Best-effort: if this fails partway through, the
    // order itself is NOT rolled back (the customer
    // still needs to reach the payment page) — instead
    // the order is flagged inventory_status: "Failed"
    // so an admin can sort it out manually.
    //

    let inventoryDeductionFailed = false

    for (const item of validatedItems) {

      if (!item.product?.id) {
        continue
      }

      const previousStock =
        Number(item.product.current_stock) || 0

      const newStock = Math.max(
        0,
        previousStock - Number(item.quantity)
      )

      const { error: stockUpdateError } =
        await supabase
          .from("products")
          .update({ current_stock: newStock })
          .eq("id", item.product.id)

      if (stockUpdateError) {
        console.error(
          "Inventory deduction failed for product:",
          item.product.id,
          stockUpdateError
        )

        inventoryDeductionFailed = true
        continue
      }

      const { error: movementError } =
        await supabase
          .from("inventory_movements")
          .insert({
            product_id: item.product.id,
            movement_type: "sale",
            quantity_change: -Number(item.quantity),
            previous_stock: previousStock,
            new_stock: newStock,
            order_id: order.id,
            reason: "Order placed",
          })

      if (movementError) {
        console.error(
          "Inventory movement log failed for product:",
          item.product.id,
          movementError
        )
      }
    }

    const { error: inventoryStatusError } =
      await supabase
        .from("orders")
        .update({
          inventory_status: inventoryDeductionFailed
            ? "Failed"
            : "Deducted",

          inventory_deducted_at: inventoryDeductionFailed
            ? null
            : new Date().toISOString(),
        })
        .eq("id", order.id)

    if (inventoryStatusError) {
      console.error(
        "Could not update order inventory_status:",
        inventoryStatusError
      )
    }

    // ----------------------------------------------
    // SEND ORDER CREATED NOTIFICATIONS
    // ----------------------------------------------
    //
    // Best-effort — a notification failure never
    // blocks the order the customer is waiting on.
    //

    try {
      const orderView = buildOrderView(order, createdItems);
      const adminContact = await getAdminContact();

      await sendOrderCreatedNotifications(
        orderView,
        adminContact
      );
    } catch (notificationError) {
      console.error(
        "sendOrderCreatedNotifications() failed:",
        notificationError
      );
    }

    // ----------------------------------------------
    // RETURN COMPLETE ORDER
    // ----------------------------------------------

    return {
      ...order,

      orderNumber:
        order.order_number,

      items:
        createdItems || [],

      pricing: {
        subtotal:
          calculatedSubtotal,

        deliveryCost,

        total,
      },
    };

  } catch (error) {
    console.error(
      "createOrder() failed:",
      error
    );

    throw error;
  }
} 



export async function fetchCustomers({
  search = "",
} = {}) {
  try {
    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    const normalizedSearch = String(search || "").trim();

    if (normalizedSearch) {
      query = query.or(
        [
          `name.ilike.%${normalizedSearch}%`,
          `phone.ilike.%${normalizedSearch}%`,
          `email.ilike.%${normalizedSearch}%`,
        ].join(",")
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "fetchCustomers() database error:",
        error
      );

      throw createServiceError(
        "Unable to fetch customers.",
        error
      );
    }

    return data || [];
  } catch (error) {
    console.error(
      "fetchCustomers() failed:",
      error
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| FETCH ORDER BY ORDER NUMBER
|--------------------------------------------------------------------------
|
| Finds a complete order using its public order number.
|
| Example:
| 6SET-20260821-AB12
|
|--------------------------------------------------------------------------
*/

export async function fetchOrderByNumber(orderNumber) {
  try {
    /*
    |--------------------------------------------------------------------------
    | VALIDATE ORDER NUMBER
    |--------------------------------------------------------------------------
    */

    const normalizedOrderNumber =
      String(orderNumber || "").trim();

    if (!normalizedOrderNumber) {
      throw createServiceError(
        "Order number is required."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH ORDER
    |--------------------------------------------------------------------------
    */

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", normalizedOrderNumber)
      .maybeSingle();


    if (orderError) {
      console.error(
        "Fetch order failed:",
        orderError
      );

      throw createServiceError(
        "Unable to fetch order.",
        orderError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | ORDER NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!order) {
      return null;
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    const {
      data: orderItems,
      error: itemsError,
    } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", {
        ascending: true,
      });


    if (itemsError) {
      console.error(
        "Fetch order items failed:",
        itemsError
      );

      throw createServiceError(
        "Unable to fetch order items.",
        itemsError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RETURN COMPLETE ORDER
    |--------------------------------------------------------------------------
    */

    return buildOrderView(order, orderItems);

  } catch (error) {
    console.error(
      "fetchOrderByNumber() failed:",
      error
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| SUBMIT PAYMENT
|--------------------------------------------------------------------------
|
| Records a customer's manual payment submission.
|
| Current payment method:
| Pochi la Biashara
|
| This does NOT verify the payment.
| It only records the customer's submitted reference.
|
|--------------------------------------------------------------------------
*/

export async function submitPayment({
  orderNumber,
  paymentReference,
}) {
  try {
    /*
    |--------------------------------------------------------------------------
    | VALIDATE ORDER NUMBER
    |--------------------------------------------------------------------------
    */

    const normalizedOrderNumber =
      String(orderNumber || "").trim();

    if (!normalizedOrderNumber) {
      throw createServiceError(
        "Order number is required."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDATE PAYMENT REFERENCE
    |--------------------------------------------------------------------------
    */

    const normalizedReference =
      String(paymentReference || "").trim();

    if (!normalizedReference) {
      throw createServiceError(
        "A payment reference is required."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH CURRENT ORDER
    |--------------------------------------------------------------------------
    */

    const {
      data: order,
      error: fetchError,
    } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", normalizedOrderNumber)
      .maybeSingle();


    if (fetchError) {
      console.error(
        "Submit payment order lookup failed:",
        fetchError
      );

      throw createServiceError(
        "Unable to find order.",
        fetchError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | ORDER NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!order) {
      throw createServiceError(
        "Order could not be found."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | PREVENT SUBMITTING PAYMENT FOR A CANCELLED ORDER
    |--------------------------------------------------------------------------
    */

    if (order.order_status === ORDER_STATUS.CANCELLED) {
      throw createServiceError(
        "Payment cannot be submitted for a cancelled order."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE ORDER WITH PAYMENT REFERENCE
    |--------------------------------------------------------------------------
    */

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        payment_reference:
          normalizedReference,

        payment_status:
          PAYMENT_STATUS.PAYMENT_SUBMITTED,

        order_status:
          ORDER_STATUS.PAYMENT_SUBMITTED,
      })
      .eq("id", order.id)
      .select()
      .single();


    if (updateError) {
      console.error(
        "Payment submission failed:",
        updateError
      );

      throw createServiceError(
        "Unable to submit payment.",
        updateError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RECORD STATUS HISTORY
    |--------------------------------------------------------------------------
    */

    const {
      error: historyError,
    } = await supabase
      .from("order_status_history")
      .insert({
        order_id:
          order.id,

        old_status:
          order.order_status,

        new_status:
          ORDER_STATUS.PAYMENT_SUBMITTED,

        note:
          `Payment reference submitted: ${normalizedReference}`,
      });


    if (historyError) {
      console.error(
        "Payment submission history failed:",
        historyError
      );

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | The order update has already succeeded.
      | We don't undo it here because this service is
      | currently using separate Supabase operations.
      |
      |--------------------------------------------------------------------------
      */
    }


    /*
    |--------------------------------------------------------------------------
    | RELOAD COMPLETE ORDER
    |--------------------------------------------------------------------------
    |
    | The update above only touches the orders table.
    | fetchOrderByNumber() also loads order_items.
    |
    | Therefore we reload the complete order
    | before returning it.
    |
    |--------------------------------------------------------------------------
    */

    const completeOrder =
      await fetchOrderByNumber(
        updatedOrder.order_number
      );

    const orderForNotification =
      completeOrder || buildOrderView(updatedOrder, []);

    // ----------------------------------------------
    // SEND PAYMENT SUBMITTED NOTIFICATIONS
    // ----------------------------------------------
    //
    // Best-effort — never blocks the response the
    // customer is waiting on.
    //

    try {
      const adminContact = await getAdminContact();

      await sendPaymentSubmittedNotifications(
        orderForNotification,
        adminContact
      );
    } catch (notificationError) {
      console.error(
        "sendPaymentSubmittedNotifications() failed:",
        notificationError
      );
    }

    return orderForNotification;

  } catch (error) {
    console.error(
      "submitPayment() failed:",
      error
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| FETCH ORDER STATUS HISTORY
|--------------------------------------------------------------------------
|
| Retrieves the complete status history for an order.
|
| Used by:
| AdminOrderDetails.jsx
|
|--------------------------------------------------------------------------
*/

export async function fetchOrderStatusHistory(orderId) {
  try {
    /*
    |--------------------------------------------------------------------------
    | VALIDATE ORDER ID
    |--------------------------------------------------------------------------
    */

    const normalizedOrderId =
      String(orderId || "").trim();

    if (!normalizedOrderId) {
      throw createServiceError(
        "Order ID is required."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH STATUS HISTORY
    |--------------------------------------------------------------------------
    */

    const {
      data: history,
      error,
    } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", normalizedOrderId)
      .order("created_at", {
        ascending: true,
      });


    /*
    |--------------------------------------------------------------------------
    | HANDLE DATABASE ERROR
    |--------------------------------------------------------------------------
    */

    if (error) {
      console.error(
        "Order status history lookup failed:",
        error
      );

      throw createServiceError(
        "Unable to fetch order status history.",
        error
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RETURN HISTORY
    |--------------------------------------------------------------------------
    */

    return history || [];

  } catch (error) {
    console.error(
      "fetchOrderStatusHistory() failed:",
      error
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| REJECT PAYMENT
|--------------------------------------------------------------------------
|
| Allows an administrator to reject a submitted payment.
|
| Example reasons:
| - Invalid M-Pesa reference
| - Payment not received
| - Incorrect amount
|
|--------------------------------------------------------------------------
*/

export async function rejectPayment(
  orderIdOrOptions,
  reasonOrOptions,
  maybeOptions
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | NORMALIZE ARGUMENTS
    |--------------------------------------------------------------------------
    |
    | Supports all of:
    |
    |   rejectPayment(orderId, reason)
    |   rejectPayment(orderId, reason, { changedBy })
    |   rejectPayment({ orderId, reason, changedBy })
    |
    |--------------------------------------------------------------------------
    */

    const orderId =
      typeof orderIdOrOptions === "string"
        ? orderIdOrOptions
        : orderIdOrOptions?.orderId;

    const reason =
      typeof reasonOrOptions === "string"
        ? reasonOrOptions
        : reasonOrOptions?.reason ??
          orderIdOrOptions?.reason;

    const changedBy =
      (typeof reasonOrOptions === "object"
        ? reasonOrOptions?.changedBy
        : null) ??
      orderIdOrOptions?.changedBy ??
      maybeOptions?.changedBy ??
      null;


    /*
    |--------------------------------------------------------------------------
    | VALIDATE ORDER ID
    |--------------------------------------------------------------------------
    */

    const normalizedOrderId =
      String(orderId || "").trim();

    if (!normalizedOrderId) {
      throw createServiceError(
        "Order ID is required."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDATE REJECTION REASON
    |--------------------------------------------------------------------------
    */

    const normalizedReason =
      String(reason || "").trim();

    if (!normalizedReason) {
      throw createServiceError(
        "A payment rejection reason is required."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH CURRENT ORDER
    |--------------------------------------------------------------------------
    */

    const {
      data: order,
      error: fetchError,
    } = await supabase
      .from("orders")
      .select("*")
      .eq("id", normalizedOrderId)
      .maybeSingle();


    if (fetchError) {
      console.error(
        "Reject payment order lookup failed:",
        fetchError
      );

      throw createServiceError(
        "Unable to find order.",
        fetchError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | ORDER NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!order) {
      throw createServiceError(
        "Order could not be found."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | PREVENT REJECTING A COMPLETED PAYMENT
    |--------------------------------------------------------------------------
    */

    if (
      order.payment_status ===
      "Payment Verified"
    ) {
      throw createServiceError(
        "A verified payment cannot be rejected."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE PAYMENT STATUS
    |--------------------------------------------------------------------------
    */

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        payment_status:
          "Payment Rejected",

        payment_rejection_reason:
          normalizedReason,

        order_status:
          "Awaiting Payment",
      })
      .eq("id", normalizedOrderId)
      .select()
      .single();


    if (updateError) {
      console.error(
        "Payment rejection failed:",
        updateError
      );

      throw createServiceError(
        "Unable to reject payment.",
        updateError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RECORD STATUS HISTORY
    |--------------------------------------------------------------------------
    */

    const {
      error: historyError,
    } = await supabase
      .from("order_status_history")
      .insert({
        order_id:
          normalizedOrderId,

        old_status:
          order.order_status,

        new_status:
          "Awaiting Payment",

        changed_by:
          changedBy || null,

        note:
          `Payment rejected: ${normalizedReason}`,
      });


    if (historyError) {
      console.error(
        "Payment rejection history failed:",
        historyError
      );

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | The order update has already succeeded.
      | We don't undo it here because this service is
      | currently using separate Supabase operations.
      |
      |--------------------------------------------------------------------------
      */
    }


    /*
    |--------------------------------------------------------------------------
    | RESTORE INVENTORY (IF IT WAS DEDUCTED)
    |--------------------------------------------------------------------------
    |
    | createOrder() deducts stock the moment an order is placed.
    | A rejected payment means that sale never actually happened,
    | so every unit gets added back to current_stock.
    |
    | Best-effort: rejecting the payment has already succeeded
    | above and is never undone by a restoration failure here.
    |
    |--------------------------------------------------------------------------
    */

    await restoreInventoryForOrder(
      order,
      normalizedOrderId,
      "Payment rejected — stock restored"
    );


    /*
    |--------------------------------------------------------------------------
    | RELOAD COMPLETE ORDER
    |--------------------------------------------------------------------------
    |
    | Reload with order_items so the returned order matches the
    | same nested admin shape used everywhere else.
    |
    |--------------------------------------------------------------------------
    */

    const completeOrder =
      await fetchOrderByNumber(
        updatedOrder.order_number
      );

    const orderForNotification =
      completeOrder || buildOrderView(updatedOrder, []);

    // ----------------------------------------------
    // SEND PAYMENT REJECTED NOTIFICATION
    // ----------------------------------------------
    //
    // Best-effort — never blocks the rejection
    // itself, which has already succeeded above.
    //

    try {
      await sendPaymentRejectedNotification(
        orderForNotification,
        reason
      );
    } catch (notificationError) {
      console.error(
        "sendPaymentRejectedNotification() failed:",
        notificationError
      );
    }

    return orderForNotification;

  } catch (error) {
    console.error(
      "rejectPayment() failed:",
      error
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE ORDER STATUS
|--------------------------------------------------------------------------
|
| Allows an administrator to move an order through the official
| 6Set Jewelry order-status workflow.
|
|--------------------------------------------------------------------------
*/

export async function updateOrderStatus({
  orderId,
  newStatus,
  note = null,
  changedBy = null,
}) {
  try {
    /*
    |--------------------------------------------------------------------------
    | VALIDATE ORDER ID
    |--------------------------------------------------------------------------
    */

    const normalizedOrderId =
      String(orderId || "").trim();

    if (!normalizedOrderId) {
      throw createServiceError(
        "Order ID is required."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | VALID ORDER STATUSES
    |--------------------------------------------------------------------------
    */

    const validStatuses = Object.values(ORDER_STATUS);


    /*
    |--------------------------------------------------------------------------
    | VALIDATE NEW STATUS
    |--------------------------------------------------------------------------
    */

    const normalizedStatus =
      String(newStatus || "").trim();

    if (!validStatuses.includes(normalizedStatus)) {
      throw createServiceError(
        `Invalid order status: ${normalizedStatus}`
      );
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH CURRENT ORDER
    |--------------------------------------------------------------------------
    */

    const {
      data: currentOrder,
      error: fetchError,
    } = await supabase
      .from("orders")
      .select("*")
      .eq("id", normalizedOrderId)
      .maybeSingle();


    if (fetchError) {
      console.error(
        "Order lookup failed:",
        fetchError
      );

      throw createServiceError(
        "Unable to find order.",
        fetchError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | ORDER NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!currentOrder) {
      throw createServiceError(
        "Order could not be found."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | NO-OP PROTECTION
    |--------------------------------------------------------------------------
    */

    if (
      currentOrder.order_status ===
      normalizedStatus
    ) {
      const noopOrder =
        await fetchOrderByNumber(
          currentOrder.order_number
        );

      return (
        noopOrder ||
        buildOrderView(currentOrder, [])
      );
    }


    /*
    |--------------------------------------------------------------------------
    | PREVENT CHANGING COMPLETED ORDERS
    |--------------------------------------------------------------------------
    */

    if (
      currentOrder.order_status ===
      "Completed"
    ) {
      throw createServiceError(
        "A completed order cannot be changed."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE ORDER
    |--------------------------------------------------------------------------
    */

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        order_status:
          normalizedStatus,
      })
      .eq("id", normalizedOrderId)
      .select()
      .single();


    if (updateError) {
      console.error(
        "Order status update failed:",
        updateError
      );

      throw createServiceError(
        "Unable to update order status.",
        updateError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RESTORE INVENTORY (IF CANCELLED)
    |--------------------------------------------------------------------------
    |
    | Cancelling an order means the sale that deducted stock never
    | actually goes through, same as a rejected payment. Restoring
    | uses currentOrder (fetched before this update) so it still
    | reflects the inventory_status prior to this status change.
    |
    |--------------------------------------------------------------------------
    */

    if (normalizedStatus === "Cancelled") {
      await restoreInventoryForOrder(
        currentOrder,
        normalizedOrderId,
        "Order cancelled — stock restored"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RECORD STATUS HISTORY
    |--------------------------------------------------------------------------
    */

    const {
      error: historyError,
    } = await supabase
      .from("order_status_history")
      .insert({
        order_id:
          normalizedOrderId,

        old_status:
          currentOrder.order_status,

        new_status:
          normalizedStatus,

        changed_by:
          changedBy || null,

        note:
          note || null,
      });


    /*
    |--------------------------------------------------------------------------
    | HISTORY ERROR
    |--------------------------------------------------------------------------
    */

    if (historyError) {
      console.error(
        "Order status history failed:",
        historyError
      );

      /*
      |--------------------------------------------------------------------------
      | The order itself was already updated successfully.
      |
      | We return the updated order but expose the history
      | problem so it can be fixed separately.
      |--------------------------------------------------------------------------
      */
    }


    /*
    |--------------------------------------------------------------------------
    | RETURN UPDATED ORDER
    |--------------------------------------------------------------------------
    */

    const completeOrder =
      await fetchOrderByNumber(
        updatedOrder.order_number
      );

    return completeOrder || buildOrderView(updatedOrder, []);

  } catch (error) {
    console.error(
      "updateOrderStatus() failed:",
      error
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| VERIFY PAYMENT
|--------------------------------------------------------------------------
|
| Allows an administrator to confirm that a submitted payment
| has been received and verified.
|
|--------------------------------------------------------------------------
*/

export async function verifyPayment(orderIdOrOptions, maybeOptions) {
  try {
    /*
    |--------------------------------------------------------------------------
    | NORMALIZE ARGUMENTS
    |--------------------------------------------------------------------------
    |
    | Supports both calling conventions:
    |
    |   verifyPayment(orderId)
    |   verifyPayment({ orderId, note, changedBy })
    |
    |--------------------------------------------------------------------------
    */

    const options =
      typeof orderIdOrOptions === "string"
        ? { orderId: orderIdOrOptions, ...(maybeOptions || {}) }
        : orderIdOrOptions || {};

    const {
      orderId,
      note = null,
      changedBy = null,
    } = options;


    /*
    |--------------------------------------------------------------------------
    | VALIDATE ORDER ID
    |--------------------------------------------------------------------------
    */

    const normalizedOrderId =
      String(orderId || "").trim();

    if (!normalizedOrderId) {
      throw createServiceError(
        "Order ID is required."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH CURRENT ORDER
    |--------------------------------------------------------------------------
    */

    const {
      data: currentOrder,
      error: fetchError,
    } = await supabase
      .from("orders")
      .select("*")
      .eq("id", normalizedOrderId)
      .maybeSingle();


    if (fetchError) {
      console.error(
        "Payment verification lookup failed:",
        fetchError
      );

      throw createServiceError(
        "Unable to find order.",
        fetchError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | ORDER NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!currentOrder) {
      throw createServiceError(
        "Order could not be found."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | PREVENT VERIFYING A CANCELLED ORDER
    |--------------------------------------------------------------------------
    */

    if (
      currentOrder.order_status ===
      "Cancelled"
    ) {
      throw createServiceError(
        "Payment cannot be verified for a cancelled order."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | PREVENT DUPLICATE VERIFICATION
    |--------------------------------------------------------------------------
    */

    if (
      currentOrder.payment_status ===
      "Payment Verified"
    ) {
      const alreadyCompleteOrder =
        await fetchOrderByNumber(
          currentOrder.order_number
        );

      return (
        alreadyCompleteOrder ||
        buildOrderView(currentOrder, [])
      );
    }


    /*
    |--------------------------------------------------------------------------
    | PAYMENT REFERENCE CHECK
    |--------------------------------------------------------------------------
    */

    if (
      !currentOrder.payment_reference ||
      !String(currentOrder.payment_reference).trim()
    ) {
      throw createServiceError(
        "A payment reference is required before payment can be verified."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE PAYMENT
    |--------------------------------------------------------------------------
    */

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        payment_status:
          "Payment Verified",

        payment_verified_at:
          new Date().toISOString(),

        order_status:
          "Confirmed",

        payment_rejection_reason:
          null,
      })
      .eq("id", normalizedOrderId)
      .select()
      .single();


    if (updateError) {
      console.error(
        "Payment verification failed:",
        updateError
      );

      throw createServiceError(
        "Unable to verify payment.",
        updateError
      );
    }
    




    /*
    |--------------------------------------------------------------------------
    | RECORD STATUS HISTORY
    |--------------------------------------------------------------------------
    */

    const {
      error: historyError,
    } = await supabase
      .from("order_status_history")
      .insert({
        order_id:
          normalizedOrderId,

        old_status:
          currentOrder.order_status,

        new_status:
          "Confirmed",

        changed_by:
          changedBy || null,

        note:
          note ||
          "Payment verified successfully.",
      });


    /*
    |--------------------------------------------------------------------------
    | HISTORY ERROR
    |--------------------------------------------------------------------------
    */

    if (historyError) {
      console.error(
        "Payment verification history failed:",
        historyError
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RETURN UPDATED ORDER
    |--------------------------------------------------------------------------
    */

    const completeOrder =
      await fetchOrderByNumber(
        updatedOrder.order_number
      );

    const orderForNotification =
      completeOrder || buildOrderView(updatedOrder, []);

    // ----------------------------------------------
    // SEND PAYMENT VERIFIED NOTIFICATION
    // ----------------------------------------------
    //
    // Best-effort — never blocks the verification
    // itself, which has already succeeded above.
    //
    // Only reached on an actual new verification —
    // the "already verified" no-op path above
    // returns before this point, so re-clicking
    // verify on an already-verified order never
    // re-sends this.
    //

    try {
      await sendPaymentVerifiedNotification(
        orderForNotification
      );
    } catch (notificationError) {
      console.error(
        "sendPaymentVerifiedNotification() failed:",
        notificationError
      );
    }

    return orderForNotification;

  } catch (error) {
    console.error(
      "verifyPayment() failed:",
      error
    );

    throw error;

  }
}


/*
|--------------------------------------------------------------------------
| FETCH ORDERS
|--------------------------------------------------------------------------
|
| Retrieves orders for the admin orders page.
|
| Optional filters:
|
|   status        → order_status
|   paymentStatus → payment_status
|   search        → order number / customer name / phone
|
|--------------------------------------------------------------------------
*/

export async function fetchOrders({
  status = null,
  paymentStatus = null,
  search = "",
} = {}) {
  try {
    /*
    |--------------------------------------------------------------------------
    | START QUERY
    |--------------------------------------------------------------------------
    */

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", {
        ascending: false,
      });


    /*
    |--------------------------------------------------------------------------
    | ORDER STATUS FILTER
    |--------------------------------------------------------------------------
    */

    if (status) {
      query = query.eq(
        "order_status",
        status
      );
    }


    /*
    |--------------------------------------------------------------------------
    | PAYMENT STATUS FILTER
    |--------------------------------------------------------------------------
    */

    if (paymentStatus) {
      query = query.eq(
        "payment_status",
        paymentStatus
      );
    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const normalizedSearch =
      String(search || "").trim();


    if (normalizedSearch) {
      query = query.or(
        [
          `order_number.ilike.%${normalizedSearch}%`,
          `customer_name.ilike.%${normalizedSearch}%`,
          `customer_phone.ilike.%${normalizedSearch}%`,
        ].join(",")
      );
    }


    /*
    |--------------------------------------------------------------------------
    | EXECUTE QUERY
    |--------------------------------------------------------------------------
    */

    const {
      data,
      error,
    } = await query;


    /*
    |--------------------------------------------------------------------------
    | HANDLE ERROR
    |--------------------------------------------------------------------------
    */

    if (error) {
      console.error(
        "fetchOrders() database error:",
        error
      );

      throw createServiceError(
        "Unable to fetch orders.",
        error
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RETURN ORDERS
    |--------------------------------------------------------------------------
    */

    return (data || []).map((row) =>
      buildOrderView(row, row.order_items)
    );

  } catch (error) {
    console.error(
      "fetchOrders() failed:",
      error
    );

    throw error;
  }
}

const orderService = {
  buildOrderView,
  createOrder,
  fetchOrders,
  fetchCustomers,
  fetchOrderByNumber,
  submitPayment,
  verifyPayment,
  rejectPayment,
  updateOrderStatus,
  fetchOrderStatusHistory,
};

export default orderService;