import Head from 'next/head';
import Link from 'next/link';
import BuyButton from '@/components/BuyButton';
import StorePromises from '@/components/StorePromises';
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

      <div className="store">
        <header className="store-head">
          <h1 className="detail-title">Desktop apps</h1>
          <p className="store-lede">
            Small Windows programs for the things you’d rather not hand to a website: the contract you’re signing, the
            resume with your phone number on it, the novel you’re halfway through. They run on your computer and
            nowhere else. No account, no cloud, and they work with the internet switched off.
          </p>
          <p className="store-lede store-lede-small">
            Each one is a single payment, and every download works before you buy, so you can try it on your own
            files first — see each app's page for exactly what's free.
          </p>
          <StorePromises />
        </header>

        <ul className="store-list">
          {products.map((p) => (
            <li key={p.slug} className="project store-item">
              <div className="project-head">
                <div className="project-icon">
                  <img src={`/assets/icons/${p.slug}.png`} alt="" />
                </div>
                <div>
                  <h2 className="project-name">
                    <Link href={`/store/${p.slug}`}>{p.name}</Link>
                  </h2>
                  <p className="project-tagline">{p.tagline}</p>
                </div>
                <div className="release">
                  <span className="release-builds">{p.price}</span>
                  <span className="release-version">v{p.version}</span>
                </div>
              </div>
              <Link href={`/store/${p.slug}`} className="store-item-shot" tabIndex={-1} aria-hidden="true">
                <img src={`/assets/store/${p.slug}/${p.shots[0].file}`} alt="" width={1440} height={900} loading="lazy" />
              </Link>
              <div className="store-item-links">
                <Link href={`/store/${p.slug}`} className="detail-btn-legal">Details and download</Link>
              </div>
            </li>
          ))}

          <li className="project store-item store-bundle">
            <div className="store-bundle-row">
              <div>
                <h2 className="project-name">{bundle.name}</h2>
                <p className="project-tagline">{bundle.tagline}</p>
              </div>
              <BuyButton product={bundle.slug} price={bundle.price} label="Buy all four" />
            </div>
          </li>
        </ul>

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
