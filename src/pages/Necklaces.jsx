import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { fetchStorefrontProducts } from '../lib/catalogService'
import { useCart } from '../context/CartContext'
import './CategoryProducts.css'

function Necklaces() {
  const { addToCart } = useCart()

  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ================================
  // IMAGE LIGHTBOX
  // ================================

  const [viewingProduct, setViewingProduct] = useState(null)

  useEffect(() => {
    if (!viewingProduct) {
      return
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setViewingProduct(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewingProduct])

  // ================================
  // LOAD NECKLACES FROM SUPABASE
  // ================================

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        const storefrontProducts =
          await fetchStorefrontProducts()

        const necklaceProducts =
          storefrontProducts.filter(
            (product) =>
              product.category === 'Necklaces'
          )

        setProducts(necklaceProducts)

        const startingQuantities = {}

        necklaceProducts.forEach((product) => {
          startingQuantities[product.id] =
            product.minQuantity
        })

        setQuantities(startingQuantities)
      } catch (error) {
        console.error(
          'Failed to load necklaces:',
          error
        )

        setError(
          error.message ||
            'Unable to load necklaces right now.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // ================================
  // INCREASE QUANTITY
  // ================================

  function increaseQuantity(product) {
    setQuantities((currentQuantities) => {
      const currentQuantity =
        currentQuantities[product.id] ??
        product.minQuantity

      if (
        currentQuantity >=
        product.maxQuantity
      ) {
        return currentQuantities
      }

      return {
        ...currentQuantities,
        [product.id]:
          currentQuantity + 1,
      }
    })
  }

  // ================================
  // DECREASE QUANTITY
  // ================================

  function decreaseQuantity(product) {
    setQuantities((currentQuantities) => {
      const currentQuantity =
        currentQuantities[product.id] ??
        product.minQuantity

      if (
        currentQuantity <=
        product.minQuantity
      ) {
        return currentQuantities
      }

      return {
        ...currentQuantities,
        [product.id]:
          currentQuantity - 1,
      }
    })
  }

  // ================================
  // ADD TO CART
  // ================================

  function handleAddToCart(product) {
    const quantity =
      quantities[product.id] ??
      product.minQuantity

    addToCart(product, quantity)

    alert(
      `${product.name} added to your cart.`
    )
  }

  return (
    <div className="category-products-page">
      <Header />

      <main>

        {/* ================================
            CATEGORY HERO
        ================================= */}

        <section className="category-products-hero">

          <a
            href="/categories"
            className="back-link"
          >
            ← Back to Categories
          </a>

          <p className="small-heading">
            6SET JEWELRY • COLLECTION
          </p>

          <h1>
            Necklaces
          </h1>

          <p>
            Discover elegant necklaces designed
            to complement every style.
          </p>

        </section>

        {/* ================================
            PRODUCTS SECTION
        ================================= */}

        <section className="category-products-section">

          <div className="category-products-heading">

            <div>

              <p className="small-heading">
                NECKLACES
              </p>

              <h2>
                Our Necklaces Collection
              </h2>

            </div>

            <p className="product-count">
              {products.length}{' '}
              {products.length === 1
                ? 'product'
                : 'products'}
            </p>

          </div>

          {/* ================================
              LOADING
          ================================= */}

          {loading && (
            <p className="products-loading">
              Loading necklaces...
            </p>
          )}

          {/* ================================
              ERROR
          ================================= */}

          {error && (
            <p className="products-error">
              {error}
            </p>
          )}

          {/* ================================
              EMPTY
          ================================= */}

          {!loading &&
            !error &&
            products.length === 0 && (
              <p className="products-empty">
                No necklaces are currently
                available.
              </p>
            )}

          {/* ================================
              PRODUCTS
          ================================= */}

          {!loading &&
            !error &&
            products.length > 0 && (

              <div className="products-grid">

                {products.map((product) => {

                  const quantity =
                    quantities[product.id] ??
                    product.minQuantity

                  const totalPrice =
                    product.price * quantity

                  return (
                    <div
                      className="product-card"
                      key={product.id}
                    >

                      {/* ================================
                          PRODUCT IMAGE
                      ================================= */}

                      <div
                        className="product-image"
                        style={{
                          position: 'relative',
                          aspectRatio: '1 / 1',
                          overflow: 'hidden',
                        }}
                      >

                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            6SET JEWELRY
                          </div>
                        )}

                        {product.image && (
                          <button
                            type="button"
                            className="product-view-button"
                            onClick={() =>
                              setViewingProduct(product)
                            }
                            aria-label={`View full image of ${product.name}`}
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              background: 'rgba(0, 0, 0, 0.6)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            🔍 View
                          </button>
                        )}

                      </div>

                      {/* ================================
                          PRODUCT INFORMATION
                      ================================= */}

                      <div className="product-info">

                        <p className="product-category">
                          {product.category}
                        </p>

                        <h2>
                          {product.name}
                        </h2>

                        <p className="product-description">
                          {product.description}
                        </p>

                        {/* TOTAL PRICE */}

                        <p className="product-price">
                          KES{' '}
                          {totalPrice.toLocaleString()}
                        </p>

                        {/* UNIT PRICE */}

                        {quantity > 1 && (
                          <p className="unit-price">
                            KES{' '}
                            {product.price.toLocaleString()}
                            {' '}per item × {quantity}
                          </p>
                        )}

                        {/* ================================
                            QUANTITY
                        ================================= */}

                        <div className="quantity-selector">

                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                product
                              )
                            }
                            disabled={
                              quantity <=
                              product.minQuantity
                            }
                            aria-label={`Decrease ${product.name} quantity`}
                          >
                            −
                          </button>

                          <span>
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(
                                product
                              )
                            }
                            disabled={
                              quantity >=
                              product.maxQuantity
                            }
                            aria-label={`Increase ${product.name} quantity`}
                          >
                            +
                          </button>

                        </div>

                        {/* ================================
                            QUANTITY LIMIT
                        ================================= */}

                        <p className="quantity-limit">
                          Min {product.minQuantity}
                          {' • '}
                          Max {product.maxQuantity}
                        </p>

                        {/* ================================
                            ADD TO CART
                        ================================= */}

                        <button
                          type="button"
                          className="add-cart-button"
                          onClick={() =>
                            handleAddToCart(
                              product
                            )
                          }
                        >
                          🛒 Add to Cart
                        </button>

                      </div>

                    </div>
                  )
                })}

              </div>
            )}

          {/* ================================
              BOTTOM NAVIGATION
          ================================= */}

          <div className="category-bottom">

            <p>
              Want to explore more jewelry?
            </p>

            <a
              href="/products"
              className="view-all-button"
            >
              View All Products
            </a>

          </div>

        </section>

      </main>

      <Footer />

      {/* ================================
          IMAGE LIGHTBOX
      ================================= */}

      {viewingProduct && (
        <div
          className="product-lightbox-overlay"
          onClick={() => setViewingProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${viewingProduct.name} full image`}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
        >

          <button
            type="button"
            onClick={() => setViewingProduct(null)}
            aria-label="Close full image"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >

            <img
              src={viewingProduct.image}
              alt={viewingProduct.name}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />

            <p
              style={{
                color: '#fff',
                fontSize: '16px',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {viewingProduct.name}
            </p>

          </div>

        </div>
      )}

    </div>
  )
}

export default Necklaces