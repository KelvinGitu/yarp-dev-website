import { DownloadIcon, GlobeIcon, SendIcon } from '@/components/icons';

// A free app's pair of buttons, in place of Buy and Try. On a computer: the
// Windows download first, then the browser version. On a phone, the other way
// round, with an offer to send the page to the visitor's computer.
export default function GetButtons({ product, onPhone }) {
  const download = (
    <a key="download" className={`store-btn${onPhone ? '' : ' store-btn-primary'}`} href={product.download}>
      <DownloadIcon />
      <span>
        <span className="store-btn-main">Download for Windows</span>
        <span className="store-btn-sub">Free · {product.size}</span>
      </span>
    </a>
  );
  const browser = product.web && (
    <a key="web" className={`store-btn${onPhone ? ' store-btn-primary' : ''}`} href={product.web}>
      <GlobeIcon />
      <span>
        <span className="store-btn-main">Open it in your browser</span>
        <span className="store-btn-sub">Free · nothing to install</span>
      </span>
    </a>
  );

  if (!onPhone) return <>{download}{browser}</>;

  const text = `${product.name} for my PC: https://yarpdevelopers.com/store/${product.slug}`;
  const send = (
    <a key="send" className="store-btn" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
      <SendIcon />
      <span>
        <span className="store-btn-main">Send it to your computer</span>
        <span className="store-btn-sub">Free for Windows</span>
      </span>
    </a>
  );
  return <>{browser || null}{send}</>;
}
