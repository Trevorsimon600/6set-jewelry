import { Link, useParams } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'

import './ProductDetails.css'


function ProductDetails({
  products = [],
  loading = false,
  error = '',
}) {
  const { productId } = useParams()

  const product = products.find(
    (item) =>
      String(item.id) ===
      String(productId)
  )


  // =================================
  // LOADING
  // =================================

  if (loading) {
    return (
      <div className="product-details-page">

        <Header />

        <main className="product-details-loading">

          <p className="small-heading">
            6SET JEWELRY
          </p>

          <h1>
            Loading Product...
          </h1>

          <p>
            Please wait while we load
            this product.
          </p>

        </main>

        <Footer />

      </div>
    )
  }


  // =================================
  // ERROR
  // =================================

  if (error && !product) {
    return (
      <div className="product-details-page">

        <Header />

        <main className="product-details-not-found">

          <p className="small-heading">
            6SET JEWELRY
          </p>

          <h1>
            Unable to Load Product
          </h1>

          <p>
            {error}
          </p>

          <Link
            to="/products"
            className="product-details-button"
          >
            Browse Products
          </Link>

        </main>

        <Footer />

      </div>
    )
  }


  // =================================
  // PRODUCT NOT FOUND
  // =================================

  if (!product) {
    return (
      <div className="product-details-page">

        <Header />

        <main className="product-details-not-found">

          <p className="small-heading">
            6SET JEWELRY
          </p>

          <h1>
            Product Not Found
          </h1>

          <p>
            Sorry, we couldn't find
            the product you're looking
            for.
          </p>

          <Link
            to="/products"
            className="product-details-button"
          >
            Browse Products
          </Link>

        </main>

        <Footer />

      </div>
    )
  }


  // =================================
  // CATEGORY URL
  // =================================

  /*
   * IMPORTANT:
   *
   * categorySlug comes directly from
   * the Supabase categories table.
   *
   * We do NOT generate the URL from
   * product.category.
   */

  const categorySlug =
    product.categorySlug
      ?.trim()
      .toLowerCase()


  // =================================
  // CATEGORY DISPLAY
  // =================================

  const categoryName =
    product.category ||
    'Jewelry'


  // =================================
  // RENDER
  // =================================

  return (
    <div className="product-details-page">

      <Header />

      <main>

        {/* =================================
            BREADCRUMB
        ================================= */}

        <section className="product-details-breadcrumb">

          <Link to="/">
            Home
          </Link>

          <span>
            /
          </span>

          <Link to="/products">
            Products
          </Link>

          {categorySlug && (
            <>
              <span>
                /
              </span>

              <Link
                to={`/category/${categorySlug}`}
              >
                {categoryName}
              </Link>
            </>
          )}

          <span>
            /
          </span>

          <span>
            {product.name}
          </span>

        </section>


        {/* =================================
            PRODUCT
        ================================= */}

        <section className="product-details-main">

          {/* IMAGE */}

          <div className="product-details-image-container">

            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="product-details-image"
              />
            ) : (
              <div className="product-details-image-placeholder">
                6SET JEWELRY
              </div>
            )}

          </div>


          {/* INFORMATION */}

          <div className="product-details-info">

            {/* CATEGORY */}

            {categorySlug ? (
              <Link
                to={`/category/${categorySlug}`}
                className="product-details-category"
              >
                {categoryName}
              </Link>
            ) : (
              <p className="product-details-category">
                {categoryName}
              </p>
            )}


            {/* NAME */}

            <h1>
              {product.name}
            </h1>


            {/* PRICE */}

            <div className="product-details-price">

              KES{' '}
              {Number(
                product.price || 0
              ).toLocaleString()}

            </div>


            {/* AVAILABILITY */}

            <div
              className={`product-details-availability ${
                product.availability
                  ?.toLowerCase()
                  .replace(
                    /\s+/g,
                    '-'
                  )
              }`}
            >
              {product.availability}
            </div>


            {/* DESCRIPTION */}

            {product.description && (
              <div className="product-details-description">

                <h2>
                  Description
                </h2>

                <p>
                  {product.description}
                </p>

              </div>
            )}


            {/* PRODUCT INFORMATION */}

            <div className="product-details-meta">

              <div>
                <span>
                  Category
                </span>

                <strong>
                  {categoryName}
                </strong>
              </div>


              <div>
                <span>
                  Available Stock
                </span>

                <strong>
                  {product.currentStock}
                </strong>
              </div>


              <div>
                <span>
                  Minimum Quantity
                </span>

                <strong>
                  {product.minQuantity}
                </strong>
              </div>


              <div>
                <span>
                  Maximum Quantity
                </span>

                <strong>
                  {product.maxQuantity}
                </strong>
              </div>

            </div>


            {/* ACTIONS */}

            <div className="product-details-actions">

              {product.availability !==
                'Out of Stock' && (
                <button
                  type="button"
                  className="product-details-button"
                >
                  Add to Cart
                </button>
              )}


              {categorySlug && (
                <Link
                  to={`/category/${categorySlug}`}
                  className="product-details-button secondary"
                >
                  View Category
                </Link>
              )}

            </div>

          </div>

        </section>


        {/* =================================
            NAVIGATION
        ================================= */}

        <section className="product-details-navigation">

          <Link
            to="/products"
            className="product-details-button secondary"
          >
            ← Back to Products
          </Link>

          {categorySlug && (
            <Link
              to={`/category/${categorySlug}`}
              className="product-details-button secondary"
            >
              More from {categoryName}
            </Link>
          )}

        </section>

      </main>

      <Footer />

    </div>
  )
}

export default ProductDetails