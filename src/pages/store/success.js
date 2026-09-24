import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { DownloadIcon } from '@/components/icons';
import { SUPPORT_EMAIL, productBySlug, products } from '@/data/products';

// Where Stripe (?session_id=) and Paystack (?reference=) return a buyer.
// Nothing here is taken on trust: the page asks the store function, which
// checks the order with the payment provider, whether it's really paid before
// showing a key.

// Mobile money can take a little while to confirm after the buyer approves
// it on their phone, so a pending order is asked about again a few times.
const RETRIES = 8;
const RETRY_MS = 4000;

// The apps a product unlocks: the bundle unlocks them all.
const appsFor = (product) =>
  product === 'yarp-bundle' ? products : [productBySlug(product)].filter(Boolean);

// The browser versions of the apps live on this site too, and read their keys
// from this list (web/license.js in each app's repo). Adding the key here
// unlocks them in this browser straight away, even in a tab already open.
function keepKeyForWebApps(order) {
  if (!appsFor(order.product).some((p) => p.web)) return;
  try {
    const same = (k) => k.replace(/[^A-Z2-7]/gi, '').toUpperCase() === order.licenseKey.replace(/[^A-Z2-7]/gi, '').toUpperCase();
    const keys = JSON.parse(window.localStorage.getItem('yarp.keys') || '[]');
    const others = Array.isArray(keys) ? keys.filter((k) => typeof k === 'string' && !same(k)) : [];
    window.localStorage.setItem('yarp.keys', JSON.stringify([order.licenseKey, ...others]));
  } catch { /* storage blocked: the key is on screen and in the email */ }
}

export default function StoreSuccess() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading'); // loading | paid | pending | error
  const [copied, setCopied] = useState(false);
  const { session_id: sessionId, reference } = router.query;
  const provider = reference ? 'Paystack' : 'Stripe';

  useEffect(() => {
    if (!router.isReady) return;
    const query = sessionId
      ? `session_id=${encodeURIComponent(sessionId)}`
      : reference ? `reference=${encodeURIComponent(reference)}` : null;
    if (!query) { setState('error'); return; }
    let cancelled = false;
    let timer;
    const ask = async (tries) => {
      try {
        const res = await fetch(`/api/order?${query}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 202) {
          if (reference && tries < RETRIES) timer = setTimeout(() => ask(tries + 1), RETRY_MS);
          else setState('pending');
          return;
        }
        if (!res.ok) throw new Error(data.error || 'lookup failed');
        keepKeyForWebApps(data);
        setOrder(data);
        setState('paid');
      } catch {
        if (!cancelled) setState('error');
      }
    };
    ask(0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [router.isReady, sessionId, reference]);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(order.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* the key is selectable anyway */ }
  }

  // A bundle gets every download; a single app gets its own.
  const downloads = order ? appsFor(order.product) : [];
  const webApps = downloads.filter((p) => p.web);

  return (
    <>
      <Head>
        <title>Thank you · Yarp Developers</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="store store-success">
        {state === 'loading' && <p className="store-lede">Checking your order with {provider}…</p>}

        {state === 'paid' && order && (
          <>
            <h1 className="detail-title">Thank you. You’re all set.</h1>
            <p className="store-lede">
              Here’s your licence key. It’s also on its way to <strong>{order.email}</strong>, so you have a copy.
            </p>

            <div className="store-key">
              <code className="store-key-value">{order.licenseKey}</code>
              <button type="button" className="store-btn store-btn-download" onClick={copyKey}>
                {copied ? 'Copied' : 'Copy key'}
              </button>
            </div>

            {webApps.length > 0 && (
              <p className="phone-note">
                <strong>Already unlocked in this browser:</strong>{' '}
                {webApps.map((p, i) => (
                  <span key={p.slug}>
                    {i > 0 && ', '}
                    <a href={p.web}>open {p.name}</a>
                  </span>
                ))}{' '}
                and carry on, or go back to the tab you had open. The steps below are for the Windows app.
              </p>
            )}

            <ol className="store-steps">
              <li>
                <strong>Install</strong> the app if you haven’t yet:
                <span className="store-downloads">
                  {downloads.map((p) => (
                    <a key={p.slug} className="detail-btn-legal" href={p.download}>
                      <DownloadIcon /> {p.name} for Windows
                    </a>
                  ))}
                </span>
              </li>
              <li>
                <strong>Open the Licence window</strong>:{' '}
                {downloads.length === 1
                  ? <>{downloads[0].whereIsLicence}.</>
                  : <>{downloads.map((p, i) => (
                      <span key={p.slug}>
                        {i > 0 && (i === downloads.length - 1 ? '; and ' : '; ')}
                        in {p.name}, {p.whereIsLicence}
                      </span>
                    ))}.</>}
              </li>
              <li>
                <strong>Paste the key and click Unlock.</strong> It’s checked on your computer, so it works offline from now on.
              </li>
            </ol>
          </>
        )}

        {state === 'pending' && (
          <>
            <h1 className="detail-title">Payment received, finishing up</h1>
            <p className="store-lede">
              {provider} is still confirming your payment. Your licence key will arrive by email within a few minutes;
              you can close this page.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="detail-title">We couldn’t look up this order</h1>
            <p className="store-lede">
              If you were charged, don’t worry: your licence key is sent by email as soon as the payment is confirmed.
              If it hasn’t arrived within an hour (check your spam folder too), email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we’ll sort it out.
            </p>
          </>
        )}

        <div className="detail-back">
          <Link href="/store" className="detail-back-link">← Desktop apps</Link>
        </div>
      </div>
    </>
  );
}
