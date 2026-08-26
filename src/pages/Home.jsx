import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'

import {
  useShopSettings,
} from '../context/ShopSettingsContext'

import {
  fetchBestSellingCategories,
  fetchStorefrontCategories,
} from '../lib/catalogService'

import './Home.css'

const MAX_HOME_CATEGORIES = 4

function Home() {
  const [showSplash, setShowSplash] =
    useState(true)

  const {
    shopName,
    logoUrl,
    whatsappUrl,
    announcement,
    settings,
  } = useShopSettings()

  // =================================
  // SHOP DESCRIPTION
  // =================================

  const shopDescription =
    settings?.shop_description?.trim() ||
    'Discover beautiful jewelry designed to add elegance and personality to every look.'

  // =================================
  // SPLASH SCREEN TIMER
  // =================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // =================================
  // TOP CATEGORIES
  //
  // Best-selling categories first (real
  // sales data), topped up with regular
  // published categories if there aren't
  // 4 with sales yet — so this section
  // never shows empty on a new store or
  // a slow month.
  // =================================

  const [topCategories, setTopCategories] =
    useState([])

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadTopCategories() {
      try {
        setCategoriesLoading(true)

        const bestSelling =
          await fetchBestSellingCategories(
            MAX_HOME_CATEGORIES
          )

        if (!isMounted) return

        const normalizedBestSelling =
          (bestSelling || []).map(
            (category) => ({
              id: category.category_id,
              name: category.name,
              slug: category.slug,
              image: category.image,
            })
          )

        const remainingSlots =
          MAX_HOME_CATEGORIES -
          normalizedBestSelling.length

        let finalCategories =
          normalizedBestSelling

        if (remainingSlots > 0) {
          const allCategories =
            await fetchStorefrontCategories()

          if (!isMounted) return

          const usedIds = new Set(
            normalizedBestSelling.map(
              (category) => category.id
            )
          )

          const fillerCategories =
            (allCategories || [])
              .filter(
                (category) =>
                  category.published !== false &&
                  !usedIds.has(category.id)
              )
              .slice(0, remainingSlots)
              .map((category) => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                image: category.image,
              }))

          finalCategories = [
            ...normalizedBestSelling,
            ...fillerCategories,
          ]
        }

        if (isMounted) {
          setTopCategories(finalCategories)
        }
      } catch (err) {
        console.error(
          'Failed to load top categories:',
          err
        )

        if (isMounted) {
          setTopCategories([])
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false)
        }
      }
    }

    loadTopCategories()

    return () => {
      isMounted = false
    }
  }, [])

  // =================================
  // SPLASH SCREEN
  // =================================

  if (showSplash) {
    return (
      <div className="splash-screen">

        <img
          src={logoUrl}
          alt={shopName}
          className="splash-logo"
        />

      </div>
    )
  }

  // =================================
  // HOME
  // =================================

  return (
    <div className="home-page">

      <Header />

      {announcement && (
        <div className="shop-announcement">
          <p>{announcement}</p>
        </div>
      )}  

      <main>

        {/* =================================
            HERO
        ================================= */}

        <section className="hero-section">

          <div className="hero-text">

            <p className="small-heading">
              {shopName} • HANDCRAFTED
            </p>

            <h1>
              Elegance
              <br />
              <span>made for you.</span>
            </h1>

            <p>
              {shopDescription}
            </p>

            <div className="hero-buttons">

              <Link
                to="/shop"
                className="shop-button"
              >
                Shop Jewelry
              </Link>

              <Link
                to="/categories"
                className="secondary-button"
              >
                Explore Categories
              </Link>

            </div>

          </div>


          <div className="hero-image">

            <img
              src={logoUrl}
              alt={shopName}
            />

          </div>

        </section>


        {/* =================================
            SHOP BY CATEGORY

            Shows up to 4 best-selling
            categories, topped up with
            regular categories if fewer
            than 4 have sales yet.
        ================================= */}

        <section className="home-categories">

          <div className="section-heading">

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

          {categoriesLoading && (
            <p className="home-categories-loading">
              Loading collections...
            </p>
          )}

          {!categoriesLoading &&
            topCategories.length > 0 && (

              <div className="home-category-grid">

                {topCategories.map(
                  (category) => (

                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      className="home-category-card"
                    >

                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                        />
                      ) : (
                        <div className="home-category-placeholder">
                          {shopName}
                        </div>
                      )}

                      <div className="category-overlay">

                        <h3>
                          {category.name}
                        </h3>

                        <span>
                          Explore Collection →
                        </span>

                      </div>

                    </Link>

                  )
                )}

              </div>
            )}


          {/* =================================
              VIEW ALL CATEGORIES
          ================================= */}

          <div className="category-view-all">

            <Link
              to="/categories"
              className="view-categories-button"
            >
              View All Categories
            </Link>

          </div>

        </section>


        {/* =================================
            SHOPPING CTA
        ================================= */}

        <section className="shop-cta">

          <div>

            <p className="small-heading">
              THE COMPLETE COLLECTION
            </p>

            <h2>
              Find something beautiful.
            </h2>

            <p>
              Browse our complete collection of
              earrings, necklaces, bracelets and rings.
            </p>

            <Link
              to="/products"
              className="shop-button"
            >
              View All Products
            </Link>

          </div>

        </section>


        {/* =================================
            ABOUT
        ================================= */}

        <section className="about">

          <p className="small-heading">
            ABOUT {shopName}
          </p>

          <h2>
            Handcrafted with elegance.
          </h2>

          <p>
            {shopDescription}
          </p>

        </section>


        {/* =================================
            CONTACT
        ================================= */}

        <section className="contact">

          <p className="small-heading">
            NEED HELP?
          </p>

          <h2>
            Talk to Tabitha.
          </h2>

          <p>
            Have a question about a product,
            your order or delivery?
          </p>

          {whatsappUrl ? (

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="whatsapp-button"
            >
              💬 Chat on WhatsApp
            </a>

          ) : (

            <span className="whatsapp-button">
              💬 WhatsApp unavailable
            </span>

          )}

        </section>

      </main>

      <Footer />

    </div>
  )
}

export default Home