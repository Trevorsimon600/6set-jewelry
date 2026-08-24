import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useCart } from '../context/CartContext'

import Header from '../components/Header'
import Footer from '../components/Footer'

import { useOrder } from '../context/useOrder'
import { useShopSettings } from '../context/ShopSettingsContext'

import './Payment.css'


function Payment() {

  // ============================================
  // ORDER CONTEXT
  // ============================================

  const {
    currentOrder,
    submitPayment,
    getOrder,
    setActiveOrder,
  } = useOrder()

  const {
    clearCart,
  } = useCart()


  // ============================================
  // SHOP SETTINGS
  // ============================================

  const {
    shopName,
    paymentMethod,
    paymentNumber,
    paymentRecipient,
    paymentInstructions,
  } = useShopSettings()


  // ============================================
  // ROUTER
  // ============================================

  const navigate = useNavigate()

  const [searchParams] =
    useSearchParams()

  const orderNumberFromUrl =
    searchParams.get('order')


  // ============================================
  // ORDER STATE
  // ============================================

  const [order, setOrder] =
    useState(currentOrder)

  const [
    isLoadingOrder,
    setIsLoadingOrder,
  ] = useState(true)

  const [
    orderError,
    setOrderError,
  ] = useState(null)


  // ============================================
  // PAYMENT REFERENCE
  // ============================================

  const [
    paymentReference,
    setPaymentReference,
  ] = useState('')

  


  // ============================================
  // SUBMISSION STATE
  // ============================================

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)


  // ============================================
  // LOAD ORDER
  // ============================================

  useEffect(() => {

    let cancelled = false


    async function loadOrder() {

      setIsLoadingOrder(true)
      setOrderError(null)


      try {

        // ----------------------------------------
        // ORDER FROM URL
        // ----------------------------------------

        if (orderNumberFromUrl) {

          const savedOrder =
            await getOrder(
              orderNumberFromUrl
            )


          if (!savedOrder) {

            if (!cancelled) {

              setOrder(null)

              setOrderError(
                'We could not find this order.'
              )

            }

            return
          }


          if (!cancelled) {

            setOrder(savedOrder)

          }

          return
        }


        // ----------------------------------------
        // CURRENT ORDER
        // ----------------------------------------

        if (currentOrder) {

          if (!cancelled) {

            setOrder(currentOrder)

          }

          return
        }


        // ----------------------------------------
        // NO ORDER
        // ----------------------------------------

        if (!cancelled) {

          setOrder(null)

        }

      } catch (error) {

        console.error(
          'Failed to load order:',
          error
        )


        if (!cancelled) {

          setOrder(null)

          setOrderError(
            error.message ||
            'Unable to load your order.'
          )

        }

      } finally {

        if (!cancelled) {

          setIsLoadingOrder(false)

        }

      }

    }


    loadOrder()


    return () => {

      cancelled = true

    }

  }, [
    orderNumberFromUrl,
    currentOrder,
    getOrder,
  ])


  // ============================================
  // KEEP ORDER IN SYNC
  // ============================================

  useEffect(() => {

    if (
      currentOrder &&
      !orderNumberFromUrl
    ) {

      setOrder(currentOrder)

    }

  }, [
    currentOrder,
    orderNumberFromUrl,
  ])


  // ============================================
  // LOADING SCREEN
  // ============================================

  if (isLoadingOrder) {

    return (

      <div className="payment-page">

        <Header />

        <main className="payment-empty">

          <p className="small-heading">
            {shopName}
          </p>

          <h1>
            Loading Your Order
          </h1>

          <p>
            Please wait while we retrieve
            your order details.
          </p>

        </main>

        <Footer />

      </div>

    )

  }


  // ============================================
  // NO ORDER / ERROR
  // ============================================

  if (!order) {

    return (

      <div className="payment-page">

        <Header />

        <main className="payment-empty">

          <p className="small-heading">
            {shopName}
          </p>

          <h1>
            {
              orderError
                ? 'Invalid Payment Request'
                : 'No Pending Order'
            }
          </h1>

          <p>
            {
              orderError ||
              "We couldn't find an order waiting for payment."
            }
          </p>

          <Link
            to="/products"
            className="payment-primary-button"
          >
            Browse Products
          </Link>

        </main>

        <Footer />

      </div>

    )

  }


  // ============================================
  // ORDER ITEMS
  // ============================================

  const orderItems =
    Array.isArray(order.items)
      ? order.items
      : Array.isArray(order.order_items)
        ? order.order_items
        : []

  // ============================================
  // PAYMENT STATUS
  // ============================================

  const paymentStatus =
    order.payment_status ??
    order.payment?.status ??
    'Pending'

  // ============================================
  // ORDER TOTAL
  // ============================================
  //
  // The authoritative value comes from
  // orders.total in Supabase.
  //

  const orderTotal =
    Number(
      order.total ??
      order.subtotal ??
      order.pricing?.total ??
      0
    )

  // ============================================
  // ITEM COUNT
  // ============================================

  const itemCount =
    orderItems.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity ??
          item.qty ??
          0
        ),
      0
    )

  // ============================================
  // PAYMENT DETAILS
  // ============================================

  const hasPaymentDetails =
    Boolean(
      paymentMethod &&
      paymentNumber &&
      paymentRecipient
    )



  // ============================================
  // PAYMENT SUBMISSION
  // ============================================

  // ============================================
  // PAYMENT SUBMISSION
  // ============================================

  async function handlePaymentSubmitted(
    event
  ) {

    event.preventDefault()

    // ------------------------------------------
    // CLEAN REFERENCE
    // ------------------------------------------

    const reference =
      paymentReference
        .trim()
        .toUpperCase()


    // ------------------------------------------
    // VALIDATE REFERENCE
    // ------------------------------------------

    if (!reference) {

      alert(
        'Please enter your M-Pesa transaction reference.'
      )

      return
    }


    // ------------------------------------------
    // VALIDATE LENGTH
    // ------------------------------------------

    if (reference.length < 6) {

      alert(
        'Please enter a valid M-Pesa transaction reference.'
      )

      return
    }


    // ------------------------------------------
    // PREVENT DOUBLE SUBMISSION
    // ------------------------------------------

    if (isSubmitting) {

      return
    }


    setIsSubmitting(true)


    try {

      console.log(
        'Submitting payment reference:',
        reference
      )


      // ========================================
      // SUBMIT PAYMENT
      // ========================================

      const paymentResult =
        await submitPayment({
          orderNumber:
            order.orderNumber ||
            order.order_number,

          paymentReference:
            reference,
        })


      // ========================================
      // GET UPDATED ORDER FROM PAYMENT RESULT
      // ========================================

      const updatedOrder =
        paymentResult?.order


      if (!updatedOrder) {

        throw new Error(
          'Payment was submitted but the updated order was not returned.'
        )

      }


      // ========================================
      // DETERMINE ORDER NUMBER
      // ========================================

      const orderNumber =
        updatedOrder.order_number ||
        updatedOrder.orderNumber ||
        order.order_number ||
        order.orderNumber


      if (!orderNumber) {

        throw new Error(
          'Payment was submitted but the order number could not be determined.'
        )

      }


      // ========================================
      // RELOAD COMPLETE ORDER
      // ========================================
      //
      // This makes sure the confirmation/receipt
      // receives the complete authoritative order
      // from Supabase.
      //

      const completeOrder =
        await getOrder(orderNumber)


      const finalOrder =
        completeOrder ||
        updatedOrder


      // ========================================
      // UPDATE LOCAL ORDER
      // ========================================

      setOrder(finalOrder)


      // ========================================
      // UPDATE ACTIVE ORDER
      // ========================================

      await setActiveOrder(
        orderNumber
      )


      // ========================================
      // CLEAR CART
      // ========================================
      //
      // IMPORTANT:
      // Only clear the cart AFTER the payment
      // reference has successfully been recorded
      // and the order has been recovered.
      //

      clearCart()


      // ========================================
      // GO TO CONFIRMATION
      // ========================================

      navigate(
        `/order-confirmation?order=${encodeURIComponent(
          orderNumber
        )}&payment=submitted`
      )


    } catch (error) {

      console.error(
        'Payment submission error:',
        error
      )


      alert(
        error.message ||
        'Something went wrong while submitting your payment.'
      )


      setIsSubmitting(false)

    }

  }


  // ============================================
  // PAYMENT ALREADY SUBMITTED?
  // ============================================

  const paymentAlreadySubmitted =
    paymentStatus === 'Payment Submitted' ||
    paymentStatus === 'Payment Verified'


  // ============================================
  // PAGE
  // ============================================

  return (

    <div className="payment-page">

      <Header />


      <main>


        {/* ======================================
            HERO
        ====================================== */}

        <section className="payment-hero">

          <p className="small-heading">
            {shopName} • PAYMENT
          </p>


          <h1>
            Complete Your Payment
          </h1>


          <p>
            Pay for your order and submit
            your M-Pesa transaction reference
            so we can verify your payment.
          </p>

        </section>


        {/* ======================================
            PAYMENT CONTENT
        ====================================== */}

        <section className="payment-section">

          <div className="payment-layout">


            {/* ==================================
                PAYMENT CARD
            ================================== */}

            <div className="payment-card">


              <p className="payment-label">

                {
                  paymentMethod
                    ? `PAY WITH ${paymentMethod.toUpperCase()}`
                    : 'PAYMENT'
                }

              </p>


              <h2>
                Order #{order.orderNumber}
              </h2>


              {/* =================================
                  PAYMENT STATUS
              ================================= */}

              <div className="payment-status-message">

                <strong>
                  Payment Status
                </strong>

                <span>
                  {paymentStatus}
                </span>

              </div>


              {/* =================================
                  TOTAL
              ================================= */}

              <div className="payment-total">

                <span>
                  Amount to Pay
                </span>

                <strong>

                  KES{' '}

                  {orderTotal.toLocaleString()}

                </strong>

              </div>


              {/* =================================
                  PAYMENT INSTRUCTIONS
              ================================= */}

              {hasPaymentDetails ? (

                <div className="payment-instructions">


                  <h3>
                    Payment Instructions
                  </h3>


                  {/* STEP 1 */}

                  <div className="payment-step">

                    <span>
                      1
                    </span>

                    <p>

                      Open M-Pesa and choose{' '}

                      <strong>
                        {paymentMethod}
                      </strong>.

                    </p>

                  </div>


                  {/* STEP 2 */}

                  <div className="payment-step">

                    <span>
                      2
                    </span>

                    <p>

                      Send{' '}

                      <strong>

                        KES{' '}

                        {orderTotal.toLocaleString()}

                      </strong>

                      {' '}to:

                    </p>

                  </div>


                  {/* PAYMENT RECIPIENT */}

                  <div className="pochi-details">

                    <strong>
                      {paymentRecipient}
                    </strong>

                    <span>
                      {paymentNumber}
                    </span>

                  </div>


                  {/* STEP 3 */}

                  <div className="payment-step">

                    <span>
                      3
                    </span>

                    <p>

                      Complete the payment.

                      <br />

                      Keep the M-Pesa confirmation
                      message you receive.

                    </p>

                  </div>


                  {/* STEP 4 */}

                  <div className="payment-step">

                    <span>
                      4
                    </span>

                    <p>

                      Find the transaction code
                      in your M-Pesa confirmation
                      message.

                    </p>

                  </div>


                  {/* =================================
                      REFERENCE REMINDER
                  ================================= */}

                  <div className="payment-reference-reminder">

                    <strong>
                      Important
                    </strong>

                    <p>

                      You must enter the M-Pesa
                      transaction reference below
                      after completing your payment.

                    </p>

                  </div>


                  {/* ADDITIONAL INSTRUCTIONS */}

                  {paymentInstructions && (

                    <div className="payment-custom-instructions">

                      <h4>
                        Additional Instructions
                      </h4>

                      <p>
                        {paymentInstructions}
                      </p>

                    </div>

                  )}

                </div>

              ) : (

                <div className="payment-status-message">

                  <strong>
                    Payment Details Unavailable
                  </strong>

                  <span>

                    Payment details have not yet
                    been configured for this shop.
                    Please contact {shopName}
                    before making a payment.

                  </span>

                </div>

              )}


              {/* =================================
                  M-PESA REFERENCE FORM
              ================================= */}

              {
                !paymentAlreadySubmitted &&
                hasPaymentDetails && (

                  <form
                    className="payment-form"
                    onSubmit={
                      handlePaymentSubmitted
                    }
                  >


                    <div className="payment-reference-header">

                      <span>
                        5
                      </span>

                      <div>

                        <label
                          htmlFor="paymentReference"
                        >
                          M-Pesa Transaction Reference
                        </label>

                        <p>

                          Enter the transaction code
                          exactly as shown in your
                          M-Pesa confirmation message.

                        </p>

                      </div>

                    </div>


                    <input
                      id="paymentReference"
                      name="paymentReference"
                      type="text"
                      placeholder="e.g. QFG7ABC123"
                      value={
                        paymentReference
                      }
                      onChange={(event) => {

                        setPaymentReference(
                          event.target.value
                            .toUpperCase()
                        )

                      }}
                      autoComplete="off"
                      spellCheck="false"
                      required
                    />


                


                    <button
                      type="submit"
                      className="payment-submit-button"
                      disabled={
                        isSubmitting ||
                        !paymentReference.trim()
                      }
                    >

                      {
                        isSubmitting
                          ? 'Submitting Payment...'
                          : "I've Paid — Submit Reference"
                      }

                    </button>


                  </form>

                )
              }


              {/* =================================
                  PAYMENT SUBMITTED
              ================================= */}

              {
                paymentAlreadySubmitted && (

                  <div className="payment-submitted-box">

                    <strong>

                      {
                        paymentStatus ===
                        'Payment Verified'
                          ? 'Payment Verified'
                          : 'Payment Submitted'
                      }

                    </strong>


                    <p>

                      {
                        paymentStatus ===
                        'Payment Verified'
                          ? 'Your payment has been verified. Your order is confirmed.'
                          : 'Your M-Pesa payment reference has been recorded and is waiting for verification.'
                      }

                    </p>


                    {order.payment?.reference && (

                      <p>

                        Reference:

                        <strong>

                          {' '}

                          {
                            order.payment.reference
                          }

                        </strong>

                      </p>

                    )}

                  </div>

                )
              }


              {/* =================================
                  PAYMENT NOTE
              ================================= */}

              <p className="payment-note">

                Your payment must be verified before
                your order is finalized.

                {' '}

                After payment verification,

                {' '}

                {paymentRecipient || shopName}

                {' '}

                can contact you to arrange
                delivery details.

              </p>


              {/* =================================
                  BACK TO CHECKOUT
              ================================= */}

              <Link
                to={
                  orderNumberFromUrl
                    ? `/checkout?order=${orderNumberFromUrl}`
                    : '/checkout'
                }
                className="payment-back-link"
              >

                ← Back to Checkout

              </Link>


            </div>


            {/* ==================================
                ORDER SUMMARY
            ================================== */}

            <aside className="payment-summary">


              <p className="small-heading">
                YOUR ORDER
              </p>


              <h2>
                Order Summary
              </h2>


              {/* ITEMS */}

              <div className="payment-summary-items">

                {orderItems.map(
                  (item, index) => (

                    <div
                      className="payment-summary-item"
                      key={
                        item.orderItemId ||
                        item.id ||
                        index
                      }
                    >


                      <div className="payment-summary-image">

                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name || 'Product'}
                          />
                        ) : (
                          <div className="payment-summary-image-placeholder">
                            No Image
                          </div>
                        )}

                      </div>

                      <div>

                        <h3>
                          {item.product_name || 'Product'}
                        </h3>

                        <p>
                          Qty: {item.quantity}
                        </p>

                      </div>


                      <strong>
                        KES{' '}
                        {Number(
                          item.item_total ??
                          item.total_price ??
                          (
                            Number(item.price || 0) *
                            Number(item.quantity || 0)
                          )
                        ).toLocaleString()}
                      </strong>


                    </div>

                  )
                )}

              </div>


              {/* DIVIDER */}

              <div className="payment-summary-divider" />


              {/* ITEMS */}

              <div className="payment-summary-row">

                <span>
                  Items
                </span>

                <span>
                  {itemCount}
                </span>

              </div>


              {/* DELIVERY */}

              <div className="payment-summary-row">

                <span>
                  Delivery
                </span>

                <span>
                  To be arranged
                </span>

              </div>


              {/* TOTAL */}

              <div className="payment-summary-total">

                <span>
                  Total to Pay
                </span>

                <strong>

                  KES{' '}

                  {orderTotal.toLocaleString()}

                </strong>

              </div>


            </aside>


          </div>

        </section>

      </main>


      <Footer />

    </div>

  )

}


export default Payment