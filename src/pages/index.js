import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import ProjectCard from '@/components/ProjectCard';
import { products } from '@/data/products';

const totalBuilds = apps.reduce((sum, app) => sum + app.builds, 0);

export default function Home() {
  return (
    <>
      <Head>
        <title>Yarp Developers — Mobile apps, built and shipped</title>
        <meta
          name="description"
          content={`${apps.length} Flutter apps live on Google Play, built, shipped, and operated end to end by Yarp Developers.`}
        />
      </Head>

      <div className="home">
        <header className="store-head">
          <h1 className="detail-title">Mobile apps, built and shipped.</h1>
          <p className="store-lede">
            We&apos;re Yarp Developers. {apps.length} Flutter apps live on Google Play, each one built and kept
            running by us — interface, backend, billing, and the store review that comes after. {totalBuilds}{' '}
            releases so far.
          </p>
          <div className="store-actions">
            <a href="#projects" className="store-btn store-btn-download">
              <span className="store-btn-main">See the apps</span>
            </a>
            <Link href="/store" className="store-btn">
              <span className="store-btn-main">Desktop apps</span>
            </Link>
          </div>
        </header>

        <section id="projects" className="section">
          <h2 className="section-label">Mobile apps</h2>
          <div className="projects">
            {apps.map((app) => (
              <ProjectCard key={app.slug} app={app} />
            ))}
          </div>
        </section>

        <section id="desktop" className="section">
          <h2 className="section-label">Desktop apps</h2>
          <div className="lede">
            <p>
              Windows programs for documents you&apos;d rather not upload anywhere. They run on your own computer
              with no account and no cloud, and they work with the internet switched off.
            </p>
          </div>
          <ul className="home-desktop">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/store/${p.slug}`} className="home-desktop-item">
                  <img src={`/assets/icons/${p.slug}.png`} alt="" width={42} height={42} />
                  <span>
                    <span className="project-name">{p.name}</span>
                    <span className="project-tagline">{p.tagline}</span>
                  </span>
                  <span className="home-desktop-price">{p.price}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="contact-secondary">
            Free to try, then a one-time price. <Link href="/store">See all four</Link>.
          </p>
          <p className="contact-secondary">
            Want to know who&apos;s behind this? <Link href="/about">About us</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
