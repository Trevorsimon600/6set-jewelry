import { supabase } from "../lib/supabaseClient";

// ============================================================
// COMMUNICATION CHANNELS
// ============================================================

export const COMMUNICATION_CHANNEL = {
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
  EMAIL: 'email',
  IN_APP: 'in_app',
}

// ============================================================
// RECIPIENT TYPES
// ============================================================

export const RECIPIENT_TYPE = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  DELIVERY: 'delivery',
}

// ============================================================
// COMMUNICATION EVENTS
// ============================================================

export const COMMUNICATION_EVENT = {
  ORDER_CREATED: 'ORDER_CREATED',
  PAYMENT_INSTRUCTIONS: 'PAYMENT_INSTRUCTIONS',
  PAYMENT_SUBMITTED: 'PAYMENT_SUBMITTED',
  PAYMENT_VERIFIED: 'PAYMENT_VERIFIED',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_READY: 'ORDER_READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',

  NEW_ORDER_ADMIN: 'NEW_ORDER_ADMIN',
  PAYMENT_SUBMISSION_ADMIN: 'PAYMENT_SUBMISSION_ADMIN',
  DELIVERY_READY_ADMIN: 'DELIVERY_READY_ADMIN',
}

// ============================================================
// COMMUNICATION STATUS
// ============================================================

export const COMMUNICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  READ: 'read',
}

// ============================================================
// DEFAULT CHANNEL
// ============================================================

const DEFAULT_CHANNEL =
  COMMUNICATION_CHANNEL.WHATSAPP

// ============================================================
// MESSAGE TEMPLATES
// ============================================================

function buildMessage(event, data = {}) {
  const {
    orderNumber = '',
    customerName = '',
    total = 0,
    paymentReference = '',
    rejectionReason = '',
    deliveryLocation = '',
    note = '',
  } = data

  switch (event) {
    case COMMUNICATION_EVENT.ORDER_CREATED:
      return `Hello ${customerName || 'Customer'} 👋

Thank you for shopping with 6Set Jewelry.

Your order has been received successfully.

Order Number: ${orderNumber}
Order Total: KES ${Number(total).toLocaleString()}

Please proceed with payment using the payment instructions provided.

Thank you for choosing 6Set Jewelry 💜`

    case COMMUNICATION_EVENT.PAYMENT_INSTRUCTIONS:
      return `💳 6Set Jewelry Payment Instructions

Order: ${orderNumber}
Amount: KES ${Number(total).toLocaleString()}

Please make your payment using the provided Pochi la Biashara details.

After payment, submit your M-Pesa transaction reference through the checkout/order page.

Your payment will then be reviewed by our team.

Thank you 💜`

    case COMMUNICATION_EVENT.PAYMENT_SUBMITTED:
      return `Payment received for review ✅

Order: ${orderNumber}

M-Pesa Reference:
${paymentReference}

Your payment is currently being reviewed by 6Set Jewelry.

We will notify you once it has been verified.`

    case COMMUNICATION_EVENT.PAYMENT_VERIFIED:
      return `Payment verified successfully ✅

Order: ${orderNumber}

Your payment has been confirmed.

Your 6Set Jewelry order is now confirmed and will proceed to preparation.

Thank you for shopping with us 💜`

    case COMMUNICATION_EVENT.PAYMENT_REJECTED:
      return `⚠️ Payment could not be verified

Order: ${orderNumber}

Reason:
${rejectionReason || 'Payment could not be verified.'}

Please check your payment details and contact 6Set Jewelry if you need assistance.

${note ? `Additional note:\n${note}` : ''}`

    case COMMUNICATION_EVENT.ORDER_CONFIRMED:
      return `🎉 Order confirmed!

Order: ${orderNumber}

Your payment has been verified and your order is now confirmed.

We will notify you when it is ready for delivery.

Thank you for shopping with 6Set Jewelry 💜`

    case COMMUNICATION_EVENT.ORDER_READY:
      return `📦 Your order is ready!

Order: ${orderNumber}

Your 6Set Jewelry order has been prepared and is ready for delivery.

${deliveryLocation ? `Delivery location: ${deliveryLocation}` : ''}

We will notify you when it is on the way.`

    case COMMUNICATION_EVENT.OUT_FOR_DELIVERY:
      return `🚚 Your order is on the way!

Order: ${orderNumber}

Your 6Set Jewelry order is now out for delivery.

Please keep your phone available so our delivery team can contact you if necessary.

Thank you 💜`

    case COMMUNICATION_EVENT.ORDER_COMPLETED:
      return `✅ Order completed

Order: ${orderNumber}

Your 6Set Jewelry order has been completed.

Thank you for shopping with 6Set Jewelry 💜

We hope to serve you again soon!`

    case COMMUNICATION_EVENT.ORDER_CANCELLED:
      return `⚠️ Order cancelled

Order: ${orderNumber}

Your order has been cancelled.

${note ? `Reason:\n${note}` : ''}

Please contact 6Set Jewelry if you need assistance.`

    case COMMUNICATION_EVENT.NEW_ORDER_ADMIN:
      return `🛍️ NEW ORDER

Order: ${orderNumber}
Customer: ${customerName}
Total: KES ${Number(total).toLocaleString()}

A new order has been placed and is awaiting payment.`

    case COMMUNICATION_EVENT.PAYMENT_SUBMISSION_ADMIN:
      return `💳 PAYMENT SUBMITTED

Order: ${orderNumber}
Customer: ${customerName}

M-Pesa Reference:
${paymentReference}

This payment is ready for verification.`

    case COMMUNICATION_EVENT.DELIVERY_READY_ADMIN:
      return `🚚 ORDER READY FOR DELIVERY

Order: ${orderNumber}
Customer: ${customerName}

${deliveryLocation ? `Location: ${deliveryLocation}` : ''}

The order is ready for delivery.`

    default:
      return `6Set Jewelry notification

Order: ${orderNumber}

${note || 'There has been an update to your order.'}`
  }
}

