// What the store sells, as the server sees it. The display copy and prices
// live in src/data/products.js; the Stripe price for each product is a
// deploy-time parameter (STRIPE_PRICE_*, see index.js), so the amount charged
// is whatever that Stripe Price says.
//
// `product` ids are what licence keys carry, so they must match APP_ID in each
// app's config.py ("pdfsign", "resume-maker", "storyforge", "ink-lifter") and license.BUNDLE.

const DOWNLOADS = "https://github.com/KelvinGitu/yarp-downloads/releases/latest/download";
// Each app's store page, which has the download and how to install it. Emails
// link here rather than to the installer itself.
const STORE = "https://yarpdevelopers.com/store";

const APPS = {
  pdfsign: {
    name: "pdfsign",
    page: `${STORE}/pdfsign`,
    download: `${DOWNLOADS}/pdfsign-setup.exe`,
    whereIsLicence: "click the key icon at the bottom left, labelled Unlicensed",
    // The browser version (src/data/products.js `web`); the same key unlocks it.
    web: "https://yarpdevelopers.com/pdfsign",
    whereIsWebLicence: "tap Unlicensed at the end of the toolbar",
  },
  "resume-maker": {
    name: "Resume Maker",
    page: `${STORE}/resume-maker`,
    download: `${DOWNLOADS}/ResumeMaker-setup.exe`,
    whereIsLicence: "click the Unlicensed button at the top right",
    web: "https://yarpdevelopers.com/resume-maker",
    whereIsWebLicence: "tap Unlicensed at the top",
  },
  storyforge: {
    name: "StoryForge",
    page: `${STORE}/storyforge`,
    download: `${DOWNLOADS}/StoryForge-setup.exe`,
    whereIsLicence: "click the Explore button at the top right, or open Settings, then Licence & data",
  },
  "ink-lifter": {
    name: "Ink Lifter",
    page: `${STORE}/ink-lifter`,
    download: `${DOWNLOADS}/InkLifter-setup.exe`,
    whereIsLicence: "click the Unlicensed button at the top right",
    web: "https://yarpdevelopers.com/ink-lifter",
    whereIsWebLicence: "tap Unlicensed at the top",
  },
};

const PRODUCTS = {
  pdfsign: { name: "pdfsign", apps: ["pdfsign"] },
  "resume-maker": { name: "Resume Maker", apps: ["resume-maker"] },
  storyforge: { name: "StoryForge", apps: ["storyforge"] },
  "ink-lifter": { name: "Ink Lifter", apps: ["ink-lifter"] },
  "yarp-bundle": {
    name: "pdfsign, Resume Maker, StoryForge and Ink Lifter",
    apps: ["pdfsign", "resume-maker", "storyforge", "ink-lifter"],
  },
};

module.exports = { APPS, PRODUCTS };
