import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'

import {
  fetchStorefrontCategories,
  fetchStorefrontProducts,
} from '../lib/catalogService'

import { useCart } from '../context/CartContext'

import './CategoryPage.css'

function CategoryPage() {
  const { categorySlug } =
    useParams()

  const { addToCart } =
    useCart()

  const [category, setCategory] =
    useState(null)

  const [products, setProducts] =
    useState([])

  const [quantities, setQuantities] =
    useState({})

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // =================================
  // LOAD CATEGORY + PRODUCTS
  // =================================

  useEffect(() => {
    let isMounted = true

    async function loadCategory() {
      try {
        setLoading(true)
        setError('')

        const [
          categories,
          storefrontProducts,
        ] = await Promise.all([
          fetchStorefrontCategories(),
          fetchStorefrontProducts(),
        ])

        if (!isMounted) {
          return
        }

        const normalizedSlug =
          categorySlug
            ?.toLowerCase()
            .trim()

        const selectedCategory =
          categories.find(
            (item) =>
              item.slug
                ?.toLowerCase()
                .trim() ===
              normalizedSlug
          )

        if (!selectedCategory) {
          setCategory(null)
          setProducts([])
          setQuantities({})

          setError(
            'The category you are looking for does not exist or is no longer published.'
          )

          return
        }

        setCategory(
          selectedCategory
        )

        const categoryProducts =
          storefrontProducts.filter(
            (product) =>
              String(
                product.categoryId
              ) ===
              String(
                selectedCategory.id
              )
          )

        setProducts(
          categoryProducts
        )

        // Initialize only orderable products.
        const startingQuantities =
          {}

        categoryProducts.forEach(
          (product) => {
            if (
              product.isOrderable
            ) {
              startingQuantities[
                product.id
              ] =
                product.effectiveMinQuantity ??
                product.minQuantity
            }
          }
        )

        setQuantities(
          startingQuantities
        )
      } catch (err) {
        console.error(
          'Failed to load category:',
          err
        )

        if (!isMounted) {
          return
        }

        setError(
          err.message ||
            'Failed to load category.'
        )
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCategory()

    return () => {
      isMounted = false
    }
  }, [categorySlug])

  // =================================
  // INCREASE QUANTITY
  // =================================

  function increaseQuantity(
    product
  ) {
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

  // =================================
  // DECREASE QUANTITY
  // =================================

  function decreaseQuantity(
    product
  ) {
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

  // =================================
  // ADD TO CART
  // =================================

  function handleAddToCart(
    product
  ) {
    if (
      !product.isOrderable
    ) {
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

  // =================================
  // LOADING
  // =================================

  if (loading) {
    return (
      <div className="category-page">

        <Header />

        <main className="category-page-loading">

          <p className="small-heading">
            6SET JEWELRY
          </p>

          <h1>
            Loading Category...
          </h1>

          <p>
            Please wait while we load this
            collection.
          </p>

        </main>

        <Footer />

      </div>
    )
  }

  // =================================
  // CATEGORY NOT FOUND
  // =================================

  if (!category) {
    return (
      <div className="category-page">

        <Header />

        <main className="category-page-not-found">

          <p className="small-heading">
            6SET JEWELRY
          </p>

          <h1>
            Category Not Found
          </h1>

          <p>
            {error ||
              "Sorry, we couldn't find this category."}
          </p>

          <Link
            to="/categories"
            className="category-page-button"
          >
            Browse Categories
          </Link>

        </main>

        <Footer />

      </div>
    )
  }

  // =================================
  // CATEGORY PAGE
  // =================================

  return (
    <div className="category-page">

      <Header />

      <main>

        {/* =================================
            CATEGORY HERO
        ================================= */}

        <section className="category-hero category-hero-centered">

          <div className="category-hero-content category-hero-content-centered">

            <p className="small-heading">
              6SET JEWELRY
            </p>

            <h1>
              {category.name}
            </h1>

            {category.description && (
              <p>
                {category.description}
              </p>
            )}

          </div>

        </section>

        {/* =================================
            PRODUCTS SECTION
        ================================= */}

        <section className="category-products-section">

          <div className="category-products-heading">

            <div>

              <p className="small-heading">
                COLLECTION
              </p>

              <h2>
                {category.name}
              </h2>

            </div>

            <p>
              {products.length}{' '}
              {products.length === 1
                ? 'product'
                : 'products'}
            </p>

          </div>

          {/* =================================
              EMPTY CATEGORY
          ================================= */}

          {products.length === 0 && (
            <div className="category-empty">

              <h3>
                No products yet
              </h3>

              <p>
                Products will appear here
                once products are assigned
                to this category.
              </p>

              <Link
                to="/products"
                className="category-page-button"
              >
                Browse All Products
              </Link>

            </div>
          )}

          {/* =================================
              PRODUCT GRID
          ================================= */}

          {products.length > 0 && (
            <div className="products-grid">

              {products.map(
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

                      <div className="product-image">

                        {product.image ? (
                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            6SET JEWELRY
                          </div>
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

                        {/* =================================
                            ORDERABLE
                        ================================= */}

                        {orderable && (
                          <>
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

                        {/* =================================
                            NOT ORDERABLE
                        ================================= */}

                        {!orderable && (
                          <div className="product-unavailable">

                            <strong>
                              {
                                product.currentStock ===
                                0
                                  ? 'Out of Stock'
                                  : 'Currently Unavailable'
                              }
                            </strong>

                            <p>
                              {
                                product.currentStock >
                                0
                                  ? `Only ${product.currentStock} available, which is below the minimum order quantity.`
                                  : 'This product is currently unavailable.'
                              }
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

        {/* =================================
            NAVIGATION
        ================================= */}

        <section className="category-navigation">

          <Link
            to="/categories"
            className="category-page-button"
          >
            ← Back to Categories
          </Link>

          <Link
            to="/products"
            className="category-page-button"
          >
            View All Products
          </Link>

        </section>

      </main>

      <Footer />

    </div>
  )
}

export default CategoryPage