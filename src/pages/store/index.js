import Head from 'next/head';
import Link from 'next/link';
import BuyButton from '@/components/BuyButton';
import StorePromises from '@/components/StorePromises';
import { DownloadIcon } from '@/components/icons';
import { products } from '@/data/products';

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
            pdfsign, Resume Maker and Ink Lifter are free, with nothing locked. StoryForge is a single payment, and
            its download works before you buy, so you can try it on your own writing first.
          </p>
          <StorePromises />
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
                {p.free
                  ? <p className="store-card-price"><strong>Free</strong> with nothing locked</p>
                  : <p className="store-card-price"><strong>{p.price}</strong> paid once</p>}
                <div className="store-actions">
                  {p.free ? (
                    <a className="store-btn store-btn-primary" href={p.download}>
                      <DownloadIcon /><span className="store-btn-main">Download free</span>
                    </a>
                  ) : (
                    <BuyButton item={p} className="store-btn-primary" />
                  )}
                  <Link href={`/store/${p.slug}`} className="store-btn">
                    <span className="store-btn-main">See {p.name}</span>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="detail-back">
          <Link href="/" className="detail-back-link">← Home</Link>
          <span className="store-legal">
            <Link href="/store/privacy">Privacy</Link> · <Link href="/store/terms">Terms</Link>
          </span>
        </div>
      </div>
    </>
  );
}
