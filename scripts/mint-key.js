// Mints a licence key by hand — for yourself, a reviewer, a giveaway, or a
// buyer whose order email went missing. Same code the store's webhook uses
// (functions/lib/license.js), so the key is indistinguishable from a sold one.
//
//   node scripts/mint-key.js --email you@example.com --product yarp-bundle
//
// --product: pdfsign | resume-maker | storyforge | ink-lifter | yarp-bundle
//            (yarp-bundle unlocks every app)
// --issued:  YYYY-MM-DD, defaults to today. Keys are deterministic: the same
//            email, product and date always give the same key.
// --key-file: the signing key JSON, defaults to ~/Documents/yarp-signing-key.json
//
// Nothing is recorded or emailed; the key is only printed. It isn't in
// Firestore, so it won't get update emails from push-update.js.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { issueLicense } = require("../functions/lib/license");
const { PRODUCTS } = require("../functions/products");

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
}

const products = Object.keys(PRODUCTS);
const { email, product } = args;
const issued = args.issued || new Date().toISOString().slice(0, 10);
const keyFile = args["key-file"] || path.join(os.homedir(), "Documents", "yarp-signing-key.json");

if (!email || !products.includes(product) || !/^\d{4}-\d{2}-\d{2}$/.test(issued)) {
  console.error(`Usage: node scripts/mint-key.js --email <address> --product <${products.join("|")}> [--issued YYYY-MM-DD]`);
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(keyFile, "utf8")).private_key_b64;
console.log(issueLicense(email, product, issued, seed));
