import './TrevorCTO.css'
import { Link } from 'react-router-dom'

// =================================
// TREVOR — CONTACT / SOCIAL
// =================================

const TREVOR_WHATSAPP_NUMBER = '254115507150'

const TREVOR_WHATSAPP_MESSAGE =
  "Hi Trevor, I have a project I'd like to discuss."

const TREVOR_WHATSAPP_URL =
  `https://wa.me/${TREVOR_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    TREVOR_WHATSAPP_MESSAGE
  )}`

const TREVOR_EMAIL = 'trevorsimon600@gmail.com'

const TREVOR_INSTAGRAM_URL =
  'https://www.instagram.com/tr3v0r_n.c.t'

const TREVOR_X_URL =
  'https://x.com/Simo63903Trevor'

const TREVOR_TIKTOK_URL =
  'https://www.tiktok.com/@trevorsimon001'

function TrevorCTO() {
  const systems = [
    {
      number: '01',
      title: 'Customer Storefront',
      description:
        'A responsive shopping experience where customers can browse products, search, filter, manage their cart, and place orders.',
      status: 'ACTIVE',
      statusType: 'active',
    },
    {
      number: '02',
      title: 'Admin Dashboard',
      description:
        'A private business control center for managing products, categories, prices, inventory, orders, customers, and shop settings.',
      status: 'ACTIVE',
      statusType: 'active',
    },
    {
      number: '03',
      title: 'Order Engine',
      description:
        'The business logic responsible for creating orders, tracking payments, managing order statuses, and preserving purchase records.',
      status: 'IN DEVELOPMENT',
      statusType: 'development',
    },
    {
      number: '04',
      title: 'Future Intelligence',
      description:
        'A foundation for future AI assistants, smart recommendations, analytics, automation, and intelligent business tools.',
      status: 'PLANNED',
      statusType: 'planned',
    },
  ]

  const technologies = [
    {
      name: 'React',
      role: 'Interface & User Experience',
      symbol: '⚛',
    },
    {
      name: 'Vite',
      role: 'Development & Production Builds',
      symbol: '⚡',
    },
    {
      name: 'Supabase',
      role: 'Database & Backend Infrastructure',
      symbol: '◈',
    },
    {
      name: 'Cloudflare',
      role: 'Deployment & Global Delivery',
      symbol: '☁',
    },
    {
      name: 'GitHub',
      role: 'Version Control & Collaboration',
      symbol: '⌘',
    },
  ]

  const roadmap = [
    {
      phase: '01',
      title: 'Foundation',
      description:
        'Project setup, architecture, routing, and the core application structure.',
      status: 'COMPLETED',
      statusType: 'active',
    },
    {
      phase: '02',
      title: 'Storefront',
      description:
        'Customer-facing pages, product discovery, categories, and responsive shopping experiences.',
      status: 'COMPLETED',
      statusType: 'active',
    },
    {
      phase: '03',
      title: 'Shopping Experience',
      description:
        'Cart functionality, quantities, totals, checkout flow, and customer order creation.',
      status: 'COMPLETED',
      statusType: 'active',
    },
    {
      phase: '04',
      title: 'Business Systems',
      description:
        'Admin dashboard, product management, categories, settings, and business controls.',
      status: 'ACTIVE',
      statusType: 'development',
    },
    {
      phase: '05',
      title: 'Order Management',
      description:
        'Payment verification, order processing, customer management, and communication tools.',
      status: 'IN PROGRESS',
      statusType: 'development',
    },
    {
      phase: '06',
      title: 'Future Intelligence',
      description:
        'AI assistance, automation, analytics, smart recommendations, and advanced business tools.',
      status: 'PLANNED',
      statusType: 'planned',
    },
  ]

  return (
    <main className="trevor-cto-page">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="cto-hero">

        <div className="cto-grid-background" />

        <div className="cto-container cto-hero-content">

          <p className="cto-system-label">
            <span className="cto-status-dot" />
            SYSTEM / DEVELOPER PROFILE
          </p>

          <div className="cto-hero-main">

            <div className="cto-hero-text">

              <p className="cto-eyebrow">
                THE TECHNOLOGY BEHIND 6SET JEWELRY
              </p>

              <h1>
                Trevor
                <span> Simon.</span>
              </h1>

              <h2>
                Developer & CTO of 6Set Jewelry.
              </h2>

              <p className="cto-hero-description">
                Building the systems, infrastructure, and technology
                behind a modern digital business.
              </p>

              <div className="cto-hero-actions">

                <Link
                  to="/"
                  className="cto-primary-button"
                >
                  Explore the Store
                  <span>→</span>
                </Link>

                <a
                  href="#systems"
                  className="cto-secondary-button"
                >
                  Explore the System
                  <span>↓</span>
                </a>

              </div>

            </div>


            <div className="cto-hero-panel">

              <div className="cto-panel-header">

                <span>
                  SYSTEM STATUS
                </span>

                <span className="cto-panel-live">
                  ● ONLINE
                </span>

              </div>

              <div className="cto-panel-content">

                <div className="cto-panel-row">

                  <span>
                    PLATFORM
                  </span>

                  <strong>
                    6SET JEWELRY
                  </strong>

                </div>

                <div className="cto-panel-row">

                  <span>
                    ROLE
                  </span>

                  <strong>
                    DEVELOPER / CTO of 6SET JEWELRY
                  </strong>

                </div>

                <div className="cto-panel-row">

                  <span>
                    ARCHITECTURE
                  </span>

                  <strong>
                    REACT + SUPABASE
                  </strong>

                </div>

                <div className="cto-panel-row">

                  <span>
                    DEPLOYMENT
                  </span>

                  <strong>
                    CLOUDFLARE
                  </strong>

                </div>

              </div>

              <div className="cto-panel-footer">

                <span>
                  VERSION
                </span>

                <strong>
                  1.0.0
                </strong>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          INTRODUCTION
      ========================================= */}

      <section className="cto-section">

        <div className="cto-container">

          <div className="cto-section-heading">

            <p className="cto-section-number">
              01 / THE DEVELOPER
            </p>

            <h2>
              More Than Just
              <span> A Website.</span>
            </h2>

          </div>

          <div className="cto-introduction-grid">

            <div className="cto-introduction-main">

              <p>
                6Set Jewelry is being built as more than a simple
                online store. It is a growing digital business platform
                designed to give the business the tools it needs to sell,
                manage operations, and grow.
              </p>

              <p>
                My role is to design and build the technology that
                connects the customer experience, business management
                tools, database infrastructure, and future intelligent
                systems.
              </p>

            </div>

            <div className="cto-principles">

              <div className="cto-principle">

                <span>
                  01
                </span>

                <div>

                  <h3>
                    Mobile First
                  </h3>

                  <p>
                    Designed to work across phones, tablets,
                    laptops, and desktops.
                  </p>

                </div>

              </div>

              <div className="cto-principle">

                <span>
                  02
                </span>

                <div>

                  <h3>
                    Scalable
                  </h3>

                  <p>
                    Built with a foundation that can grow with
                    the business.
                  </p>

                </div>

              </div>

              <div className="cto-principle">

                <span>
                  03
                </span>

                <div>

                  <h3>
                    Future Ready
                  </h3>

                  <p>
                    Prepared for automation, analytics, AI,
                    and advanced business tools.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          SYSTEMS
      ========================================= */}

      <section
        id="systems"
        className="cto-section cto-systems-section"
      >

        <div className="cto-container">

          <div className="cto-section-heading">

            <p className="cto-section-number">
              02 / WHAT I BUILD
            </p>

            <h2>
              The Systems
              <span> Behind The Store.</span>
            </h2>

            <p>
              Every part of the platform is designed to work
              together as one connected business system.
            </p>

          </div>


          <div className="cto-systems-grid">

            {systems.map((system) => (

              <article
                className="cto-system-card"
                key={system.number}
              >

                <div className="cto-system-card-top">

                  <span className="cto-card-number">
                    {system.number}
                  </span>

                  <span
                    className={`cto-card-status ${system.statusType}`}
                  >
                    <span className="cto-card-status-dot" />

                    {system.status}

                  </span>

                </div>

                <div className="cto-system-card-content">

                  <h3>
                    {system.title}
                  </h3>

                  <p>
                    {system.description}
                  </p>

                </div>

                <div className="cto-system-card-line">

                  <span />

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =========================================
          ARCHITECTURE
      ========================================= */}

      <section className="cto-section cto-architecture-section">

        <div className="cto-container">

          <div className="cto-section-heading cto-centered-heading">

            <p className="cto-section-number">
              03 / SYSTEM ARCHITECTURE
            </p>

            <h2>
              One Platform.
              <span> Connected Systems.</span>
            </h2>

          </div>


          <div className="cto-architecture">

            <div className="cto-architecture-node cto-main-node">

              <span>
                ◈
              </span>

              <strong>
                6SET JEWELRY
              </strong>

              <small>
                DIGITAL BUSINESS PLATFORM
              </small>

            </div>


            <div className="cto-architecture-line cto-line-main" />


            <div className="cto-architecture-row">

              <div className="cto-architecture-node">

                <span>
                  ◉
                </span>

                <strong>
                  STOREFRONT
                </strong>

                <small>
                  CUSTOMER EXPERIENCE
                </small>

              </div>

              <div className="cto-architecture-node">

                <span>
                  ◈
                </span>

                <strong>
                  ADMIN
                </strong>

                <small>
                  BUSINESS CONTROL
                </small>

              </div>

              <div className="cto-architecture-node">

                <span>
                  ⬡
                </span>

                <strong>
                  DATABASE
                </strong>

                <small>
                  SUPABASE
                </small>

              </div>

            </div>


            <div className="cto-architecture-line" />


            <div className="cto-architecture-node cto-engine-node">

              <span>
                ⚙
              </span>

              <strong>
                BUSINESS ENGINE
              </strong>

              <small>
                ORDERS / PAYMENTS / INVENTORY / DATA
              </small>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          TECHNOLOGY STACK
      ========================================= */}

      <section className="cto-section">

        <div className="cto-container">

          <div className="cto-section-heading">

            <p className="cto-section-number">
              04 / TECHNOLOGY STACK
            </p>

            <h2>
              Built With
              <span> Modern Technology.</span>
            </h2>

          </div>


          <div className="cto-tech-grid">

            {technologies.map((technology) => (

              <article
                className="cto-tech-card"
                key={technology.name}
              >

                <div className="cto-tech-symbol">

                  {technology.symbol}

                </div>

                <h3>
                  {technology.name}
                </h3>

                <p>
                  {technology.role}
                </p>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =========================================
          DEVELOPMENT JOURNEY
      ========================================= */}

      <section className="cto-section cto-roadmap-section">

        <div className="cto-container">

          <div className="cto-section-heading">

            <p className="cto-section-number">
              05 / DEVELOPMENT JOURNEY
            </p>

            <h2>
              Building The Platform
              <span> Step By Step.</span>
            </h2>

          </div>


          <div className="cto-roadmap">

            {roadmap.map((item) => (

              <article
                className="cto-roadmap-item"
                key={item.phase}
              >

                <div className="cto-roadmap-phase">

                  {item.phase}

                </div>

                <div className="cto-roadmap-content">

                  <div className="cto-roadmap-header">

                    <h3>
                      {item.title}
                    </h3>

                    <span
                      className={`cto-roadmap-status ${item.statusType}`}
                    >
                      {item.status}
                    </span>

                  </div>

                  <p>
                    {item.description}
                  </p>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =========================================
          PLATFORM STATUS
      ========================================= */}

      <section className="cto-section cto-status-section">

        <div className="cto-container">

          <div className="cto-status-panel">

            <div className="cto-status-panel-header">

              <div>

                <p>
                  06 / PLATFORM STATUS
                </p>

                <h2>
                  Current System
                  <span> Overview.</span>
                </h2>

              </div>

              <div className="cto-overall-status">

                <span className="cto-status-dot" />

                PLATFORM ONLINE

              </div>

            </div>


            <div className="cto-status-list">

              <div className="cto-status-row">

                <span>
                  Storefront
                </span>

                <strong className="active">
                  ● ONLINE
                </strong>

              </div>

              <div className="cto-status-row">

                <span>
                  Product Catalogue
                </span>

                <strong className="active">
                  ● ONLINE
                </strong>

              </div>

              <div className="cto-status-row">

                <span>
                  Shopping Cart
                </span>

                <strong className="active">
                  ● ACTIVE
                </strong>

              </div>

              <div className="cto-status-row">

                <span>
                  Admin Dashboard
                </span>

                <strong className="active">
                  ● ACTIVE
                </strong>

              </div>

              <div className="cto-status-row">

                <span>
                  Order Management
                </span>

                <strong className="development">
                  ◐ IN DEVELOPMENT
                </strong>

              </div>

              <div className="cto-status-row">

                <span>
                  AI Systems
                </span>

                <strong className="planned">
                  ○ PLANNED
                </strong>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          FUTURE
      ========================================= */}

      <section className="cto-section cto-future-section">

        <div className="cto-grid-background" />

        <div className="cto-container cto-future-content">

          <p className="cto-section-number">
            07 / THE NEXT SYSTEM
          </p>

          <h2>
            Building For
            <span> What's Next.</span>
          </h2>

          <p>
            The current platform is only the foundation.
            Future versions can introduce automation,
            intelligent business tools, advanced analytics,
            and AI-powered customer experiences.
          </p>


          <div className="cto-future-grid">

            <div>
              🤖
              <span>
                AI Assistant
              </span>
            </div>

            <div>
              💳
              <span>
                Automated Payments
              </span>
            </div>

            <div>
              📊
              <span>
                Business Analytics
              </span>
            </div>

            <div>
              ⚡
              <span>
                Smart Automation
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          HAVE AN IDEA? (ADVERTISEMENT)
      ========================================= */}

      <section className="cto-cta-section">

        <div className="cto-grid-background" />

        <div className="cto-container cto-cta-content">

          <p className="cto-system-label">
            <span className="cto-status-dot" />
            HAVE AN IDEA?
          </p>

          <h2>
            Let's Build
            <span> Something Real.</span>
          </h2>

          <p className="cto-cta-lead">
            6Set Jewelry is one example of what I build.
            Have a business, idea, or project that needs
            technology behind it? I design and build modern
            websites, e-commerce platforms, business systems,
            and custom digital experiences — from the first
            idea to a working product.
          </p>

          <p className="cto-cta-tagline">
            WEBSITES &middot; E-COMMERCE &middot; BUSINESS SYSTEMS &middot; CUSTOM SOFTWARE
          </p>

          <div className="cto-cta-actions">

            <a
              href={TREVOR_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="cto-primary-button"
            >
              Start a Project
              <span>→</span>
            </a>

            <a
              href={TREVOR_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="cto-glass-button"
            >
              Chat on WhatsApp
            </a>

          </div>

          <p className="cto-cta-closing">
            Your idea could be the next system I build.
          </p>

        </div>

      </section>


      {/* =========================================
          DEVELOPER FOOTER
      ========================================= */}

      <section className="cto-developer-footer">

        <div className="cto-container">

          {/* CONNECT */}

          <p className="cto-system-label">
            <span className="cto-status-dot" />
            CONNECT WITH THE DEVELOPER
          </p>

          <p className="cto-connect-lead">
            Follow the work. See what I'm building next.
          </p>

          <div className="cto-connect-icons">

            <a
              href={TREVOR_INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="cto-connect-icon"
              aria-label="Instagram"
              title="Instagram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect
                  x="3" y="3" width="18" height="18"
                  rx="5" ry="5"
                  fill="none" stroke="currentColor" strokeWidth="2"
                />
                <circle
                  cx="12" cy="12" r="4"
                  fill="none" stroke="currentColor" strokeWidth="2"
                />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </a>

            <a
              href={TREVOR_X_URL}
              target="_blank"
              rel="noreferrer"
              className="cto-connect-icon"
              aria-label="X"
              title="X"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M18.9 2H22l-8.6 9.8L23 22h-6.6l-5.2-6.8L5 22H2l9.3-10.6L1 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20Z"
                />
              </svg>
            </a>

            <a
              href={TREVOR_TIKTOK_URL}
              target="_blank"
              rel="noreferrer"
              className="cto-connect-icon"
              aria-label="TikTok"
              title="TikTok"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M15 3c.4 2.1 1.6 3.6 4 4v3.1c-1.5-.1-2.8-.6-4-1.4v6.8c0 3.5-2.4 5.5-5.5 5.5A5.5 5.5 0 1 1 15 15.5v3.2a2.5 2.5 0 1 0-2.5-2.4V3H15Z"
                />
              </svg>
            </a>

            <a
              href={TREVOR_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="cto-connect-icon"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.6 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.5.5-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.9.3.1.5.2.5.3.1.2.1.6-.1 1.2Z"
                />
              </svg>
            </a>

            <a
              href={`mailto:${TREVOR_EMAIL}`}
              className="cto-connect-icon"
              aria-label="Email"
              title="Email"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect
                  x="3" y="5" width="18" height="14" rx="2"
                  fill="none" stroke="currentColor" strokeWidth="2"
                />
                <path
                  d="M4 7l8 6 8-6"
                  fill="none" stroke="currentColor" strokeWidth="2"
                />
              </svg>
            </a>

          </div>

          <div className="cto-footer-divider" />

          {/* IDENTITY */}

          <p className="cto-system-label">
            <span className="cto-status-dot" />
            SYSTEM / DEVELOPER PROFILE
          </p>

          <h2>
            Trevor Simon
          </h2>

          <p className="cto-footer-role">
            CTO — 6Set Jewelry
          </p>

          <p className="cto-footer-descriptor">
            Developer · System Architect · Technology Builder
          </p>

          <p className="cto-footer-copyright">
            © 2026 Trevor Simon
          </p>

          <div className="cto-footer-actions">

            <Link
              to="/"
              className="cto-primary-button"
            >
              Visit 6Set Jewelry
              <span>→</span>
            </Link>

          </div>

        </div>

      </section>

    </main>
  )
}

export default TrevorCTO