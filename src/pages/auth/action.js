import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AppIcon from '@/components/AppIcon';
import { CheckIcon, PlayIcon } from '@/components/icons';
import { authAppByApiKey } from '@/data/authApps';
import { SUPPORT_EMAIL } from '@/data/products';

// Where an app's Firebase Auth emails land (set as the custom action URL in
// the app's Firebase console). Firebase sends ?mode=&oobCode=&apiKey=; the page
// talks to Identity Toolkit's REST API directly, so the site doesn't carry the
// Firebase SDK for one page.

const IDENTITY = 'https://identitytoolkit.googleapis.com/v1/accounts';

async function identity(app, method, body) {
  const res = await fetch(`${IDENTITY}:${method}?key=${app.webApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  // Errors come back as e.g. "WEAK_PASSWORD : Password should be at least 6 characters".
  if (!res.ok) throw new Error((data.error?.message || 'UNKNOWN').split(' ')[0]);
  return data;
}

// The code is spent or out of date: the only fix is a fresh email from the app.
const DEAD_LINK = ['EXPIRED_OOB_CODE', 'INVALID_OOB_CODE'];

function failureText(code) {
  if (DEAD_LINK.includes(code)) return 'This link has expired or has already been used. Links work once and only for a short while.';
  if (code === 'USER_DISABLED') return 'This account has been disabled.';
  if (code === 'EMAIL_NOT_FOUND') return 'There is no account for this email any more.';
  if (code === 'TOO_MANY_ATTEMPTS_TRY_LATER') return 'Too many attempts. Wait a few minutes and try again.';
  return 'Something went wrong. Check your connection and try again.';
}

export default function AuthAction() {
  const router = useRouter();
  const { mode, oobCode, apiKey } = router.query;
  const app = apiKey ? authAppByApiKey(apiKey) : null;

  // checking | verified | emailChanged | resetForm | resetDone | recovered | failed
  const [state, setState] = useState('checking');
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    (async () => {
      try {
        if (!app || !oobCode) {
          throw new Error('INVALID_OOB_CODE');
        } else if (mode === 'verifyEmail') {
          await identity(app, 'update', { oobCode });
          if (!cancelled) setState('verified');
        } else if (mode === 'verifyAndChangeEmail') {
          await identity(app, 'update', { oobCode });
          if (!cancelled) setState('emailChanged');
        } else if (mode === 'resetPassword') {
          // Only checks the code and says whose password it is; nothing changes yet.
          const data = await identity(app, 'resetPassword', { oobCode });
          if (!cancelled) { setEmail(data.email); setState('resetForm'); }
        } else if (mode === 'recoverEmail') {
          const data = await identity(app, 'resetPassword', { oobCode });
          await identity(app, 'update', { oobCode });
          if (!cancelled) { setEmail(data.email); setState('recovered'); }
        } else {
          throw new Error('INVALID_OOB_CODE');
        }
      } catch (e) {
        if (!cancelled) { setError(e.message); setState('failed'); }
      }
    })();
    return () => { cancelled = true; };
    // `app` is derived from apiKey, so apiKey stands in for it here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, mode, oobCode, apiKey]);

  const name = app?.name ?? 'Yarp Developers';

  return (
    <>
      <Head>
        <title>{`${name} account · Yarp Developers`}</title>
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="no-referrer" />
      </Head>

      <div className="auth-action">
        <div className="auth-card">
          {app && (
            <div className="auth-app">
              <div className="project-icon"><AppIcon slug={app.slug} name={app.name} /></div>
              <span>{app.name}</span>
            </div>
          )}

          {state === 'checking' && <p className="auth-text" role="status">Checking your link…</p>}

          {state === 'verified' && (
            <Done app={app} title="Your email is verified">
              Thanks for confirming. Head back to {name} and carry on where you left off.
            </Done>
          )}

          {state === 'emailChanged' && (
            <Done app={app} title="Your email has been changed">
              Use your new email the next time you sign in to {name}.
            </Done>
          )}

          {state === 'resetForm' && (
            <ResetForm app={app} oobCode={oobCode} email={email} onDone={() => setState('resetDone')} />
          )}

          {state === 'resetDone' && (
            <Done app={app} title="Your password has been changed">
              Open {name} and sign in with <strong>{email}</strong> and your new password.
            </Done>
          )}

          {state === 'recovered' && <Recovered app={app} email={email} />}

          {state === 'failed' && (
            <>
              <h1 className="auth-title">This link didn’t work</h1>
              <p className="auth-text">{failureText(error)}</p>
              {DEAD_LINK.includes(error) && (
                <p className="auth-text">
                  Open {name} and ask for a new one: <em>Forgot password?</em> on the sign-in screen for a
                  password link, or <em>Verify</em> in Account settings for a verification email.
                </p>
              )}
              <p className="auth-help">
                Still stuck? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Done({ app, title, children }) {
  return (
    <>
      <div className="auth-tick"><CheckIcon /></div>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-text">{children}</p>
      <p className="auth-help">You can close this tab.</p>
      {app?.playUrl && (
        <a className="auth-get" href={app.playUrl} target="_blank" rel="noopener noreferrer">
          <PlayIcon /> Don’t have {app.name} on this phone? Get it on Google Play
        </a>
      )}
    </>
  );
}

function ResetForm({ app, oobCode, email, onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const tooShort = password.length < app.minPasswordLength;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(e) {
    e.preventDefault();
    if (tooShort || confirm !== password) return;
    setSaving(true);
    setError(null);
    try {
      await identity(app, 'resetPassword', { oobCode, newPassword: password });
      onDone();
    } catch (err) {
      setError(err.message === 'WEAK_PASSWORD'
        ? `Use at least ${app.minPasswordLength} characters.`
        : failureText(err.message));
      setSaving(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <h1 className="auth-title">Choose a new password</h1>
      <p className="auth-text">For <strong>{email}</strong></p>

      {/* Lets password managers save the new password against the right account. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />

      <label className="auth-field">
        <span>New password</span>
        <div className="auth-input">
          <input
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            aria-describedby="pw-rule"
          />
          <button type="button" className="auth-show" onClick={() => setShow((s) => !s)}>
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <small id="pw-rule" className={password && tooShort ? 'auth-bad' : undefined}>
          At least {app.minPasswordLength} characters
        </small>
      </label>

      <label className="auth-field">
        <span>Type it again</span>
        <div className="auth-input">
          <input
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {mismatch && <small className="auth-bad">The passwords don’t match</small>}
      </label>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <button
        type="submit"
        className="store-btn store-btn-primary auth-submit"
        disabled={saving || tooShort || confirm !== password}
      >
        {saving ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}

// Someone changed this account's email and the owner clicked "undo" in the
// warning sent to the old address. The email is back; the password may not be safe.
function Recovered({ app, email }) {
  const [sent, setSent] = useState('idle'); // idle | sending | sent | failed

  async function sendReset() {
    setSent('sending');
    try {
      await identity(app, 'sendOobCode', { requestType: 'PASSWORD_RESET', email });
      setSent('sent');
    } catch {
      setSent('failed');
    }
  }

  return (
    <>
      <div className="auth-tick"><CheckIcon /></div>
      <h1 className="auth-title">Your email is back to {email}</h1>
      <p className="auth-text">
        If you didn’t change it yourself, someone else may know your password. Reset it now to lock them out.
      </p>
      {sent === 'sent' ? (
        <p className="auth-text" role="status">Done: check {email} for a reset link.</p>
      ) : (
        <button type="button" className="store-btn store-btn-primary auth-submit" onClick={sendReset} disabled={sent === 'sending'}>
          {sent === 'sending' ? 'Sending…' : 'Send me a password reset email'}
        </button>
      )}
      {sent === 'failed' && <p className="auth-error" role="alert">Couldn’t send it. Try again in a minute.</p>}
    </>
  );
}
