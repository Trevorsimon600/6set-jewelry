import { supabase } from "./supabaseClient";
import { uploadProductImageToSupabase } from "./imageUploadUtil";

/*
|--------------------------------------------------------------------------
| PRODUCT SERVICE
|--------------------------------------------------------------------------
| 6SET JEWELRY
|
| Backs AdminProducts.jsx against:
|
|   products
|   product_images
|   product_price_history
|
|--------------------------------------------------------------------------
*/

function createServiceError(message, details = null) {
  const error = new Error(message);

  error.name = "ProductServiceError";
  error.details = details;

  return error;
}


/*
|--------------------------------------------------------------------------
| PICK — camelCase first, snake_case fallback
|--------------------------------------------------------------------------
|
| AdminProducts.jsx sometimes hands back a product object that is a
| spread of BOTH the raw Supabase row (snake_case) and its own
| normalized camelCase overrides. This picks whichever is present,
| preferring camelCase.
|
|--------------------------------------------------------------------------
*/

function pick(source, camelKey, snakeKey, fallback) {
  if (source?.[camelKey] !== undefined && source?.[camelKey] !== "") {
    return source[camelKey];
  }

  if (source?.[snakeKey] !== undefined && source?.[snakeKey] !== "") {
    return source[snakeKey];
  }

  return fallback;
}


/*
|--------------------------------------------------------------------------
| LOAD PRODUCT BY ID (ENRICHED)
|--------------------------------------------------------------------------
|
| Joins the category name and full price history onto the raw
| product row, so the admin UI always has what it needs without a
| second round trip.
|
|--------------------------------------------------------------------------
*/

export async function loadProductById(productId) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, categories(name), product_price_history(price, changed_at)"
    )
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("loadProductById() failed:", error);

    throw createServiceError(
      "Unable to load product.",
      error
    );
  }

  if (!data) {
    return null;
  }

  const { categories, product_price_history, ...productRow } =
    data;

  const priceHistory = (product_price_history || [])
    .map((entry) => ({
      price: Number(entry.price || 0),
      changedAt: entry.changed_at,
    }))
    .sort(
      (a, b) =>
        new Date(b.changedAt).getTime() -
        new Date(a.changedAt).getTime()
    );

  return {
    ...productRow,

    category: categories?.name || "",
    categoryId: productRow.category_id,

    productCode: productRow.product_code || "",
    currentStock: Number(productRow.current_stock || 0),
    initialStock: Number(productRow.initial_stock || 0),
    lowStockThreshold: Number(
      productRow.low_stock_threshold || 0
    ),
    minimumOrderQuantity: Number(
      productRow.minimum_order_quantity || 1
    ),
    maximumOrderQuantity: Number(
      productRow.maximum_order_quantity || 10
    ),
    mainImage: productRow.main_image_url || "",
    price: Number(productRow.price || 0),

    priceHistory,
  };
}


/*
|--------------------------------------------------------------------------
| FETCH PRODUCTS
|--------------------------------------------------------------------------
|
| Used by adminService.js's fetchAdminData(), and available directly
| for any page that wants the full product list.
|
|--------------------------------------------------------------------------
*/

