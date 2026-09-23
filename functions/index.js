// The store's server side: one HTTPS function, reached through Firebase
// Hosting's rewrite of /api/** (see firebase.json).
//
//   POST /api/checkout {product}      -> { url } of a Stripe Checkout page
//   POST /api/webhook                 <- Stripe; mints and emails the licence key
//   POST /api/paystack/checkout {product, region, email}
//                                     -> { url } of a Paystack page, at the local price (pricing.js)
//   GET  /api/order?session_id=...    -> the key, for the success page (Stripe)
//   GET  /api/order?reference=...     -> the same for Paystack; this also fulfils the order
//   POST /api/notify-update           <- scripts/push-update.js; emails buyers about a new version
//
// plus paystackReconcile, a schedule that fulfils Paystack orders whose buyer
// never made it back to the success page.
//
// Nothing is granted because a browser says so. Stripe's webhook is its source
// of truth; the success page gets its key by asking Stripe about the session,
// which works whether or not the webhook has landed yet. Paystack has no
// webhook here (see lib/paystack.js): every Paystack order is checked with
// Paystack's API, amount and currency included, before a key is minted.
//
// Setup and every value below: STORE_SETUP.md.

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");
const crypto = require("node:crypto");

const { issueLicense, licenseForSession } = require("./lib/license");
const { sendLicense, sendUpdateEmail } = require("./lib/email");
const { findOrder, recordOrder, listOrdersForProducts, markNotified } = require("./lib/orders");
const paystack = require("./lib/paystack");
const { cleanCampaign, toStripeMetadata, fromStripeMetadata } = require("./lib/campaign");
const { PRODUCTS, APPS } = require("./products");
const { REGIONS, subunitPrice } = require("./pricing");

setGlobalOptions({ region: "europe-west1", maxInstances: 5 });

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
// The private half of yarp-signing-key.json. Anyone holding it can mint keys.
const YARP_SIGNING_KEY = defineSecret("YARP_SIGNING_KEY");
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
// Shared secret for the /api/notify-update trigger script — not a per-user
// login, just enough to keep randoms from emailing every buyer.
const ADMIN_NOTIFY_KEY = defineSecret("ADMIN_NOTIFY_KEY");
const PAYSTACK_SECRET_KEY = defineSecret("PAYSTACK_SECRET_KEY");

const RESEND_FROM = defineString("RESEND_FROM", { default: "" });
const SITE_URL = defineString("SITE_URL", { default: "https://yarpdevelopers.com" });
// "true" once Stripe Tax is set up in the dashboard (EU VAT; see STORE_SETUP.md).
const STRIPE_AUTOMATIC_TAX = defineString("STRIPE_AUTOMATIC_TAX", { default: "false" });
const PRICES = {
  pdfsign: defineString("STRIPE_PRICE_PDFSIGN", { default: "" }),
  "resume-maker": defineString("STRIPE_PRICE_RESUME_MAKER", { default: "" }),
  storyforge: defineString("STRIPE_PRICE_STORYFORGE", { default: "" }),
  "ink-lifter": defineString("STRIPE_PRICE_INK_LIFTER", { default: "" }),
  "yarp-bundle": defineString("STRIPE_PRICE_BUNDLE", { default: "" }),
};

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const stripe = () => new Stripe(STRIPE_SECRET_KEY.value());

exports.api = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, YARP_SIGNING_KEY, RESEND_API_KEY, ADMIN_NOTIFY_KEY, PAYSTACK_SECRET_KEY] },
  async (req, res) => {
    const path = req.path.replace(/\/+$/, "");
    try {
      if (path === "/api/checkout" && req.method === "POST") return await checkout(req, res);
      if (path === "/api/webhook" && req.method === "POST") return await webhook(req, res);
      if (path === "/api/paystack/checkout" && req.method === "POST") return await paystackCheckout(req, res);
      if (path === "/api/order" && req.method === "GET") return await order(req, res);
      if (path === "/api/notify-update" && req.method === "POST") return await notifyUpdate(req, res);
      res.status(404).json({ error: "Not found." });
    } catch (err) {
      logger.error("[api] unhandled", { path, err: String(err), stack: err?.stack });
      res.status(500).json({ error: "Something went wrong on our side." });
    }
  },
);

