import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { formatDate, guideBySlug, guides, readingMinutes } from '@/data/guides';
import { apps } from '@/data/apps';
import { productBySlug } from '@/data/products';
import { ADSENSE_CLIENT } from '@/data/studio';

// What the closing box points at: a desktop app in the store (`product`), or
// a mobile app's page (`app`).
function relatedApp(guide) {
  const product = guide.product && productBySlug(guide.product);
  if (product) {
    return {
      slug: product.slug,
      name: product.name,
      text: product.headline ?? product.tagline,
      href: `/store/${product.slug}`,
      cta: product.free ? `See ${product.name}, free →` : `See ${product.name} →`,
    };
  }
  const app = guide.app && apps.find((a) => a.slug === guide.app);
  if (app) {
    return { slug: app.slug, name: app.name, text: app.tagline, href: `/apps/${app.slug}`, cta: `See ${app.name} →` };
  }
  return null;
}

function Block({ block }) {
  if (block.h2) return <h2>{block.h2}</h2>;
  if (block.ul) return <ul>{block.ul.map((item) => <li key={item}>{item}</li>)}</ul>;
  if (block.ol) return <ol className="guide-steps">{block.ol.map((item) => <li key={item}>{item}</li>)}</ol>;
  return <p>{block.p}</p>;
}

export default function Guide({ slug }) {
  const guide = guideBySlug(slug);
  const related = relatedApp(guide);
  const url = `https://yarpdevelopers.com/guides/${guide.slug}`;

  return (
    <>
      <Head>
        <title>{`${guide.title} · Yarp Developers`}</title>
        <meta name="description" content={guide.description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={guide.title} />
        <meta property="og:description" content={guide.description} />
        <meta property="og:url" content={url} />
      </Head>

      {/* AdSense loads here and nowhere else: the guides carry ads, the store doesn't. */}
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <article className="prose guide">
        <p className="detail-section-title"><Link href="/guides">Guides</Link></p>
        <h1>{guide.title}</h1>
        <span className="date">
          {formatDate(guide.date)} · {readingMinutes(guide)} min read · By Kelvin Gitu
        </span>

        {guide.body.map((block, i) => <Block key={i} block={block} />)}

        {related && (
          <aside className="guide-product">
            <img src={`/assets/icons/${related.slug}.png`} alt="" width={40} height={40} />
            <div>
              <p className="guide-product-name">{related.name}</p>
              <p className="guide-product-text">{related.text}</p>
              <Link href={related.href}>{related.cta}</Link>
            </div>
          </aside>
        )}

        <div className="detail-back">
          <Link href="/guides" className="detail-back-link">← All guides</Link>
        </div>
      </article>
    </>
  );
}

export async function getStaticPaths() {
  return { paths: guides.map((g) => ({ params: { slug: g.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { slug: params.slug } };
}
