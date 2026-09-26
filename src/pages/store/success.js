import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { DownloadIcon } from '@/components/icons';
import { SUPPORT_EMAIL, productBySlug, products } from '@/data/products';

// Where Stripe (?session_id=) returns a buyer. Nothing here is taken on
// trust: the page asks the store function, which checks the order with Stripe,
// whether it's really paid before showing a key.

// The apps a key still unlocks. The bundle (no longer sold) covered all four;
// of those, only the paid ones need a key now. An old receipt for an app that
// has since gone free unlocks nothing, because nothing needs unlocking.
const appsFor = (product) =>
  (product === 'yarp-bundle' ? products : [productBySlug(product)]).filter((p) => p && !p.free);

export default function StoreSuccess() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading'); // loading | paid | pending | error
  const [copied, setCopied] = useState(false);
  const { session_id: sessionId } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    if (!sessionId) { setState('error'); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/order?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 202) { setState('pending'); return; }
        if (!res.ok) throw new Error(data.error || 'lookup failed');
        setOrder(data);
        setState('paid');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [router.isReady, sessionId]);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(order.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* the key is selectable anyway */ }
  }

  // A bundle gets every paid app's download; a single app gets its own.
  const downloads = order ? appsFor(order.product) : [];

  return (
    <>
      <Head>
        <title>Thank you · Yarp Developers</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="store store-success">
        {state === 'loading' && <p className="store-lede">Checking your order with Stripe…</p>}

        {state === 'paid' && order && downloads.length === 0 && (
          <>
            <h1 className="detail-title">Thank you for your order</h1>
            <p className="store-lede">
              The app you bought is free now, so it doesn’t need a licence key any more: download the latest version
              from <Link href="/store">the store</Link> and everything works. Your key was{' '}
              <code>{order.licenseKey}</code>, if you ever need it.
            </p>
          </>
        )}

        {state === 'paid' && order && downloads.length > 0 && (
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
              Stripe is still confirming your payment. Your licence key will arrive by email within a few minutes;
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
