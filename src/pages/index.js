import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import AppCard from '@/components/AppCard';

export default function Home() {
  return (
    <>
      <Head>
        <title>Yarp Developers</title>
        <meta name="description" content="Crafting mobile experiences — AI, social, gaming, and productivity." />
      </Head>

      <section className="hero">
        <h1>Yarp Developers</h1>
        <p>Crafting stunning mobile experiences — AI, social, gaming, and productivity. Built from Kenya to the world.</p>
        <div className="hero-buttons">
          <a href="#apps" className="btn">View Apps</a>
          <Link href="/support" className="btn secondary">Contact Us</Link>
        </div>
      </section>

      <section id="apps" className="apps-section">
        <h2 className="section-title">Our Portfolio</h2>
        <div className="apps-grid">
          {apps.map(app => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </section>

      <section className="about-section" style={{ marginTop: '5rem', textAlign: 'center' }}>
        <h2 className="section-title" style={{ justifyContent: 'center' }}>About & Tech Stack</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Built by Kelvin Gitu, a Flutter developer based in Kenya, building across AI, social, gaming, and productivity.
        </p>
        <div className="tech-stack">
          {['Flutter / Dart', 'Firebase', 'Google Gemini AI', 'RevenueCat', 'AdMob', 'Next.js', 'GitHub Actions'].map(tech => (
            <span key={tech} className="tech-item">{tech}</span>
          ))}
        </div>
      </section>
    </>
  );
}
