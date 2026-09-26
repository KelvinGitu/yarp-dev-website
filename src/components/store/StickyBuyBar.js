import { useEffect, useState } from 'react';

// A slim bar along the bottom once the hero's buttons have scrolled away, so
// the price (or the download) is never more than a tap from wherever the
// reader is. It steps aside while the price card or the final buttons are on
// screen, and it links to the price card rather than starting a checkout of
// its own.
const WATCH = ['store-hero-actions', 'buy', 'store-final'];

export default function StickyBuyBar({ product }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const where = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        where.set(e.target.id, e.isIntersecting ? 'on' : e.boundingClientRect.top < 0 ? 'above' : 'below');
      }
      setShow(where.get('store-hero-actions') === 'above' && ![...where.values()].includes('on'));
    });
    WATCH.map((id) => document.getElementById(id)).filter(Boolean).forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className={`sticky-buy${show ? ' sticky-buy-on' : ''}`} inert={!show}>
      <div className="sticky-buy-inner">
        <img src={`/assets/icons/${product.slug}.png`} alt="" width={32} height={32} />
        <span className="sticky-buy-name">
          {product.name}
          <span className="sticky-buy-price">{product.free ? 'Free' : `${product.price}, paid once`}</span>
        </span>
        <a href="#buy" className="store-btn store-btn-primary">{product.free ? 'Get it' : 'Buy'}</a>
      </div>
    </div>
  );
}
