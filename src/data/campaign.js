// Which ad brought a buyer here, without an ad pixel. Ad links carry UTM tags
// (?utm_source=meta&utm_campaign=ke-launch&utm_content=resume-maker); the tag
// is kept in this browser for a week and sent with the order, which records
// it (functions/index.js). Nothing is sent to Meta or anyone else.

const KEY = 'yarp-campaign';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FIELDS = ['source', 'campaign', 'content'];

// Call on every page load: a tagged link replaces whatever was remembered.
export function rememberCampaign() {
  try {
    const q = new URLSearchParams(window.location.search);
    const tag = Object.fromEntries(FIELDS.map((f) => [f, q.get(`utm_${f}`)]).filter(([, v]) => v));
    if (!tag.campaign) return;
    window.localStorage.setItem(KEY, JSON.stringify({ ...tag, at: Date.now() }));
  } catch { /* storage blocked: the sale just goes untagged */ }
}

// The remembered tag, or undefined once it's a week old.
export function currentCampaign() {
  try {
    const { at, ...tag } = JSON.parse(window.localStorage.getItem(KEY) || 'null') ?? {};
    return at && Date.now() - at < WEEK_MS ? tag : undefined;
  } catch {
    return undefined;
  }
}
