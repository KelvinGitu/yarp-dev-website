import { apps } from '@/data/apps';

// The apps whose Firebase Auth emails (verify email, reset password, undo an
// email change) link to /auth/action instead of Firebase's own plain page.
// Firebase adds the sending client's API key to every link, and each platform
// has its own key, so the app is recognised by any of them. Only SHA-256
// hashes are kept here, so this public repo doesn't hold the keys. Calls to
// Auth use the web key, which comes from the build environment: the Android
// and iOS keys may be locked to their apps and refuse a browser.
const AUTH_APPS = [
  {
    slug: 'shopflow',
    webApiKey: process.env.NEXT_PUBLIC_SHOPFLOW_WEB_API_KEY,
    keyHashes: [
      '3e5e595b16c2f5ce61b1eb2b376359eb31bbb3386f908a9dd590c6ff0743ffac', // web
      '038853251dff1dff67b47ed171bc7a8905e86e20ab61e5804ad4455bea72849e', // android
      'a6a90b2484a0adcd5336421aa98e9b52d3c7df2b895308bc91f0f143736d4735', // ios
    ],
    minPasswordLength: 6,
  },
];

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function authAppByApiKey(apiKey) {
  const hash = await sha256(apiKey);
  const auth = AUTH_APPS.find((a) => a.keyHashes.includes(hash));
  if (!auth?.webApiKey) return null;
  return { ...apps.find((a) => a.slug === auth.slug), ...auth };
}
