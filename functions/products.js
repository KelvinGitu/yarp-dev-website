// What the store sells, as the server sees it. The display copy and prices
// live in src/data/products.js; the Stripe price for each product is a
// deploy-time parameter (STRIPE_PRICE_*, see index.js), so the amount charged
// is whatever that Stripe Price says.
//
// `product` ids are what licence keys carry, so they must match APP_ID in each
// app's app/config.py ("pdfsign", "resume-maker") and license.BUNDLE.

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
};

const PRODUCTS = {
  pdfsign: { name: "pdfsign", apps: ["pdfsign"] },
  "resume-maker": { name: "Resume Maker", apps: ["resume-maker"] },
  "yarp-bundle": { name: "pdfsign and Resume Maker", apps: ["pdfsign", "resume-maker"] },
};

module.exports = { APPS, PRODUCTS };
