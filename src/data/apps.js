// `version` and `builds` are read straight from each app's pubspec.yaml — the build
// number is the count of releases cut for that app, and the site treats it as data,
// not decoration. Keep them in sync when you ship.
//
// `note` is the one engineering decision, incident, or constraint worth telling.
// `kind` types the note so the reader knows what sort of problem it was.
// `shots` are phone screenshots in public/assets/shots/<slug>/ — 1 to 3, in order.
// `webShots` (optional) are browser screenshots in the same folder, shown wide.
// `status` is 'live' for our apps on Google Play, or 'client' for an app built for
// one company (`client`), which isn't on the store and has no policy pages here.

export const apps = [
  {
    slug: 'sleevr',
    name: 'Sleevr',
    tagline: 'Cross-platform trivia multiplayer game.',
    packageId: 'com.ai.tirvia', // Note the typo com.ai.tirvia per docs
    status: 'live',
    version: '2.23.0',
    builds: 156,
    playUrl: 'https://play.google.com/store/apps/details?id=com.ai.tirvia',
    webUrl: 'https://sleevr.yarpdevelopers.com',
    description: "Cross-platform trivia multiplayer game. AI-curated question database served from Firestore.",
    features: ['Timed MCQ across categories', 'Trivia Trails', 'Guess the Country', 'Real-time leaderboards', 'Achievement system'],
    stack: ['Flutter', 'Firebase', 'Riverpod', 'Go Router', 'AdMob', 'in_app_purchase', 'Rive animations'],
    shots: ['1.webp', '2.webp', '3.webp'],
    note: {
      kind: 'Incident',
      text: 'Google Cloud suspended the project in May 2026. The cause was mine: a Gemini API key compiled into every shipped binary with no application restrictions, extractable by anyone who unpacked the APK. I audited all four keys on the project, rotated and restricted them, scrubbed the history, and documented the whole thing for the appeal. Reinstated a week later.',
    },
    hasAds: true,
    hasPurchases: true,
    hasMic: false,
  },
  {
    slug: 'shopflow',
    name: 'ShopFlow',
    tagline: 'Your complete business management solution',
    packageId: 'small.biz.tool',
    status: 'live',
    version: '1.6.1',
    builds: 43,
    playUrl: 'https://play.google.com/store/apps/details?id=small.biz.tool',
    webUrl: null,
    description: "Built for Kenyan small business owners. Covers inventory, sales, purchases, customer debts, supplier credits, and analytics, with AI-powered insights.",
    features: ['Product catalog + barcode scanning', 'Quick sale entry', 'Debt/credit tracking', 'Business analytics dashboard', 'Multi-business support'],
    stack: ['Flutter', 'Firebase', 'Google Gemini AI', 'RevenueCat'],
    shots: ['1.webp', '2.webp', '3.webp'],
    note: {
      kind: 'Domain',
      text: 'Kenyan shopkeepers sell on credit constantly, so a ledger that only records paid sales is useless to them. Debts and supplier credits are first-class records here, not an afterthought bolted onto a Western point-of-sale model — which changed how stock, revenue, and profit all had to be counted.',
    },
    hasAds: false,
    hasPurchases: true,
    hasMic: false,
  },
  {
    slug: 'three-clues',
    name: 'Three Clues',
    tagline: 'Crossword-style word puzzle game',
    packageId: 'com.hattrick.game',
    status: 'live',
    version: '1.7.2',
    builds: 27,
    playUrl: 'https://play.google.com/store/apps/details?id=com.hattrick.game',
    webUrl: null,
    description: "Crossword-style word puzzle game — three clues, find the answer.",
    features: ['100 progressive levels across 5 difficulty zones', '1,864 unique words with clues', 'Dynamic grid generation', 'Timed challenges', 'Credit-based purchasable reveals'],
    stack: ['Flutter', 'AdMob', 'in_app_purchase'],
    shots: ['1.webp', '2.webp', '3.webp'],
    note: {
      kind: 'Data',
      text: 'The game is only as good as its word list, so the 1,864 words went through a pipeline before shipping: duplicate detection, format normalisation, and an automated pass that scored every clue for quality. Bad clues were cut rather than patched.',
    },
    hasAds: true,
    hasPurchases: true,
    hasMic: false,
  },
  {
    slug: 'days-end',
    name: "Day's End",
    tagline: 'What the world did today.',
    packageId: 'com.global.events',
    status: 'live',
    version: '1.0.0',
    builds: 13,
    playUrl: 'https://play.google.com/store/apps/details?id=com.global.events',
    webUrl: 'https://days-end.yarpdevelopers.com',
    description: "Users log everyday moments (made coffee, skipped the gym, saw a rainbow) and discover how many people worldwide did the same thing. Core hook: you're not alone in your mundane day.",
    features: ['Event browsing and logging', 'Hourly/country counts', 'Coincidence push notifications', 'Shareable moment cards', 'Rewards and subscriptions'],
    stack: ['Flutter', 'Firebase', 'Riverpod', 'Hive', 'AdMob', 'RevenueCat'],
    shots: ['1.webp', '2.webp', '3.webp'],
    note: {
      kind: 'Observability',
      text: 'Counting the same event across every user means a handful of Firestore documents take every write. I built the monitoring before the traffic arrived — dashboards for function p95 and error rate, alerts on write contention in the hot collections, and automatic cleanup of dead FCM tokens so failed pushes stop counting as failures.',
    },
    hasAds: true,
    hasPurchases: true,
    hasMic: false,
  },
  {
    slug: 'lisabem',
    name: 'LISABEM Security',
    tagline: 'Guard attendance, live shift monitoring and panic alerts.',
    packageId: 'com.lisabem.security',
    status: 'client', // built for LISABEM, used by their guards and managers, not on the store
    client: 'LISABEM',
    version: '1.0.0',
    builds: 1,
    playUrl: null,
    webUrl: null, // the manager dashboard is behind a login
    description: "Built for LISABEM, a Kenyan security company. Guards sign in to a shift on their phone at the site, and managers watch who is on duty, late or absent from a phone or the browser. One Flutter app serves both.",
    features: ['Geofenced shift sign-in, checked on the server', 'Live location, only while on shift', 'One-tap panic button', 'QR check-in from a poster or a rotating code', 'Incident reports with photos', 'Weekly and monthly reports, as PDF or CSV'],
    stack: ['Flutter', 'Firebase', 'Cloud Functions', 'Realtime Database', 'Riverpod', 'Google Maps'],
    shots: ['1.webp', '2.webp', '3.webp'],
    webShots: [
      { file: 'web-1.webp', alt: 'Manager dashboard: who is on duty, late or absent, and what needs attention' },
      { file: 'web-2.webp', alt: 'Live map of sites and guards on shift' },
      { file: 'web-3.webp', alt: 'Weekly attendance report with PDF and CSV export' },
    ],
    note: {
      kind: 'Reliability',
      text: "A panic button that fails once is worse than none, and guards work nights at sites with poor signal. The alert is queued on the phone first. If the server hasn't confirmed it within eight seconds, the phone texts the managers itself, and the queued write keeps retrying until it gets through. When it does, every manager gets a push and an alarm that keeps ringing until someone acknowledges it.",
    },
    hasAds: false,
    hasPurchases: false,
    hasMic: false,
  }
];

// Ours, on Google Play (with policy pages and support here), and apps built for clients.
export const storeApps = apps.filter((a) => a.status === 'live');
export const clientApps = apps.filter((a) => a.status === 'client');
