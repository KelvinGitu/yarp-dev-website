// Local prices, charged through Paystack. Everywhere else pays the euro price
// through Stripe (STRIPE_PRICE_*, see index.js).
//
// This is what's charged: the browser only says which region it picked, and
// a payment counts only if its amount and currency match this table exactly.
// The display copy lives in src/data/regions.js. Change one, change the other.
//
// Amounts are whole units (KES 1,000 is 1000); Paystack takes them x100.
// Mobile money only, so the region needs a local phone line to pay in, not
// just a card that works anywhere.

const REGIONS = {
  KE: {
    currency: "KES",
    channels: ["mobile_money"],
    prices: {
      pdfsign: 350,
      "resume-maker": 1000,
      storyforge: 2500,
      "ink-lifter": 250,
      "yarp-bundle": 3500,
    },
  },
};

// The price of `product` in `region`, in Paystack's subunits, or null.
function subunitPrice(region, product) {
  const units = REGIONS[region]?.prices[product];
  return units ? units * 100 : null;
}

module.exports = { REGIONS, subunitPrice };