// ============================================================
// CREATE NOTIFICATION
// ============================================================

export async function createNotification({
  orderId = null,
  customerId = null,
  recipientType,
  recipientName = '',
  recipientPhone = null,
  recipientEmail = null,
  channel = DEFAULT_CHANNEL,
  eventType,
  message,
  metadata = {},
}) {
  if (!recipientType) {
    throw new Error('Recipient type is required.')
  }

  if (!eventType) {
    throw new Error('Communication event is required.')
  }

  if (!message?.trim()) {
    throw new Error('Communication message is required.')
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      order_id: orderId,
      customer_id: customerId,

      recipient_type: recipientType,
      recipient_name: recipientName || null,
      recipient_phone: recipientPhone || null,
      recipient_email: recipientEmail || null,

      channel,

      event_type: eventType,

      message: message.trim(),

      status:
        COMMUNICATION_STATUS.PENDING,

      metadata,

      created_at:
        new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error(
      'Failed to create notification:',
      error
    )

    throw new Error(
      error.message ||
        'Unable to create notification.'
    )
  }

  return data
}

// ============================================================
// MARK NOTIFICATION SENT
// ============================================================

export async function markNotificationSent(
  notificationId,
  providerMessageId = null
) {
  if (!notificationId) {
    throw new Error(
      'Notification ID is required.'
    )
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({
      status:
        COMMUNICATION_STATUS.SENT,

      sent_at:
        new Date().toISOString(),

      provider_message_id:
        providerMessageId,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      notificationId
    )
    .select()
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Unable to mark notification as sent.'
    )
  }

  return data
}

// ============================================================
// MARK NOTIFICATION FAILED
// ============================================================

export async function markNotificationFailed(
  notificationId,
  errorMessage
) {
  if (!notificationId) {
    throw new Error(
      'Notification ID is required.'
    )
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({
      status:
        COMMUNICATION_STATUS.FAILED,

      error_message:
        errorMessage || 'Unknown error',

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      notificationId
    )
    .select()
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Unable to update notification.'
    )
  }

  return data
}

// ============================================================
// SEND CUSTOMER NOTIFICATION
// ============================================================

