import { apps } from '@/data/apps';

// The apps whose Firebase Auth emails (verify email, reset password, undo an
// email change) link to /auth/action instead of Firebase's own plain page.
// Firebase adds the sending client's API key to every link, and each platform
// has its own key, so all of them are listed to recognise the app. Calls to
// Auth always use the web key: the Android and iOS keys may be locked to
// their apps and refuse a browser.
const AUTH_APPS = [
  {
    slug: 'shopflow',
    webApiKey: 'AIzaSyDwtDv3_fr0YGYwNACG7V8ymC1dyBesyrQ',
    apiKeys: [
      'AIzaSyDwtDv3_fr0YGYwNACG7V8ymC1dyBesyrQ', // web
      'AIzaSyBTe_ClCURRvlukWSZjPakpvw1JNL1exkc', // android
      'AIzaSyC9SB-8d6yeoAG_rKz5nXOCib95x3-7DRk', // ios
    ],
    minPasswordLength: 6,
  },
];

export function authAppByApiKey(apiKey) {
  const auth = AUTH_APPS.find((a) => a.apiKeys.includes(apiKey));
  if (!auth) return null;
  return { ...apps.find((a) => a.slug === auth.slug), ...auth };
}
