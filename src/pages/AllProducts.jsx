import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { fetchStorefrontProducts } from '../lib/catalogService'
import { useCart } from '../context/CartContext'
import './Products.css'

function AllProducts() {
  const { addToCart } = useCart()

  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ================================
  // SEARCH / FILTER / SORT STATE
  // ================================

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name-asc')

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
  // LOAD PRODUCTS FROM SUPABASE
  // ================================

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        const storefrontProducts =
          await fetchStorefrontProducts()

        setProducts(storefrontProducts)

        // Initialize each product at its
        // effective minimum quantity.
        const startingQuantities = {}

        storefrontProducts.forEach(
          (product) => {
            if (product.isOrderable) {
              startingQuantities[
                product.id
              ] =
                product.effectiveMinQuantity ??
                product.minQuantity
            }
          }
        )

        setQuantities(startingQuantities)
      } catch (error) {
        console.error(
          'Failed to load storefront products:',
          error
        )

        setError(
          error.message ||
            'Unable to load products right now.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // ================================
  // AVAILABLE CATEGORIES
  // ================================
  //
  // Derived from whatever products actually
  // loaded, so the filter never shows a
  // category with zero products in it.

  const availableCategories = Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))

  // ================================
  // VISIBLE PRODUCTS
  // ================================
  //
  // Search matches name and description.
  // Category filter and sort are applied
  // on top of the search results.

  const visibleProducts = products
    .filter((product) => {
      if (
        categoryFilter !== 'all' &&
        product.category !== categoryFilter
      ) {
        return false
      }

      const term = searchTerm.trim().toLowerCase()

      if (!term) {
        return true
      }

      const name =
        product.name?.toLowerCase() || ''

      const description =
        product.description?.toLowerCase() || ''

      return (
        name.includes(term) ||
        description.includes(term)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0)

        case 'price-desc':
          return (b.price || 0) - (a.price || 0)

        case 'name-desc':
          return (b.name || '').localeCompare(
            a.name || ''
          )

        default:
          return (a.name || '').localeCompare(
            b.name || ''
          )
      }
    })

  // ================================
  // INCREASE QUANTITY
  // ================================

  function increaseQuantity(product) {
    setQuantities(
      (currentQuantities) => {
        const currentQuantity =
          currentQuantities[
            product.id
          ] ??
          product.effectiveMinQuantity ??
          product.minQuantity

        const maximumQuantity =
          product.effectiveMaxQuantity ??
          product.maxQuantity

        if (
          currentQuantity >=
          maximumQuantity
        ) {
          return currentQuantities
        }

        return {
          ...currentQuantities,

          [product.id]:
            currentQuantity + 1,
        }
      }
    )
  }

  // ================================
  // DECREASE QUANTITY
  // ================================

  function decreaseQuantity(product) {
    setQuantities(
      (currentQuantities) => {
        const currentQuantity =
          currentQuantities[
            product.id
          ] ??
          product.effectiveMinQuantity ??
          product.minQuantity

        const minimumQuantity =
          product.effectiveMinQuantity ??
          product.minQuantity

        if (
          currentQuantity <=
          minimumQuantity
        ) {
          return currentQuantities
        }

        return {
          ...currentQuantities,

          [product.id]:
            currentQuantity - 1,
        }
      }
    )
  }

  // ================================
  // ADD TO CART
  // ================================

  function handleAddToCart(product) {
    if (!product.isOrderable) {
      return
    }

    const quantity =
      quantities[product.id] ??
      product.effectiveMinQuantity ??
      product.minQuantity

    const added =
      addToCart(
        product,
        quantity
      )

    if (added) {
      alert(
        `${product.name} added to your cart.`
      )
    }
  }

  return (
    <div className="products-page">
      <Header />

      <main>

        {/* ================================
            PAGE HERO
        ================================= */}

        <section className="products-hero">
          <p className="small-heading">
            6SET JEWELRY
          </p>

          <h1>
            All Products
          </h1>

          <p>
            Explore our complete jewelry collection.
          </p>
        </section>

        {/* ================================
            PRODUCTS
        ================================= */}

        <section className="products-section">

          {/* ================================
              SEARCH / FILTER / SORT
          ================================= */}

          {!loading &&
            !error &&
            products.length > 0 && (
              <div className="products-toolbar">

                <div className="products-search-box">
                  <span
                    className="products-search-icon"
                    aria-hidden="true"
                  >
                    🔍
                  </span>

                  <input
                    id="product-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search products..."
                    aria-label="Search products"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      className="products-search-clear"
                      onClick={() =>
                        setSearchTerm('')
                      }
                      aria-label="Clear product search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                  aria-label="Filter by category"
                >
                  <option value="all">
                    All Categories
                  </option>

                  {availableCategories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value
                    )
                  }
                  aria-label="Sort products"
                >
                  <option value="name-asc">
                    Name (A–Z)
                  </option>
                  <option value="name-desc">
                    Name (Z–A)
                  </option>
                  <option value="price-asc">
                    Price (Low to High)
                  </option>
                  <option value="price-desc">
                    Price (High to Low)
                  </option>
                </select>

              </div>
            )}

          {loading && (
            <p className="products-loading">
              Loading products...
            </p>
          )}

          {error && (
            <p className="products-error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            products.length === 0 && (
              <p className="products-empty">
                No products are currently available.
              </p>
            )}

          {!loading &&
            !error &&
            products.length > 0 &&
            visibleProducts.length === 0 && (
              <p className="products-empty">
                No products match your search.
              </p>
            )}

          {!loading &&
            !error &&
            visibleProducts.length > 0 && (
              <div className="products-grid">

                {visibleProducts.map(
                  (product) => {

                    const orderable =
                      product.isOrderable

                    const quantity =
                      quantities[
                        product.id
                      ] ??
                      product.effectiveMinQuantity ??
                      product.minQuantity

                    const totalPrice =
                      product.price *
                      quantity

                    const maximumQuantity =
                      product.effectiveMaxQuantity ??
                      product.maxQuantity

                    const minimumQuantity =
                      product.effectiveMinQuantity ??
                      product.minQuantity

                    return (
                      <div
                        className="product-card"
                        key={product.id}
                      >

                        {/* PRODUCT IMAGE */}

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
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
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
                                setViewingProduct(
                                  product
                                )
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

                        {/* PRODUCT INFORMATION */}

                        <div className="product-info">

                          <p className="product-category">
                            {
                              product.category
                            }
                          </p>

                          <h2>
                            {product.name}
                          </h2>

                          <p className="product-description">
                            {
                              product.description
                            }
                          </p>

                          {/* AVAILABILITY */}

                          <p
                            className={
                              product.availability ===
                              'Out of Stock'
                                ? 'product-stock-out'
                                : product.availability ===
                                  'Low Stock'
                                ? 'product-stock-low'
                                : 'product-stock-available'
                            }
                          >
                            {
                              product.availability
                            }
                          </p>

                          {/* PRICE */}

                          <p className="product-price">
                            KES{' '}
                            {totalPrice.toLocaleString()}
                          </p>

                          {/* UNIT PRICE */}

                          {orderable &&
                            quantity > 1 && (
                              <p className="unit-price">
                                KES{' '}
                                {product.price.toLocaleString()}
                                {' '}per item ×{' '}
                                {quantity}
                              </p>
                            )}

                          {/* ================================
                              ORDERABLE PRODUCT
                          ================================= */}

                          {orderable && (
                            <>
                              {/* QUANTITY */}

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
                                    minimumQuantity
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
                                    maximumQuantity
                                  }
                                  aria-label={`Increase ${product.name} quantity`}
                                >
                                  +
                                </button>

                              </div>

                              {/* QUANTITY LIMIT */}

                              <p className="quantity-limit">
                                Min{' '}
                                {
                                  minimumQuantity
                                }
                                {' • '}
                                Max{' '}
                                {
                                  maximumQuantity
                                }
                                {' • '}
                                Stock{' '}
                                {
                                  product.currentStock
                                }
                              </p>

                              {/* ADD TO CART */}

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
                            </>
                          )}

                          {/* ================================
                              NOT ORDERABLE
                          ================================= */}

                          {!orderable && (
                            <div className="product-unavailable">

                              <strong>
                                {product.currentStock ===
                                0
                                  ? 'Out of Stock'
                                  : 'Currently Unavailable'}
                              </strong>

                              <p>
                                {product.currentStock >
                                  0
                                  ? `Only ${product.currentStock} available, which is below the minimum order quantity.`
                                  : 'This product is currently unavailable.'}
                              </p>

                            </div>
                          )}

                        </div>
                      </div>
                    )
                  }
                )}

              </div>
            )}

        </section>
      </main>

      <Footer />

      {/* ================================
          IMAGE LIGHTBOX
      ================================= */}

      {viewingProduct && (
        <div
          className="product-lightbox-overlay"
          onClick={() =>
            setViewingProduct(null)
          }
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
            onClick={() =>
              setViewingProduct(null)
            }
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
            onClick={(event) =>
              event.stopPropagation()
            }
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

export default AllProducts