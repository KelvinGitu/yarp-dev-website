// Which Paystack transactions count as a paid store order. No network, no keys.
// Run: npm test (from functions/).

const assert = require("node:assert/strict");
const { paidOrder } = require("../lib/paystack");

const good = {
  status: "success",
  reference: "yds_resume-maker_0123456789abcdef",
  amount: 100000,
  currency: "KES",
  paid_at: "2026-09-23T10:15:00.000Z",
  domain: "test",
  customer: { email: "buyer@example.com" },
  metadata: { source: "yarp-store", product: "resume-maker", region: "KE" },
};
const tx = (changes) => ({ ...good, ...changes });

const order = paidOrder(good);
assert.equal(order.email, "buyer@example.com");
assert.equal(order.product, "resume-maker");
assert.equal(order.issued, "2026-09-23");
assert.equal(order.currency, "kes");
assert.equal(order.livemode, false);

// Metadata sent as a JSON string comes back as one.
assert.ok(paidOrder(tx({ metadata: JSON.stringify(good.metadata) })));

const rejected = {
  "not paid": tx({ status: "abandoned" }),
  "wrong amount": tx({ amount: 35000 }),
  "wrong currency": tx({ currency: "USD" }),
  "another app's payment": tx({ metadata: { ...good.metadata, source: undefined } }),
  "another app's reference": tx({ reference: "paystack_abc_123" }),
  "unknown product": tx({ metadata: { ...good.metadata, product: "nope" } }),
  "unknown region": tx({ metadata: { ...good.metadata, region: "GH" } }),
  "no email": tx({ customer: {} }),
};
for (const [why, t] of Object.entries(rejected)) {
  assert.equal(paidOrder(t), null, why);
}

console.log("paystack: ok");
