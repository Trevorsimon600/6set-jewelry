import { Link } from 'react-router-dom'

import {
  useShopSettings,
} from '../context/ShopSettingsContext'

import './StoreClosedScreen.css'

function StoreClosedScreen() {
  const {
    shopName,
    logoUrl,
    closedMessage,
    whatsappUrl,
    phoneUrl,
  } = useShopSettings()

  return (
    <div className="store-closed-page">

      {/* =================================
          BACKGROUND DECORATION
      ================================= */}

      <div className="store-closed-glow glow-one" />
      <div className="store-closed-glow glow-two" />


      {/* =================================
          MAIN CARD
      ================================= */}

      <main className="store-closed-card">

        {/* =================================
            LOGO
        ================================= */}

        <Link
          to="/"
          className="store-closed-logo"
          aria-label={`${shopName} home`}
        >

          <img
            src={logoUrl}
            alt={shopName}
          />

        </Link>


        {/* =================================
            STATUS
        ================================= */}

        <div className="store-closed-status">

          <span className="store-closed-status-dot" />

          <span>
            STORE CURRENTLY CLOSED
          </span>

        </div>


        {/* =================================
            SHOP NAME
        ================================= */}

        <p className="store-closed-shop-name">
          {shopName}
        </p>


        {/* =================================
            TITLE
        ================================= */}

        <h1>
          We'll be back soon.
        </h1>


        {/* =================================
            MESSAGE
        ================================= */}

        <p className="store-closed-message">
          {closedMessage ||
            "We're currently closed. Please check back soon."}
        </p>


        {/* =================================
            CONTACT
        ================================= */}

        <div className="store-closed-contact">

          <p>
            Need help with an order or have a
            question?
          </p>


          <div className="store-closed-buttons">

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="store-closed-whatsapp"
              >
                💬 Chat on WhatsApp
              </a>
            )}


            {phoneUrl && (
              <a
                href={phoneUrl}
                className="store-closed-call"
              >
                📞 Call Us
              </a>
            )}

          </div>

        </div>


        {/* =================================
            HOME
        ================================= */}

        <Link
          to="/"
          className="store-closed-home"
        >
          Return to Home
        </Link>


        {/* =================================
            FOOTER
        ================================= */}

        <p className="store-closed-footer">
          {shopName}
          <span> • </span>
          Made with Love ❤️
        </p>

      </main>

    </div>
  )
}

export default StoreClosedScreen