export async function notifyCustomer({
  order,
  eventType,
  channel = DEFAULT_CHANNEL,
  metadata = {},
  extraData = {},
}) {
  if (!order) {
    throw new Error(
      'Order is required.'
    )
  }

  const customer =
    order.customer || {}

  const payment =
    order.payment || {}

  const delivery =
    order.delivery || {}

  const message =
    buildMessage(
      eventType,
      {
        orderNumber:
          order.orderNumber,

        customerName:
          customer.name,

        total:
          order.total,

        paymentReference:
          payment.reference,

        rejectionReason:
          payment.rejectionReason,

        deliveryLocation:
          delivery.location,

        ...extraData,
      }
    )

  return createNotification({
    orderId:
      order.id,

    customerId:
      customer.id || null,

    recipientType:
      RECIPIENT_TYPE.CUSTOMER,

    recipientName:
      customer.name,

    recipientPhone:
      customer.phone,

    recipientEmail:
      customer.email || null,

    channel,

    eventType,

    message,

    metadata,
  })
}

// ============================================================
// SEND ADMIN NOTIFICATION
// ============================================================

export async function notifyAdmin({
  order,
  eventType,
  adminPhone = null,
  adminEmail = null,
  channel = DEFAULT_CHANNEL,
  metadata = {},
  extraData = {},
}) {
  if (!order) {
    throw new Error(
      'Order is required.'
    )
  }

  const customer =
    order.customer || {}

  const payment =
    order.payment || {}

  const delivery =
    order.delivery || {}

  const message =
    buildMessage(
      eventType,
      {
        orderNumber:
          order.orderNumber,

        customerName:
          customer.name,

        total:
          order.total,

        paymentReference:
          payment.reference,

        deliveryLocation:
          delivery.location,

        ...extraData,
      }
    )

  return createNotification({
    orderId:
      order.id,

    recipientType:
      RECIPIENT_TYPE.ADMIN,

    recipientName:
      '6Set Jewelry Admin',

    recipientPhone:
      adminPhone,

    recipientEmail:
      adminEmail,

    channel,

    eventType,

    message,

    metadata,
  })
}

// ============================================================
// ORDER CREATED COMMUNICATION
// ============================================================

export async function sendOrderCreatedNotifications(
  order,
  adminContact = {}
) {
  if (!order) {
    throw new Error(
      'Order is required.'
    )
  }

  const customerNotification =
    await notifyCustomer({
      order,

      eventType:
        COMMUNICATION_EVENT.ORDER_CREATED,
    })

  const paymentNotification =
    await notifyCustomer({
      order,

      eventType:
        COMMUNICATION_EVENT.PAYMENT_INSTRUCTIONS,
    })

  const adminNotification =
    await notifyAdmin({
      order,

      eventType:
        COMMUNICATION_EVENT.NEW_ORDER_ADMIN,

      ...adminContact,
    })

  return {
    customerNotification,
    paymentNotification,
    adminNotification,
  }
}

// ============================================================
// PAYMENT SUBMITTED COMMUNICATION
// ============================================================

export async function sendPaymentSubmittedNotifications(
  order,
  adminContact = {}
) {
  const customerNotification =
    await notifyCustomer({
      order,

      eventType:
        COMMUNICATION_EVENT.PAYMENT_SUBMITTED,
    })

  const adminNotification =
    await notifyAdmin({
      order,

      eventType:
        COMMUNICATION_EVENT.PAYMENT_SUBMISSION_ADMIN,

      ...adminContact,
    })

  return {
    customerNotification,
    adminNotification,
  }
}

// ============================================================
// PAYMENT VERIFIED COMMUNICATION
// ============================================================

export async function sendPaymentVerifiedNotification(
  order
) {
  return notifyCustomer({
    order,

    eventType:
      COMMUNICATION_EVENT.PAYMENT_VERIFIED,
  })
}

// ============================================================
// PAYMENT REJECTED COMMUNICATION
// ============================================================

export async function sendPaymentRejectedNotification(
  order,
  reason
) {
  return notifyCustomer({
    order,

    eventType:
      COMMUNICATION_EVENT.PAYMENT_REJECTED,

    extraData: {
      rejectionReason:
        reason,
    },
  })
}

