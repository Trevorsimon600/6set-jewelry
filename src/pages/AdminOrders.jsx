import { useEffect, useMemo, useState } from 'react'
import AdminOrderDetails from './AdminOrderDetails'

import {
  fetchOrders,
} from '../lib/orderService'

import { exportToCSV } from '../lib/csvExport'

// ============================================================
// ADMIN ORDERS
// PHASE 7.16.6
// SEARCH + FILTER
// ============================================================

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  // ==========================================================
  // SEARCH + FILTER STATE
  // ==========================================================

  const [searchTerm, setSearchTerm] = useState('')

  const [paymentFilter, setPaymentFilter] =
    useState('All')

  const [orderStatusFilter, setOrderStatusFilter] =
    useState('All')

  const [dateFilter, setDateFilter] =
    useState('All')

  // ==========================================================
  // LOAD ORDERS
  // ==========================================================

  async function loadOrders() {
    setLoading(true)
    setError('')

    try {
      const data = await fetchOrders()

      setOrders(data || [])
    } catch (err) {
      console.error(
        'Failed to load orders:',
        err
      )

      setError(
        err.message ||
        'Unable to load orders.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadOrders()
  }, [])

  // ==========================================================
  // RETURN FROM ORDER DETAILS
  // ==========================================================

  async function handleBackFromDetails() {
    setSelectedOrder(null)

    await loadOrders()
  }

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(date) {
    if (!date) {
      return '—'
    }

    return new Date(date).toLocaleString(
      'en-KE',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    )
  }

  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  function formatMoney(amount) {
    return `KES ${Number(
      amount || 0
    ).toLocaleString()}`
  }

  // ==========================================================
  // PAYMENT STATUS CLASS
  // ==========================================================

  function getPaymentClass(status) {
    switch (status) {
      case 'Payment Verified':
        return 'verified'

      case 'Payment Submitted':
        return 'submitted'

      case 'Payment Rejected':
        return 'rejected'

      case 'Pending':
      case 'Awaiting Payment':
      default:
        return 'pending'
    }
  }

  // ==========================================================
  // ORDER STATUS CLASS
  // ==========================================================

  function getOrderClass(status) {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return 'completed'

      case 'Confirmed':
        return 'active'

      case 'Ready for Delivery':
      case 'Out for Delivery':
        return 'delivery'

      case 'Cancelled':
        return 'cancelled'

      case 'Payment Submitted':
      case 'Awaiting Payment':
      default:
        return 'pending'
    }
  }

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredOrders = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase()

    return orders.filter((order) => {
      // ------------------------------------------------------
      // SEARCH
      // ------------------------------------------------------

      if (normalizedSearch) {
        const orderNumber =
          String(
            order.orderNumber || ''
          ).toLowerCase()

        const customerName =
          String(
            order.customer?.name || ''
          ).toLowerCase()

        const customerPhone =
          String(
            order.customer?.phone || ''
          ).toLowerCase()

        const matchesSearch =
          orderNumber.includes(
            normalizedSearch
          ) ||
          customerName.includes(
            normalizedSearch
          ) ||
          customerPhone.includes(
            normalizedSearch
          )

        if (!matchesSearch) {
          return false
        }
      }

      // ------------------------------------------------------
      // PAYMENT FILTER
      // ------------------------------------------------------

      if (
        paymentFilter !== 'All' &&
        order.payment?.status !==
          paymentFilter
      ) {
        return false
      }

      // ------------------------------------------------------
      // ORDER STATUS FILTER
      // ------------------------------------------------------

      if (
        orderStatusFilter !== 'All' &&
        order.orderStatus !==
          orderStatusFilter
      ) {
        return false
      }

      // ------------------------------------------------------
      // DATE FILTER
      // ------------------------------------------------------

      if (dateFilter !== 'All') {
        if (!order.createdAt) {
          return false
        }

        const orderDate =
          new Date(order.createdAt)

        const now = new Date()

        if (
          Number.isNaN(
            orderDate.getTime()
          )
        ) {
          return false
        }

        // ----------------------------------------------------
        // TODAY
        // ----------------------------------------------------

        if (dateFilter === 'Today') {
          const startOfToday =
            new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            )

          if (
            orderDate <
            startOfToday
          ) {
            return false
          }
        }

        // ----------------------------------------------------
        // LAST 7 DAYS
        // ----------------------------------------------------

        if (
          dateFilter ===
          'Last 7 Days'
        ) {
          const sevenDaysAgo =
            new Date(now)

          sevenDaysAgo.setDate(
            now.getDate() - 7
          )

          if (
            orderDate <
            sevenDaysAgo
          ) {
            return false
          }
        }

        // ----------------------------------------------------
        // LAST 30 DAYS
        // ----------------------------------------------------

        if (
          dateFilter ===
          'Last 30 Days'
        ) {
          const thirtyDaysAgo =
            new Date(now)

          thirtyDaysAgo.setDate(
            now.getDate() - 30
          )

          if (
            orderDate <
            thirtyDaysAgo
          ) {
            return false
          }
        }
      }

      return true
    })
  }, [
    orders,
    searchTerm,
    paymentFilter,
    orderStatusFilter,
    dateFilter,
  ])

  // ==========================================================
  // EXPORT ORDERS TO CSV
  //
  // Exports whatever is currently visible in the table
  // (respects search + all active filters).
  // ==========================================================

  function handleExportOrders() {
    const rows = filteredOrders.map((order) => ({
      order_number: order.orderNumber || '',
      customer_name: order.customer?.name || '',
      customer_phone: order.customer?.phone || '',
      date: order.createdAt || '',
      total: order.total ?? 0,
      payment_status: order.payment?.status || '',
      order_status: order.orderStatus || '',
    }))

    exportToCSV(rows, 'orders.csv')
  }

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  function clearFilters() {
    setSearchTerm('')
    setPaymentFilter('All')
    setOrderStatusFilter('All')
    setDateFilter('All')
  }

  // ==========================================================
  // CHECK WHETHER FILTERS ARE ACTIVE
  // ==========================================================

  const filtersActive =
    searchTerm.trim() !== '' ||
    paymentFilter !== 'All' ||
    orderStatusFilter !== 'All' ||
    dateFilter !== 'All'

  // ==========================================================
  // SUMMARY COUNTS
  // ==========================================================

  const totalOrders =
    orders.length

  const awaitingPayment =
    orders.filter(
      (order) =>
        order.payment?.status ===
          'Pending' ||
        order.payment?.status ===
          'Awaiting Payment'
    ).length

  const paymentSubmitted =
    orders.filter(
      (order) =>
        order.payment?.status ===
        'Payment Submitted'
    ).length

  const completedOrders =
    orders.filter(
      (order) =>
        order.orderStatus ===
          'Completed' ||
        order.orderStatus ===
          'Delivered'
    ).length

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="admin-orders-panel">

        <div className="admin-orders-loading">
          <p>
            Loading orders...
          </p>
        </div>

      </div>
    )
  }

  // ==========================================================
  // ORDER DETAILS
  // ==========================================================

  if (selectedOrder) {
    return (
      <AdminOrderDetails
        order={selectedOrder}
        onBack={handleBackFromDetails}
      />
    )
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="admin-orders-panel">

        <div className="admin-orders-error">

          <h3>
            Unable to load orders
          </h3>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="admin-action-button"
            onClick={loadOrders}
          >
            Try Again
          </button>

        </div>

      </div>
    )
  }

  // ==========================================================
  // EMPTY
  // ==========================================================

  if (orders.length === 0) {
    return (
      <div className="admin-orders-panel">

        <div className="admin-orders-header">

          <div>

            <p className="section-label">
              ORDER MANAGEMENT
            </p>

            <h2>
              Orders
            </h2>

            <p>
              Manage customer orders from
              your 6Set Jewelry store.
            </p>

          </div>

          <button
            type="button"
            className="admin-action-button secondary"
            onClick={loadOrders}
          >
            Refresh
          </button>

        </div>

        <div className="admin-orders-empty">

          <h3>
            No orders yet
          </h3>

          <p>
            Customer orders will appear
            here once they are placed.
          </p>

        </div>

      </div>
    )
  }

  // ==========================================================
  // ORDERS DASHBOARD
  // ==========================================================

  return (
    <div className="admin-orders-panel">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-orders-header">

        <div>

          <p className="section-label">
            ORDER MANAGEMENT
          </p>

          <h2>
            Orders
          </h2>

          <p>
            View, search and manage
            customer orders.
          </p>

        </div>

        <button
          type="button"
          className="admin-action-button secondary"
          onClick={loadOrders}
        >
          Refresh
        </button>

        <button
          type="button"
          className="admin-action-button secondary"
          onClick={handleExportOrders}
          disabled={
            filteredOrders.length === 0
          }
        >
          ⬇ Export CSV
        </button>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="admin-orders-summary">

        <div className="stat-card">

          <span>
            Total Orders
          </span>

          <strong>
            {totalOrders}
          </strong>

        </div>

        <div className="stat-card">

          <span>
            Awaiting Payment
          </span>

          <strong>
            {awaitingPayment}
          </strong>

        </div>

        <div className="stat-card">

          <span>
            Payment Submitted
          </span>

          <strong>
            {paymentSubmitted}
          </strong>

        </div>

        <div className="stat-card">

          <span>
            Completed
          </span>

          <strong>
            {completedOrders}
          </strong>

        </div>

      </div>

      {/* ======================================================
          SEARCH + FILTER BAR
      ====================================================== */}

      <div className="admin-orders-filters">

        {/* SEARCH */}

        <div className="admin-orders-search">

          <label htmlFor="order-search">
            Search Orders
          </label>

          <input
            id="order-search"
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search order number, customer or phone..."
          />

        </div>

        {/* PAYMENT FILTER */}

        <div className="admin-orders-filter">

          <label htmlFor="payment-filter">
            Payment
          </label>

          <select
            id="payment-filter"
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(
                event.target.value
              )
            }
          >

            <option value="All">
              All Payments
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Payment Submitted">
              Payment Submitted
            </option>

            <option value="Payment Verified">
              Payment Verified
            </option>

            <option value="Payment Rejected">
              Payment Rejected
            </option>

          </select>

        </div>

        {/* ORDER STATUS FILTER */}

        <div className="admin-orders-filter">

          <label htmlFor="order-status-filter">
            Order Status
          </label>

          <select
            id="order-status-filter"
            value={orderStatusFilter}
            onChange={(event) =>
              setOrderStatusFilter(
                event.target.value
              )
            }
          >

            <option value="All">
              All Statuses
            </option>

            <option value="Awaiting Payment">
              Awaiting Payment
            </option>

            <option value="Payment Submitted">
              Payment Submitted
            </option>

            <option value="Confirmed">
              Confirmed
            </option>

            <option value="Ready for Delivery">
              Ready for Delivery
            </option>

            <option value="Out for Delivery">
              Out for Delivery
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

          </select>

        </div>

        {/* DATE FILTER */}

        <div className="admin-orders-filter">

          <label htmlFor="date-filter">
            Date
          </label>

          <select
            id="date-filter"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value
              )
            }
          >

            <option value="All">
              All Dates
            </option>

            <option value="Today">
              Today
            </option>

            <option value="Last 7 Days">
              Last 7 Days
            </option>

            <option value="Last 30 Days">
              Last 30 Days
            </option>

          </select>

        </div>

        {/* CLEAR */}

        {filtersActive && (
          <button
            type="button"
            className="admin-action-button secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        )}

      </div>

      {/* ======================================================
          FILTER RESULT INFORMATION
      ====================================================== */}

      <div className="admin-orders-result-info">

        <span>
          Showing{' '}
          <strong>
            {filteredOrders.length}
          </strong>{' '}
          of{' '}
          <strong>
            {orders.length}
          </strong>{' '}
          orders
        </span>

        {filtersActive && (
          <span>
            Filters active
          </span>
        )}

      </div>

      {/* ======================================================
          NO FILTER RESULTS
      ====================================================== */}

      {filteredOrders.length === 0 ? (

        <div className="admin-orders-empty">

          <h3>
            No matching orders
          </h3>

          <p>
            No orders match your current
            search and filter settings.
          </p>

          <button
            type="button"
            className="admin-action-button secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>

      ) : (

        /* ====================================================
           ORDER TABLE
        ==================================================== */

        <div className="admin-orders-table-wrapper">

          <table className="admin-orders-table">

            <thead>

              <tr>

                <th>
                  Order
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Date
                </th>

                <th>
                  Total
                </th>

                <th>
                  Payment
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredOrders.map(
                (order) => (

                  <tr
                    key={order.id}
                  >

                    {/* ORDER */}

                    <td>

                      <strong>
                        {order.orderNumber}
                      </strong>

                    </td>

                    {/* CUSTOMER */}

                    <td>

                      <div>

                        <strong>
                          {
                            order.customer?.name ||
                            'Unknown Customer'
                          }
                        </strong>

                        <small>
                          {
                            order.customer?.phone ||
                            'No phone'
                          }
                        </small>

                      </div>

                    </td>

                    {/* DATE */}

                    <td>

                      {formatDate(
                        order.createdAt
                      )}

                    </td>

                    {/* TOTAL */}

                    <td>

                      <strong>
                        {formatMoney(
                          order.total
                        )}
                      </strong>

                    </td>

                    {/* PAYMENT */}

                    <td>

                      <span
                        className={`admin-status-badge payment-${getPaymentClass(
                          order.payment?.status
                        )}`}
                      >
                        {
                          order.payment?.status ||
                          'Pending'
                        }
                      </span>

                    </td>

                    {/* ORDER STATUS */}

                    <td>

                      <span
                        className={`admin-status-badge order-${getOrderClass(
                          order.orderStatus
                        )}`}
                      >
                        {
                          order.orderStatus ||
                          'Unknown'
                        }
                      </span>

                    </td>

                    {/* ACTION */}

                    <td>

                      <button
                        type="button"
                        className="admin-action-button secondary"
                        onClick={() =>
                          setSelectedOrder(
                            order
                          )
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  )
}

export default AdminOrders