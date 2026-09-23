// Notify everyone who bought a given app (directly or via a bundle) that a
// new version is out. Hits the live /api/notify-update route, which does the
// actual Firestore lookup and Resend sends — this script is just the trigger.
//
// Usage:
//   ADMIN_NOTIFY_KEY=... node scripts/push-update.js --app storyforge --version 1.1.0 --notes "What's new: ..."
//
// Reusable for any app in functions/products.js (pdfsign, resume-maker,
// storyforge, ink-lifter) — just change --app.

const SITE_URL = process.env.SITE_URL || "https://yarpdevelopers.com";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "";
    args[key] = value;
  }
  return args;
}

async function main() {
  const { app, version, notes } = parseArgs(process.argv.slice(2));
  const adminKey = process.env.ADMIN_NOTIFY_KEY;

  if (!adminKey) {
    console.error("Set ADMIN_NOTIFY_KEY in the environment first (firebase functions:secrets:access ADMIN_NOTIFY_KEY).");
    process.exit(1);
  }
  if (!app || !version) {
    console.error("Usage: node scripts/push-update.js --app <slug> --version <x.y.z> [--notes \"...\"]");
    process.exit(1);
  }

  const res = await fetch(`${SITE_URL}/api/notify-update`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ app, version, notes: notes || "" }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Failed (${res.status}):`, body.error || body);
    process.exit(1);
  }

  console.log(`${app} ${version}: sent ${body.sent}, skipped ${body.skipped}, failed ${body.failed}`);
  if (body.failed) process.exit(1);
}

main();
