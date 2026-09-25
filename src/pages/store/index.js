import Head from 'next/head';
import Link from 'next/link';
import BuyButton from '@/components/BuyButton';
import { Price, RegionPicker } from '@/components/Region';
import StorePromises from '@/components/StorePromises';
import PriceCard from '@/components/store/PriceCard';
import { bundle, products } from '@/data/products';

export default function Store() {
  return (
    <>
      <Head>
        <title>Desktop apps · Yarp Developers</title>
        <meta
          name="description"
          content="pdfsign, Resume Maker, StoryForge and Ink Lifter: Windows apps that work on your own computer. No account, no cloud."
        />
      </Head>

      <div className="page store">
        <header className="store-head page-hero">
          <p className="detail-section-title">Desktop apps</p>
          <h1 className="page-title">Apps that keep your files on your own computer.</h1>
          <p className="store-lede">
            Small Windows programs for the things you’d rather not hand to a website: the contract you’re signing, the
            resume with your phone number on it, the novel you’re halfway through. No account, no cloud, and they work
            with the internet switched off.
          </p>
          <p className="store-lede store-lede-small">
            Each one is a single payment, and every download works before you buy, so you can try it on your own
            files first — see each app’s page for exactly what’s free.
          </p>
          <StorePromises />
          <RegionPicker />
        </header>

        <ul className="store-list">
          {products.map((p) => (
            <li key={p.slug} className="store-card">
              <Link href={`/store/${p.slug}`} className="store-card-shot" tabIndex={-1} aria-hidden="true">
                <img src={`/assets/store/${p.slug}/${p.shots[0].file}`} alt="" width={1440} height={900} loading="lazy" />
              </Link>
              <div className="store-card-body">
                <p className="store-card-name">
                  <img src={`/assets/icons/${p.slug}.png`} alt="" width={28} height={28} />
                  {p.name}
                  <span className="detail-release">v{p.version}</span>
                </p>
                <h2 className="store-card-headline">
                  <Link href={`/store/${p.slug}`}>{p.headline ?? p.tagline}</Link>
                </h2>
                {p.headline && <p className="card-text">{p.tagline}</p>}
                <p className="store-card-price"><strong><Price product={p} /></strong> paid once</p>
                <div className="store-actions">
                  <BuyButton item={p} className="store-btn-primary" />
                  <Link href={`/store/${p.slug}`} className="store-btn">
                    <span className="store-btn-main">See {p.name}</span>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <section className="detail-section store-price">
          <p className="detail-section-title">All four apps</p>
          <h2 className="page-h2">Or have all four, with one key</h2>
          <PriceCard
            item={bundle}
            title="All four apps"
            buyLabel="Buy all four"
            items={[
              ...products.map((p) => (
                <span key={p.slug}><strong>{p.name}</strong> <span className="price-card-sub">{p.tagline}</span></span>
              )),
              'One licence key unlocks every one of them',
              'Every future version of each, free',
              '30-day refund if they don’t work for you',
            ]}
          />
        </section>

        <div className="detail-back">
          <Link href="/" className="detail-back-link">← Home</Link>
          <span className="store-legal">
            <Link href="/store/privacy">Privacy</Link> · <Link href="/store/terms">Licence terms</Link>
          </span>
        </div>
      </div>
    </>
  );
}
