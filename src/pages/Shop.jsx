import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'
import { fetchBestSellers } from '../lib/catalogService'
import './Shop.css'

function Shop({
  products = [],
  loading,
  error,
}) {
  // =================================
  // BEST SELLERS
  // =================================
  //
  // Featured section leads with whatever is actually
  // selling (Completed orders, most units sold first).
  // If there's no sales data yet, featuredProducts below
  // falls back to the original behavior untouched.
  //

  const [bestSellerIds, setBestSellerIds] =
    useState([])

  useEffect(() => {
    let cancelled = false

    async function loadBestSellers() {
      try {
        const data =
          await fetchBestSellers(8)

        if (!cancelled) {
          setBestSellerIds(
            (data || []).map(
              (item) => item.product_id
            )
          )
        }
      } catch (err) {
        console.error(
          'Failed to load best sellers:',
          err
        )
      }
    }

    loadBestSellers()

    return () => {
      cancelled = true
    }
  }, [])

  // =================================
  // FEATURED PRODUCTS
  // =================================
  //
  // Best sellers first, in ranked order, filled out
  // with other products up to 4. If none of the best
  // sellers match a currently live product, this falls
  // back to exactly what it did before.
  // =================================

  const bestSellingProducts = bestSellerIds
    .map((id) =>
      products.find(
        (product) =>
          String(product.id) === String(id)
      )
    )
    .filter(Boolean)

  const remainingProducts = products.filter(
    (product) =>
      !bestSellingProducts.some(
        (bestSeller) =>
          bestSeller.id === product.id
      )
  )

  const featuredProducts =
    bestSellingProducts.length > 0
      ? [
          ...bestSellingProducts,
          ...remainingProducts,
        ].slice(0, 4)
      : products.slice(0, 4)

  // =================================
  // SHOP CATEGORIES
  // =================================

  const categoryNames = [
    'Earrings',
    'Necklaces',
    'Bracelets',
    'Rings',
  ]

  const categoryProducts = categoryNames
    .map((category) =>
      products.find(
        (product) =>
          product.category === category
      )
    )
    .filter(Boolean)

  // =================================
  // CATEGORY LINK
  // =================================
  //
  // Prefer the real slug from Supabase; fall back to a
  // lowercased category name only if it's ever missing.
  //

  function categoryLink(product) {
    return `/category/${
      product.categorySlug ||
      product.category.toLowerCase()
    }`
  }

  return (
    <div className="shop-page">
      <Header />

      <main>

        {/* =================================
            SHOP HERO
        ================================= */}

        <section className="shop-hero">

          <div className="shop-hero-content">

            <p className="small-heading">
              6SET JEWELRY • SHOP
            </p>

            <h1>
              Find something
              <br />
              <span>beautiful.</span>
            </h1>

            <p>
              Explore our jewelry collection and
              discover pieces designed to add
              elegance to every look.
            </p>

            <Link
              to="/products"
              className="shop-hero-button"
            >
              View All Products
            </Link>

          </div>

        </section>

        {/* =================================
            FEATURED PRODUCTS
        ================================= */}

        <section className="shop-featured">

          <div className="shop-section-heading">

            <p className="small-heading">
              FEATURED
            </p>

            <h2>
              Featured Jewelry
            </h2>

            <p>
              A selection of pieces from our
              current collection.
            </p>

          </div>

          {loading && (
            <p className="shop-state-message">
              Loading products...
            </p>
          )}

          {!loading && error && (
            <p className="shop-state-message">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            featuredProducts.length === 0 && (
              <p className="shop-state-message">
                No products are currently available.
              </p>
            )}

          {!loading &&
            !error &&
            featuredProducts.length > 0 && (

              <div className="shop-product-grid">

                {featuredProducts.map((product) => (
                  <article
                    className="shop-product-card"
                    key={product.id}
                  >

                    <div className="shop-product-image">

                      <img
                        src={product.image}
                        alt={product.name}
                      />

                    </div>

                    <div className="shop-product-info">

                      <p className="product-category">
                        {product.category}
                      </p>

                      <h3>
                        {product.name}
                      </h3>

                      <strong>
                        KES{' '}
                        {product.price.toLocaleString()}
                      </strong>

                      <Link
                        to={categoryLink(product)}
                        className="shop-product-link"
                      >
                        Explore Collection →
                      </Link>

                    </div>

                  </article>
                ))}

              </div>
            )}

        </section>

        {/* =================================
            SHOP BY CATEGORY
        ================================= */}

        <section className="shop-categories">

          <div className="shop-section-heading">

            <p className="small-heading">
              EXPLORE
            </p>

            <h2>
              Shop by Category
            </h2>

            <p>
              Find the perfect piece for your style.
            </p>

          </div>

          {!loading &&
            !error &&
            categoryProducts.length > 0 && (

              <div className="shop-category-grid">

                {categoryProducts.map((product) => (
                  <Link
                    to={categoryLink(product)}
                    className="shop-category-card"
                    key={product.category}
                  >

                    <img
                      src={product.image}
                      alt={product.category}
                    />

                    <div className="shop-category-overlay">

                      <span>
                        {product.category}
                      </span>

                      <small>
                        Explore →
                      </small>

                    </div>

                  </Link>
                ))}

              </div>
            )}

        </section>

        {/* =================================
            COMPLETE COLLECTION
        ================================= */}

        <section className="shop-all-products">

          <p className="small-heading">
            COMPLETE COLLECTION
          </p>

          <h2>
            See Everything We Have
          </h2>

          <p>
            Browse our complete collection of
            earrings, necklaces, bracelets and rings.
          </p>

          <Link
            to="/products"
            className="shop-all-button"
          >
            Browse All Products
          </Link>

        </section>

      </main>

      <Footer />
    </div>
  )
}

export default Shop