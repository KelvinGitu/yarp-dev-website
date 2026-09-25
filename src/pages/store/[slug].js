import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useSyncExternalStore } from 'react';
import BuyButton from '@/components/BuyButton';
import { Price, useRegion } from '@/components/Region';
import FinalCta from '@/components/store/FinalCta';
import Guarantee from '@/components/store/Guarantee';
import HowItWorks from '@/components/store/HowItWorks';
import PriceCard from '@/components/store/PriceCard';
import ProblemCards from '@/components/store/ProblemCards';
import ProductHero from '@/components/store/ProductHero';
import SectionHead from '@/components/SectionHead';
import Showcase from '@/components/store/Showcase';
import StickyBuyBar from '@/components/store/StickyBuyBar';
import { SUPPORT_EMAIL, bundle, products, productBySlug } from '@/data/products';
import { REGIONS, priceFor } from '@/data/regions';

// Most ad clicks come from phones. An app with a browser version (`web`) sends
// them there; the Windows-only ones explain how to get it onto a computer.
// The answer never changes during a visit, so there's nothing to subscribe to.
const noSubscribe = () => () => {};
const isPhone = () => /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);

// The page is one argument, in order: what you get (hero), what's in your way,
// how the app gets you there, the proof (screens), everything it does, the
// privacy promise, the price, the refund, then questions and a last call.
// Sections whose data a product doesn't have yet are skipped (products.js).
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
  const more = product.shots.slice(1);
  const device = product.web ? 'device' : 'computer';

  return (
    <>
      <Head>
        <title>{`${product.name} for Windows${product.web ? ' and your browser' : ''} · Yarp Developers`}</title>
        <meta
          name="description"
          content={`${product.tagline} Runs on your ${product.web ? 'computer or phone' : 'computer'}; your files never leave it.`}
        />
      </Head>

      <div className="page store-product">
        {cancelled && (
          <p className="detail-note store-cancelled" role="status">
            Checkout was cancelled, and nothing was charged. {product.name} is still yours to download and try.
          </p>
        )}

        <ProductHero product={product} onPhone={onPhone} />

        <p className="product-intro">{product.description}</p>

        {product.problems && <ProblemCards problems={product.problems} />}
        {product.steps && <HowItWorks steps={product.steps} />}

        {product.showcase ? (
          <Showcase product={product} />
        ) : more.length > 0 && (
          <section className="detail-section">
            <SectionHead eyebrow="A closer look" title="More screens" />
            <div className={`store-shots${more.length > 1 ? ' store-shots-grid' : ''}`}>
              {more.map((shot) => (
                <img key={shot.file} src={`/assets/store/${product.slug}/${shot.file}`} alt={shot.alt} width={1440} height={900} loading="lazy" />
              ))}
            </div>
          </section>
        )}

        <section className="detail-section">
          <SectionHead eyebrow="Everything included" title={`Everything ${product.name} does`} />
          <ul className="card-grid">
            {product.features.map((f) => (
              <li key={f.title} className="card-grid-item">
                <h3 className="card-title">{f.title}</h3>
                <p className="card-text">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* The promise: the reason to buy this over a web tool. */}
        <section className="store-promise">
          <p className="store-promise-line">Your files never leave {product.web ? 'your device' : 'this computer'}.</p>
          <ul className="store-promise-list">
            {product.privacy.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        <section className="detail-section store-price" id="buy">
          <SectionHead eyebrow="Price" title="One price, paid once" />
          <div className="store-price-grid">
            <PriceCard
              item={product}
              title={`${product.name} licence`}
              items={[
                ...(product.included ?? product.features.map((f) => f.title)),
                'Every future version, free',
                product.web
                  ? 'One key for the Windows app and the browser version'
                  : 'Use it on your own computers, desktop and laptop',
                'Works with the internet switched off',
                '30-day refund if it doesn’t work for you',
              ]}
            />
            {/* Beside the card: the two things that make saying yes easier. */}
            <div className="store-price-side">
              <Guarantee product={product} />
              {others.length > 0 && (
                <div className="store-bundle-offer">
                  <p>
                    <strong>Want {others.map((p) => p.name).join(', ').replace(/, ([^,]*)$/, ' and $1')} too?</strong>{' '}
                    All four apps, with one licence key that unlocks them all:{' '}
                    <span className="store-bundle-price"><Price product={bundle} /></span>.
                  </p>
                  <BuyButton item={bundle} label="Buy all four" />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="detail-section">
          <SectionHead eyebrow="Buying" title="How buying works" />
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
              <strong>Paste the key</strong> into the app’s Licence window. It’s checked on your {device}, so it
              keeps working offline, for good.
              {product.web && ' Bought on this device? The browser version is unlocked for you already.'}
            </li>
          </ol>
        </section>

        {product.fromDev && (
          <section className="detail-section">
            <SectionHead eyebrow="P.S." title="From the developer" />
            <p className="page-text">{product.fromDev}</p>
          </section>
        )}

        <section className="detail-section">
          <SectionHead eyebrow="Questions" title="Before you buy" />
          <div className="store-faq">
            <details>
              <summary>How can I check that it really doesn’t send my files anywhere?</summary>
              <p>
                Unplug your network cable or turn off wifi: {product.name} works exactly the same. For a closer look, open
                Windows’ Resource Monitor while you use it. Its only connections are to 127.0.0.1, your own computer.
                {product.web && (
                  <>
                    {' '}In the browser version, open it once, then turn on airplane mode: you can still{' '}
                    {product.webOffline}, because it all happens on your phone or computer.
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
                  licence key unlocks the browser version and the Windows app.{product.webNote && ` ${product.webNote}`}{' '}
                  {product.webKeeps}
                </p>
              </details>
            )}
            <details>
              <summary>What’s free, and what needs a licence?</summary>
              <p>{product.licenseFaq}</p>
            </details>
            <details>
              <summary>Windows says “Windows protected your PC”. Is it safe?</summary>
              <p>
                Yes. The installer sets {product.name} up just for you, with no administrator password. Because it
                comes from a small independent developer, Windows may show that blue box the first time: click{' '}
                <strong>More info</strong>, then <strong>Run anyway</strong>. Windows shows it for new programs it
                hasn’t seen many times before, not because anything is wrong with the file.
              </p>
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
                Email within 30 days of buying and you’ll get a full refund. It’s free to try, so you can check first.
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

        <FinalCta product={product} onPhone={onPhone} />

        <div className="detail-back">
          <Link href="/store" className="detail-back-link">← All desktop apps</Link>
          <span className="store-legal">
            <Link href="/store/privacy">Privacy</Link> · <Link href="/store/terms">Licence terms</Link>
          </span>
        </div>
      </div>

      <StickyBuyBar product={product} />
    </>
  );
}

export async function getStaticPaths() {
  return { paths: products.map((p) => ({ params: { slug: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { product: productBySlug(params.slug) } };
}
