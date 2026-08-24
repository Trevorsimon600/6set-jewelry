import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { fetchStorefrontCategories } from '../lib/catalogService'
import './Categories.css'

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadCategories() {
      try {
        setLoading(true)
        setError('')

        const storefrontCategories =
          await fetchStorefrontCategories()

        if (!isMounted) return

        // Only show categories that are published
        setCategories(
          (storefrontCategories || []).filter(
            (category) => category.published !== false
          )
        )
      } catch (err) {
        if (!isMounted) return

        console.error(
          'Failed to load storefront categories:',
          err
        )

        setError(
          err.message ||
            'Failed to load categories.'
        )
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  // =================================
  // SEARCH CATEGORIES
  // =================================

  const filteredCategories = categories.filter(
    (category) => {
      const search =
        searchTerm.trim().toLowerCase()

      if (!search) {
        return true
      }

      const name =
        category.name
          ?.trim()
          .toLowerCase() || ''

      const slug =
        category.slug
          ?.trim()
          .toLowerCase() || ''

      // Match the actual category name or slug.
      // This prevents words inside descriptions
      // from causing unrelated categories to appear.
      if (
        name.includes(search) ||
        slug.includes(search)
      ) {
        return true
      }

      // Allow singular/plural searches.
      // Example:
      // "ring" -> "rings"
      // "rings" -> "ring"
      // "earring" -> "earrings"
      // "earrings" -> "earring"
      if (
        name === `${search}s` ||
        name === search.replace(/s$/, '')
      ) {
        return true
      }

      return false
    }
  )

  return (
    <div className="categories-page">
      <Header />

      <main>

        {/* ================================
            PAGE HERO
        ================================= */}

        <section className="categories-hero">

          <p className="small-heading">
            6SET JEWELRY
          </p>

          <h1>
            Shop by Category
          </h1>

          <p>
            Explore our jewelry collections
            and find something made for you.
          </p>

        </section>

        {/* ================================
            CATEGORY GRID
        ================================= */}

        <section className="categories-section">

          {/* ================================
              CATEGORY SEARCH
          ================================= */}

          {!loading &&
            !error &&
            categories.length > 0 && (
              <div className="categories-search">

                <label
                  htmlFor="category-search"
                  className="categories-search-label"
                >
                  Search Categories
                </label>

                <div className="categories-search-box">

                  <span
                    className="categories-search-icon"
                    aria-hidden="true"
                  >
                    🔍
                  </span>

                  <input
                    id="category-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search categories..."
                    aria-label="Search categories"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      className="categories-search-clear"
                      onClick={() =>
                        setSearchTerm('')
                      }
                      aria-label="Clear category search"
                    >
                      ×
                    </button>
                  )}

                </div>

              </div>
            )}

          {loading && (
            <div className="categories-loading">
              <p>
                Loading categories...
              </p>
            </div>
          )}

          {error && (
            <div
              className="categories-error"
              role="alert"
            >
              <p>
                {error}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            categories.length === 0 && (
              <div className="categories-empty">
                <p>
                  No categories are currently
                  available.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            categories.length > 0 &&
            filteredCategories.length === 0 && (
              <div className="categories-empty">
                <p>
                  No categories match your search.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filteredCategories.length > 0 && (
              <div className="categories-grid">

                {filteredCategories.map(
                  (category) => {

                    const categoryPath =
                      category.slug ||
                      category.name
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-')

                    return (
                      <Link
                        key={
                          category.id ||
                          category.slug
                        }
                        to={`/category/${categoryPath}`}
                        className="category-card"
                      >

                        <div className="category-image">

                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                            />
                          ) : (
                            <div className="category-image-placeholder">
                              6SET JEWELRY
                            </div>
                          )}

                        </div>

                        <div className="category-info">

                          <h2>
                            {category.name}
                          </h2>

                          {category.description && (
                            <p>
                              {category.description}
                            </p>
                          )}

                          <span>
                            Explore →
                          </span>

                        </div>

                      </Link>
                    )
                  }
                )}

              </div>
            )}

          {/* ================================
              ALL PRODUCTS
          ================================= */}

          <div className="all-products-section">

            <p>
              Looking for everything?
            </p>

            <Link
              to="/products"
              className="all-products-button"
            >
              View All Products
            </Link>

          </div>

        </section>

      </main>

      <Footer />
    </div>
  )
}

export default Categories