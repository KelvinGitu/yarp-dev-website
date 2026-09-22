// Round trip: mint a key here with the real signing key, then check it with
// both apps' Python verifiers. Needs ~/Documents/yarp-signing-key.json and the
// app repos next to this one. Run: npm test (from functions/).

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { issueLicense, licenseForSession } = require("../lib/license");

const keyFile = path.join(os.homedir(), "Documents", "yarp-signing-key.json");
const seed = JSON.parse(fs.readFileSync(keyFile, "utf8")).private_key_b64;
const projects = path.resolve(__dirname, "..", "..", "..", "..");

const apps = [
  { dir: path.join(projects, "pdfsign"), id: "pdfsign" },
  { dir: path.join(projects, "resume_maker"), id: "resume-maker" },
];

function verify(app, key) {
  const script = [
    "import os, sys, tempfile",
    "d = tempfile.mkdtemp()",
    "for k in ('PDFSIGN_DATA','PDFSIGN_DIR','RESUME_DATA','RESUME_OUTPUT'): os.environ[k] = d",
    "sys.path.insert(0, os.getcwd())",
    "from app import license",
    "try:",
    "    c = license.verify(sys.argv[1]); print('OK', c.product, c.email)",
    "except license.LicenseError as e:",
    "    print('REJECTED', e)",
  ].join("\n");
  return execFileSync(path.join(app.dir, ".venv", "Scripts", "python.exe"), ["-c", script, key], { cwd: app.dir })
    .toString()
    .trim();
}

let failed = 0;
function expect(label, got, prefix) {
  const ok = got.startsWith(prefix);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${got}`);
}

const session = { created: 1790000000, customer_details: { email: "Buyer@Example.com" }, metadata: { product: "pdfsign" } };
const a = licenseForSession(session, seed).licenseKey;
const b = licenseForSession(session, seed).licenseKey;
expect("same session gives the same key", a === b ? "same" : "different", "same");

for (const app of apps) {
  expect(`${app.id} accepts its own key`, verify(app, issueLicense("buyer@example.com", app.id, "2026-09-22", seed)), `OK ${app.id}`);
  expect(`${app.id} accepts a bundle key`, verify(app, issueLicense("buyer@example.com", "yarp-bundle", "2026-09-22", seed)), "OK yarp-bundle");
  const other = app.id === "pdfsign" ? "resume-maker" : "pdfsign";
  expect(`${app.id} rejects a ${other} key`, verify(app, issueLicense("buyer@example.com", other, "2026-09-22", seed)), "REJECTED");
}
expect("pdfsign accepts a key from a session", verify(apps[0], a), "OK pdfsign buyer@example.com");

console.log(failed ? `${failed} FAILED` : "ALL PASS");
process.exit(failed ? 1 : 0);
