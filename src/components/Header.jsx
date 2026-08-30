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

  // =================================
  // DESKTOP CONTACT DROPDOWN
  //
  // Unchanged interaction model — still
  // used on desktop only (hidden on
  // mobile via CSS, see below).
  // =================================

  const [contactOpen, setContactOpen] =
    useState(false)

  const contactRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        contactRef.current &&
        !contactRef.current.contains(
          event.target
        )
      ) {
        setContactOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setContactOpen(false)
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
  // MOBILE NAV PANEL
  //
  // Deliberately NOT using a document-
  // level "click outside" listener —
  // that's what caused the flicker.
  // Closes only via: the backdrop tap,
  // the X button, a nav link tap, or
  // Escape. Each of those is a distinct,
  // unambiguous action, so there's no
  // event-ordering race to misfire on.
  // =================================

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  const [mobileContactOpen, setMobileContactOpen] =
    useState(false)

  function closeMobileMenu() {
    setMobileMenuOpen(false)
    setMobileContactOpen(false)
  }

  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeMobileMenu()
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [mobileMenuOpen])


  // =================================
  // HIDE ON SCROLL DOWN, SHOW ON
  // SCROLL UP
  //
  // Paused while the mobile menu is
  // open — the header (and its
  // hamburger toggle) should never
  // disappear while that panel is on
  // screen, or there'd be no way to
  // close it.
  //
  // Always visible near the very top
  // of the page, regardless of
  // direction, so it doesn't flicker
  // on tiny scroll jitters right at
  // scrollY 0.
  // =================================

  const [headerHidden, setHeaderHidden] =
    useState(false)

  const lastScrollY = useRef(0)

  useEffect(() => {
    if (mobileMenuOpen) {
      setHeaderHidden(false)
      return
    }

    function handleScroll() {
      const currentScrollY =
        window.scrollY

      const scrolledDown =
        currentScrollY >
        lastScrollY.current

      const pastTopBuffer =
        currentScrollY > 80

      setHeaderHidden(
        scrolledDown && pastTopBuffer
      )

      lastScrollY.current =
        currentScrollY
    }

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [mobileMenuOpen])


  // =================================
  // RENDER
  // =================================

  return (
    <header
      className={`site-header${
        headerHidden ? ' site-header-hidden' : ''
      }`}
    >

      {/* =================================
          LOGO + WORDMARK

          Keeps the existing circular
          photo logo, paired with a
          visible text wordmark next to
          it (previously text-only via
          aria-label, not actually shown
          on screen).
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

        <span className="brand-name">
          {shopName}
        </span>

      </Link>


      {/* =================================
          DESKTOP NAVIGATION
      ================================= */}

      <nav
        className="navigation"
        ref={contactRef}
      >

        <button
          type="button"
          className={`mobile-menu-toggle${
            mobileMenuOpen ? ' open' : ''
          }`}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen((open) => {
              if (open) {
                setMobileContactOpen(false)
              }
              return !open
            })
          }
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
            CONTACT (DESKTOP ONLY)
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
            onClick={() =>
              setContactOpen((open) => !open)
            }
          >
            Contact
          </button>


          {contactOpen && (
            <div
              className="contact-menu"
              role="menu"
            >

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


      {/* =================================
          MOBILE NAV BACKDROP + PANEL

          Rendered as siblings, in this
          order, so the panel (later in
          the DOM / higher z-index) sits
          on top of the backdrop where
          they overlap. Tapping the
          exposed backdrop area closes
          the menu; tapping inside the
          panel does not.
      ================================= */}

      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={closeMobileMenu}
        />
      )}

      {mobileMenuOpen && (
        <div
          className="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >

          <div className="mobile-nav-panel-header">

            <button
              type="button"
              className="mobile-nav-close"
              aria-label="Close menu"
              onClick={closeMobileMenu}
            >
              ×
            </button>

            <Link
              to="/"
              className="mobile-nav-brand"
              onClick={closeMobileMenu}
            >
              <img
                src={logoUrl}
                alt={shopName}
              />

              <span>
                {shopName}
              </span>
            </Link>

          </div>


          {/* =================================
              CONTACT (inside the panel)
          ================================= */}

          <div className="mobile-nav-section">

            <button
              type="button"
              className="mobile-nav-expand-row"
              aria-expanded={mobileContactOpen}
              onClick={() =>
                setMobileContactOpen(
                  (open) => !open
                )
              }
            >
              <span>
                Contact Us
              </span>

              <span
                className={`mobile-nav-chevron${
                  mobileContactOpen ? ' open' : ''
                }`}
                aria-hidden="true"
              >
                ›
              </span>
            </button>

            {mobileContactOpen && (
              <div className="mobile-nav-subrows">

                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={closeMobileMenu}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.6 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.5.5-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.9.3.1.5.2.5.3.1.2.1.6-.1 1.2Z"
                      />
                    </svg>
                    WhatsApp
                  </a>
                ) : (
                  <span className="disabled">
                    WhatsApp unavailable
                  </span>
                )}

                {phoneNumber ? (
                  <a
                    href={`tel:${phoneNumber}`}
                    onClick={closeMobileMenu}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M6.6 10.8c1.4 2.8 3.7 5.1 6.5 6.5l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1.1.5 1.1 1.1V20c0 .6-.5 1.1-1.1 1.1C10.5 21.1 2.9 13.5 2.9 4.1 2.9 3.5 3.4 3 4 3h3.4c.6 0 1.1.5 1.1 1.1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z"
                      />
                    </svg>
                    Call
                  </a>
                ) : (
                  <span className="disabled">
                    Phone unavailable
                  </span>
                )}

              </div>
            )}

          </div>


          {/* =================================
              PAGES (only what the site has)
          ================================= */}

          <div className="mobile-nav-section">

            <p className="mobile-nav-section-label">
              EXPLORE
            </p>

            <Link to="/" onClick={closeMobileMenu}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 3 3 10.5V21h6v-6h6v6h6V10.5L12 3Z"
                />
              </svg>
              Home
            </Link>

            <Link to="/shop" onClick={closeMobileMenu}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M7 8V7a5 5 0 0 1 10 0v1h1.5A1.5 1.5 0 0 1 20 9.5v9A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-9A1.5 1.5 0 0 1 5.5 8H7Zm2 0h6V7a3 3 0 0 0-6 0v1Z"
                />
              </svg>
              Shop
            </Link>

            <Link to="/categories" onClick={closeMobileMenu}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
                <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" />
                <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" />
                <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
              </svg>
              Categories
            </Link>

            <Link to="/products" onClick={closeMobileMenu}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2 3 9l9 13 9-13-9-7Zm0 2.5L18.2 9H5.8L12 4.5ZM6.3 11h11.4l-5.7 8.2L6.3 11Z"
                />
              </svg>
              All Products
            </Link>

            <Link to="/trevor-cto" onClick={closeMobileMenu}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4Zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4Z"
                />
              </svg>
              Developer
            </Link>

          </div>

        </div>
      )}

    </header>
  )
}

export default Header