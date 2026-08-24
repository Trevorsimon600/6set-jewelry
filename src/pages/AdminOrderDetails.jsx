import { useEffect, useMemo, useState } from 'react'
import './AdminOrderDetails.css'

import {
  verifyPayment,
  rejectPayment,
  updateOrderStatus,
  fetchOrderStatusHistory,
  fetchOrderByNumber,
} from '../lib/orderService'

import { useAuth } from '../context/AuthContext'

// ============================================================
// ADMIN ORDER DETAILS
// PHASE 7.16.9C
// CUSTOMER COMMUNICATION
// ============================================================

function AdminOrderDetails({ order, onBack }) {
  // ==========================================================
  // CURRENT ADMIN
  // ==========================================================
  //
  // Attached to every status change below so order_status_history
  // records which admin actually did it.
  //

  const { session } = useAuth()

  const currentAdminId =
    session?.user?.id || null

  // ==========================================================
  // STATE
  // ==========================================================

  const [currentOrder, setCurrentOrder] = useState(order)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  // ==========================================================
  // CUSTOMER COMMUNICATION STATE
  // ==========================================================

  const [communicationType, setCommunicationType] =
    useState('Order Confirmed')

  const [communicationMessage, setCommunicationMessage] =
    useState('')

  const [copySuccess, setCopySuccess] = useState('')

  // ==========================================================
  // LOAD ORDER HISTORY
  // ==========================================================

  async function loadHistory() {
    if (!currentOrder?.id) {
      return
    }

    setLoadingHistory(true)

    try {
      const data = await fetchOrderStatusHistory(
        currentOrder.id
      )

      setHistory(data || [])
    } catch (err) {
      console.error(
        'Failed to load order history:',
        err
      )
    } finally {
      setLoadingHistory(false)
    }
  }

  // ==========================================================
  // REFRESH ORDER
  // ==========================================================

  async function refreshOrder() {
    if (!currentOrder?.orderNumber) {
      return
    }

    const updatedOrder =
      await fetchOrderByNumber(
        currentOrder.orderNumber
      )

    if (updatedOrder) {
      setCurrentOrder(updatedOrder)

      try {
        const updatedHistory =
          await fetchOrderStatusHistory(
            updatedOrder.id
          )

        setHistory(updatedHistory || [])
      } catch (err) {
        console.error(
          'Failed to refresh order history:',
          err
        )
      }
    } else {
      await loadHistory()
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    setCurrentOrder(order)
  }, [order])

  useEffect(() => {
    loadHistory()
  }, [currentOrder?.id])

  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  function formatMoney(amount) {
    return `KES ${Number(
      amount || 0
    ).toLocaleString()}`
  }

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(date) {
    if (!date) {
      return '—'
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return '—'
    }

    return parsedDate.toLocaleString(
      'en-KE',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    )
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
      case 'Preparing':
        return 'active'

      case 'Ready for Delivery':
      case 'Out for Delivery':
        return 'delivery'

      case 'Cancelled':
        return 'cancelled'

      default:
        return 'pending'
    }
  }

  // ==========================================================
  // VERIFY PAYMENT
  // ==========================================================

  async function handleVerifyPayment() {
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedOrder =
        await verifyPayment(
          currentOrder.id,
          { changedBy: currentAdminId }
        )

      if (updatedOrder) {
        setCurrentOrder(updatedOrder)

        try {
          const updatedHistory =
            await fetchOrderStatusHistory(
              updatedOrder.id
            )

          setHistory(updatedHistory || [])
        } catch (historyError) {
          console.error(
            'Failed to refresh history:',
            historyError
          )
        }
      } else {
        await loadHistory()
      }

      setSuccess(
        'Payment verified successfully. Order is now confirmed.'
      )
    } catch (err) {
      console.error(
        'Failed to verify payment:',
        err
      )

      setError(
        err.message ||
          'Unable to verify payment.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ==========================================================
  // SHOW REJECTION FORM
  // ==========================================================

  function handleShowRejectForm() {
    setError('')
    setSuccess('')
    setShowRejectForm(true)
  }

  // ==========================================================
  // CANCEL REJECTION
  // ==========================================================

  function handleCancelReject() {
    setShowRejectForm(false)
    setRejectionReason('')
    setError('')
  }

  // ==========================================================
  // REJECT PAYMENT
  // ==========================================================

  async function handleRejectPayment() {
    if (
      !rejectionReason ||
      !rejectionReason.trim()
    ) {
      setError(
        'Please enter a reason for rejecting this payment.'
      )

      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedOrder =
        await rejectPayment(
          currentOrder.id,
          rejectionReason.trim(),
          { changedBy: currentAdminId }
        )

      if (updatedOrder) {
        setCurrentOrder(updatedOrder)

        try {
          const updatedHistory =
            await fetchOrderStatusHistory(
              updatedOrder.id
            )

          setHistory(updatedHistory || [])
        } catch (historyError) {
          console.error(
            'Failed to refresh history:',
            historyError
          )
        }
      } else {
        await loadHistory()
      }

      setRejectionReason('')
      setShowRejectForm(false)

      setSuccess(
        'Payment rejected. The customer can submit a new payment reference.'
      )
    } catch (err) {
      console.error(
        'Failed to reject payment:',
        err
      )

      setError(
        err.message ||
          'Unable to reject payment.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ==========================================================
  // UPDATE ORDER STATUS
  // ==========================================================

  async function handleStatusChange(event) {
    const newStatus =
      event.target.value

    if (
      !newStatus ||
      newStatus === currentOrder.orderStatus
    ) {
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      await updateOrderStatus({
        orderId: currentOrder.id,
        newStatus,
        changedBy: currentAdminId,
      })

      await refreshOrder()

      setSuccess(
        `Order status updated to ${newStatus}.`
      )
    } catch (err) {
      console.error(
        'Failed to update order status:',
        err
      )

      setError(
        err.message ||
          'Unable to update order status.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ==========================================================
  // REFRESH
  // ==========================================================

  async function handleRefresh() {
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      await refreshOrder()

      setSuccess(
        'Order refreshed successfully.'
      )
    } catch (err) {
      console.error(
        'Failed to refresh order:',
        err
      )

      setError(
        err.message ||
          'Unable to refresh order.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ==========================================================
  // CUSTOMER COMMUNICATION
  // ==========================================================

  const customerName =
    currentOrder?.customer?.name ||
    'Customer'

  const customerPhone =
    currentOrder?.customer?.phone ||
    ''

  const orderNumber =
    currentOrder?.orderNumber ||
    ''

  const orderTotal =
    formatMoney(currentOrder?.total)

  // ==========================================================
  // NORMALIZE KENYAN PHONE NUMBER
  // ==========================================================

  function normalizeKenyanPhone(phone) {
    if (!phone) {
      return ''
    }

    let cleaned = String(phone)
      .trim()
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')

    // +254712345678
    if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1)
    }

    // 254712345678
    if (cleaned.startsWith('254')) {
      return cleaned
    }

    // 0712345678
    if (cleaned.startsWith('0')) {
      return `254${cleaned.substring(1)}`
    }

    // 712345678
    if (
      cleaned.startsWith('7') ||
      cleaned.startsWith('1')
    ) {
      return `254${cleaned}`
    }

    return ''
  }

  const whatsappPhone =
    normalizeKenyanPhone(
      customerPhone
    )

  const hasCustomerPhone =
    whatsappPhone.length > 0

  // ==========================================================
  // CUSTOMER MESSAGE TEMPLATES
  // ==========================================================

  const communicationTemplates =
    useMemo(
      () => ({
        'Order Confirmed': `Hello ${customerName} 👋

Your 6Set Jewelry order ${orderNumber} has been confirmed.

Order total: ${orderTotal}

Thank you for shopping with 6Set Jewelry. We will keep you updated as your order progresses.`,

        'Payment Verified': `Hello ${customerName} 👋

Your payment for order ${orderNumber} has been successfully verified.

Order total: ${orderTotal}

Your order is now confirmed and will proceed to the next stage.

Thank you for shopping with 6Set Jewelry. 💜`,

        'Payment Rejected': `Hello ${customerName},

We were unable to verify the payment submitted for order ${orderNumber}.

Please review your payment details and submit a new payment reference if necessary.

If you need assistance, please contact 6Set Jewelry.`,

        Preparing: `Hello ${customerName} 👋

Your 6Set Jewelry order ${orderNumber} is now being prepared. 📦

Order total: ${orderTotal}

We will notify you when your order is ready for delivery.

Thank you for shopping with 6Set Jewelry. 💜`,

        'Ready for Delivery': `Hello ${customerName} 👋

Good news! Your 6Set Jewelry order ${orderNumber} is ready for delivery. 🎉

Order total: ${orderTotal}

We will contact you regarding the delivery arrangements.

Thank you for shopping with 6Set Jewelry. 💜`,

        'Out for Delivery': `Hello ${customerName} 👋

Your 6Set Jewelry order ${orderNumber} is now out for delivery. 🛍️

Please be available to receive your order.

Thank you for shopping with 6Set Jewelry. 💜`,

        Delivered: `Hello ${customerName} 👋

Your 6Set Jewelry order ${orderNumber} has been marked as delivered. 🎉

Thank you for shopping with 6Set Jewelry. We hope you love your purchase! 💜

We look forward to serving you again.`,
      }),
      [
        customerName,
        orderNumber,
        orderTotal,
      ]
    )

  // ==========================================================
  // UPDATE MESSAGE WHEN TYPE CHANGES
  // ==========================================================

  useEffect(() => {
    setCommunicationMessage(
      communicationTemplates[
        communicationType
      ] || ''
    )

    setCopySuccess('')
  }, [
    communicationType,
    communicationTemplates,
  ])

  // ==========================================================
  // OPEN WHATSAPP
  // ==========================================================

  function handleOpenWhatsApp() {
    if (!hasCustomerPhone) {
      setError(
        'This customer does not have a valid phone number.'
      )

      return
    }

    if (!communicationMessage.trim()) {
      setError(
        'Please enter a message before opening WhatsApp.'
      )

      return
    }

    setError('')

    const encodedMessage =
      encodeURIComponent(
        communicationMessage
      )

    // Correct WhatsApp URL
    const whatsappUrl =
      `https://wa.me/${whatsappPhone}?text=${encodedMessage}`

    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    )
  }

  // ==========================================================
  // COPY MESSAGE
  // ==========================================================

  async function handleCopyMessage() {
    if (!communicationMessage.trim()) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        communicationMessage
      )

      setCopySuccess(
        'Message copied successfully.'
      )

      setTimeout(() => {
        setCopySuccess('')
      }, 2500)
    } catch (err) {
      console.error(
        'Failed to copy message:',
        err
      )

      setCopySuccess(
        'Unable to copy message.'
      )
    }
  }

  // ==========================================================
  // SAFETY CHECK
  // ==========================================================

  if (!currentOrder) {
    return (
      <div className="admin-order-details">

        <button
          type="button"
          className="admin-back-button"
          onClick={onBack}
        >
          ← Back to Orders
        </button>

        <div className="admin-orders-error">

          <h3>
            Order not found
          </h3>

          <p>
            The requested order could not be loaded.
          </p>

        </div>

      </div>
    )
  }

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const currentPaymentStatus =
    currentOrder.payment?.status ||
    'Pending'

  const currentOrderStatus =
    currentOrder.orderStatus ||
    'Awaiting Payment'

  const canVerifyPayment =
    currentPaymentStatus ===
    'Payment Submitted'

  const canRejectPayment =
    currentPaymentStatus ===
    'Payment Submitted'

  const paymentReference =
    currentOrder.payment?.reference

  const rejectionReasonFromOrder =
    currentOrder.payment?.rejectionReason

  // ==========================================================
  // COMPONENT
  // ==========================================================

  return (
    <div className="admin-order-details">

      {/* ======================================================
          BACK BUTTON
      ====================================================== */}

      <div className="admin-order-details-top">

        <button
          type="button"
          className="admin-back-button"
          onClick={onBack}
          disabled={actionLoading}
        >
          ← Back to Orders
        </button>

        <button
          type="button"
          className="admin-action-button secondary"
          onClick={handleRefresh}
          disabled={actionLoading}
        >
          {actionLoading
            ? 'Refreshing...'
            : 'Refresh'}
        </button>

      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-order-details-header">

        <div>

          <p className="section-label">
            ORDER DETAILS
          </p>

          <h2>
            {currentOrder.orderNumber}
          </h2>

          <p>
            Placed{' '}
            {formatDate(
              currentOrder.createdAt
            )}
          </p>

        </div>

        <div className="admin-order-statuses">

          <span
            className={`admin-status-badge payment-${getPaymentClass(
              currentPaymentStatus
            )}`}
          >
            {currentPaymentStatus}
          </span>

          <span
            className={`admin-status-badge order-${getOrderClass(
              currentOrderStatus
            )}`}
          >
            {currentOrderStatus}
          </span>

        </div>

      </div>

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {success && (
        <div className="admin-order-success">
          {success}
        </div>
      )}

      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div className="admin-order-error">
          {error}
        </div>
      )}

      {/* ======================================================
          ORDER OVERVIEW
      ====================================================== */}

      <div className="admin-order-grid">

        {/* CUSTOMER */}

        <div className="admin-order-card">

          <h3>
            Customer
          </h3>

          <div className="admin-order-info">

            <div>
              <span>
                Name
              </span>

              <strong>
                {currentOrder.customer?.name ||
                  'Unknown Customer'}
              </strong>
            </div>

            <div>
              <span>
                Phone
              </span>

              <strong>
                {currentOrder.customer?.phone ||
                  'No phone provided'}
              </strong>
            </div>

            <div>
              <span>
                Location
              </span>

              <strong>
                {currentOrder.customer?.location ||
                  'To be arranged'}
              </strong>
            </div>

            {currentOrder.customer?.instructions && (
              <div>
                <span>
                  Instructions
                </span>

                <strong>
                  {currentOrder.customer.instructions}
                </strong>
              </div>
            )}

          </div>

        </div>

        {/* PAYMENT */}

        <div className="admin-order-card">

          <h3>
            Payment
          </h3>

          <div className="admin-order-info">

            <div>
              <span>
                Status
              </span>

              <strong>
                {currentPaymentStatus}
              </strong>
            </div>

            <div>
              <span>
                Method
              </span>

              <strong>
                {currentOrder.payment?.method ||
                  'Not specified'}
              </strong>
            </div>

            <div>
              <span>
                Reference
              </span>

              <strong>
                {paymentReference ||
                  'Not submitted'}
              </strong>
            </div>

            <div>
              <span>
                Submitted
              </span>

              <strong>
                {formatDate(
                  currentOrder.payment
                    ?.submittedAt
                )}
              </strong>
            </div>

            <div>
              <span>
                Verified
              </span>

              <strong>
                {formatDate(
                  currentOrder.payment
                    ?.verifiedAt
                )}
              </strong>
            </div>

          </div>

        </div>

        {/* DELIVERY */}

        <div className="admin-order-card">

          <h3>
            Delivery
          </h3>

          <div className="admin-order-info">

            <div>
              <span>
                Status
              </span>

              <strong>
                {currentOrder.delivery?.status ||
                  'To be arranged'}
              </strong>
            </div>

            <div>
              <span>
                Location
              </span>

              <strong>
                {currentOrder.delivery?.location ||
                  currentOrder.customer?.location ||
                  'To be arranged'}
              </strong>
            </div>

            <div>
              <span>
                Delivery Cost
              </span>

              <strong>
                {currentOrder.delivery?.cost ===
                  null ||
                currentOrder.delivery?.cost ===
                  undefined
                  ? 'To be arranged'
                  : formatMoney(
                      currentOrder.delivery.cost
                    )}
              </strong>
            </div>

          </div>

        </div>

        {/* INVENTORY */}

        <div className="admin-order-card">

          <h3>
            Inventory
          </h3>

          <div className="admin-order-info">

            <div>
              <span>
                Status
              </span>

              <strong>
                {currentOrder.inventory?.status ||
                  'Not Reserved'}
              </strong>
            </div>

            <div>
              <span>
                Inventory Deducted
              </span>

              <strong>
                {formatDate(
                  currentOrder.inventory
                    ?.deductedAt
                )}
              </strong>
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          CUSTOMER COMMUNICATION
      ====================================================== */}

      <div className="admin-order-communication">

        <div className="admin-order-communication-header">

          <div>

            <p className="section-label">
              CUSTOMER COMMUNICATION
            </p>

            <h3>
              Contact Customer
            </h3>

            <p>
              Send an order-specific update to the
              customer through WhatsApp.
            </p>

          </div>

          <div className="admin-communication-customer">

            <strong>
              {customerName}
            </strong>

            <span>
              {customerPhone ||
                'No phone number'}
            </span>

          </div>

        </div>

        {!hasCustomerPhone ? (

          <div className="admin-communication-warning">

            <strong>
              WhatsApp unavailable
            </strong>

            <p>
              This customer does not have a valid
              phone number. Add a phone number to
              the customer's order before using
              WhatsApp communication.
            </p>

          </div>

        ) : (

          <>
            <div className="admin-communication-controls">

              <div className="admin-communication-field">

                <label htmlFor="communication-type">
                  Message Type
                </label>

                <select
                  id="communication-type"
                  value={communicationType}
                  onChange={(event) =>
                    setCommunicationType(
                      event.target.value
                    )
                  }
                  disabled={actionLoading}
                >

                  <option value="Order Confirmed">
                    Order Confirmed
                  </option>

                  <option value="Payment Verified">
                    Payment Verified
                  </option>

                  <option value="Payment Rejected">
                    Payment Rejected
                  </option>

                  <option value="Preparing">
                    Preparing
                  </option>

                  <option value="Ready for Delivery">
                    Ready for Delivery
                  </option>

                  <option value="Out for Delivery">
                    Out for Delivery
                  </option>

                  <option value="Delivered">
                    Delivered
                  </option>

                </select>

              </div>

            </div>

            <div className="admin-communication-preview">

              <div className="admin-communication-preview-header">

                <span>
                  Message Preview
                </span>

                <span>
                  {communicationMessage.length}{' '}
                  characters
                </span>

              </div>

              <textarea
                value={communicationMessage}
                onChange={(event) =>
                  setCommunicationMessage(
                    event.target.value
                  )
                }
                rows="10"
                disabled={actionLoading}
                placeholder="Enter customer message..."
              />

            </div>

            {copySuccess && (
              <div className="admin-communication-copy-success">
                {copySuccess}
              </div>
            )}

            <div className="admin-communication-actions">

              <button
                type="button"
                className="admin-action-button secondary"
                onClick={handleCopyMessage}
                disabled={
                  actionLoading ||
                  !communicationMessage.trim()
                }
              >
                Copy Message
              </button>

              <button
                type="button"
                className="admin-action-button whatsapp"
                onClick={handleOpenWhatsApp}
                disabled={
                  actionLoading ||
                  !communicationMessage.trim()
                }
              >
                Open WhatsApp
              </button>

            </div>

          </>

        )}

      </div>

      {/* ======================================================
          PAYMENT REJECTION
      ====================================================== */}

      {currentPaymentStatus ===
        'Payment Rejected' && (
        <div className="admin-order-rejection">

          <h3>
            Payment Rejected
          </h3>

          <p>
            <strong>
              Reason:
            </strong>{' '}
            {rejectionReasonFromOrder ||
              'No rejection reason recorded.'}
          </p>

        </div>
      )}

      {/* ======================================================
          PAYMENT ACTIONS
      ====================================================== */}

      {canVerifyPayment && (
        <div className="admin-order-actions-section">

          <h3>
            Payment Review
          </h3>

          <p>
            Review the customer's payment
            reference before verifying or
            rejecting the payment.
          </p>

          <div className="admin-order-actions">

            <button
              type="button"
              className="admin-action-button"
              onClick={handleVerifyPayment}
              disabled={actionLoading}
            >
              {actionLoading
                ? 'Processing...'
                : 'Verify Payment'}
            </button>

            {canRejectPayment && (
              <button
                type="button"
                className="admin-action-button danger"
                onClick={handleShowRejectForm}
                disabled={actionLoading}
              >
                Reject Payment
              </button>
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          REJECTION FORM
      ====================================================== */}

      {showRejectForm && (
        <div className="admin-reject-payment-form">

          <h3>
            Reject Payment
          </h3>

          <p>
            Explain why this payment is being
            rejected. The customer may need
            this information before submitting
            another payment reference.
          </p>

          <textarea
            value={rejectionReason}
            onChange={(event) =>
              setRejectionReason(
                event.target.value
              )
            }
            placeholder="Enter rejection reason..."
            rows="4"
            disabled={actionLoading}
          />

          <div className="admin-order-actions">

            <button
              type="button"
              className="admin-action-button danger"
              onClick={handleRejectPayment}
              disabled={actionLoading}
            >
              {actionLoading
                ? 'Rejecting...'
                : 'Confirm Rejection'}
            </button>

            <button
              type="button"
              className="admin-action-button secondary"
              onClick={handleCancelReject}
              disabled={actionLoading}
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* ======================================================
          ORDER STATUS MANAGEMENT
      ====================================================== */}

      <div className="admin-order-actions-section">

        <h3>
          Order Status
        </h3>

        <p>
          Update the progress of this order.
        </p>

        <select
          value={currentOrderStatus}
          onChange={handleStatusChange}
          disabled={actionLoading}
          className="admin-order-status-select"
        >

          <option value="Awaiting Payment">
            Awaiting Payment
          </option>

          <option value="Payment Submitted">
            Payment Submitted
          </option>

          <option value="Confirmed">
            Confirmed
          </option>

          <option value="Preparing">
            Preparing
          </option>

          <option value="Ready for Delivery">
            Ready for Delivery
          </option>

          <option value="Out for Delivery">
            Out for Delivery
          </option>

          <option value="Delivered">
            Delivered
          </option>

          <option value="Completed">
            Completed
          </option>

          <option value="Cancelled">
            Cancelled
          </option>

        </select>

      </div>

      {/* ======================================================
          ORDER ITEMS
      ====================================================== */}

      <div className="admin-order-items-section">

        <h3>
          Order Items
        </h3>

        {!currentOrder.items ||
        currentOrder.items.length === 0 ? (

          <p>
            No items found for this order.
          </p>

        ) : (

          <div className="admin-order-items-list">

            {currentOrder.items.map((item) => (

              <div
                className="admin-order-item"
                key={
                  item.orderItemId ||
                  item.id
                }
              >

                <div className="admin-order-item-main">

                  <div>

                    <strong>
                      {item.name ||
                        'Unnamed Product'}
                    </strong>

                    {item.category && (
                      <small>
                        {item.category}
                      </small>
                    )}

                    {item.productCode && (
                      <small>
                        Code: {item.productCode}
                      </small>
                    )}

                  </div>

                </div>

                <div className="admin-order-item-price">

                  <span>
                    {formatMoney(
                      item.price
                    )}{' '}
                    × {item.quantity}
                  </span>

                  <strong>
                    {formatMoney(
                      item.total
                    )}
                  </strong>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* ======================================================
          ORDER TOTALS
      ====================================================== */}

      <div className="admin-order-totals">

        <div>

          <span>
            Subtotal
          </span>

          <strong>
            {formatMoney(
              currentOrder.subtotal
            )}
          </strong>

        </div>

        {currentOrder.delivery?.cost !== null &&
          currentOrder.delivery?.cost !==
            undefined && (

          <div>

            <span>
              Delivery
            </span>

            <strong>
              {formatMoney(
                currentOrder.delivery.cost
              )}
            </strong>

          </div>

        )}

        <div className="admin-order-total-final">

          <span>
            Total
          </span>

          <strong>
            {formatMoney(
              currentOrder.total
            )}
          </strong>

        </div>

      </div>

      {/* ======================================================
          STATUS HISTORY
      ====================================================== */}

      <div className="admin-order-history">

        <h3>
          Order History
        </h3>

        {loadingHistory ? (

          <p>
            Loading order history...
          </p>

        ) : history.length === 0 ? (

          <p>
            No order history available yet.
          </p>

        ) : (

          <div className="admin-order-history-list">

            {history.map((entry) => (

              <div
                className="admin-order-history-item"
                key={entry.id}
              >

                <div>

                  <strong>
                    {entry.old_status ||
                      'Order Created'}
                  </strong>

                  <span>
                    {' '}→{' '}
                  </span>

                  <strong>
                    {entry.new_status}
                  </strong>

                </div>

                {entry.note && (
                  <p>
                    {entry.note}
                  </p>
                )}

                <small>
                  {formatDate(
                    entry.created_at
                  )}
                </small>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  )
}

export default AdminOrderDetails