// Round trip: mint a key here with the real signing key, then check it with
// every app's Python verifier. Needs ~/Documents/yarp-signing-key.json and the
// app repos next to this one. Run: npm test (from functions/).

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { issueLicense, licenseForSession } = require("../lib/license");

const keyFile = path.join(os.homedir(), "Documents", "yarp-signing-key.json");
const seed = JSON.parse(fs.readFileSync(keyFile, "utf8")).private_key_b64;
const projects = path.resolve(__dirname, "..", "..", "..", "..");

// `module` is where each app keeps its copy of license.py.
const apps = [
  { dir: path.join(projects, "pdfsign"), id: "pdfsign", module: "app" },
  { dir: path.join(projects, "resume_maker"), id: "resume-maker", module: "app" },
  { dir: path.join(projects, "story_forge"), id: "storyforge", module: "desktop" },
  { dir: path.join(projects, "ink_lifter"), id: "ink-lifter", module: "app" },
];

// The apps' virtualenvs: .venv, or StoryForge's older venv.
function pythonFor(app) {
  for (const name of [".venv", "venv"]) {
    const exe = path.join(app.dir, name, "Scripts", "python.exe");
    if (fs.existsSync(exe)) return exe;
  }
  throw new Error(`No virtualenv in ${app.dir}; run its run.ps1 once.`);
}

function verify(app, key) {
  const script = [
    "import os, sys, tempfile",
    "d = tempfile.mkdtemp()",
    "for k in ('PDFSIGN_DATA','PDFSIGN_DIR','RESUME_DATA','RESUME_OUTPUT','MEDIAGRAB_DATA','MEDIAGRAB_DIR','STORYFORGE_DATA','INKLIFTER_DATA','INKLIFTER_DIR'): os.environ[k] = d",
    "sys.path.insert(0, os.getcwd())",
    `from ${app.module} import license`,
    "try:",
    "    c = license.verify(sys.argv[1]); print('OK', c.product, c.email)",
    "except license.LicenseError as e:",
    "    print('REJECTED', e)",
  ].join("\n");
  return execFileSync(pythonFor(app), ["-c", script, key], { cwd: app.dir })
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
