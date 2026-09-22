// What the store sells, as the server sees it. The display copy and prices
// live in src/data/products.js; the Stripe price for each product is a
// deploy-time parameter (STRIPE_PRICE_*, see index.js), so the amount charged
// is whatever that Stripe Price says.
//
// `product` ids are what licence keys carry, so they must match APP_ID in each
// app's config.py ("pdfsign", "resume-maker", "mediagrab", "storyforge") and
// license.BUNDLE.

const DOWNLOADS = "https://github.com/KelvinGitu/yarp-downloads/releases/latest/download";

const APPS = {
  pdfsign: {
    name: "pdfsign",
    download: `${DOWNLOADS}/pdfsign-setup.exe`,
    whereIsLicence: "click the key icon at the bottom left, labelled Trial",
  },
  "resume-maker": {
    name: "Resume Maker",
    download: `${DOWNLOADS}/ResumeMaker-setup.exe`,
    whereIsLicence: "click the Trial button at the top right",
  },
  mediagrab: {
    name: "mediagrab",
    download: `${DOWNLOADS}/mediagrab-setup.exe`,
    whereIsLicence: "click the Trial button at the top right",
  },
  storyforge: {
    name: "StoryForge",
    download: `${DOWNLOADS}/StoryForge-setup.exe`,
    whereIsLicence: "click the Trial button at the top right, or open Settings, then Licence & data",
  },
};

const PRODUCTS = {
  pdfsign: { name: "pdfsign", apps: ["pdfsign"] },
  "resume-maker": { name: "Resume Maker", apps: ["resume-maker"] },
  mediagrab: { name: "mediagrab", apps: ["mediagrab"] },
  storyforge: { name: "StoryForge", apps: ["storyforge"] },
  "yarp-bundle": {
    name: "pdfsign, Resume Maker, mediagrab and StoryForge",
    apps: ["pdfsign", "resume-maker", "mediagrab", "storyforge"],
  },
};

module.exports = { APPS, PRODUCTS };
