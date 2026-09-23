// Paystack, for the local-currency prices in ../pricing.js.
//
// No webhook: the Paystack business's one webhook URL belongs to another app,
// which ignores store payments. Instead the server asks Paystack itself,
// when the buyer comes back (GET /api/order?reference=) and on a schedule for
// anyone who closed the tab (paystackReconcile in index.js).

const { PRODUCTS } = require("../products");
const { REGIONS, subunitPrice } = require("../pricing");
const { cleanCampaign } = require("./campaign");

const API = "https://api.paystack.co";

// Every store payment's reference: yds_<product>_<16 hex>. Other payments on
// the same Paystack business never look like this.
const REFERENCE = /^yds_[a-z-]+_[0-9a-f]{16}$/;

async function call(secretKey, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      // Secrets pasted into Secret Manager tend to pick up a trailing newline.
      Authorization: `Bearer ${secretKey.trim()}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== true) {
    const err = new Error(`Paystack ${method} ${path.split("?")[0]}: ${res.status} ${data.message || ""}`.trim());
    err.status = res.status;
    throw err;
  }
  return data;
}

async function initialize(secretKey, body) {
  return (await call(secretKey, "POST", "/transaction/initialize", body)).data;
}

// The transaction, or null when Paystack doesn't know the reference.
async function verify(secretKey, reference) {
  try {
    return (await call(secretKey, "GET", `/transaction/verify/${encodeURIComponent(reference)}`)).data;
  } catch (err) {
    if (err.status === 400 || err.status === 404) return null;
    throw err;
  }
}

// Every successful transaction since `from` (a Date), across all pages.
async function listSuccessful(secretKey, from) {
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const q = new URLSearchParams({ status: "success", from: from.toISOString(), perPage: "100", page: String(page) });
    const { data, meta } = await call(secretKey, "GET", `/transaction?${q}`);
    all.push(...data);
    if (!meta || page >= (meta.pageCount || 1)) break;
  }
  return all;
}

// Metadata comes back as an object, or as a JSON string when it was sent as one.
function metadataOf(tx) {
  if (tx.metadata && typeof tx.metadata === "object") return tx.metadata;
  try {
    return JSON.parse(tx.metadata || "{}") || {};
  } catch {
    return {};
  }
}

// What the store needs to fulfil a Paystack transaction, or null when it isn't
// a paid store order at exactly the listed price. Nothing here trusts the browser.
function paidOrder(tx) {
  if (!tx || tx.status !== "success" || !REFERENCE.test(tx.reference || "")) return null;
  const meta = metadataOf(tx);
  if (meta.source !== "yarp-store" || !PRODUCTS[meta.product]) return null;
  const region = REGIONS[meta.region];
  if (!region || tx.currency !== region.currency || tx.amount !== subunitPrice(meta.region, meta.product)) return null;
  const email = tx.customer?.email;
  if (!email || !tx.paid_at) return null;
  return {
    email,
    product: meta.product,
    issued: new Date(tx.paid_at).toISOString().slice(0, 10),
    amountTotal: tx.amount,
    currency: tx.currency.toLowerCase(),
    country: meta.region,
    campaign: cleanCampaign(meta.campaign),
    livemode: tx.domain === "live",
    createdAt: new Date(tx.paid_at).toISOString(),
  };
}

module.exports = { REFERENCE, initialize, verify, listSuccessful, paidOrder };
