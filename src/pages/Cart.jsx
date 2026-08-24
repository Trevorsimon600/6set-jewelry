import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'
import './Cart.css'

function Cart() {

  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart()


  // ================================
  // EMPTY CART
  // ================================

  if (cartItems.length === 0) {

    return (

      <div className="cart-page">

        <Header />

        <main>

          <section className="empty-cart">

            <div className="empty-cart-icon">
              🛒
            </div>

            <p className="small-heading">
              YOUR SHOPPING CART
            </p>

            <h1>
              Your cart is empty.
            </h1>

            <p>
              Discover something beautiful
              from our jewelry collection.
            </p>

            <Link
              to="/products"
              className="continue-shopping-button"
            >
              Explore Jewelry
            </Link>

          </section>

        </main>

        <Footer />

      </div>

    )
  }


  // ================================
  // CART
  // ================================

  return (

    <div className="cart-page">

      <Header />

      <main>

        {/* ================================
            CART HERO
            ================================ */}

        <section className="cart-hero">

          <p className="small-heading">
            6SET JEWELRY
          </p>

          <h1>
            Your Cart
          </h1>

          <p>
            Review your selected jewelry before checkout.
          </p>

        </section>


        {/* ================================
            CART CONTENT
            ================================ */}

        <section className="cart-section">

          <div className="cart-layout">


            {/* ================================
                ITEMS
                ================================ */}

            <div className="cart-items">

              {cartItems.map((item) => {

                const itemTotal =
                  item.price * item.quantity

                return (

                  <div
                    className="cart-item"
                    key={item.id}
                  >

                    {/* IMAGE */}

                    <div className="cart-item-image">

                      <img
                        src={item.image}
                        alt={item.name}
                      />

                    </div>


                    {/* INFORMATION */}

                    <div className="cart-item-info">

                      <p className="cart-item-category">
                        {item.category}
                      </p>

                      <h2>
                        {item.name}
                      </h2>

                      <p className="cart-item-price">
                        KES {item.price.toLocaleString()}
                        {' '}per item
                      </p>


                      {/* QUANTITY */}

                      <div className="cart-quantity">

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                          disabled={
                            item.quantity <= item.minQuantity
                          }
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            item.quantity >= item.maxQuantity
                          }
                        >
                          +
                        </button>

                      </div>


                      {/* REMOVE */}

                      <button
                        type="button"
                        className="remove-item-button"
                        onClick={() =>
                          removeFromCart(item.id)
                        }
                      >
                        Remove
                      </button>

                    </div>


                    {/* ITEM TOTAL */}

                    <div className="cart-item-total">

                      <span>
                        Item total
                      </span>

                      <strong>
                        KES {itemTotal.toLocaleString()}
                      </strong>

                    </div>

                  </div>

                )

              })}

            </div>


            {/* ================================
                ORDER SUMMARY
                ================================ */}

            <aside className="cart-summary">

              <h2>
                Order Summary
              </h2>


              <div className="summary-row">

                <span>
                  Items
                </span>

                <span>
                  {totalItems}
                </span>

              </div>


              <div className="summary-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  KES {totalPrice.toLocaleString()}
                </strong>

              </div>


              <div className="summary-divider" />


              <div className="summary-total">

                <span>
                  Total
                </span>

                <strong>
                  KES {totalPrice.toLocaleString()}
                </strong>

              </div>


              {/* CHECKOUT */}

              <Link
                to="/checkout"
                className="checkout-button"
              >
                Continue to Checkout
              </Link>


              {/* CLEAR CART */}

              <button
                type="button"
                className="clear-cart-button"
                onClick={clearCart}
              >
                Clear Cart
              </button>


              {/* CONTINUE SHOPPING */}

              <Link
                to="/products"
                className="continue-shopping-link"
              >
                ← Continue Shopping
              </Link>

            </aside>

          </div>

        </section>

      </main>

      <Footer />

    </div>

  )
}

export default Cart