import { useState } from 'react';
import { useRegion } from '@/components/Region';
import { REGIONS, priceFor } from '@/data/regions';

// Sends the buyer to a checkout page for `item` (a products.js entry or the
// bundle). The session is created by the store function; payment details are
// only ever entered on the payment provider's own page.
//
// Everywhere else: Stripe, at the euro price. In a local-price region
// (regions.js): Paystack mobile money, which needs the email address the
// licence key is sent to before the checkout starts.
export default function BuyButton({ item, label = 'Buy a licence', className = '' }) {
  const { region } = useRegion();
  const local = REGIONS[region];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [asking, setAsking] = useState(false);
  const [email, setEmail] = useState('');

  async function start(endpoint, body) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout isn’t available right now.');
      window.location.assign(data.url);
    } catch (err) {
      setError(`${err.message} Please try again in a minute.`);
      setBusy(false);
    }
  }

  function buy() {
    if (local) setAsking(true);
    else start('/api/checkout', { product: item.slug });
  }

  function payLocally(e) {
    e.preventDefault();
    start('/api/paystack/checkout', { product: item.slug, region, email });
  }

  const price = priceFor(item, region);

  return (
    <div className="buy">
      {!(local && asking) && (
        <button type="button" className={`store-btn store-btn-buy ${className}`} onClick={buy} disabled={busy}>
          {busy ? 'Opening checkout…' : `${label} · ${price}`}
        </button>
      )}
      {local && asking && (
        <form className="buy-local" onSubmit={payLocally}>
          <label className="buy-local-label" htmlFor={`buy-email-${item.slug}`}>
            Your email. The licence key is sent here.
          </label>
          <div className="buy-local-row">
            <input
              id={`buy-email-${item.slug}`}
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button type="submit" className={`store-btn store-btn-buy ${className}`} disabled={busy}>
              {busy ? 'Opening…' : `Pay ${price}`}
            </button>
          </div>
          <p className="buy-local-note">
            Paid with {local.payWith} through Paystack.{' '}
            <button type="button" className="buy-local-cancel" onClick={() => { setAsking(false); setError(''); }} disabled={busy}>
              Cancel
            </button>
          </p>
        </form>
      )}
      {error && <p className="buy-error" role="alert">{error}</p>}
    </div>
  );
}
