import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apps } from '@/data/apps';

export default function AppDetail() {
  const { query, isReady } = useRouter();

  if (!isReady) return null;

  const app = apps.find((a) => a.slug === query.slug);
  if (!app) return <div className="prose"><p>App not found.</p></div>;

  const iconPath = `/assets/icons/${app.slug}.png`;

  return (
    <>
      <Head>
        <title>{app.name} · Yarp Developers</title>
        <meta name="description" content={app.tagline} />
      </Head>

      <div className="app-detail">

        {/* ── Header ── */}
        <div className="ad-header">
          <div className="ad-icon">
            <img
              src={iconPath}
              alt={app.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span class="ad-icon-fallback">${app.name.charAt(0)}</span>`;
              }}
            />
          </div>
          <div className="ad-header-text">
            <h1 className="ad-title">{app.name}</h1>
            <p className="ad-tagline">{app.tagline}</p>
            <div className="app-badges">
              {app.status === 'live' && <span className="badge badge-play">Play Store</span>}
              {app.webUrl && <span className="badge badge-web">Web App</span>}
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="ad-description">
          <p>{app.description}</p>
        </div>

        {/* ── Features ── */}
        <section className="ad-section">
          <h2 className="ad-section-title">Features</h2>
          <ul className="ad-features">
            {app.features.map((f, i) => (
              <li key={i} className="ad-feature-item">
                <span className="ad-feature-dot" />
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Tech Stack ── */}
        <section className="ad-section">
          <h2 className="ad-section-title">Tech Stack</h2>
          <div className="tech-pills">
            {app.stack.map((t) => (
              <span key={t} className="tech-pill">{t}</span>
            ))}
          </div>
        </section>

        {/* ── Legal & Links ── */}
        <section className="ad-section">
          <h2 className="ad-section-title">Legal &amp; Links</h2>
          <div className="ad-links">
            {app.playUrl && app.status === 'live' && (
              <a href={app.playUrl} target="_blank" rel="noopener noreferrer" className="ad-btn-store">
                <span className="ad-btn-icon">▶</span>
                <span>
                  <span className="ad-btn-sub">Get it on</span>
                  <span className="ad-btn-main">Google Play</span>
                </span>
              </a>
            )}
            {app.webUrl && (
              <Link href={app.webUrl} className="ad-btn-launch">
                <span className="ad-btn-icon">⊕</span>
                <span>
                  <span className="ad-btn-sub">Open in browser</span>
                  <span className="ad-btn-main">Web App</span>
                </span>
              </Link>
            )}
            <div className="ad-legal-links">
              <Link href={`/privacy/${app.packageId}`} className="ad-btn-legal">
                Privacy Policy
              </Link>
              <Link href={`/terms/${app.packageId}`} className="ad-btn-legal">
                Terms of Service
              </Link>
            </div>
          </div>
        </section>

        {/* ── Notes ── */}
        {app.webUrl && (app.hasPurchases || app.hasAds) && (
          <div className="ad-note">
            <strong>Note for web users:</strong> In-app purchases and certain features are optimised for the mobile app. To buy credits or upgrade, open the app on your phone.
          </div>
        )}
        {app.hasMic && (
          <div className="ad-note ad-note-warning">
            <strong>Note:</strong> This app requires microphone access and is primarily designed for mobile devices.
          </div>
        )}

        <div className="ad-back">
          <Link href="/" className="ad-back-link">← All apps</Link>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: apps.map((app) => ({ params: { slug: app.slug } })),
    fallback: false,
  };
}

export async function getStaticProps() {
  return { props: {} };
}
