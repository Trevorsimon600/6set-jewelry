import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useCart } from '../context/CartContext'
import { useShopSettings } from '../context/ShopSettingsContext'


import './Header.css'

function Header() {
  const { totalItems } = useCart()

  const {
    shopName,
    logoUrl,
    whatsappUrl,
    phoneNumber,
  } = useShopSettings()

  const [contactOpen, setContactOpen] =
    useState(false)

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  const contactRef = useRef(null)

  // =================================
  // CONTACT MENU + MOBILE NAV
  //
  // Both menus live inside the same <nav>
  // element, so a single outside-click
  // handler closes whichever is open.
  // =================================

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        contactRef.current &&
        !contactRef.current.contains(
          event.target
        )
      ) {
        setContactOpen(false)
        setMobileMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setContactOpen(false)
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    document.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [])

  // =================================
  // RENDER
  // =================================

  return (
    <header className="site-header">

      {/* =================================
          LOGO
      ================================= */}

      <Link
        to="/"
        className="brand"
        aria-label={`Go to ${shopName} home`}
      >

        <img
          src={logoUrl}
          alt={shopName}
        />

      </Link>


      {/* =================================
          NAVIGATION
      ================================= */}

      <nav
        className="navigation"
        ref={contactRef}
      >

        {/* =================================
            MOBILE MENU TOGGLE

            Hidden on desktop via CSS.
            Reveals .mobile-nav-panel below,
            since the links to its right
            are display:none at this width.
        ================================= */}

        <button
          type="button"
          className={`mobile-menu-toggle${
            mobileMenuOpen ? ' open' : ''
          }`}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onMouseDown={(event) =>
            event.stopPropagation()
          }
          onClick={() => {
            setMobileMenuOpen(
              (open) => !open
            )
            setContactOpen(false)
          }}
        >
          <span />
          <span />
          <span />
        </button>

        <Link to="/">
          Home
        </Link>

        <Link to="/shop">
          Shop
        </Link>

        <Link to="/categories">
          Categories
        </Link>

        <Link to="/products">
          All Products
        </Link>


        <Link to="/trevor-cto">
          Developer
        </Link>


        {/* =================================
            MOBILE NAV PANEL

            Same links as above, shown only
            on mobile once the hamburger is
            tapped (the links above this are
            display:none at that width).
        ================================= */}

        {mobileMenuOpen && (
          <div
            className="mobile-nav-panel"
            role="menu"
          >

            <Link
              to="/"
              role="menuitem"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            >
              Home
            </Link>

            <Link
              to="/shop"
              role="menuitem"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            >
              Shop
            </Link>

            <Link
              to="/categories"
              role="menuitem"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            >
              Categories
            </Link>

            <Link
              to="/products"
              role="menuitem"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            >
              All Products
            </Link>

            <Link
              to="/trevor-cto"
              role="menuitem"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            >
              Developer
            </Link>

          </div>
        )}




        {/* =================================
            CONTACT
        ================================= */}

        <div className="header-contact-wrap">

          <button
            type="button"
            className="contact-trigger"
            aria-expanded={contactOpen}
            aria-haspopup="menu"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            onClick={() => {
              setContactOpen(
                (open) => !open
              )
              setMobileMenuOpen(false)
            }}
          >
            Contact
          </button>


          {contactOpen && (
            <div
              className="contact-menu"
              role="menu"
            >

              {/* =============================
                  WHATSAPP
              ============================== */}

              {whatsappUrl ? (

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-menu-item"
                  role="menuitem"
                  onClick={() =>
                    setContactOpen(false)
                  }
                >
                  WhatsApp
                </a>

              ) : (

                <span
                  className="contact-menu-item disabled"
                  role="menuitem"
                >
                  WhatsApp unavailable
                </span>

              )}


              {/* =============================
                  PHONE
              ============================== */}

              {phoneNumber ? (

                <a
                  href={`tel:${phoneNumber}`}
                  className="contact-menu-item"
                  role="menuitem"
                  onClick={() =>
                    setContactOpen(false)
                  }
                >
                  Call
                </a>

              ) : (

                <span
                  className="contact-menu-item disabled"
                  role="menuitem"
                >
                  Phone unavailable
                </span>

              )}

            </div>
          )}

        </div>

      </nav>


      {/* =================================
          CART
      ================================= */}

      <Link
        to="/cart"
        className="cart-button"
      >

        <span className="cart-icon-wrapper">

          <svg
            className="cart-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >

            <path
              fill="currentColor"
              d="M7 9V7a5 5 0 0 1 10 0v2h1.5A1.5 1.5 0 0 1 20 10.5v8A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-8A1.5 1.5 0 0 1 5.5 9H7Zm2 0h6V7a3 3 0 0 0-6 0v2Z"
            />

          </svg>


          {totalItems > 0 && (

            <span className="cart-count">
              {totalItems}
            </span>

          )}

        </span>


        <span className="cart-text">
          Cart
        </span>

      </Link>

    </header>
  )
}

export default Header