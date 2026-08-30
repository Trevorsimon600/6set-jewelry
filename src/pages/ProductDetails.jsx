import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'

import { useCart } from '../context/CartContext'

import './ProductDetails.css'


function ProductDetails({
  products = [],
  loading = false,
  error = '',
}) {
  const { productId } = useParams()
  const { addToCart } = useCart()

  const product = products.find(
    (item) =>
      String(item.id) ===
      String(productId)
  )

  // =================================
  // QUANTITY
  // =================================

  const [quantity, setQuantity] =
    useState(1)


  // =================================
  // SEO
  // =================================

  useEffect(() => {
    const siteName = '6Set Jewelry'

    // ---------------------------------
    // PRODUCT NOT YET LOADED
    // ---------------------------------

    if (!product) {
      document.title = `${siteName} | Jewelry Store`

      return () => {
        document.title = siteName
      }
    }

    const productName =
      product.name ||
      'Jewelry Product'

    const categoryName =
      product.category ||
      'Jewelry'

    const productDescription =
      product.description ||
      `${productName} from ${siteName}. Shop ${categoryName.toLowerCase()} in Kenya.`

    const price =
      Number(product.price || 0)

    const canonicalUrl =
      `${window.location.origin}${window.location.pathname}`


    // ---------------------------------
    // PAGE TITLE
    // ---------------------------------

    document.title =
      `${productName} | ${siteName}`


    // ---------------------------------
    // HELPER: META TAG
    // ---------------------------------

    function setMeta(
      attribute,
      value,
      content
    ) {
      if (!content) {
        return
      }

      let element =
        document.head.querySelector(
          `meta[${attribute}="${value}"]`
        )

      if (!element) {
        element =
          document.createElement('meta')

        element.setAttribute(
          attribute,
          value
        )

        document.head.appendChild(
          element
        )
      }

      element.setAttribute(
        'content',
        content
      )

      return element
    }


    // ---------------------------------
    // META DESCRIPTION
    // ---------------------------------

    setMeta(
      'name',
      'description',
      productDescription
    )


    // ---------------------------------
    // OPEN GRAPH
    // ---------------------------------

    setMeta(
      'property',
      'og:title',
      `${productName} | ${siteName}`
    )

    setMeta(
      'property',
      'og:description',
      productDescription
    )

    setMeta(
      'property',
      'og:type',
      'product'
    )

    setMeta(
      'property',
      'og:url',
      canonicalUrl
    )

    if (product.image) {
      setMeta(
        'property',
        'og:image',
        product.image
      )
    }


    // ---------------------------------
    // TWITTER
    // ---------------------------------

    setMeta(
      'name',
      'twitter:card',
      'summary_large_image'
    )

    setMeta(
      'name',
      'twitter:title',
      `${productName} | ${siteName}`
    )

    setMeta(
      'name',
      'twitter:description',
      productDescription
    )

    if (product.image) {
      setMeta(
        'name',
        'twitter:image',
        product.image
      )
    }


    // ---------------------------------
    // CANONICAL URL
    // ---------------------------------

    let canonical =
      document.head.querySelector(
        'link[rel="canonical"]'
      )

    if (!canonical) {
      canonical =
        document.createElement('link')

      canonical.setAttribute(
        'rel',
        'canonical'
      )

      document.head.appendChild(
        canonical
      )
    }

    canonical.setAttribute(
      'href',
      canonicalUrl
    )


    // ---------------------------------
    // PRODUCT AVAILABILITY
    // ---------------------------------

    const availability =
      product.currentStock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'


    // ---------------------------------
    // PRODUCT STRUCTURED DATA
    // ---------------------------------

    const productSchema = {
      '@context':
        'https://schema.org',

      '@type':
        'Product',

      name:
        productName,

      description:
        productDescription,

      url:
        canonicalUrl,

      category:
        categoryName,

      brand: {
        '@type':
          'Brand',

        name:
          siteName,
      },

      offers: {
        '@type':
          'Offer',

        price:
          price,

        priceCurrency:
          'KES',

        availability:
          availability,

        url:
          canonicalUrl,

        itemCondition:
          'https://schema.org/NewCondition',
      },
    }


    // ---------------------------------
    // PRODUCT IMAGE
    // ---------------------------------

    if (product.image) {
      productSchema.image =
        [product.image]
    }


    // ---------------------------------
    // SKU
    // ---------------------------------

    const sku =
      product.product_code ||
      product.productCode ||
      product.code

    if (sku) {
      productSchema.sku =
        String(sku)
    }


    // ---------------------------------
    // INSERT JSON-LD
    // ---------------------------------

    let structuredData =
      document.head.querySelector(
        '#sixset-product-schema'
      )

    if (!structuredData) {
      structuredData =
        document.createElement('script')

      structuredData.setAttribute(
        'id',
        'sixset-product-schema'
      )

      structuredData.setAttribute(
        'type',
        'application/ld+json'
      )

      document.head.appendChild(
        structuredData
      )
    }

    structuredData.textContent =
      JSON.stringify(
        productSchema
      )


    // ---------------------------------
    // CLEANUP
    // ---------------------------------

    return () => {
      const schema =
        document.head.querySelector(
          '#sixset-product-schema'
        )

      if (schema) {
        schema.remove()
      }
    }
  }, [product])


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
  // QUANTITY LIMITS
  // =================================

  const minimumQuantity =
    product.effectiveMinQuantity ??
    product.minQuantity ??
    1

  const maximumQuantity =
    product.effectiveMaxQuantity ??
    product.maxQuantity ??
    1

  const effectiveQuantity =
    Math.min(
      Math.max(
        quantity,
        minimumQuantity
      ),
      maximumQuantity
    )


  function increaseQuantity() {
    setQuantity((current) =>
      Math.min(
        Math.max(
          current,
          minimumQuantity
        ) + 1,
        maximumQuantity
      )
    )
  }


  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(
        Math.max(
          current,
          minimumQuantity
        ) - 1,
        minimumQuantity
      )
    )
  }


  // =================================
  // ADD TO CART
  // =================================

  function handleAddToCart() {
    if (!product.isOrderable) {
      return
    }

    const added =
      addToCart(
        product,
        effectiveQuantity
      )

    if (added) {
      alert(
        `${product.name} added to your cart.`
      )
    }
  }


  // =================================
  // CATEGORY URL
  // =================================

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

      <main className="product-details-section">

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


            {/* QUANTITY */}

            {product.isOrderable && (
              <div className="product-details-quantity">

                <span className="quantity-label">
                  Quantity
                </span>

                <div className="quantity-selector">

                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      effectiveQuantity <=
                      minimumQuantity
                    }
                    aria-label={`Decrease ${product.name} quantity`}
                  >
                    −
                  </button>

                  <span>
                    {effectiveQuantity}
                  </span>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      effectiveQuantity >=
                      maximumQuantity
                    }
                    aria-label={`Increase ${product.name} quantity`}
                  >
                    +
                  </button>

                </div>

                <p className="quantity-limit">
                  Min {minimumQuantity}
                  {' • '}
                  Max {maximumQuantity}
                </p>

              </div>
            )}


            {/* ACTIONS */}

            <div className="product-details-actions">

              {product.isOrderable ? (
                <button
                  type="button"
                  className="product-details-cart-button"
                  onClick={
                    handleAddToCart
                  }
                >
                  Add to Cart
                </button>
              ) : (
                <p className="product-details-unavailable">
                  {product.currentStock > 0
                    ? `Only ${product.currentStock} available, which is below the minimum order quantity.`
                    : 'This product is currently unavailable.'}
                </p>
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