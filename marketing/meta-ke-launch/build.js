// Renders the Meta ad images for the Kenyan launch: one per product, in the
// two sizes Meta asks for (4:5 feed, 9:16 stories and reels). Each ad is an
// HTML page drawn at exact pixel size, then screenshotted by headless Chrome.
//
//   node marketing/meta-ke-launch/build.js
//
// Output: marketing/meta-ke-launch/out/<product>-<feed|story>.png
// Prices come from src/data/regions.js, so re-run after changing them.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(__dirname, "out");
const WORK = path.join(__dirname, ".work");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";

// regions.js is an ES module for the site; read the KES prices out of it.
const regions = fs.readFileSync(path.join(ROOT, "src/data/regions.js"), "utf8");
const kes = (slug) => {
  const m = regions.match(new RegExp(`['"]?${slug}['"]?:\\s*(\\d+)`));
  if (!m) throw new Error(`No KES price for ${slug} in regions.js`);
  return `KES ${Number(m[1]).toLocaleString("en-US")}`;
};

const ADS = [
  {
    slug: "resume-maker",
    name: "Resume Maker",
    shot: "resume-maker/1.webp",
    headline: "A CV that fits on one page, and looks it.",
    lines: ["Seven designs, live preview as you type.", "Exports a clean PDF recruiters can search."],
  },
  {
    slug: "pdfsign",
    name: "pdfsign",
    shot: "pdfsign/1.webp",
    headline: "Sign PDFs without printing a thing.",
    lines: ["Fill in forms, add your signature, save.", "Your documents never leave your computer."],
  },
  {
    slug: "storyforge",
    name: "StoryForge",
    shot: "storyforge/7.webp",
    headline: "Write the book. Keep it yours.",
    lines: ["Chapters, a story bible, daily word goals.", "Export to Word, PDF and EPUB."],
  },
  {
    slug: "ink-lifter",
    name: "Ink Lifter",
    shot: "ink-lifter/1.webp",
    headline: "Your signature, lifted off the paper.",
    lines: ["Snap it with your phone. Get a clean,", "transparent PNG for any document."],
  },
];

const SIZES = {
  feed: { w: 1080, h: 1350 },
  // Stories and reels cover the top ~250px and bottom ~340px with their own UI.
  story: { w: 1080, h: 1920, safeTop: 250, safeBottom: 340 },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function page(ad, size, key) {
  const shot = pathToFileURL(path.join(ROOT, "public/assets/store", ad.shot)).href;
  const icon = pathToFileURL(path.join(ROOT, "public/assets/icons", `${ad.slug}.png`)).href;
  const story = key === "story";
  const padTop = story ? size.safeTop + 30 : 84;
  const padBottom = story ? size.safeBottom + 20 : 0;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=block">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${size.w}px;height:${size.h}px;overflow:hidden}
  body{background:#0A0F1A;color:#E4E9F0;font-family:Inter,system-ui,sans-serif;position:relative}
  .glow{position:absolute;inset:0;background:radial-gradient(900px 700px at 85% ${story ? "62%" : "78%"},rgba(201,168,76,.16),transparent 70%)}
  .copy{position:relative;padding:${padTop}px 84px 0}
  .brand{display:flex;align-items:center;gap:18px;font-size:28px;color:#8792A5;letter-spacing:.02em}
  .brand img{width:64px;height:64px;border-radius:15px;border:1px solid #2A3547}
  .brand b{color:#E4E9F0;font-weight:600}
  h1{margin-top:${story ? 64 : 52}px;font-family:"Space Grotesk",system-ui,sans-serif;font-weight:700;font-size:${story ? 92 : 84}px;line-height:1.04;letter-spacing:-.03em;text-wrap:balance}
  .lines{margin-top:30px;font-size:${story ? 38 : 34}px;line-height:1.45;color:#AAB3C2}
  .deal{margin-top:${story ? 52 : 40}px;display:flex;flex-wrap:wrap;gap:14px}
  .chip{padding:14px 24px;border-radius:999px;font-size:30px;font-weight:600;border:2px solid #2A3547;color:#E4E9F0}
  .chip.price{background:#C9A84C;border-color:#C9A84C;color:#0A0F1A}
  .shot{position:absolute;left:84px;right:-60px;bottom:${padBottom ? padBottom + "px" : "-40px"};
        border-radius:22px 0 0 ${padBottom ? "22px" : "0"};overflow:hidden;border:2px solid #2A3547;border-right:0;
        box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
  .shot img{display:block;width:100%;height:auto}
  .win{position:absolute;top:${padTop}px;right:84px;font-size:24px;color:#8792A5;border:1px solid #2A3547;border-radius:999px;padding:10px 20px}
</style></head><body>
<div class="glow"></div>
<div class="win">Windows PC</div>
<div class="copy">
  <div class="brand"><img src="${icon}" alt=""><span><b>${esc(ad.name)}</b> · Yarp Developers</span></div>
  <h1>${esc(ad.headline)}</h1>
  <p class="lines">${ad.lines.map(esc).join("<br>")}</p>
  <div class="deal">
    <span class="chip price">${kes(ad.slug)} · once</span>
    <span class="chip">Pay with M-Pesa</span>
    <span class="chip">Free to try</span>
  </div>
</div>
<div class="shot"><img src="${shot}" alt=""></div>
</body></html>`;
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(WORK, { recursive: true });
for (const ad of ADS) {
  for (const [key, size] of Object.entries(SIZES)) {
    const html = path.join(WORK, `${ad.slug}-${key}.html`);
    const png = path.join(OUT, `${ad.slug}-${key}.png`);
    fs.writeFileSync(html, page(ad, size, key));
    execFileSync(CHROME, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
      `--window-size=${size.w},${size.h}`, "--virtual-time-budget=6000", "--force-device-scale-factor=1",
      `--screenshot=${png}`, pathToFileURL(html).href,
    ], { stdio: "ignore" });
    console.log(path.relative(ROOT, png));
  }
}
fs.rmSync(WORK, { recursive: true, force: true });