export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "*, categories(name), product_price_history(price, changed_at)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchProducts() failed:", error);

      throw createServiceError(
        "Unable to fetch products.",
        error
      );
    }

    return (data || []).map((row) => {
      const {
        categories,
        product_price_history,
        ...productRow
      } = row;

      const priceHistory = (product_price_history || [])
        .map((entry) => ({
          price: Number(entry.price || 0),
          changedAt: entry.changed_at,
        }))
        .sort(
          (a, b) =>
            new Date(b.changedAt).getTime() -
            new Date(a.changedAt).getTime()
        );

      return {
        ...productRow,

        category: categories?.name || "",
        categoryId: productRow.category_id,

        productCode: productRow.product_code || "",
        currentStock: Number(productRow.current_stock || 0),
        initialStock: Number(productRow.initial_stock || 0),
        lowStockThreshold: Number(
          productRow.low_stock_threshold || 0
        ),
        minimumOrderQuantity: Number(
          productRow.minimum_order_quantity || 1
        ),
        maximumOrderQuantity: Number(
          productRow.maximum_order_quantity || 10
        ),
        mainImage: productRow.main_image_url || "",
        price: Number(productRow.price || 0),

        priceHistory,
      };
    });
  } catch (error) {
    console.error("fetchProducts() failed:", error);

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
|
| createProduct(productData, { imageFile })
|
|--------------------------------------------------------------------------
*/

export async function createProduct(
  productData,
  { imageFile } = {}
) {
  try {
    const name = String(productData?.name || "").trim();

    if (!name) {
      throw createServiceError("Product name is required.");
    }

    const categoryId = pick(
      productData,
      "categoryId",
      "category_id",
      null
    );

    if (!categoryId) {
      throw createServiceError(
        "A category is required."
      );
    }

    const price = Number(
      pick(productData, "price", "price", 0)
    );

    if (!Number.isFinite(price) || price <= 0) {
      throw createServiceError(
        "Price must be a positive number."
      );
    }

    const payload = {
      product_code:
        pick(productData, "productCode", "product_code", null) ||
        null,

      name,
      category_id: categoryId,

      description:
        productData?.description
          ? String(productData.description).trim()
          : null,

      price,

      initial_stock: Number(
        pick(productData, "initialStock", "initial_stock", 0)
      ),

      current_stock: Number(
        pick(productData, "currentStock", "current_stock", 0)
      ),

      minimum_order_quantity: Number(
        pick(
          productData,
          "minimumOrderQuantity",
          "minimum_order_quantity",
          1
        )
      ),

      maximum_order_quantity: Number(
        pick(
          productData,
          "maximumOrderQuantity",
          "maximum_order_quantity",
          10
        )
      ),

      low_stock_threshold: Number(
        pick(
          productData,
          "lowStockThreshold",
          "low_stock_threshold",
          5
        )
      ),

      published:
        productData?.published === undefined
          ? true
          : Boolean(productData.published),

      main_image_url: null,
    };

    const { data: createdProduct, error: createError } =
      await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

    if (createError) {
      console.error("createProduct() failed:", createError);

      if (createError.code === "23505") {
        throw createServiceError(
          "A product with that product code already exists."
        );
      }

      throw createServiceError(
        "Unable to create product.",
        createError
      );
    }

    /*
    |------------------------------------------------------------------
    | UPLOAD IMAGE (IF PROVIDED)
    |------------------------------------------------------------------
    */

    if (imageFile) {
      const { publicUrl, storagePath } =
        await uploadProductImageToSupabase(
          imageFile,
          createdProduct.id
        );

      await supabase
        .from("products")
        .update({ main_image_url: publicUrl })
        .eq("id", createdProduct.id);

      await supabase.from("product_images").insert({
        product_id: createdProduct.id,
        storage_path: storagePath,
        public_url: publicUrl,
        is_primary: true,
        sort_order: 0,
      });
    }

    /*
    |------------------------------------------------------------------
    | RECORD INITIAL PRICE HISTORY
    |------------------------------------------------------------------
    */

    await supabase.from("product_price_history").insert({
      product_id: createdProduct.id,
      price,
    });

    const completeProduct = await loadProductById(
      createdProduct.id
    );

    return completeProduct || createdProduct;
  } catch (error) {
    console.error("createProduct() failed:", error);

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
|
| updateProduct(productId, productData, { imageFile, removePrimaryImage })
|
|--------------------------------------------------------------------------
*/

export async function updateProduct(
  productId,
  productData,
  { imageFile, removePrimaryImage } = {}
) {
  try {
    const normalizedId = String(productId || "").trim();

    if (!normalizedId) {
      throw createServiceError("Product ID is required.");
    }

    const { data: existingProduct, error: fetchError } =
      await supabase
        .from("products")
        .select("*")
        .eq("id", normalizedId)
        .maybeSingle();

    if (fetchError) {
      console.error(
        "Update product lookup failed:",
        fetchError
      );

      throw createServiceError(
        "Unable to find product.",
        fetchError
      );
    }

    if (!existingProduct) {
      throw createServiceError(
        "Product could not be found."
      );
    }

    const payload = {};

    const name = pick(productData, "name", "name", undefined);
    if (name !== undefined) {
      payload.name = String(name).trim();
    }

    const categoryId = pick(
      productData,
      "categoryId",
      "category_id",
      undefined
    );
    if (categoryId !== undefined) {
      payload.category_id = categoryId;
    }

    const productCode = pick(
      productData,
      "productCode",
      "product_code",
      undefined
    );
    if (productCode !== undefined) {
      payload.product_code = productCode || null;
    }

    if (productData?.description !== undefined) {
      payload.description = productData.description
        ? String(productData.description).trim()
        : null;
    }

    let nextPrice = existingProduct.price;
    const priceValue = pick(
      productData,
      "price",
      "price",
      undefined
    );
    if (priceValue !== undefined) {
      const parsedPrice = Number(priceValue);

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        throw createServiceError(
          "Price must be a positive number."
        );
      }

      payload.price = parsedPrice;
      nextPrice = parsedPrice;
    }

    const initialStock = pick(
      productData,
      "initialStock",
      "initial_stock",
      undefined
    );
    if (initialStock !== undefined) {
      payload.initial_stock = Number(initialStock) || 0;
    }

    const currentStock = pick(
      productData,
      "currentStock",
      "current_stock",
      undefined
    );
    if (currentStock !== undefined) {
      payload.current_stock = Number(currentStock) || 0;
    }

    const minQty = pick(
      productData,
      "minimumOrderQuantity",
      "minimum_order_quantity",
      undefined
    );
    if (minQty !== undefined) {
      payload.minimum_order_quantity = Number(minQty) || 1;
    }

    const maxQty = pick(
      productData,
      "maximumOrderQuantity",
      "maximum_order_quantity",
      undefined
    );
    if (maxQty !== undefined) {
      payload.maximum_order_quantity = Number(maxQty) || 10;
    }

    const lowStockThreshold = pick(
      productData,
      "lowStockThreshold",
      "low_stock_threshold",
      undefined
    );
    if (lowStockThreshold !== undefined) {
      payload.low_stock_threshold =
        Number(lowStockThreshold) || 0;
    }

    if (productData?.published !== undefined) {
      payload.published = Boolean(productData.published);
    }

    /*
    |------------------------------------------------------------------
    | IMAGE CHANGES
    |------------------------------------------------------------------
    */

    if (imageFile) {
      const { publicUrl, storagePath } =
        await uploadProductImageToSupabase(
          imageFile,
          normalizedId
        );

      payload.main_image_url = publicUrl;

      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", normalizedId);

      await supabase.from("product_images").insert({
        product_id: normalizedId,
        storage_path: storagePath,
        public_url: publicUrl,
        is_primary: true,
        sort_order: 0,
      });
    } else if (removePrimaryImage) {
      payload.main_image_url = null;

      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", normalizedId);
    }

    /*
    |------------------------------------------------------------------
    | APPLY UPDATE
    |------------------------------------------------------------------
    */

    if (Object.keys(payload).length > 0) {
      const { error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", normalizedId);

      if (updateError) {
        console.error("updateProduct() failed:", updateError);

        if (updateError.code === "23505") {
          throw createServiceError(
            "A product with that product code already exists."
          );
        }

        throw createServiceError(
          "Unable to update product.",
          updateError
        );
      }
    }

    /*
    |------------------------------------------------------------------
    | RECORD PRICE HISTORY (IF PRICE CHANGED)
    |------------------------------------------------------------------
    */

    if (
      payload.price !== undefined &&
      Number(existingProduct.price) !== Number(nextPrice)
    ) {
      await supabase.from("product_price_history").insert({
        product_id: normalizedId,
        price: nextPrice,
      });
    }

    const completeProduct = await loadProductById(
      normalizedId
    );

    return completeProduct;
  } catch (error) {
    console.error("updateProduct() failed:", error);

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
|
| product_images, product_price_history and inventory_movements all
| cascade on delete. order_items.product_id is set null instead of
| blocking the delete, so past orders keep their historical record.
|
|--------------------------------------------------------------------------
*/

export async function deleteProduct(productId) {
  try {
    const normalizedId = String(productId || "").trim();

    if (!normalizedId) {
      throw createServiceError("Product ID is required.");
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", normalizedId);

    if (error) {
      console.error("deleteProduct() failed:", error);

      throw createServiceError(
        "Unable to delete product.",
        error
      );
    }

    return { success: true };
  } catch (error) {
    console.error("deleteProduct() failed:", error);

    throw error;
  }
}


const productService = {
  fetchProducts,
  loadProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

export default productService;