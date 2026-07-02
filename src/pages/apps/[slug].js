import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { apps } from '@/data/apps';

function AppIcon({ slug, name }) {
  const [error, setError] = useState(false);
  if (error) return <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--gold)' }}>{name.charAt(0)}</span>;
  return <img src={`/assets/icons/${slug}.png`} alt={name} onError={() => setError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export default function AppDetail({ app }) {
  if (!app) return <div className="prose"><p>App not found.</p></div>;

  return (
    <>
      <Head>
        <title>{app.name} · Yarp Developers</title>
        <meta name="description" content={app.tagline} />
      </Head>

      <div className="app-detail">

        {/* ── Header ── */}
        <div className="detail-header">
          <div className="detail-icon">
            <AppIcon slug={app.slug} name={app.name} />
          </div>
          <div className="detail-header-text">
            <h1 className="detail-title">{app.name}</h1>
            <p className="detail-tagline">{app.tagline}</p>
            <div className="app-badges">
              {app.status === 'live' && <span className="badge badge-play">Play Store</span>}
              {app.webUrl && <span className="badge badge-web">Web App</span>}
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="detail-description">
          <p>{app.description}</p>
        </div>

        {/* ── Features ── */}
        <section className="detail-section">
          <h2 className="detail-section-title">Features</h2>
          <ul className="detail-features">
            {app.features.map((f, i) => (
              <li key={i} className="detail-feature-item">
                <span className="detail-feature-dot" />
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Tech Stack ── */}
        <section className="detail-section">
          <h2 className="detail-section-title">Tech Stack</h2>
          <div className="tech-pills">
            {app.stack.map((t) => (
              <span key={t} className="tech-pill">{t}</span>
            ))}
          </div>
        </section>

        {/* ── Legal & Links ── */}
        <section className="detail-section">
          <h2 className="detail-section-title">Legal &amp; Links</h2>
          <div className="detail-links">
            {app.playUrl && app.status === 'live' && (
              <a href={app.playUrl} target="_blank" rel="noopener noreferrer" className="detail-btn-store">
                <span className="detail-btn-icon">▶</span>
                <span>
                  <span className="detail-btn-sub">Get it on</span>
                  <span className="detail-btn-main">Google Play</span>
                </span>
              </a>
            )}
            {app.webUrl && (
              <Link href={app.webUrl} className="detail-btn-launch">
                <span className="detail-btn-icon">⊕</span>
                <span>
                  <span className="detail-btn-sub">Open in browser</span>
                  <span className="detail-btn-main">Web App</span>
                </span>
              </Link>
            )}
            <div className="detail-legal-links">
              <Link href={`/privacy/${app.packageId}`} className="detail-btn-legal">
                Privacy Policy
              </Link>
              <Link href={`/terms/${app.packageId}`} className="detail-btn-legal">
                Terms of Service
              </Link>
            </div>
          </div>
        </section>

        {/* ── Notes ── */}
        {app.webUrl && (app.hasPurchases || app.hasAds) && (
          <div className="detail-note">
            <strong>Note for web users:</strong> In-app purchases and certain features are optimised for the mobile app. To buy credits or upgrade, open the app on your phone.
          </div>
        )}
        {app.hasMic && (
          <div className="detail-note detail-note-warning">
            <strong>Note:</strong> This app requires microphone access and is primarily designed for mobile devices.
          </div>
        )}

        <div className="detail-back">
          <Link href="/" className="detail-back-link">← All apps</Link>
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

export async function getStaticProps({ params }) {
  const app = apps.find((a) => a.slug === params.slug) ?? null;
  return { props: { app } };
}
