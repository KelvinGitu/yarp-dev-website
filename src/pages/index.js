import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import AppCard from '@/components/AppCard';

function HvcIcon({ slug, name }) {
  const [error, setError] = useState(false);
  if (error) return <div className="hvc-icon-fallback">{name.charAt(0)}</div>;
  return <img src={`/assets/icons/${slug}.png`} alt={name} onError={() => setError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

const heroApps = [
  { slug: 'days-end',   name: "Day's End",  tag: 'Social · AI'     },
  { slug: 'narp',       name: 'Narp',        tag: 'Social Network'  },
  { slug: 'sleevr',     name: 'Sleevr',      tag: 'Trivia Game'     },
];

const techGroups = [
  { label: 'Mobile',    items: ['Flutter', 'Dart', 'Riverpod', 'Go Router'] },
  { label: 'Backend',   items: ['Firebase', 'Firestore', 'Cloud Functions'] },
  { label: 'AI',        items: ['Google Gemini AI', 'Vertex AI'] },
  { label: 'Monetise',  items: ['RevenueCat', 'AdMob', 'In-App Purchase'] },
  { label: 'Web',       items: ['Next.js', 'Firebase Hosting', 'GitHub Actions'] },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Yarp Developers</title>
        <meta name="description" content="Crafting mobile experiences — AI, social, gaming, and productivity. Built from Kenya to the world." />
      </Head>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />

        <div className="hero-left">
          <span className="hero-eyebrow">Nairobi, Kenya</span>
          <h1>
            Building apps<br />
            the world <em>loves.</em>
          </h1>
          <p className="hero-subtitle">
            AI, social, gaming, and productivity — five apps on the Play Store, crafted with an obsessive eye for detail.
          </p>
          <div className="hero-actions">
            <a href="#apps" className="btn-primary">View Portfolio</a>
            <Link href="/support" className="btn-ghost">Get in Touch</Link>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">5</div>
              <div className="hero-stat-label">Apps Live</div>
            </div>
            <div>
              <div className="hero-stat-value">4+</div>
              <div className="hero-stat-label">Years Building</div>
            </div>
            <div>
              <div className="hero-stat-value">KE</div>
              <div className="hero-stat-label">Based In</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          {heroApps.map((app) => (
            <div key={app.slug} className="hero-visual-card">
              <div className="hvc-icon">
                <HvcIcon slug={app.slug} name={app.name} />
              </div>
              <div>
                <div className="hvc-name">{app.name}</div>
                <div className="hvc-tag">{app.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── APPS ── */}
      <section id="apps" className="apps-section">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">Portfolio</div>
            <h2 className="section-title">Our Apps</h2>
          </div>
          <span className="section-count">{apps.length} apps</span>
        </div>
        <div className="apps-grid">
          {apps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-left">
            <div className="section-eyebrow">About</div>
            <h2>
              One developer.<br />
              <em>Relentless</em> craft.
            </h2>
            <p>
              Kelvin Gitu is a Flutter developer based in Nairobi, Kenya, building across AI, social, gaming, and productivity. Every app ships with real monetisation, real users, and a real obsession with quality.
            </p>
          </div>
          <div className="about-right">
            {techGroups.map((group) => (
              <div key={group.label} className="tech-group">
                <div className="tech-group-label">{group.label}</div>
                <div className="tech-pills">
                  {group.items.map((item) => (
                    <span key={item} className="tech-pill">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
