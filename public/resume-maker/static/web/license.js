/* Licence keys for the browser version: app/license.py's check, ported line
   for line, so a key that unlocks the desktop app unlocks this too. Keep the
   two in step, messages included. functions/test/license.test.js in
   yarp-dev-website checks both against keys minted with the real signing key.

   Keys live in localStorage["yarp.keys"], a list shared by every Yarp web app
   on yarpdevelopers.com, which the store's thank-you page also adds to. A
   bundle key there unlocks them all.

   This file is shared, byte for byte, by every Yarp app's browser version
   (static/web/license.js in each repo), like license.py on the desktop. It
   takes the app's id as an argument and names no app itself; edit one copy,
   copy it to the others. license.test.js checks they're identical. */

import { verifyAsync } from "../vendor/noble-ed25519.js";

export const PREFIX = "YD1";

// The verifying half of the store's signing key; see license.py.
const PUBLIC_KEY_B64 = "4+m3hGVB+4XSZcRfDqvrA1s54ctAkkFi/wrply4Aax4=";

export const BUNDLE = "yarp-bundle";

export const PRODUCT_NAMES = {
  pdfsign: "pdfsign",
  "resume-maker": "Resume Maker",
  mediagrab: "mediagrab",
  storyforge: "StoryForge",
  "ink-lifter": "Ink Lifter",
  [BUNDLE]: "the Yarp bundle",
};

const STORAGE_KEY = "yarp.keys";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Carries a message already phrased for the person reading it. */
export class LicenseError extends Error {}

const b64Bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** Strip what email and copy-paste add, so a key pasted from anywhere still checks. */
export function normalize(key) {
  let upper = (key || "").trim().toUpperCase();
  if (upper.startsWith(PREFIX)) upper = upper.slice(PREFIX.length);
  return upper.replace(/[^A-Z2-7]/g, "");
}

// RFC 4648 base32 without padding. Python's b32decode, given the padding
// back, refuses the same lengths this does.
function base32(body) {
  if ([1, 3, 6].includes(body.length % 8)) throw new Error("bad length");
  const out = new Uint8Array(Math.floor((body.length * 5) / 8));
  let bits = 0;
  let value = 0;
  let i = 0;
  for (const ch of body) {
    value = (value << 5) | ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out[i++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return out;
}

/** The claim a key carries, if it's genuine and for `appId`. Throws LicenseError. */
export async function verify(key, appId) {
  const body = normalize(key);
  if (!body) throw new LicenseError("Paste your licence key first.");
  let blob;
  try {
    blob = base32(body);
  } catch {
    throw new LicenseError("That doesn't look like a licence key. Copy it again from your purchase email.");
  }
  if (blob.length < 2 + 64) {
    throw new LicenseError("That key is too short. Copy the whole key from your purchase email.");
  }

  const size = (blob[0] << 8) | blob[1];
  const payload = blob.subarray(2, 2 + size);
  const signature = blob.subarray(2 + size);
  if (signature.length !== 64) {
    throw new LicenseError("That key is incomplete. Copy the whole key from your purchase email.");
  }

  let genuine = false;
  try {
    // zip215 off: strict RFC 8032, as the Python side checks.
    genuine = await verifyAsync(signature, payload, b64Bytes(PUBLIC_KEY_B64), { zip215: false });
  } catch { /* a malformed signature is simply not genuine */ }
  if (!genuine) {
    throw new LicenseError("That key isn't valid. Check for a typo, or copy it again from your purchase email.");
  }

  let claim;
  try {
    const data = JSON.parse(new TextDecoder().decode(payload));
    if (!("email" in data && "product" in data && "issued" in data)) throw new Error("missing");
    claim = { email: String(data.email), product: String(data.product), issued: String(data.issued) };
  } catch {
    throw new LicenseError("That key is damaged. Copy it again from your purchase email.");
  }

  if (claim.product !== appId && claim.product !== BUNDLE) {
    const other = PRODUCT_NAMES[claim.product] ?? claim.product;
    throw new LicenseError(`That's a key for ${other}, not ${PRODUCT_NAMES[appId]}.`);
  }
  return claim;
}

// ---------------------------------------------------------------- storage

function readKeys() {
  try {
    const keys = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(keys) ? keys.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}

function writeKeys(keys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    throw new LicenseError("This browser won't let the app keep your key. Is it a private window?");
  }
}

/** The first saved key that unlocks `appId`, with its claim; null if none does. */
export async function currentKey(appId) {
  for (const key of readKeys()) {
    try {
      return { key, claim: await verify(key, appId) };
    } catch { /* a key for another app, or damaged: keep looking */ }
  }
  return null;
}

/** Check a key and keep it first in the list. Throws LicenseError. */
export async function addKey(key, appId) {
  const claim = await verify(key, appId);
  const clean = `${PREFIX}-${normalize(key)}`;
  writeKeys([clean, ...readKeys().filter((k) => normalize(k) !== normalize(clean))]);
  return claim;
}

/** Forget every saved key that unlocks `appId`. */
export async function removeKeys(appId) {
  const kept = [];
  for (const key of readKeys()) {
    try {
      await verify(key, appId);
    } catch {
      kept.push(key);
    }
  }
  writeKeys(kept);
}
