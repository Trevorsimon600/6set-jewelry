import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'

import { useOrder } from '../context/useOrder'

import './OrderConfirmation.css'


// =================================
// ORDER CONFIRMATION
// =================================

function OrderConfirmation() {

  // =================================
  // ORDER CONTEXT
  // =================================

  const {
    currentOrder,
    getOrder,
  } = useOrder()


  // =================================
  // URL PARAMETERS
  // =================================

  const [searchParams] =
    useSearchParams()


  const orderNumber =
    searchParams.get('order')


  const paymentParameter =
    searchParams.get('payment')


  // =================================
  // FALLBACK ORDER (LOADED FROM SUPABASE)
  // =================================
  //
  // getOrder() is async. If the order isn't
  // already sitting in OrderContext (e.g. this
  // page was reopened later, or reloaded), it
  // has to be fetched — it can't be resolved
  // synchronously during render.
  //

  const [fetchedOrder, setFetchedOrder] =
    useState(null)

  const [isLoadingOrder, setIsLoadingOrder] =
    useState(false)


  useEffect(() => {

    let cancelled = false

    const needsFallback =
      orderNumber &&
      (
        !currentOrder ||
        currentOrder.orderNumber !== orderNumber
      )

    if (!needsFallback) {
      return
    }

    async function loadFallbackOrder() {

      setIsLoadingOrder(true)

      try {

        const result =
          await getOrder(orderNumber)

        if (!cancelled) {
          setFetchedOrder(result || null)
        }

      } catch (error) {

        console.error(
          'Failed to load order for confirmation page:',
          error
        )

      } finally {

        if (!cancelled) {
          setIsLoadingOrder(false)
        }

      }

    }

    loadFallbackOrder()

    return () => {
      cancelled = true
    }

  }, [orderNumber, currentOrder, getOrder])


  // =================================
  // FIND ORDER
  // =================================

  let order =
    currentOrder


  /*
    If the current order is not the
    order shown in the URL, use whatever
    the fallback fetch above resolved.
  */

  if (
    orderNumber &&
    (
      !order ||
      order.orderNumber !== orderNumber
    ) &&
    fetchedOrder &&
    fetchedOrder.orderNumber === orderNumber
  ) {

    order =
      fetchedOrder

  }


  // =================================
  // LOADING ORDER
  // =================================

  if (!order && isLoadingOrder) {

    return (

      <div className="confirmation-page">

        <Header />

        <main>

          <section className="confirmation-section">

            <div className="confirmation-card">

              <div className="success-icon">

                ⏳

              </div>


              <p className="small-heading">

                6SET JEWELRY

              </p>


              <h1>

                Loading Your Order

              </h1>


              <p className="confirmation-message">

                Hang tight — we're pulling up your order details.

              </p>

            </div>

          </section>

        </main>

        <Footer />

      </div>

    )
  }


  // =================================
  // NO ORDER
  // =================================

  if (!order) {

    return (

      <div className="confirmation-page">

        <Header />

        <main>

          <section className="confirmation-section">

            <div className="confirmation-card">

              {/* =================================
                  ERROR ICON
              ================================= */}

              <div className="success-icon">

                ?

              </div>


              {/* =================================
                  BRAND
              ================================= */}

              <p className="small-heading">

                6SET JEWELRY

              </p>


              {/* =================================
                  HEADING
              ================================= */}

              <h1>

                Order Not Found

              </h1>


              {/* =================================
                  MESSAGE
              ================================= */}

              <p className="confirmation-message">

                We couldn't find the order you're
                looking for. It may have expired or
                the order number may be incorrect.

              </p>


              {/* =================================
                  ACTIONS
              ================================= */}

              <div className="confirmation-actions">

                <Link
                  to="/products"
                  className="shop-again-button"
                >

                  Continue Shopping

                </Link>


                <Link
                  to="/"
                  className="home-button"
                >

                  Back to Home

                </Link>

              </div>

            </div>

          </section>

        </main>

        <Footer />

      </div>

    )
  }


  // =================================
  // PAYMENT STATUS
  // =================================

  const paymentStatus =
    order.payment_status ??
    order.payment?.status ??
    'Awaiting Payment'


  // =================================
  // ORDER STATUS
  // =================================

  const orderStatus =
    order.order_status ??
    order.orderStatus ??
    'Awaiting Payment'


  // =================================
  // PAYMENT SUBMITTED
  // =================================

  const paymentSubmitted =
    paymentStatus === 'Payment Submitted' ||
    paymentParameter === 'submitted'


  // =================================
  // PAYMENT VERIFIED
  // =================================

  const paymentVerified =
    paymentStatus === 'Payment Verified'


  // =================================
  // ORDER NUMBER
  // =================================

  const displayOrderNumber =
    order.order_number ??
    order.orderNumber ??
    orderNumber


  // =================================
  // ORDER DATE
  // =================================

  const createdAt =
    order.created_at ??
    order.createdAt

  const orderDate =
    createdAt

      ? new Date(
          createdAt
        ).toLocaleString(
          'en-KE',
          {
            dateStyle: 'medium',
            timeStyle: 'short',
          }
        )

      : '—'

  // =================================
  // SUBTOTAL
  // =================================

  const subtotal =
    Number(
      order.subtotal ??
      0
    )


  // =================================
  // DELIVERY COST
  // =================================

  const deliveryCost =
    order.delivery?.cost !== null &&
    order.delivery?.cost !== undefined

      ? Number(
          order.delivery.cost
        )

      : null


  // =================================
  // ORDER TOTAL
  // =================================

  const orderTotal =
    Number(
      order.total ??
      (
        subtotal +
        (deliveryCost || 0)
      )
    )

  // =================================
  // CUSTOMER
  // =================================

  const customerName =
    order.customer_name ??
    order.customer?.name ??
    'Customer'


  const customerPhone =
    order.customer_phone ??
    order.customer?.phone ??
    '—'


  const customerLocation =
    order.customer_location ??
    order.customer?.location ??
    ''


  const customerInstructions =
    order.customer_instructions ??
    order.customer?.instructions ??
  ''
  


  // =================================
  // PAYMENT INFORMATION
  // =================================

  const paymentMethod =
    order.payment_method ??
    order.payment?.method ??
    'Pochi la Biashara'


  const paymentReference =
    order.payment_reference ??
    order.payment?.reference ??
    ''


  // =================================
  // DELIVERY
  // =================================

  const deliveryStatus =
    order.delivery?.status ||
    'To Be Arranged'


  // =================================
  // 6SET JEWELRY CONTACT
  // =================================

  /*
    Display number:
    0754657655

    International WhatsApp:
    254754657655
  */

  const contactPhone =
    '0754657655'


  const whatsappPhone =
    '254754657655'


  const internationalPhone =
    '+254754657655'


  // =================================
  // WHATSAPP MESSAGE
  // =================================

  const whatsappMessage =

    `Hello Tabitha, I placed order ${displayOrderNumber} ` +
    `with 6Set Jewelry. ` +
    `My order total is KES ${orderTotal.toLocaleString()}. ` +
    `I would like to discuss my delivery arrangements.`


  // =================================
  // WHATSAPP URL
  // =================================

  const whatsappUrl =
    `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
      whatsappMessage
    )}`


  // =================================
  // PHONE URL
  // =================================

  const phoneUrl =
    `tel:${internationalPhone}`


  // =================================
  // PRINT RECEIPT
  // =================================

  function handlePrintReceipt() {

    window.print()

  }


  // =================================
  // PAGE
  // =================================

  return (

    <div className="confirmation-page">

      <Header />


      <main>

        <section className="confirmation-section">

          <div className="confirmation-card">


            {/* =================================
                SUCCESS ICON
            ================================= */}

            <div className="success-icon">

              ✓

            </div>


            {/* =================================
                BRAND
            ================================= */}

            <p className="small-heading">

              6SET JEWELRY

            </p>


            {/* =================================
                MAIN HEADING
            ================================= */}

            <h1>

              {paymentSubmitted
                ? 'Payment Submitted!'
                : 'Order Received!'
              }

            </h1>


            {/* =================================
                MESSAGE
            ================================= */}

            <p className="confirmation-message">

              {customerName && (

                <>

                  Thank you, {customerName}.

                  {' '}

                </>

              )}

              Your order has been received by
              6Set Jewelry.

              {' '}

              {paymentVerified

                ? (
                  'Your payment has been verified successfully.'
                )

                : paymentSubmitted

                  ? (
                    'Your payment details have been submitted and are awaiting verification.'
                  )

                  : (
                    'Payment is still required before your order can move forward.'
                  )

              }

            </p>


            {/* =================================
                DIGITAL RECEIPT
            ================================= */}

            <div
              className="digital-receipt"
              id="digital-receipt"
            >


              {/* =================================
                  RECEIPT HEADER
              ================================= */}

              <div className="receipt-header">

                <p className="receipt-shop-name">

                  6SET JEWELRY

                </p>


                <h2>

                  Digital Receipt

                </h2>


                <p>

                  Order #{displayOrderNumber}

                </p>


                <p>

                  {orderDate}

                </p>

              </div>


              {/* =================================
                  CUSTOMER INFORMATION
              ================================= */}

              <div className="receipt-section">

                <h3>

                  Customer

                </h3>


                <div className="receipt-info-row">

                  <span>

                    Name

                  </span>


                  <strong>

                    {customerName}

                  </strong>

                </div>


                <div className="receipt-info-row">

                  <span>

                    Phone

                  </span>


                  <strong>

                    {customerPhone}

                  </strong>

                </div>


                {customerLocation && (

                  <div className="receipt-info-row">

                    <span>

                      Location

                    </span>


                    <strong>

                      {customerLocation}

                    </strong>

                  </div>

                )}

              </div>


              {/* =================================
                  ORDER ITEMS
              ================================= */}

              <div className="receipt-section">

                <h3>

                  Items

                </h3>


                <div className="receipt-items">

                  {order.items?.map(
                    (item, index) => (

                      <div
                        className="receipt-item"
                        key={
                          item.id ||
                          item.order_item_id ||
                          index
                        }
                      >

                        {/* ITEM DETAILS */}

                        <div className="receipt-item-details">

                          <strong>

                            {
                              item.product_name ||
                              item.name ||
                              'Product'
                            }

                          </strong>

                          <span>

                            Qty:{' '}

                            {
                              item.quantity ??
                              item.qty ??
                              0
                            }

                          </span>

                        </div>


                        {/* ITEM PRICE */}

                        <div className="receipt-item-price">

                          <span>

                            KES{' '}

                            {Number(
                              item.price ??
                              0
                            ).toLocaleString()}

                          </span>


                          <strong>

                            KES{' '}

                            {Number(
                              item.item_total ??
                              item.total_price ??
                              item.total ??
                              (
                                Number(item.price ?? 0) *
                                Number(item.quantity ?? 0)
                              )
                            ).toLocaleString()}

                          </strong>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>


              {/* =================================
                  MONEY SUMMARY
              ================================= */}

              <div className="receipt-section">

                <h3>

                  Summary

                </h3>


                {/* SUBTOTAL */}

                <div className="receipt-total-row">

                  <span>

                    Subtotal

                  </span>


                  <span>

                    KES {subtotal.toLocaleString()}

                  </span>

                </div>


                {/* DELIVERY */}

                <div className="receipt-total-row">

                  <span>

                    Delivery

                  </span>


                  <span>

                    {deliveryCost === null

                      ? 'To be arranged'

                      : (
                        `KES ${deliveryCost.toLocaleString()}`
                      )

                    }

                  </span>

                </div>


                {/* GRAND TOTAL */}

                <div className="receipt-grand-total">

                  <span>

                    TOTAL

                  </span>


                  <strong>

                    KES {orderTotal.toLocaleString()}

                  </strong>

                </div>

              </div>


              {/* =================================
                  PAYMENT INFORMATION
              ================================= */}

              <div className="receipt-section">

                <h3>

                  Payment

                </h3>


                <div className="receipt-info-row">

                  <span>

                    Method

                  </span>


                  <strong>

                    {paymentMethod}

                  </strong>

                </div>


                <div className="receipt-info-row">

                  <span>

                    Status

                  </span>


                  <strong>

                    {paymentStatus}

                  </strong>

                </div>


                {paymentReference && (

                  <div className="receipt-info-row">

                    <span>

                      M-Pesa Reference

                    </span>


                    <strong>

                      {paymentReference}

                    </strong>

                  </div>

                )}

              </div>


              {/* =================================
                  DELIVERY INFORMATION
              ================================= */}

              <div className="receipt-section">

                <h3>

                  Delivery

                </h3>


                <div className="receipt-info-row">

                  <span>

                    Status

                  </span>


                  <strong>

                    {deliveryStatus}

                  </strong>

                </div>


                {customerInstructions && (

                  <div className="receipt-info-row">

                    <span>

                      Instructions

                    </span>


                    <strong>

                      {customerInstructions}

                    </strong>

                  </div>

                )}

              </div>


              {/* =================================
                  CONTACT 6SET JEWELRY
              ================================= */}

              <div className="receipt-section">

                <h3>

                  Contact 6Set Jewelry

                </h3>


                <div className="receipt-info-row">

                  <span>

                    WhatsApp / Phone

                  </span>


                  <strong>

                    {contactPhone}

                  </strong>

                </div>

              </div>


              {/* =================================
                  RECEIPT FOOTER
              ================================= */}

              <div className="receipt-footer">

                <p>

                  Thank you for shopping with
                  6Set Jewelry!

                </p>


                <span>

                  Please keep this receipt for
                  your records.

                </span>

              </div>

            </div>


            {/* =================================
                NEXT STEP
                PAYMENT SUBMITTED
            ================================= */}

            {paymentSubmitted &&
              !paymentVerified && (

              <div className="confirmation-next-step">

                <p className="small-heading">

                  WHAT HAPPENS NEXT?

                </p>


                <h2>

                  Payment Verification

                </h2>


                <p>

                  Your payment reference has been
                  submitted successfully.

                  {' '}

                  Tabitha will verify the payment and
                  then contact you to arrange your
                  delivery location, delivery cost and
                  delivery time.

                </p>


                {/* =================================
                    WHATSAPP
                ================================= */}

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-button"
                >

                  <svg
                    className="whatsapp-icon"
                    viewBox="0 0 32 32"
                    width="20"
                    height="20"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M16 3a13 13 0 0 0-11.1 19.8L3 29l6.4-1.7A13 13 0 1 0 16 3Zm0 23.7a10.7 10.7 0 0 1-5.4-1.5l-.4-.2-3.8 1 1-3.7-.3-.4A10.7 10.7 0 1 1 16 26.7Zm5.9-8c-.3-.1-1.8-.9-2.1-1s-.5-.1-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.7 8.7 0 0 1-2.6-1.6 9.7 9.7 0 0 1-1.8-2.3c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.5l-1-2.3c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.5.1-.8.4s-1 1-1 2.5 1 3 1.1 3.2a12.3 12.3 0 0 0 4.8 4.2c.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2.1-1.4s.3-1.3.2-1.4-.3-.2-.6-.3Z"
                    />
                  </svg>

                  {' '}

                  Chat with Tabitha

                </a>

              </div>

            )}


            {/* =================================
                PAYMENT VERIFIED
            ================================= */}

            {paymentVerified && (

              <div className="confirmation-next-step">

                <p className="small-heading">

                  PAYMENT VERIFIED

                </p>


                <h2>

                  Your Order Is Confirmed

                </h2>


                <p>

                  Your payment has been verified.

                  {' '}

                  Tabitha will contact you to finalize
                  your delivery arrangements.

                </p>


                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-button"
                >

                  <svg
                    className="whatsapp-icon"
                    viewBox="0 0 32 32"
                    width="20"
                    height="20"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M16 3a13 13 0 0 0-11.1 19.8L3 29l6.4-1.7A13 13 0 1 0 16 3Zm0 23.7a10.7 10.7 0 0 1-5.4-1.5l-.4-.2-3.8 1 1-3.7-.3-.4A10.7 10.7 0 1 1 16 26.7Zm5.9-8c-.3-.1-1.8-.9-2.1-1s-.5-.1-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.7 8.7 0 0 1-2.6-1.6 9.7 9.7 0 0 1-1.8-2.3c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.5l-1-2.3c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.5.1-.8.4s-1 1-1 2.5 1 3 1.1 3.2a12.3 12.3 0 0 0 4.8 4.2c.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2.1-1.4s.3-1.3.2-1.4-.3-.2-.6-.3Z"
                    />
                  </svg>

                  {' '}

                  Chat with Tabitha

                </a>

              </div>

            )}


            {/* =================================
                PAYMENT STILL REQUIRED
            ================================= */}

            {!paymentSubmitted &&
              !paymentVerified && (

              <div className="confirmation-next-step">

                <p className="small-heading">

                  NEXT STEP

                </p>


                <h2>

                  Complete Your Payment

                </h2>


                <p>

                  Your order has been created, but
                  payment has not yet been submitted.

                  {' '}

                  Complete your payment to continue.

                </p>


                <Link
                  to={`/payment?order=${displayOrderNumber}`}
                  className="shop-again-button"
                >

                  Complete Payment

                </Link>

              </div>

            )}


            {/* =================================
                RECEIPT ACTIONS
            ================================= */}

            <div className="receipt-actions">


              {/* =================================
                  PRINT / SAVE
              ================================= */}

              <button
                type="button"
                className="print-receipt-button"
                onClick={handlePrintReceipt}
              >

                🧾 Print / Save Receipt

              </button>


              {/* =================================
                  CALL BUTTON
              ================================= */}

              <a
                href={phoneUrl}
                className="call-button"
              >

                📞 Call Tabitha

              </a>

            </div>


            {/* =================================
                GENERAL ACTIONS
            ================================= */}

            <div className="confirmation-actions">


              {/* CONTINUE SHOPPING */}

              <Link
                to="/products"
                className="shop-again-button"
              >

                Continue Shopping

              </Link>


              {/* HOME */}

              <Link
                to="/"
                className="home-button"
              >

                Back to Home

              </Link>

            </div>


          </div>

        </section>

      </main>


      <Footer />

    </div>

  )
}


export default OrderConfirmation