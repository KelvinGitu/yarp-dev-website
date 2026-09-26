import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import CtaBand from '@/components/CtaBand';
import ProjectCard from '@/components/ProjectCard';
import SectionHead from '@/components/SectionHead';
import StatRow from '@/components/StatRow';
import { MailIcon } from '@/components/icons';
import { products } from '@/data/products';
import { SALES_EMAIL, studioStats } from '@/data/studio';

// The studio's front door: who we are, the proof, the mobile apps, the desktop
// apps you can buy, and a way to get in touch.
export default function Home() {
  return (
    <>
      <Head>
        <title>Yarp Developers — Mobile and desktop apps, built and kept running</title>
        <meta
          name="description"
          content={`${apps.length} Flutter apps live on Google Play and ${products.length} private Windows apps, built, shipped, and operated end to end by Yarp Developers.`}
        />
      </Head>

      <div className="page home">
        <header className="page-hero">
          <p className="detail-section-title">Yarp Developers</p>
          <h1 className="page-title">Mobile and desktop apps, built and kept running.</h1>
          <p className="page-lede">
            {apps.length} Flutter apps live on Google Play and {products.length} private Windows apps, each one built
            and kept running by us — interface, backend, billing, and the store review that comes after.
          </p>
          <div className="store-actions">
            <a href="#apps" className="store-btn store-btn-primary">
              <span className="store-btn-main">See the apps</span>
            </a>
            <Link href="/store" className="store-btn">
              <span className="store-btn-main">Desktop apps</span>
            </Link>
          </div>
          <StatRow stats={studioStats()} />
        </header>

        <section id="apps" className="detail-section">
          <SectionHead eyebrow="Mobile apps" title="Live on Google Play" />
          <div className="projects">
            {apps.map((app) => (
              <ProjectCard key={app.slug} app={app} />
            ))}
          </div>
        </section>

        <section id="desktop" className="detail-section">
          <SectionHead eyebrow="Desktop apps" title="Private tools for your own computer" />
          <p className="page-text">
            Windows programs for the documents you’d rather not upload anywhere. No account, no cloud, and they work
            with the internet switched off.
          </p>
          <ul className="home-desktop">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/store/${p.slug}`} className="home-desktop-item">
                  <span className="home-desktop-name">
                    <img src={`/assets/icons/${p.slug}.png`} alt="" width={32} height={32} />
                    {p.name}
                  </span>
                  <span className="home-desktop-headline">{p.headline ?? p.tagline}</span>
                  <span className="home-desktop-price">
                    {p.free ? <strong>Free</strong> : <><strong>{p.price}</strong> paid once</>} · See {p.name} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="page-text home-desktop-more">
            Three are free; StoryForge is free to try, then a one-time price. <Link href="/store">See the store →</Link>
          </p>
        </section>

        <section className="detail-section">
          <SectionHead eyebrow="About" title="A small studio, run by Kelvin Gitu" />
          <p className="page-text">
            We build every part of these apps ourselves, from the interface to the billing, and keep them running
            after launch, which is where the real work is. <Link href="/about">About us →</Link>
          </p>
        </section>

        <CtaBand title="Have an app in mind?" text="Available for mobile and web work.">
          <a href={`mailto:${SALES_EMAIL}`} className="store-btn store-btn-primary">
            <MailIcon />
            <span className="store-btn-main">{SALES_EMAIL}</span>
          </a>
        </CtaBand>
      </div>
    </>
  );
}
