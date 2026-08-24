import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'

import {
  useShopSettings,
} from '../context/ShopSettingsContext'

import './Home.css'

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


          <div className="home-category-grid">

            {/* =================================
                EARRINGS
            ================================= */}

            <Link
              to="/category/earrings"
              className="home-category-card"
            >

              <img
                src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85"
                alt="Earrings"
              />

              <div className="category-overlay">

                <h3>
                  Earrings
                </h3>

                <span>
                  Explore Collection →
                </span>

              </div>

            </Link>


            {/* =================================
                NECKLACES
            ================================= */}

            <Link
              to="/category/necklaces"
              className="home-category-card"
            >

              <img
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85"
                alt="Necklaces"
              />

              <div className="category-overlay">

                <h3>
                  Necklaces
                </h3>

                <span>
                  Explore Collection →
                </span>

              </div>

            </Link>


            {/* =================================
                BRACELETS
            ================================= */}

            <Link
              to="/category/bracelets"
              className="home-category-card"
            >

              <img
                src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85"
                alt="Bracelets"
              />

              <div className="category-overlay">

                <h3>
                  Bracelets
                </h3>

                <span>
                  Explore Collection →
                </span>

              </div>

            </Link>


            {/* =================================
                RINGS
            ================================= */}

            <Link
              to="/category/rings"
              className="home-category-card"
            >

              <img
                src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85"
                alt="Rings"
              />

              <div className="category-overlay">

                <h3>
                  Rings
                </h3>

                <span>
                  Explore Collection →
                </span>

              </div>

            </Link>

          </div>


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