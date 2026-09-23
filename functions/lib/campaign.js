// The ad tag a buyer arrived with (src/data/campaign.js), kept on the order so
// sales can be traced to an ad without an ad pixel. It comes from the browser,
// so only short, plain values survive.

const FIELDS = ["source", "campaign", "content"];
const VALUE = /^[\w.-]{1,60}$/;

// {source, campaign, content} with only the fields that look right, or null.
function cleanCampaign(raw) {
  if (!raw || typeof raw !== "object") return null;
  const tag = Object.fromEntries(FIELDS.map((f) => [f, raw[f]]).filter(([, v]) => typeof v === "string" && VALUE.test(v)));
  return tag.campaign ? tag : null;
}

// As flat Stripe metadata (values must be strings), and back.
const toStripeMetadata = (tag) => (tag ? Object.fromEntries(Object.entries(tag).map(([k, v]) => [`utm_${k}`, v])) : {});
const fromStripeMetadata = (meta = {}) =>
  cleanCampaign(Object.fromEntries(FIELDS.map((f) => [f, meta[`utm_${f}`]])));

module.exports = { cleanCampaign, toStripeMetadata, fromStripeMetadata };
