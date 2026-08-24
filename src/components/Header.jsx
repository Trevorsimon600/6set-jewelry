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

  const contactRef = useRef(null)

  // =================================
  // CONTACT MENU
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
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
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


        <Link to="/Trevor-cto">
          Developer
        </Link>




        {/* =================================
            CONTACT
        ================================= */}

        <div className="header-contact-wrap">

          <button
            type="button"
            className="contact-trigger"
            aria-expanded={contactOpen}
            aria-haspopup="menu"
            onClick={() =>
              setContactOpen(
                (open) => !open
              )
            }
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