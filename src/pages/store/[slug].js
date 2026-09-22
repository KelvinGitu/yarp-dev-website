import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import BuyButton from '@/components/BuyButton';
import { DownloadIcon } from '@/components/icons';
import { FREE_EXPORTS, SUPPORT_EMAIL, bundle, products, productBySlug } from '@/data/products';

export default function StoreProduct({ product }) {
  const router = useRouter();
  const [cancelled, setCancelled] = useState(false);

  // Stripe sends a buyer who backs out of checkout here with ?checkout=cancelled.
  useEffect(() => {
    if (router.isReady) setCancelled(router.query.checkout === 'cancelled');
  }, [router.isReady, router.query.checkout]);

  if (!product) return <div className="prose"><p>Product not found.</p></div>;
  const other = products.find((p) => p.slug !== product.slug);

  return (
    <>
      <Head>
        <title>{`${product.name} for Windows · Yarp Developers`}</title>
        <meta name="description" content={`${product.tagline} Runs on your computer; your files never leave it.`} />
      </Head>

      <div className="store-product">
        {cancelled && (
          <p className="detail-note" role="status">
            Checkout was cancelled, and nothing was charged. The free trial is still yours to download.
          </p>
        )}

        <div className="detail-header">
          <div className="detail-icon">
            <img src={`/assets/icons/${product.slug}.png`} alt="" />
          </div>
          <div className="detail-header-text">
            <h1 className="detail-title">{product.name}</h1>
            <p className="detail-tagline">{product.tagline}</p>
            <p className="detail-release">
              v{product.version} · Windows 10 and 11 · {product.size}
            </p>
          </div>
        </div>

        {/* The promise first: it's the reason to buy this over a web tool. */}
        <section className="store-promise">
          <p className="store-promise-line">Your files never leave this computer.</p>
          <ul className="store-promise-list">
            {product.privacy.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        <div className="store-actions">
          <a className="store-btn store-btn-download" href={product.download}>
            <DownloadIcon />
            <span>
              <span className="store-btn-main">Download free trial</span>
              <span className="store-btn-sub">{FREE_EXPORTS} free exports, then a key</span>
            </span>
          </a>
          <BuyButton product={product.slug} price={product.price} />
        </div>
        <p className="store-price-note">
          One payment, yours to keep. No subscription, no account.
        </p>

        <div className="detail-description">
          <p>{product.description}</p>
        </div>

        <section className="detail-section">
          <h2 className="detail-section-title">Screens</h2>
          <div className="store-shots">
            {product.shots.map((shot) => (
              <img key={shot.file} src={`/assets/store/${product.slug}/${shot.file}`} alt={shot.alt} width={1440} height={900} loading="lazy" />
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">What it does</h2>
          <ul className="detail-features">
            {product.features.map((f) => (
              <li key={f} className="detail-feature-item">
                <span className="detail-feature-dot" />
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">How buying works</h2>
          <ol className="store-steps">
            <li>
              <strong>Try it.</strong> Download and install the free trial. Everything works; the first {FREE_EXPORTS} PDFs you save are free.
            </li>
            <li>
              <strong>Buy a licence</strong> ({product.price}, paid through Stripe). Your licence key arrives by email a moment later.
            </li>
            <li>
              <strong>Paste the key</strong> into the app’s Licence window. It’s checked on your computer, so it keeps working offline, for good.
            </li>
          </ol>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Installing on Windows</h2>
          <div className="detail-body">
            <p>
              Run the file you downloaded. It installs just for you, with no administrator password.
            </p>
            <p>
              Because {product.name} comes from a small independent developer, Windows may show a blue
              <em> “Windows protected your PC”</em> box the first time. Click <strong>More info</strong>, then
              <strong> Run anyway</strong>. Windows shows this for new programs it hasn’t seen many times before,
              not because anything is wrong with the file.
            </p>
          </div>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Questions</h2>
          <div className="store-faq">
            <details>
              <summary>How can I check that it really doesn’t send my files anywhere?</summary>
              <p>
                Unplug your network cable or turn off wifi: {product.name} works exactly the same. For a closer look, open
                Windows’ Resource Monitor while you use it. Its only connections are to 127.0.0.1, your own computer.
              </p>
            </details>
            <details>
              <summary>What happens after the free exports?</summary>
              <p>
                You can keep opening and editing as much as you like. Saving new PDFs needs a licence key.
              </p>
            </details>
            <details>
              <summary>Can I use my key on more than one computer?</summary>
              <p>Yes, on your own computers: your desktop and your laptop, say. Please don’t share it beyond that.</p>
            </details>
            <details>
              <summary>I lost my key.</summary>
              <p>
                Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address you bought with, and we’ll send it again.
              </p>
            </details>
            <details>
              <summary>What if it doesn’t work for me?</summary>
              <p>
                Email within 30 days of buying and you’ll get a full refund. The free trial is there so you can check first.
              </p>
            </details>
            <details>
              <summary>Mac or Linux?</summary>
              <p>Windows only for now.</p>
            </details>
          </div>
        </section>

        {other && (
          <div className="detail-note">
            <strong>Want {other.name} too?</strong> {bundle.tagline} {bundle.price} for both.{' '}
            <Link href="/store">See both apps</Link>.
          </div>
        )}

        <div className="detail-back">
          <Link href="/store" className="detail-back-link">← All desktop apps</Link>
          <span className="store-legal">
            <Link href="/store/privacy">Privacy</Link> · <Link href="/store/terms">Licence terms</Link>
          </span>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  return { paths: products.map((p) => ({ params: { slug: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { product: productBySlug(params.slug) } };
}
