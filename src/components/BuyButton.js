import { useState } from 'react';

// Starts a Stripe Checkout for one product and sends the buyer there. The
// session is created by the store function (/api/checkout); card details are
// only ever entered on Stripe's page.
export default function BuyButton({ product, price, label = 'Buy a licence', className = '' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function buy() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
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
        {busy ? 'Opening checkout…' : `${label} · ${price}`}
      </button>
      {error && <p className="buy-error" role="alert">{error}</p>}
    </div>
  );
}
