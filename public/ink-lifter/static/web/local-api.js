/* The browser version's stand-in for Ink Lifter's local server
   (app/main.py). app.js's api() hands every request here in web mode, and
   gets back the same shapes and messages the server would give. When a
   route in main.py changes, change it here too.

   The server only ever checked the licence and wrote "Export all" into a
   folder; in a browser, images are downloaded or shared instead (app.js),
   so all that's left is the licence, kept in the shared list web/license.js
   manages. Nothing leaves the browser. */

import * as license from "./license.js";

const APP_ID = "ink-lifter";
const VERSION = document.documentElement.dataset.version || "dev";
const STORE_URL = new URL("/store/ink-lifter", location.origin).href;
const NEEDS_LICENSE = "Enter a licence key to save or export images. Opening and previewing keep working.";

const fail = (status, detail) => Object.assign(new Error(detail), { status });

async function licenseStatus() {
  const claim = (await license.currentKey(APP_ID))?.claim;
  return {
    licensed: Boolean(claim),
    email: claim?.email ?? null,
    product: claim?.product ?? null,
    issued: claim?.issued ?? null,
    store_url: STORE_URL,
    version: VERSION,
  };
}

async function setKey({ key }) {
  try {
    await license.addKey(key, APP_ID);
  } catch (err) {
    throw fail(400, err.message);
  }
  return licenseStatus();
}

async function consume() {
  const status = await licenseStatus();
  if (!status.licensed) throw fail(402, NEEDS_LICENSE);
  return status;
}

export default async function localApi(method, path, body = {}) {
  switch (`${method} ${path}`) {
    case "GET /api/health": return { output_dir: "" };
    case "GET /api/license": return licenseStatus();
    case "POST /api/license": return setKey(body);
    case "DELETE /api/license": await license.removeKeys(APP_ID); return licenseStatus();
    case "POST /api/license/consume": return consume();
  }
  throw fail(404, "That needs the Ink Lifter desktop app.");
}
