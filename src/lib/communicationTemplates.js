// ============================================================
// CUSTOMER COMMUNICATION TEMPLATES
// PHASE 7.16.9C
// CENTRAL MESSAGE TEMPLATES
// ============================================================

export function getCommunicationTemplates({
  customerName,
  orderNumber,
  orderTotal,
}) {
  return {
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
  }
}