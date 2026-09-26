import BuyButton from '@/components/BuyButton';
import GetButtons from '@/components/store/GetButtons';
import TryButton from '@/components/store/TryButton';

// The first screen answers the whole question: what you get, what it costs,
// how to have it, and why it's safe to try. Everything below makes the case.
export default function ProductHero({ product, onPhone }) {
  const [lead] = product.shots;

  return (
    <header className="product-hero page-hero">
      <p className="page-eyebrow">
        <img src={`/assets/icons/${product.slug}.png`} alt="" width={36} height={36} />
        <span className="page-eyebrow-name">{product.name}</span>
        <span className="detail-release">
          v{product.version} · Windows 10 and 11{product.web && ' · or in your browser'}
        </span>
      </p>

      <h1 className="page-title">{product.headline ?? product.name}</h1>
      {product.headline && <p className="page-lede">{product.tagline}</p>}

      {product.free ? (
        <p className="store-hero-price">
          <strong>Free</strong>, with every update. No licence key, no account, no ads.
        </p>
      ) : (
        <p className="store-hero-price">
          <strong>{product.price}</strong> paid once, yours for good, with every update
        </p>
      )}

      <div className="store-actions" id="store-hero-actions">
        {product.free ? (
          <GetButtons product={product} onPhone={onPhone} />
        ) : (
          <>
            <BuyButton item={product} className="store-btn-primary" />
            <TryButton product={product} onPhone={onPhone} />
          </>
        )}
      </div>

      <p className="store-trust">
        {product.free ? <span>Free, nothing locked</span> : <span>30-day refund</span>}
        <span>No subscription</span>
        <span>No account</span>
        <span>Works offline</span>
      </p>

      {product.web && (
        <p className="phone-note">
          {onPhone ? (
            <>
              <strong>Works on your phone.</strong> {product.name} runs right in your browser, with nothing to
              install, and your files stay on your phone. There’s a <a href={product.download}>Windows app</a> too.
            </>
          ) : (
            <>
              <strong>No Windows computer?</strong>{' '}
              <a href={product.web}>Use {product.name} in your browser</a>, on any phone or computer. Your files
              stay on your device.
            </>
          )}
        </p>
      )}
      {onPhone && !product.web && (
        <p className="phone-note">
          <strong>On your phone?</strong> {product.name} runs on Windows computers. Buy now and your key and the
          download link arrive by email, or send this page to your computer and try it free there first.
        </p>
      )}

      <figure className="product-lead-shot">
        <img src={`/assets/store/${product.slug}/${lead.file}`} alt={lead.alt} width={1440} height={900} />
      </figure>
    </header>
  );
}
