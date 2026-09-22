// Mints the licence keys the desktop apps check offline (app/license.py in
// pdfsign and resume_maker). Adapted from widgetcast-site's license.ts.
//
//   YD1-<base32 of: uint16 payload length | payload JSON | 64-byte Ed25519 signature>
//
// The apps verify the signature over the payload bytes exactly as they appear
// in the key, then parse the JSON, so the JSON doesn't have to match Python's
// formatting; it's still compact and key-sorted, to keep keys short and stable.
//
// Ed25519 signatures are deterministic: the same claim always gives the same
// key. The issue date comes from the Stripe session, not the clock, so every
// path (the webhook, a webhook retry, the success page) produces the identical
// key for an order without needing a database to remember it.

const { createPrivateKey, sign } = require("node:crypto");

const PREFIX = "YD1";
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 base32, unpadded: Python's base64.b32encode with '=' stripped. */
function base32(bytes) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

/**
 * node:crypto takes Ed25519 keys as DER, not raw seeds, so the 32-byte seed is
 * prefixed with the PKCS#8 header that every Ed25519 private key shares.
 */
function privateKeyFromSeed(seedB64) {
  const seed = Buffer.from(seedB64 || "", "base64");
  if (seed.length !== 32) {
    throw new Error(`YARP_SIGNING_KEY must be a base64 32-byte Ed25519 seed (got ${seed.length} bytes).`);
  }
  const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
  return createPrivateKey({ key: der, format: "der", type: "pkcs8" });
}

/**
 * @param {string} email   the buyer's address, as Stripe collected it
 * @param {string} product "pdfsign" | "resume-maker" | "yarp-bundle"
 * @param {string} issued  YYYY-MM-DD, from the Stripe session
 * @param {string} seedB64 the private half of yarp-signing-key.json
 */
function issueLicense(email, product, issued, seedB64) {
  const claim = { email: email.trim().toLowerCase(), issued, product };
  const payload = Buffer.from(JSON.stringify(claim, ["email", "issued", "product"]), "utf8");
  const signature = sign(null, payload, privateKeyFromSeed(seedB64));
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length);
  const body = base32(Buffer.concat([length, payload, signature]));
  return [PREFIX, ...(body.match(/.{1,8}/g) || [])].join("-");
}

/** The key for a Stripe Checkout session: same session in, same key out. */
function licenseForSession(session, seedB64) {
  const email = session.customer_details?.email || session.customer_email;
  const product = session.metadata?.product;
  const issued = new Date(session.created * 1000).toISOString().slice(0, 10);
  return { email, product, licenseKey: issueLicense(email, product, issued, seedB64) };
}

module.exports = { issueLicense, licenseForSession };
