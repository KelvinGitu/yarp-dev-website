// What the store sells, as the server sees it. The display copy and prices
// live in src/data/products.js; the Stripe price for each product is a
// deploy-time parameter (STRIPE_PRICE_*, see index.js), so the amount charged
// is whatever that Stripe Price says.
//
// `product` ids are what licence keys carry, so they must match APP_ID in each
// app's config.py ("storyforge") and license.BUNDLE.
//
// Only StoryForger is sold now. pdfsign, Resume Maker and Ink Lifter went free
// on 2026-09-26 (their licence checks are gone), and the bundle was withdrawn
// with them. Their ids stay in PRODUCTS, not for sale, so that earlier
// receipts (/api/order) and scripts/mint-key.js still recognise them. A bundle
// key still unlocks StoryForger, so update emails for StoryForger reach bundle
// buyers too.

const DOWNLOADS = "https://github.com/KelvinGitu/yarp-downloads/releases/latest/download";
// Each app's store page, which has the download and how to install it. Emails
// link here rather than to the installer itself.
const STORE = "https://yarpdevelopers.com/store";

const APPS = {
  storyforge: {
    name: "StoryForger",
    page: `${STORE}/storyforger`,
    download: `${DOWNLOADS}/StoryForger-setup.exe`,
    whereIsLicence: "click the Explore button at the top right, or open Settings, then Licence & data",
  },
};

const PRODUCTS = {
  storyforge: { name: "StoryForger", apps: ["storyforge"], forSale: true },
  pdfsign: { name: "pdfsign", apps: [] },
  "resume-maker": { name: "Resume Maker", apps: [] },
  "ink-lifter": { name: "Ink Lifter", apps: [] },
  "yarp-bundle": {
    name: "pdfsign, Resume Maker, StoryForger and Ink Lifter",
    apps: ["storyforge"],
  },
};

module.exports = { APPS, PRODUCTS };
