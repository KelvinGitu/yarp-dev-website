import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useSyncExternalStore } from 'react';
import BuyButton from '@/components/BuyButton';
import StorePromises from '@/components/StorePromises';
import { RegionPicker, useRegion } from '@/components/Region';
import { DownloadIcon, GlobeIcon } from '@/components/icons';
import { SUPPORT_EMAIL, bundle, products, productBySlug } from '@/data/products';
import { REGIONS, priceFor } from '@/data/regions';

// Most ad clicks come from phones. An app with a browser version (`web`) sends
// them there; the Windows-only ones explain how to get it onto a computer.
// The answer never changes during a visit, so there's nothing to subscribe to.
const noSubscribe = () => () => {};
const isPhone = () => /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);

export default function StoreProduct({ product }) {
  const router = useRouter();
  const { region } = useRegion();
  const local = REGIONS[region];
  const [cancelled, setCancelled] = useState(false);
  const onPhone = useSyncExternalStore(noSubscribe, isPhone, () => false);

  // Stripe and Paystack send a buyer who backs out of checkout here with ?checkout=cancelled.
  useEffect(() => {
    if (router.isReady) setCancelled(router.query.checkout === 'cancelled');
  }, [router.isReady, router.query.checkout]);

  if (!product) return <div className="prose"><p>Product not found.</p></div>;
  const others = products.filter((p) => p.slug !== product.slug);
  const [lead, ...more] = product.shots;

  return (
    <>
      <Head>
        <title>{`${product.name} for Windows${product.web ? ' and your browser' : ''} · Yarp Developers`}</title>
        <meta
          name="description"
          content={`${product.tagline} Runs on your ${product.web ? 'computer or phone' : 'computer'}; your files never leave it.`}
        />
      </Head>

      <div className="store-product">
        {cancelled && (
          <p className="detail-note" role="status">
            Checkout was cancelled, and nothing was charged. {product.name} is still yours to download and try.
          </p>
        )}

        <header className="product-hero">
          <div className="detail-header">
            <div className="detail-icon">
              <img src={`/assets/icons/${product.slug}.png`} alt="" />
            </div>
            <div className="detail-header-text">
              <h1 className="detail-title">{product.name}</h1>
              <p className="detail-tagline">{product.tagline}</p>
              <p className="detail-release">
                v{product.version} · Windows 10 and 11 · {product.size}
                {product.web && ' · or in your browser'}
              </p>
            </div>
          </div>

          <div className="store-actions">
            {onPhone && product.web ? (
              <a className="store-btn store-btn-download" href={product.web}>
                <GlobeIcon />
                <span>
                  <span className="store-btn-main">Open it in your browser</span>
                  <span className="store-btn-sub">{product.tryShort}</span>
                </span>
              </a>
            ) : (
              <a className="store-btn store-btn-download" href={product.download}>
                <DownloadIcon />
                <span>
                  <span className="store-btn-main">Download</span>
                  <span className="store-btn-sub">{product.tryShort}</span>
                </span>
              </a>
            )}
            <BuyButton item={product} />
          </div>
          <RegionPicker />
          {product.web && (
            <p className="phone-note">
              {onPhone ? (
                <>
                  <strong>Works on your phone.</strong> {product.name} runs right in your browser, with nothing to
                  install, and your files stay on your phone. One key unlocks it here and in the{' '}
                  <a href={product.download}>Windows app</a>.
                </>
              ) : (
                <>
                  <strong>No Windows computer?</strong>{' '}
                  <a href={product.web}>Use {product.name} in your browser</a>, on any phone or computer. Your files
                  stay on your device, and one key unlocks both.
                </>
              )}
            </p>
          )}
          {onPhone && !product.web && (
            <p className="phone-note">
              <strong>On your phone?</strong> {product.name} runs on Windows computers. Buy now and your key
              and the download link arrive by email, or{' '}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${product.name} for my PC: https://yarpdevelopers.com/store/${product.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                send this page to yourself on WhatsApp
              </a>{' '}
              and open it on your computer to try it free first.
            </p>
          )}
          <StorePromises compact />
        </header>

        <figure className="product-lead-shot">
          <img src={`/assets/store/${product.slug}/${lead.file}`} alt={lead.alt} width={1440} height={900} />
        </figure>

        <p className="product-intro">{product.description}</p>

        {/* The features are what people came to compare, so each gets a card. */}
        <section className="detail-section">
          <h2 className="detail-section-title">What it does</h2>
          <ol className="product-features">
            {product.features.map((f, i) => (
              <li key={f.title} className="product-feature">
                <span className="product-feature-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="product-feature-title">{f.title}</h3>
                <p className="product-feature-text">{f.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* The promise: the reason to buy this over a web tool. */}
        <section className="store-promise">
          <p className="store-promise-line">Your files never leave {product.web ? 'your device' : 'this computer'}.</p>
          <ul className="store-promise-list">
            {product.privacy.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        {more.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-section-title">More screens</h2>
            <div className={`store-shots${more.length > 1 ? ' store-shots-grid' : ''}`}>
              {more.map((shot) => (
                <img key={shot.file} src={`/assets/store/${product.slug}/${shot.file}`} alt={shot.alt} width={1440} height={900} loading="lazy" />
              ))}
            </div>
          </section>
        )}

        <section className="detail-section">
          <h2 className="detail-section-title">How buying works</h2>
          <ol className="store-steps">
            <li>
              <strong>Try it.</strong>{' '}
              {product.web
                ? <>Download it for Windows, or <a href={product.web}>open it in your browser</a> — no payment needed.</>
                : <>Download and install — no payment needed.</>}{' '}
              {product.tryLong}
            </li>
            <li>
              <strong>Buy a licence</strong>{' '}
              ({priceFor(product, region)}, {local ? `paid with ${local.payWith} through Paystack` : 'paid through Stripe'}).
              Your licence key arrives by email a moment later.
            </li>
            <li>
              <strong>Paste the key</strong> into the app’s Licence window. It’s checked on your{' '}
              {product.web ? 'device' : 'computer'}, so it keeps working offline, for good.
              {product.web && ' Bought on this device? The browser version is unlocked for you already.'}
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
                {product.web && (
                  <>
                    {' '}In the browser version, open it once, then turn on airplane mode: you can still open, sign and
                    download PDFs, because it all happens on your phone or computer.
                  </>
                )}
              </p>
            </details>
            {product.web && (
              <details>
                <summary>Can I use it on my phone?</summary>
                <p>
                  Yes. <a href={product.web}>Open {product.name} in your phone’s browser</a>. It works on Android and
                  iPhone, with nothing to install; your browser can add it to your home screen if you like. The same
                  licence key unlocks the browser version and the Windows app. The key, your saved signatures and your
                  profile are kept in that browser, so if you clear your browsing data, paste your key again.
                </p>
              </details>
            )}
            <details>
              <summary>What's free, and what needs a licence?</summary>
              <p>{product.licenseFaq}</p>
            </details>
            <details>
              <summary>Do I get updates?</summary>
              <p>
                Yes, for life. Every new version of {product.name} is free for anyone with a key, and you’ll get an email
                when one comes out. Download it from this page and install it over the old one; your key and your files carry on.
              </p>
            </details>
            <details>
              <summary>Can I use my key on more than one computer?</summary>
              <p>
                Yes, on your own {product.web ? 'devices: your laptop and your phone' : 'computers: your desktop and your laptop'},
                say. Please don’t share it beyond that.
              </p>
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
                Email within 30 days of buying and you’ll get a full refund. It's free to try, so you can check first.
              </p>
            </details>
            <details>
              <summary>Mac or Linux?</summary>
              <p>
                {product.web
                  ? <>The app you install is for Windows, but <a href={product.web}>the browser version</a> runs on a Mac or Linux too.</>
                  : 'Windows only for now.'}
              </p>
            </details>
          </div>
        </section>

        {others.length > 0 && (
          <div className="detail-note">
            <strong>Want {others.map((p) => p.name).join(', ').replace(/, ([^,]*)$/, ' or $1')} too?</strong>{' '}
            {bundle.tagline} {priceFor(bundle, region)} for all of them.{' '}
            <Link href="/store">See all the apps</Link>.
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
