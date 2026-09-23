// Where the store shows local prices. Everywhere else ('intl') pays each
// product's euro `price` through Stripe.
//
// Display only: functions/pricing.js is what's charged, and a payment that
// doesn't match it exactly gets no key. Change one, change the other.
//
// Local prices are paid through Paystack with mobile money only, so picking
// Kenya from abroad doesn't get anyone the Kenyan price with a foreign card.

export const INTL = 'intl';

// What a visitor sees before they've picked anything, and what every page is
// prebuilt with. A saved choice from the picker always wins. Set to KE while
// Kenyan ads run (so ad visitors never see euros first); INTL otherwise.
export const DEFAULT_REGION = 'KE';

export const REGIONS = {
  KE: {
    name: 'Kenya',
    currency: 'KES',
    // Time zones that mean "probably in this region". The picker covers the rest.
    timeZones: ['Africa/Nairobi'],
    payWith: 'M-Pesa or Airtel Money',
    prices: {
      pdfsign: 350,
      'resume-maker': 1000,
      storyforge: 2500,
      'ink-lifter': 250,
      'yarp-bundle': 3500,
    },
  },
};

export const isRegion = (code) => code === INTL || Object.hasOwn(REGIONS, code);

// The price shown for `product` (a products.js or bundle entry) in `region`.
export function priceFor(product, region) {
  const local = REGIONS[region];
  if (!local) return product.price;
  const amount = local.prices[product.slug];
  return `${local.currency} ${amount.toLocaleString('en-US')}`;
}

// A first guess from the browser's time zone, else DEFAULT_REGION. No
// request, no IP lookup.
export function guessRegion() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hit = Object.entries(REGIONS).find(([, r]) => r.timeZones.includes(zone));
    return hit ? hit[0] : DEFAULT_REGION;
  } catch {
    return DEFAULT_REGION;
  }
}
