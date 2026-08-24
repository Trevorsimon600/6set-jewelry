import "./TrevorCTO.css";

/**
 * TrevorCTO — a single-page "hallmark certificate" for the person
 * behind 6set. Drop this in next to your Home / All Products routes.
 * No external dependencies — just this file + TrevorCTO.css.
 *
 * Rename the component/file to whatever you land on for the nav label.
 */
export default function TrevorCTO() {
  return (
    <main className="cto-page">
      <div className="cto-vignette" aria-hidden="true" />

      <section className="cto-card">
        <span className="cto-corner cto-corner--tl" aria-hidden="true" />
        <span className="cto-corner cto-corner--tr" aria-hidden="true" />
        <span className="cto-corner cto-corner--bl" aria-hidden="true" />
        <span className="cto-corner cto-corner--br" aria-hidden="true" />

        <div className="cto-seal" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="100%" height="100%">
            <polygon
              points="32,3 55,16 55,48 32,61 9,48 9,16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <text
              x="32"
              y="38"
              textAnchor="middle"
              fontFamily="'Cormorant Garamond', serif"
              fontSize="20"
              fill="currentColor"
            >
              TS
            </text>
          </svg>
        </div>

        <p className="cto-eyebrow cto-fade" style={{ "--d": "0.05s" }}>
          6SET &middot; EST. 2026
        </p>

        <h1 className="cto-name cto-fade" style={{ "--d": "0.15s" }}>
          Trevor Simon
        </h1>

        <p className="cto-title cto-fade" style={{ "--d": "0.25s" }}>
          Chief Technology Officer
        </p>

        <div className="cto-rule cto-fade" style={{ "--d": "0.35s" }}>
          <span className="cto-rule-line" />
          <span className="cto-rule-dot" />
          <span className="cto-rule-line" />
        </div>

        <p className="cto-bio cto-fade" style={{ "--d": "0.45s" }}>
          I'm the one who built the site you're browsing — and a few other
          things you'll probably never see. Systems, mostly. The kind that
          quietly make sure everything just works.
        </p>

        <dl className="cto-manifest cto-fade" style={{ "--d": "0.55s" }}>
          <div className="cto-manifest-row">
            <dt>Role</dt>
            <dd>Chief Technology Officer, 6set</dd>
          </div>
          <div className="cto-manifest-row">
            <dt>Built</dt>
            <dd>This site, and more behind the scenes</dd>
          </div>
          <div className="cto-manifest-row">
            <dt>Open to</dt>
            <dd>Select builds, by request</dd>
          </div>
        </dl>

        <div className="cto-rule cto-fade" style={{ "--d": "0.65s" }}>
          <span className="cto-rule-line" />
          <span className="cto-rule-dot" />
          <span className="cto-rule-line" />
        </div>

        <div className="cto-cta cto-fade" style={{ "--d": "0.75s" }}>
          <h2>Need something built?</h2>
          <p>
            If you're after a website — or something else entirely — reach
            out through any of these.
          </p>
        </div>

        <div className="cto-socials cto-fade" style={{ "--d": "0.85s" }}>
          <a
            href="mailto:trevorsimon600@gmail.com"
            aria-label="Email Trevor"
            className="cto-social"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="3" y="5" width="18" height="14" rx="1.5" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </a>

          <a
            href="https://www.instagram.com/tr3v0r._n.c.t"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Trevor on Instagram"
            className="cto-social"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>

          <a
            href="https://www.linkedin.com/in/trevor-simon"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Trevor on LinkedIn"
            className="cto-social"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM.5 21.5h4.9V8.9H.5v12.6ZM8.6 8.9h4.7v1.72h.07c.65-1.2 2.24-2.47 4.62-2.47 4.94 0 5.85 3.15 5.85 7.24v8.11h-4.9v-7.19c0-1.72-.03-3.93-2.4-3.93-2.41 0-2.78 1.87-2.78 3.8v7.32H8.6V8.9Z" />
            </svg>
          </a>

          <a
            href="https://x.com/Simo63903Trevor"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Trevor on X"
            className="cto-social"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.9 2H22l-7.4 8.4L23.3 22H16.9l-5-6.5L6 22H2.9l7.9-9L1.9 2h6.6l4.5 6 5.9-6Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
            </svg>
          </a>
        </div>

        <p className="cto-footnote cto-fade" style={{ "--d": "0.95s" }}>
          6SET &mdash; crafted in Nairobi
        </p>
      </section>
    </main>
  );
}
