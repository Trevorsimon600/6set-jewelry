/*
|--------------------------------------------------------------------------
| SALES
|--------------------------------------------------------------------------
| 6SET JEWELRY
|
| The single source of truth for "what counts as a sale."
|
| Only orders with payment_status === "Payment Verified" count.
| A submitted-but-unverified payment is NOT a sale yet.
|
| Works against the nested admin order shape (order.payment.status,
| order.items) but falls back to the flat Supabase row shape
| (order.payment_status, order.order_items) so it's safe to use
| either way.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| IS VERIFIED ORDER
|--------------------------------------------------------------------------
*/

export function isVerifiedOrder(order) {
  const status =
    order?.payment?.status ??
    order?.payment_status ??
    null;

  return status === "Payment Verified";
}


/*
|--------------------------------------------------------------------------
| GET ORDER TOTAL
|--------------------------------------------------------------------------
*/

export function getOrderTotal(order) {
  return Number(order?.total ?? 0);
}


/*
|--------------------------------------------------------------------------
| GET ORDER DATE
|--------------------------------------------------------------------------
*/

export function getOrderDate(order) {
  return (
    order?.createdAt ??
    order?.created_at ??
    null
  );
}


/*
|--------------------------------------------------------------------------
| GET ORDER ITEMS SOLD
|--------------------------------------------------------------------------
|
| Total unit quantity across the order's line items (not just the
| number of distinct line items).
|
|--------------------------------------------------------------------------
*/

export function getOrderItemsSold(order) {
  const items = order?.items ?? order?.order_items ?? [];

  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce(
    (sum, item) => sum + Number(item?.quantity || 0),
    0
  );
}


/*
|--------------------------------------------------------------------------
| DATE WINDOW HELPERS
|--------------------------------------------------------------------------
*/

function isToday(dateValue) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isWithinLastDays(dateValue, days) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const diffMs = Date.now() - date.getTime();
  const windowMs = days * 24 * 60 * 60 * 1000;

  return diffMs >= 0 && diffMs <= windowMs;
}


/*
|--------------------------------------------------------------------------
| GET SALES SUMMARY
|--------------------------------------------------------------------------
|
| Returns:
|
|   {
|     totalSales, paidOrders, itemsSold, averageOrderValue,
|     today: { sales, itemsSold, orders },
|     week:  { sales, itemsSold, orders },   // rolling 7 days
|     month: { sales, itemsSold, orders },   // rolling 30 days
|   }
|
|--------------------------------------------------------------------------
*/

export function getSalesSummary(orders) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const verifiedOrders = safeOrders.filter(isVerifiedOrder);

  const totalSales = verifiedOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const paidOrders = verifiedOrders.length;

  const itemsSold = verifiedOrders.reduce(
    (sum, order) => sum + getOrderItemsSold(order),
    0
  );

  const averageOrderValue =
    paidOrders > 0 ? totalSales / paidOrders : 0;

  function summarizeWindow(matchesWindow) {
    const subset = verifiedOrders.filter((order) =>
      matchesWindow(getOrderDate(order))
    );

    return {
      sales: subset.reduce(
        (sum, order) => sum + getOrderTotal(order),
        0
      ),
      itemsSold: subset.reduce(
        (sum, order) => sum + getOrderItemsSold(order),
        0
      ),
      orders: subset.length,
    };
  }

  return {
    totalSales,
    paidOrders,
    itemsSold,
    averageOrderValue,

    today: summarizeWindow(isToday),
    week: summarizeWindow((date) => isWithinLastDays(date, 7)),
    month: summarizeWindow((date) => isWithinLastDays(date, 30)),
  };
}


const sales = {
  isVerifiedOrder,
  getOrderTotal,
  getOrderDate,
  getOrderItemsSold,
  getSalesSummary,
};

export default sales;