// ---------------------------------------------------------------- checkout

async function checkout(req, res) {
  const product = req.body?.product;
  if (!PRODUCTS[product]) return res.status(400).json({ error: "Unknown product." });
  const price = PRICES[product].value();
  if (!price) return res.status(503).json({ error: "This one isn’t on sale yet." });

  const origin = siteOrigin(req);
  const back = product === "yarp-bundle" ? "/store" : `/store/${product}`;

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    // The licence is delivered to an email address, so one is always collected.
    customer_creation: "always",
    allow_promotion_codes: true,
    // Only sent when switched on: with Stripe Managed Payments (Stripe as the
    // merchant of record, handling VAT) the parameter must be left out, and
    // leaving it out is the same as off otherwise.
    ...(STRIPE_AUTOMATIC_TAX.value() === "true" ? { automatic_tax: { enabled: true } } : {}),
    metadata: { product, ...toStripeMetadata(cleanCampaign(req.body?.campaign)) },
    payment_intent_data: { metadata: { product } },
    // No custom_text on the Pay button either: Managed Payments doesn't allow it.
    success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${back}?checkout=cancelled`,
  });
  res.json({ url: session.url });
}

// Local testing runs on localhost; everything else returns to the real site.
function siteOrigin(req) {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.get("origin") || "")
    ? req.get("origin")
    : SITE_URL.value();
}

// ---------------------------------------------------------------- paystack checkout

// A local-price checkout (pricing.js). The browser picks the region; the price
// is looked up here, and checked again against Paystack before any key is minted.
async function paystackCheckout(req, res) {
  const product = req.body?.product;
  const region = req.body?.region;
  const email = String(req.body?.email || "").trim();
  if (!PRODUCTS[product]) return res.status(400).json({ error: "Unknown product." });
  const amount = subunitPrice(region, product);
  if (!amount) return res.status(400).json({ error: "That price isn’t available." });
  if (email.length > 200 || !EMAIL.test(email)) {
    return res.status(400).json({ error: "That email address doesn’t look right." });
  }

  const { currency, channels } = REGIONS[region];
  const origin = siteOrigin(req);
  const back = product === "yarp-bundle" ? "/store" : `/store/${product}`;
  const tx = await paystack.initialize(PAYSTACK_SECRET_KEY.value(), {
    email,
    amount,
    currency,
    channels,
    reference: `yds_${product}_${crypto.randomBytes(8).toString("hex")}`,
    // Paystack adds ?reference=...&trxref=... when it sends the buyer back.
    callback_url: `${origin}/store/success`,
    metadata: {
      source: "yarp-store",
      product,
      region,
      campaign: cleanCampaign(req.body?.campaign),
      // Where Paystack's Cancel link goes, like Stripe's cancel_url.
      cancel_action: `${origin}${back}?checkout=cancelled`,
      custom_fields: [{ display_name: "Product", variable_name: "product", value: PRODUCTS[product].name }],
    },
  });
  res.json({ url: tx.authorization_url });
}

// ---------------------------------------------------------------- webhook

async function webhook(req, res) {
  let event;
  try {
    event = stripe().webhooks.constructEvent(req.rawBody, req.get("stripe-signature"), STRIPE_WEBHOOK_SECRET.value());
  } catch (err) {
    logger.warn("[webhook] bad signature", { err: String(err) });
    return res.status(400).send("Invalid signature");
  }

  // Card payments complete at once. Slower methods (bank transfers, some
  // wallets) complete later, and then the second event is the one that counts.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      try {
        await fulfill(session);
      } catch (err) {
        // A non-2xx makes Stripe retry, which is right for a transient failure.
        // Keys are derived from the session, so a retry sends the same key.
        logger.error("[webhook] fulfilment failed", { session: session.id, err: String(err) });
        return res.status(500).send("Fulfilment failed");
      }
    }
  }
  res.json({ received: true });
}

async function fulfill(session) {
  const { email, product, licenseKey } = licenseForSession(session, YARP_SIGNING_KEY.value());
  await fulfillOrder(session.id, {
    email,
    product,
    licenseKey,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
    country: session.customer_details?.address?.country ?? null,
    livemode: session.livemode,
    provider: "stripe",
    campaign: fromStripeMetadata(session.metadata),
    createdAt: new Date(session.created * 1000).toISOString(),
  });
}

// Records and emails one order's key, once. `orderId` is the Stripe session id
// or the Paystack reference; the rest is the audit copy in store_orders.
// `mustRecord` is for callers that come back again and again: without a
// record there's no "already emailed", so they'd email on every visit.
async function fulfillOrder(orderId, order, { mustRecord = false } = {}) {
  const { email, product, licenseKey } = order;
  if (!email || !PRODUCTS[product]) {
    // Retrying won't conjure an address or a product, so log loudly instead.
    logger.error("[fulfil] order missing email or product", { orderId, email, product });
    return;
  }

  // An order can be fulfilled more than once (a repeated Stripe event, a
  // second visit to the success page, the Paystack reconcile). Email once.
  const existing = await findOrder(orderId);
  if (existing?.emailed) return;

  if (!(await recordOrder(orderId, order)) && mustRecord) throw new Error("order not recorded");

  const result = await sendLicense({
    to: email,
    product,
    licenseKey,
    apiKey: RESEND_API_KEY.value(),
    from: RESEND_FROM.value(),
  });
  if (result === "failed") throw new Error("email not sent");
  await recordOrder(orderId, { emailed: result === "sent", emailedAt: new Date().toISOString() });
  logger.info("[fulfil] fulfilled", { orderId, product, email: result });
}

// A Paystack order, checked with Paystack: the order to fulfil, "pending"
// while the buyer is still paying, or null if it isn't a paid store order.
async function paystackOrder(reference) {
  const tx = await paystack.verify(PAYSTACK_SECRET_KEY.value(), reference);
  if (!tx) return null;
  if (["ongoing", "pending", "processing", "queued"].includes(tx.status)) return "pending";
  const paid = paystack.paidOrder(tx);
  if (!paid) {
    if (tx.status === "success") logger.error("[paystack] paid but not a valid store order", { reference, amount: tx.amount, currency: tx.currency });
    return null;
  }
  const { issued, ...details } = paid;
  return {
    ...details,
    licenseKey: issueLicense(paid.email, paid.product, issued, YARP_SIGNING_KEY.value()),
    provider: "paystack",
  };
}

// ---------------------------------------------------------------- order lookup

async function order(req, res) {
  res.set("Cache-Control", "no-store");
  if (req.query.reference) return await paystackOrderLookup(req, res);
  const id = String(req.query.session_id || "");
  if (!SESSION_ID.test(id)) return res.status(400).json({ error: "That isn’t an order reference." });

  let session;
  try {
    session = await stripe().checkout.sessions.retrieve(id);
  } catch {
    return res.status(404).json({ error: "No such order." });
  }
  if (session.payment_status !== "paid") return res.status(202).json({ status: "pending" });

  const { email, product, licenseKey } = licenseForSession(session, YARP_SIGNING_KEY.value());
  if (!email || !PRODUCTS[product]) return res.status(404).json({ error: "No such order." });
  res.json({ email, product, licenseKey });
}

// Paystack has no webhook here, so the buyer's return to the success page is
// what fulfils the order; paystackReconcile catches anyone who never returns.
async function paystackOrderLookup(req, res) {
  const reference = String(req.query.reference);
  if (!paystack.REFERENCE.test(reference)) return res.status(400).json({ error: "That isn’t an order reference." });

  const order = await paystackOrder(reference);
  if (order === "pending") return res.status(202).json({ status: "pending" });
  if (!order) return res.status(404).json({ error: "No such order." });

  // The key is shown on the page either way; a failed email is retried by
  // the reconcile schedule.
  try {
    await fulfillOrder(reference, order);
  } catch (err) {
    logger.error("[order] paystack fulfilment failed", { reference, err: String(err) });
  }
  res.json({ email: order.email, product: order.product, licenseKey: order.licenseKey });
}

// ---------------------------------------------------------------- paystack reconcile

// Fulfils recent Paystack orders that nobody has fulfilled yet: the buyer paid
// on their phone and closed the tab, or the success page's email failed.
// Orders already emailed are skipped by fulfillOrder, so each run is cheap.
exports.paystackReconcile = onSchedule(
  { schedule: "every 15 minutes", secrets: [PAYSTACK_SECRET_KEY, YARP_SIGNING_KEY, RESEND_API_KEY] },
  async () => {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    // Payments from the last few minutes are left to the success page the
    // buyer is probably looking at, so the two don't both send an email.
    const settled = Date.now() - 5 * 60 * 1000;
    const txs = await paystack.listSuccessful(PAYSTACK_SECRET_KEY.value(), since);
    let fulfilled = 0;
    let failed = 0;
    for (const tx of txs) {
      if (!paystack.REFERENCE.test(tx.reference || "")) continue; // another app's payment
      if (new Date(tx.paid_at).getTime() > settled) continue;
      if ((await findOrder(tx.reference))?.emailed) continue;
      // Check it the same way the success page does, amount and all.
      const order = await paystackOrder(tx.reference);
      if (!order || order === "pending") continue;
      try {
        await fulfillOrder(tx.reference, order, { mustRecord: true });
        fulfilled++;
      } catch (err) {
        logger.error("[reconcile] fulfilment failed", { reference: tx.reference, err: String(err) });
        failed++;
      }
    }
    logger.info("[reconcile] done", { checked: txs.length, fulfilled, failed });
  },
);

// ---------------------------------------------------------------- notify update

// Emails everyone who owns `app` (bought it directly, or via a bundle that
// includes it) that a new version is out. Triggered by scripts/push-update.js,
// not by anything in the browser.
async function notifyUpdate(req, res) {
  const key = req.get("x-admin-key") || "";
  const want = ADMIN_NOTIFY_KEY.value();
  const authorized = want.length > 0 && key.length === want.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(want));
  if (!authorized) return res.status(401).json({ error: "Not authorized." });

  const app = req.body?.app;
  const version = String(req.body?.version || "");
  const notes = req.body?.notes ? String(req.body.notes) : "";
  if (!APPS[app]) return res.status(400).json({ error: "Unknown app." });
  if (!version) return res.status(400).json({ error: "Missing version." });

  const products = Object.keys(PRODUCTS).filter((p) => PRODUCTS[p].apps.includes(app));
  const orders = await listOrdersForProducts(products);

  const seen = new Set();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const order of orders) {
    if (!order.email || seen.has(order.email)) { skipped++; continue; }
    if ((order.notifiedVersions || []).includes(version)) { skipped++; continue; }
    seen.add(order.email);

    const result = await sendUpdateEmail({
      to: order.email,
      app,
      version,
      notes,
      apiKey: RESEND_API_KEY.value(),
      from: RESEND_FROM.value(),
    });
    if (result === "sent") {
      await markNotified(order.id, version);
      sent++;
    } else {
      logger.error("[notify-update] not sent", { to: order.email, app, version, result });
      failed++;
    }
  }
  logger.info("[notify-update] done", { app, version, sent, skipped, failed });
  res.json({ sent, skipped, failed });
}
