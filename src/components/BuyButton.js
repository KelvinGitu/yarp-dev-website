import { useState } from 'react';
import { currentCampaign } from '@/data/campaign';

// Sends the buyer to Stripe Checkout for `item` (a paid products.js entry),
// at the euro price. The session is created by the store function; payment
// details are only ever entered on Stripe's own page.
export default function BuyButton({ item, label = 'Buy a licence', className = '' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function buy() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: item.slug, campaign: currentCampaign() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout isn’t available right now.');
      window.location.assign(data.url);
    } catch (err) {
      setError(`${err.message} Please try again in a minute.`);
      setBusy(false);
    }
  }

  return (
    <div className="buy">
      <button type="button" className={`store-btn store-btn-buy ${className}`} onClick={buy} disabled={busy}>
        {busy ? 'Opening checkout…' : `${label} · ${item.price}`}
      </button>
      {error && <p className="buy-error" role="alert">{error}</p>}
    </div>
  );
}
