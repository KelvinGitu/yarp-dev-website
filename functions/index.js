// The store's server side: one HTTPS function, reached through Firebase
// Hosting's rewrite of /api/** (see firebase.json).
//
//   POST /api/checkout {product}   -> { url } of a Stripe Checkout page
//   POST /api/webhook              <- Stripe; mints and emails the licence key
//   GET  /api/order?session_id=... -> the key, for the success page
//
// The webhook is the source of truth: nothing is granted because a browser
// says so. The success page gets its key by asking Stripe about the session,
// which works whether or not the webhook has landed yet.
//
// Setup and every value below: STORE_SETUP.md.

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");

const { licenseForSession } = require("./lib/license");
const { sendLicense } = require("./lib/email");
const { findOrder, recordOrder } = require("./lib/orders");
const { PRODUCTS } = require("./products");

setGlobalOptions({ region: "europe-west1", maxInstances: 5 });

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
// The private half of yarp-signing-key.json. Anyone holding it can mint keys.
const YARP_SIGNING_KEY = defineSecret("YARP_SIGNING_KEY");
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

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

const stripe = () => new Stripe(STRIPE_SECRET_KEY.value());

exports.api = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, YARP_SIGNING_KEY, RESEND_API_KEY] },
  async (req, res) => {
    const path = req.path.replace(/\/+$/, "");
    try {
      if (path === "/api/checkout" && req.method === "POST") return await checkout(req, res);
      if (path === "/api/webhook" && req.method === "POST") return await webhook(req, res);
      if (path === "/api/order" && req.method === "GET") return await order(req, res);
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

  // Local testing runs on localhost; everything else returns to the real site.
  const origin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.get("origin") || "")
    ? req.get("origin")
    : SITE_URL.value();
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
    metadata: { product },
    payment_intent_data: { metadata: { product } },
    // No custom_text on the Pay button either: Managed Payments doesn't allow it.
    success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${back}?checkout=cancelled`,
  });
  res.json({ url: session.url });
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
  if (!email || !PRODUCTS[product]) {
    // Retrying won't conjure an address or a product, so log loudly instead.
    logger.error("[webhook] session missing email or product", { session: session.id, email, product });
    return;
  }

  // Stripe can deliver an event twice. Don't email the buyer twice.
  const existing = await findOrder(session.id);
  if (existing?.emailed) return;

  await recordOrder(session.id, {
    email,
    product,
    licenseKey,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
    country: session.customer_details?.address?.country ?? null,
    livemode: session.livemode,
    createdAt: new Date(session.created * 1000).toISOString(),
  });

  const result = await sendLicense({
    to: email,
    product,
    licenseKey,
    apiKey: RESEND_API_KEY.value(),
    from: RESEND_FROM.value(),
  });
  if (result === "failed") throw new Error("email not sent");
  await recordOrder(session.id, { emailed: result === "sent", emailedAt: new Date().toISOString() });
  logger.info("[webhook] fulfilled", { session: session.id, product, email: result });
}

// ---------------------------------------------------------------- order lookup

async function order(req, res) {
  res.set("Cache-Control", "no-store");
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
