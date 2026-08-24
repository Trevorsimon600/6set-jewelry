import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'

import { useCart } from '../context/CartContext'
import { useOrder } from '../context/useOrder'
import { useShopSettings } from '../context/ShopSettingsContext'

import { validateCartStock } from '../lib/catalogService'

import './Checkout.css'

export default function Checkout() {
  const cart = useCart()
  const orderContext = useOrder()
  const navigate = useNavigate()

  // =================================
  // SHOP SETTINGS
  // =================================

  const {
    shopName,
    deliveryInstructions,
    deliveryFeePolicy,
  } = useShopSettings()

  // =================================
  // CART
  // =================================

  const cartItems = cart.cartItems
  const totalItems = cart.totalItems
  const totalPrice = cart.totalPrice

  // =================================
  // ORDER
  // =================================

  const createOrder = orderContext.createOrder

  // =================================
  // FORM
  // =================================

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    instructions: '',
  })

  // =================================
  // STOCK STATE
  // =================================

  const [checkingStock, setCheckingStock] = useState(false)

  const [stockError, setStockError] = useState('')

  const [stockIssues, setStockIssues] = useState([])

  // =================================
  // SAFE DELIVERY INFORMATION
  // =================================

  const safeDeliveryInstructions =
    deliveryInstructions?.trim() ||
    'Payment is required first. After payment, you and the shop will arrange the delivery location, delivery cost and timing through WhatsApp.'

  const safeDeliveryFeePolicy =
    deliveryFeePolicy?.trim() ||
    'Delivery cost will be confirmed with you after payment.'

  // =================================
  // HANDLE FORM CHANGE
  // =================================

  function handleChange(event) {
    const name = event.target.name
    const value = event.target.value

    setFormData(function (currentData) {
      return {
        ...currentData,
        [name]: value,
      }
    })
  }

  // =================================
  // HANDLE SUBMIT
  // =================================

  async function handleSubmit(event) {
    event.preventDefault()

    setStockError('')
    setStockIssues([])

    if (checkingStock) {
      return
    }

    try {
      setCheckingStock(true)

      // =================================
      // RECHECK LATEST SUPABASE STOCK
      // =================================

      const validation =
        await validateCartStock(cartItems)

      if (!validation.valid) {
        setStockIssues(validation.issues)

        setStockError(
          'Some items in your cart are no longer available in the requested quantity.'
        )

        return
      }

      // =================================
      // CREATE ORDER FROM CURRENT CART
      // =================================

      const orderData = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          location: 'To be arranged',
          instructions: formData.instructions,
        },

        cartItems: cartItems,

        // This is informational only.
        // orderService recalculates the authoritative
        // subtotal and total from Supabase prices.
        subtotal: totalPrice,
      }

      const createdOrder =
        await createOrder(orderData)

      if (!createdOrder?.orderNumber) {
        throw new Error(
          'Order number was not returned.'
        )
      }

      // =================================
      // GO TO PAYMENT
      // =================================

      navigate(
        `/payment?order=${encodeURIComponent(
          createdOrder.orderNumber
        )}`
      )
    } catch (error) {
      console.error(
        'Checkout order creation failed:',
        error
      )

      setStockError(
        error.message ||
          'We could not create your order. Please try again.'
      )
    } finally {
      setCheckingStock(false)
    }
}

  // =================================
  // EMPTY CART
  // =================================

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <Header />

        <main>
          <section className="checkout-empty">

            <div className="checkout-empty-icon">
              🛒
            </div>

            <p className="small-heading">
              {shopName}
            </p>

            <h1>
              Your cart is empty.
            </h1>

            <p>
              Add some beautiful jewelry
              before continuing to checkout.
            </p>

            <Link
              to="/products"
              className="checkout-shopping-button"
            >
              Explore Jewelry
            </Link>

          </section>
        </main>

        <Footer />
      </div>
    )
  }

  // =================================
  // CHECKOUT
  // =================================

  return (
    <div className="checkout-page">

      <Header />

      <main>

        {/* =================================
            HERO
        ================================= */}

        <section className="checkout-hero">

          <p className="small-heading">
            {shopName}
          </p>

          <h1>
            Checkout
          </h1>

          <p>
            Complete your details before
            proceeding to payment.
          </p>

        </section>


        {/* =================================
            CHECKOUT CONTENT
        ================================= */}

        <section className="checkout-section">

          <div className="checkout-layout">

            {/* =================================
                CHECKOUT FORM
            ================================= */}

            <form
              className="checkout-form"
              onSubmit={handleSubmit}
            >

              <div className="checkout-form-header">

                <p className="small-heading">
                  CUSTOMER DETAILS
                </p>

                <h2>
                  Your Information
                </h2>

              </div>


              {/* =================================
                  STOCK ERROR
              ================================= */}

              {stockError && (
                <div className="checkout-stock-error">

                  <strong>
                    Product availability changed
                  </strong>

                  <p>
                    {stockError}
                  </p>

                  {stockIssues.length > 0 && (
                    <ul>
                      {stockIssues.map(
                        (issue, index) => (
                          <li
                            key={
                              `${issue.productId}-${index}`
                            }
                          >
                            {issue.message}
                          </li>
                        )
                      )}
                    </ul>
                  )}

                  <p>
                    Please return to your
                    cart and update the affected
                    items before continuing.
                  </p>

                  <Link
                    to="/cart"
                    className="back-to-cart"
                  >
                    ← Review Cart
                  </Link>

                </div>
              )}


              {/* =================================
                  CUSTOMER NAME
              ================================= */}

              <div className="form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={checkingStock}
                />

              </div>


              {/* =================================
                  PHONE
              ================================= */}

              <div className="form-group">

                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 0792 659 242"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={checkingStock}
                />

              </div>


              {/* =================================
                  DYNAMIC DELIVERY INFORMATION
              ================================= */}

              <div className="payment-notice">

                <span className="payment-icon">
                  📍
                </span>

                <div>

                  <strong>
                    Delivery details
                  </strong>

                  <p>
                    {safeDeliveryInstructions}
                  </p>

                  <p>
                    <strong>
                      Delivery fee:
                    </strong>{' '}
                    {safeDeliveryFeePolicy}
                  </p>

                </div>

              </div>


              {/* =================================
                  NOTES
              ================================= */}

              <div className="form-group">

                <label htmlFor="instructions">
                  Order Notes (Optional)
                </label>

                <textarea
                  id="instructions"
                  name="instructions"
                  placeholder="Anything you'd like us to know about your order?"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows="4"
                  disabled={checkingStock}
                />

              </div>


              {/* =================================
                  PAYMENT
              ================================= */}

              <div className="payment-notice">

                <span className="payment-icon">
                  📱
                </span>

                <div>

                  <strong>
                    Pochi la Biashara
                  </strong>

                  <p>
                    After you place the order,
                    you will receive the payment
                    instructions for {shopName}.
                  </p>

                </div>

              </div>


              {/* =================================
                  PLACE ORDER
              ================================= */}

              <button
                type="submit"
                className="place-order-button"
                disabled={checkingStock}
              >
                {checkingStock
                  ? 'Checking Availability...'
                  : 'Continue to Payment'}
              </button>


              <Link
                to="/cart"
                className="back-to-cart"
              >
                ← Back to Cart
              </Link>

            </form>


            {/* =================================
                ORDER SUMMARY
            ================================= */}

            <aside className="checkout-summary">

              <div className="summary-header">

                <p className="small-heading">
                  YOUR ORDER
                </p>

                <h2>
                  Order Summary
                </h2>

              </div>


              {/* =================================
                  ITEMS
              ================================= */}

              <div className="checkout-items">

                {cartItems.map(
                  function (item) {

                    return (
                      <div
                        className="checkout-item"
                        key={item.id}
                      >

                        <div className="checkout-item-image">

                          <img
                            src={item.image}
                            alt={item.name}
                          />

                        </div>


                        <div className="checkout-item-info">

                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            Qty: {item.quantity}
                          </p>

                        </div>


                        <strong>
                          KES{' '}
                          {(
                            item.price *
                            item.quantity
                          ).toLocaleString()}
                        </strong>

                      </div>
                    )
                  }
                )}

              </div>


              <div className="checkout-summary-divider" />


              {/* =================================
                  ITEMS COUNT
              ================================= */}

              <div className="checkout-summary-row">

                <span>
                  Items
                </span>

                <span>
                  {totalItems}
                </span>

              </div>


              {/* =================================
                  SUBTOTAL
              ================================= */}

              <div className="checkout-summary-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  KES{' '}
                  {totalPrice.toLocaleString()}
                </strong>

              </div>


              {/* =================================
                  DYNAMIC DELIVERY POLICY
              ================================= */}

              <div className="checkout-summary-row">

                <span>
                  Delivery
                </span>

                <span>
                  {safeDeliveryFeePolicy}
                </span>

              </div>


              {/* =================================
                  TOTAL
              ================================= */}

              <div className="checkout-summary-total">

                <span>
                  Total
                </span>

                <strong>
                  KES{' '}
                  {totalPrice.toLocaleString()}
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