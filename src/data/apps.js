// `version` and `builds` are read straight from each app's pubspec.yaml — the build
// number is the count of releases cut for that app, and the site treats it as data,
// not decoration. Keep them in sync when you ship.
//
// `note` is the one engineering decision, incident, or constraint worth telling.
// `kind` types the note so the reader knows what sort of problem it was.
// `shots` are phone screenshots in public/assets/shots/<slug>/ — 1 to 3, in order.
// `webNote` (optional) is a note under the features about who the web version is for.
// `webShots` (optional) are browser screenshots in the same folder, shown wide.
// Each is 1440 wide; `height` defaults to 764. `webShotsTitle` heads them.
// `status` is 'live' for our apps on Google Play, 'product' for one we sell to
// businesses from the web (not on the store yet), or 'client' for an app built for
// one company (`client`). Only 'live' apps have policy pages here.
// `webLabel` and `ctaText` (optional) word the web button and the closing band.

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
    slug: 'nightpost',
    name: 'Nightpost',
    tagline: 'Guard attendance, live shift monitoring and panic alerts.',
    packageId: 'com.yarpdevelopers.nightpost',
    status: 'product', // ours, sold to security companies on a subscription; not on the store yet
    version: '0.1.0',
    builds: 1,
    playUrl: null,
    webUrl: 'https://nightpost-38d28.web.app', // sign-up and the manager dashboard
    webLabel: 'Start a free trial',
    ctaText: 'Free for 14 days. Sign your company up in the browser, then add your sites and guards.',
    description: "For security companies. Guards sign in to a shift on their phone at the site, and managers watch who is on duty, late or absent from a phone or the browser. A company signs itself up, and one Flutter app serves guards and managers both.",
    features: ['Geofenced shift sign-in, checked on the server', 'Live location, only while on shift', 'One-tap panic button, with push, SMS and a voice call', 'QR check-in at the post', 'Weekly and monthly attendance reports', 'Self-serve sign-up, paid per guard by card or M-Pesa'],
    stack: ['Flutter', 'Firebase', 'Cloud Functions', 'Realtime Database', 'Riverpod', 'Google Maps', 'Paystack', "Africa's Talking"],
    shots: ['1.webp', '2.webp', '3.webp'],
    note: {
      kind: 'Reliability',
      text: "A panic button that fails once is worse than none, and guards work nights at sites with poor signal. The alert is queued on the phone first. If the server hasn't confirmed it within eight seconds, the phone texts the managers itself, and the queued write keeps retrying until it gets through. When it does, every manager gets a push, a text and a phone call, and an alarm that keeps ringing until someone acknowledges it.",
    },
    hasAds: false,
    hasPurchases: false,
    hasMic: false,
  },
  {
    slug: 'lisabem',
    name: 'LISABEM Security',
    tagline: 'Guard attendance, live shift monitoring and panic alerts.',
    packageId: 'com.lisabem.security',
    status: 'client', // built for LISABEM, used by their guards and managers, not on the store
    client: 'LISABEM',
    webNote: "The dashboard is for LISABEM's managers, and LISABEM issues the accounts. Guards use the phone app.",
    version: '1.0.0',
    builds: 1,
    playUrl: null,
    webUrl: 'https://lisabem-security.web.app', // the manager dashboard; accounts are issued by LISABEM
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
  },
  {
    slug: 'solartide',
    name: 'SolarTide',
    tagline: 'Solar installation quotes for installers in Kenya.',
    packageId: 'com.solartide.app',
    status: 'client', // built for a solar installer, who prefers not to be named; anyone can sign up
    client: 'a solar installer',
    version: '2.0.0',
    builds: 5,
    playUrl: null,
    webUrl: 'https://solar-project-6a8a9.web.app',
    webLabel: 'Open the web app',
    description: "For solar installers. Size a system from a client's appliances or monthly units, price every component from your own catalogue, and send the client a PDF quote with your logo and payment details. On Android, iOS and the web.",
    features: ['Client list with call and WhatsApp buttons', 'System sizing from NASA POWER sun data', 'Quotes priced from your own catalogue', 'Markup and 16% VAT worked out for you', 'Client quote and crew components list as PDFs', 'Dashboard of drafts, sent, accepted and installed quotes'],
    stack: ['Flutter', 'Firebase', 'Riverpod', 'NASA POWER API', 'PDF generation'],
    shots: ['1.webp', '2.webp', '3.webp'],
    webShots: [
      { file: 'web-1.webp', alt: 'Home: what was won this month, and quotes by status' },
      { file: 'web-2.webp', alt: 'Quotes, with the open quote in a side panel' },
      { file: 'web-3.webp', alt: 'Pricing one component of a quote from the catalogue' },
    ],
    note: {
      kind: 'Rewrite',
      text: "The 2024 version had 46 hand-written pages, one for each kind of component, and every new item meant another page. The rewrite sorts every catalogue item into one of six kinds (fixed, quantity, length, choice, multi or custom), and one editor shows the right fields for each. All the money arithmetic now lives in one pure, unit-tested calculator, so no screen works out a price on its own.",
    },
    hasAds: false,
    hasPurchases: false,
    hasMic: false,
  },
  {
    slug: 'mywo-sacco',
    name: 'MYWO Sacco',
    tagline: 'Member register, contribution ledger and M-Pesa reconciliation for a sacco.',
    packageId: 'mywo-sacco',
    status: 'client', // built for MYWO's sacco, not launched yet
    client: 'MYWO',
    version: '0.1.0',
    builds: 0,
    playUrl: null,
    webUrl: null,
    description: "Built for MYWO's savings and credit co-operative. Staff run the member register, payments and reminders from the browser, ward representatives follow their members from a phone, and members check their own statement in English or Kiswahili.",
    features: ['Member register, with applications and document review', 'M-Pesa payments matched to members automatically', 'A suspense queue for payments that don’t match', 'Bulk SMS reminders in English and Kiswahili', 'Member portal and USSD for phones without data', 'Loans with guarantors, ready for when the committee switches them on'],
    stack: ['React', 'TypeScript', 'Vite', 'Firebase', 'Cloud Functions', 'M-Pesa Daraja', "Africa's Talking", 'Tailwind'],
    shots: ['1.webp', '2.webp', '3.webp'],
    webShotsTitle: 'The staff side, on a desktop',
    webShots: [
      { file: 'web-1.webp', alt: 'Staff dashboard: collections by month, money held for members, and payments in suspense', height: 900 },
      { file: 'web-2.webp', alt: 'Payments in suspense, each with its best match and a form to assign it', height: 900 },
      { file: 'web-3.webp', alt: 'A member’s profile: fees, share capital, monthly contributions and documents', height: 900 },
    ],
    note: {
      kind: 'Money',
      text: "Sacco contributions used to arrive in the same account as the organisation's membership fees and renewals, and separating them took months of work by hand. Now every payment is tagged to a member and a purpose the moment it arrives, and anything that can't be matched goes to a suspense queue instead of a guess. The ledger is append-only and double-entry, so a mistake is corrected with a reversing entry, and M-Pesa receipt numbers are the record IDs, so a repeated callback can't post twice.",
    },
    hasAds: false,
    hasPurchases: false,
    hasMic: false,
  }
];

// Ours, on Google Play (with policy pages and support here).
export const storeApps = apps.filter((a) => a.status === 'live');
// Ours, on the store or sold from the web; and apps built for one client.
export const ownApps = apps.filter((a) => a.status !== 'client');
export const clientApps = apps.filter((a) => a.status === 'client');