// ============================================================
// ORDER CONFIRMED COMMUNICATION
// ============================================================

export async function sendOrderConfirmedNotification(
  order
) {
  return notifyCustomer({
    order,

    eventType:
      COMMUNICATION_EVENT.ORDER_CONFIRMED,
  })
}

// ============================================================
// ORDER READY COMMUNICATION
// ============================================================

export async function sendOrderReadyNotifications(
  order,
  adminContact = {}
) {
  const customerNotification =
    await notifyCustomer({
      order,

      eventType:
        COMMUNICATION_EVENT.ORDER_READY,
    })

  const adminNotification =
    await notifyAdmin({
      order,

      eventType:
        COMMUNICATION_EVENT.DELIVERY_READY_ADMIN,

      ...adminContact,
    })

  return {
    customerNotification,
    adminNotification,
  }
}

// ============================================================
// OUT FOR DELIVERY
// ============================================================

export async function sendOutForDeliveryNotification(
  order
) {
  return notifyCustomer({
    order,

    eventType:
      COMMUNICATION_EVENT.OUT_FOR_DELIVERY,
  })
}

// ============================================================
// ORDER COMPLETED
// ============================================================

export async function sendOrderCompletedNotification(
  order
) {
  return notifyCustomer({
    order,

    eventType:
      COMMUNICATION_EVENT.ORDER_COMPLETED,
  })
}

// ============================================================
// ORDER CANCELLED
// ============================================================

export async function sendOrderCancelledNotification(
  order,
  note = ''
) {
  return notifyCustomer({
    order,

    eventType:
      COMMUNICATION_EVENT.ORDER_CANCELLED,

    extraData: {
      note,
    },
  })
}

// ============================================================
// FETCH NOTIFICATION HISTORY
// ============================================================

export async function fetchNotificationHistory(
  orderId
) {
  if (!orderId) {
    throw new Error(
      'Order ID is required.'
    )
  }

  const { data, error } =
    await supabase
      .from('notifications')
      .select('*')
      .eq(
        'order_id',
        orderId
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      )

  if (error) {
    throw new Error(
      error.message ||
        'Unable to load notification history.'
    )
  }

  return data || []
}

// ============================================================
// FETCH ALL NOTIFICATIONS
// ============================================================

export async function fetchNotifications({
  limit = 100,
  status = null,
  recipientType = null,
} = {}) {
  let query = supabase
    .from('notifications')
    .select('*')
    .order(
      'created_at',
      {
        ascending: false,
      }
    )
    .limit(limit)

  if (status) {
    query = query.eq(
      'status',
      status
    )
  }

  if (recipientType) {
    query = query.eq(
      'recipient_type',
      recipientType
    )
  }

  const { data, error } =
    await query

  if (error) {
    throw new Error(
      error.message ||
        'Unable to load notifications.'
    )
  }

  return data || []
}

// ============================================================
// MARK NOTIFICATION READ
// ============================================================

export async function markNotificationRead(
  notificationId
) {
  if (!notificationId) {
    throw new Error(
      'Notification ID is required.'
    )
  }

  const { data, error } =
    await supabase
      .from('notifications')
      .update({
        status:
          COMMUNICATION_STATUS.READ,

        read_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        notificationId
      )
      .select()
      .single()

  if (error) {
    throw new Error(
      error.message ||
        'Unable to mark notification as read.'
    )
  }

  return data
}

// ============================================================
// DEFAULT SERVICE
// ============================================================

const communicationService = {
  createNotification,

  markNotificationSent,

  markNotificationFailed,

  notifyCustomer,

  notifyAdmin,

  sendOrderCreatedNotifications,

  sendPaymentSubmittedNotifications,

  sendPaymentVerifiedNotification,

  sendPaymentRejectedNotification,

  sendOrderConfirmedNotification,

  sendOrderReadyNotifications,

  sendOutForDeliveryNotification,

  sendOrderCompletedNotification,

  sendOrderCancelledNotification,

  fetchNotificationHistory,

  fetchNotifications,

  markNotificationRead,
}

export default communicationService