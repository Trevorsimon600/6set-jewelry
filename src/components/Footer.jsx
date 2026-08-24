import { Link } from 'react-router-dom'

import { useShopSettings } from '../context/ShopSettingsContext'

import './Footer.css'

function Footer() {

  // =================================
  // SHOP SETTINGS
  // =================================

  const {
    shopName,
    logoUrl,
    instagramUrl,
    facebookUrl,
    tiktokUrl,
  } = useShopSettings()


  // =================================
  // CURRENT YEAR
  // =================================

  const currentYear =
    new Date().getFullYear()


  // =================================
  // SOCIAL MEDIA
  // =================================

  const hasSocialMedia =
    instagramUrl ||
    facebookUrl ||
    tiktokUrl


  // =================================
  // FOOTER
  // =================================

  return (

    <footer className="site-footer">


      {/* =================================
          BRAND
      ================================= */}

      <Link
        to="/"
        className="footer-logo"
        aria-label={`${shopName} home`}
      >

        <img
          src={logoUrl}
          alt={shopName}
        />

      </Link>


      {/* =================================
          SHOP NAME
      ================================= */}

      <p className="footer-shop-name">
        {shopName}
      </p>


      {/* =================================
          SOCIAL MEDIA
      ================================= */}

      {hasSocialMedia && (

        <div className="footer-social">

          {/* INSTAGRAM */}

          {instagramUrl && (

            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="footer-social-icon"
              aria-label="Instagram"
              title="Instagram"
            >

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="5"
                  ry="5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                <circle
                  cx="12"
                  cy="12"
                  r="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                <circle
                  cx="17.5"
                  cy="6.5"
                  r="1"
                  fill="currentColor"
                />
              </svg>

            </a>

          )}


          {/* FACEBOOK */}

          {facebookUrl && (

            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="footer-social-icon"
              aria-label="Facebook"
              title="Facebook"
            >

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v4h4v-4h3.5l.5-4H13V9c0-.7.3-1 1-1Z"
                />
              </svg>

            </a>

          )}


          {/* TIKTOK */}

          {tiktokUrl && (

            <a
              href={tiktokUrl}
              target="_blank"
              rel="noreferrer"
              className="footer-social-icon"
              aria-label="TikTok"
              title="TikTok"
            >

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M15 3c.4 2.1 1.6 3.6 4 4v3.1c-1.5-.1-2.8-.6-4-1.4v6.8c0 3.5-2.4 5.5-5.5 5.5A5.5 5.5 0 1 1 15 15.5v3.2a2.5 2.5 0 1 0-2.5-2.4V3H15Z"
                />
              </svg>

            </a>

          )}

        </div>

      )}


      {/* =================================
          COPYRIGHT
      ================================= */}

      <p className="footer-copyright">

        © {currentYear} {shopName}.
        All rights reserved.

      </p>


      {/* =================================
          MADE WITH LOVE
      ================================= */}

      <p className="made-with-love">

        Made with Love ❤️

      </p>


    </footer>

  )
}

export default Footer