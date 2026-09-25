import { DownloadIcon, GlobeIcon, SendIcon } from '@/components/icons';

// The second button next to Buy: whatever lets this visitor try the app free.
// On a phone, an app with a browser version (`web`) opens there; a Windows-only
// one offers to send the page to the visitor's computer over WhatsApp.
export default function TryButton({ product, onPhone }) {
  if (onPhone && product.web) {
    return (
      <a className="store-btn" href={product.web}>
        <GlobeIcon />
        <span>
          <span className="store-btn-main">Try it in your browser</span>
          <span className="store-btn-sub">{product.tryShort}</span>
        </span>
      </a>
    );
  }

  if (onPhone) {
    const text = `${product.name} for my PC: https://yarpdevelopers.com/store/${product.slug}`;
    return (
      <a className="store-btn" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        <SendIcon />
        <span>
          <span className="store-btn-main">Send it to your computer</span>
          <span className="store-btn-sub">Try it free on Windows</span>
        </span>
      </a>
    );
  }

  return (
    <a className="store-btn" href={product.download}>
      <DownloadIcon />
      <span>
        <span className="store-btn-main">Try it free</span>
        <span className="store-btn-sub">{product.tryShort}</span>
      </span>
    </a>
  );
}
