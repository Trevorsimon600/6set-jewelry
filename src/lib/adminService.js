import {
  fetchOrders,
  fetchCustomers,
} from "./orderService";

import { fetchProducts } from "./productService";
import { fetchCategories } from "./categoryService";
import { isVerifiedOrder } from "../services/sales.js";

/*
|--------------------------------------------------------------------------
| ADMIN SERVICE
|--------------------------------------------------------------------------
| 6SET JEWELRY
|
| Everything AdminDashboard.jsx needs: one aggregated data fetch, plus
| small, defensive getter/formatter helpers used throughout the
| dashboard's JSX. Nothing here talks to Supabase directly except
| fetchAdminData(), which just delegates to the real services.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| FETCH ADMIN DATA
|--------------------------------------------------------------------------
|
| { products, categories, orders, customers }
|
|--------------------------------------------------------------------------
*/

export async function fetchAdminData() {
  try {
    const [products, categories, orders, customers] =
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchOrders(),
        fetchCustomers(),
      ]);

    return {
      products,
      categories,
      orders,
      customers,
    };
  } catch (error) {
    console.error("fetchAdminData() failed:", error);

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| SAFE PRIMITIVES
|--------------------------------------------------------------------------
*/

export function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}


/*
|--------------------------------------------------------------------------
| ORDER GETTERS
|--------------------------------------------------------------------------
|
| Work against the nested admin order shape (order.customer.name,
| order.payment.status, order.items) but fall back to the flat
| Supabase row shape, so either is safe to pass in.
|
|--------------------------------------------------------------------------
*/

export function getOrderId(order) {
  return order?.id ?? "";
}

export function getOrderCustomerName(order) {
  return (
    order?.customer?.name ||
    order?.customer_name ||
    "Customer"
  );
}

export function getOrderCustomerPhone(order) {
  return (
    order?.customer?.phone ||
    order?.customer_phone ||
    ""
  );
}

export function getOrderStatus(order) {
  return (
    order?.orderStatus ||
    order?.order_status ||
    "Awaiting Payment"
  );
}

export function getPaymentStatus(order) {
  return (
    order?.payment?.status ||
    order?.payment_status ||
    "Pending"
  );
}

export function getAdminOrderDate(order) {
  return (
    order?.createdAt ??
    order?.created_at ??
    null
  );
}

export function getOrderItemsCount(order) {
  const items = order?.items ?? order?.order_items ?? [];

  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce(
    (sum, item) => sum + safeNumber(item?.quantity, 0),
    0
  );
}


/*
|--------------------------------------------------------------------------
| DATES
|--------------------------------------------------------------------------
*/

export function getValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}


/*
|--------------------------------------------------------------------------
| ORDER LISTS
|--------------------------------------------------------------------------
*/

export function getRecentOrders(orders, limit = 8) {
  return safeArray(orders)
    .slice()
    .sort((a, b) => {
      const dateA =
        getValidDate(getAdminOrderDate(a))?.getTime() || 0;

      const dateB =
        getValidDate(getAdminOrderDate(b))?.getTime() || 0;

      return dateB - dateA;
    })
    .slice(0, limit);
}

export function getVerifiedOrders(orders) {
  return safeArray(orders).filter((order) =>
    isVerifiedOrder(order)
  );
}


/*
|--------------------------------------------------------------------------
| CUSTOMER GETTERS
|--------------------------------------------------------------------------
*/

export function getCustomerOrders(orders, customer) {
  const customerId = customer?.id;

  const customerPhone = String(
    customer?.phone || ""
  ).trim();

  return safeArray(orders).filter((order) => {
    const orderCustomerId = order?.customer_id;

    const orderPhone = String(
      getOrderCustomerPhone(order) || ""
    ).trim();

    return (
      (customerId &&
        orderCustomerId &&
        String(customerId) === String(orderCustomerId)) ||
      (customerPhone &&
        orderPhone &&
        customerPhone === orderPhone)
    );
  });
}

export function getCustomerAverageOrder(customer) {
  const totalOrders = safeNumber(customer?.total_orders, 0);
  const totalSpent = safeNumber(customer?.total_spent, 0);

  return totalOrders > 0 ? totalSpent / totalOrders : 0;
}


/*
|--------------------------------------------------------------------------
| SALES SUMMARY (ADMIN-SERVICE VARIANT)
|--------------------------------------------------------------------------
|
| services/sales.js's getSalesSummary() is the source of truth for
| sales figures. This is kept for anything importing it from
| adminService.js directly.
|
|--------------------------------------------------------------------------
*/

export function getAdminSalesSummary(orders) {
  const verifiedOrders = getVerifiedOrders(orders);

  const totalSales = verifiedOrders.reduce(
    (sum, order) => sum + safeNumber(order?.total, 0),
    0
  );

  const paidOrders = verifiedOrders.length;

  const itemsSold = verifiedOrders.reduce(
    (sum, order) => sum + getOrderItemsCount(order),
    0
  );

  return {
    totalSales,
    paidOrders,
    itemsSold,
    averageOrderValue:
      paidOrders > 0 ? totalSales / paidOrders : 0,
  };
}


/*
|--------------------------------------------------------------------------
| PRODUCT STATISTICS
|--------------------------------------------------------------------------
*/

export function getProductStatistics(products) {
  const safeProducts = safeArray(products);

  const totalProducts = safeProducts.length;

  const activeProducts = safeProducts.filter(
    (product) => product?.published !== false
  ).length;

  const lowStockCount = safeProducts.filter((product) => {
    const stock = safeNumber(
      product?.currentStock ?? product?.current_stock,
      0
    );

    const threshold = safeNumber(
      product?.lowStockThreshold ??
        product?.low_stock_threshold,
      0
    );

    return stock > 0 && stock <= threshold;
  }).length;

  const outOfStockCount = safeProducts.filter(
    (product) =>
      safeNumber(
        product?.currentStock ?? product?.current_stock,
        0
      ) <= 0
  ).length;

  const totalInventoryValue = safeProducts.reduce(
    (sum, product) =>
      sum +
      safeNumber(product?.price, 0) *
        safeNumber(
          product?.currentStock ?? product?.current_stock,
          0
        ),
    0
  );

  return {
    totalProducts,
    activeProducts,
    lowStockCount,
    outOfStockCount,
    totalInventoryValue,
  };
}


/*
|--------------------------------------------------------------------------
| STORE HEALTH
|--------------------------------------------------------------------------
*/

export function getStoreHealthStatus(products) {
  const { lowStockCount, outOfStockCount } =
    getProductStatistics(products);

  if (outOfStockCount > 0) {
    return "Needs Attention";
  }

  if (lowStockCount > 0) {
    return "Healthy — Monitor Stock";
  }

  return "Healthy";
}


/*
|--------------------------------------------------------------------------
| FORMATTERS
|--------------------------------------------------------------------------
*/

export function formatCurrency(amount) {
  return `KES ${safeNumber(amount, 0).toLocaleString(
    "en-KE",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

export function formatDate(value) {
  const date = getValidDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
  });
}

export function formatDateTime(value) {
  const date = getValidDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatStatus(status) {
  return status ? String(status) : "Unknown";
}


const adminService = {
  fetchAdminData,
  getOrderId,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderItemsCount,
  getOrderStatus,
  getPaymentStatus,
  getAdminOrderDate,
  getValidDate,
  getRecentOrders,
  getVerifiedOrders,
  getCustomerOrders,
  getCustomerAverageOrder,
  getAdminSalesSummary,
  getProductStatistics,
  getStoreHealthStatus,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
  safeNumber,
  safeArray,
};

export default adminService;