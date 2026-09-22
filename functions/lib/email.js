// Delivery: the one step that has to work after a purchase. The buyer's
// licence key reaches them here, or on the success page, or not at all.
// Sent through Resend's HTTP API with plain fetch, so there's no SDK to keep up.

const logger = require("firebase-functions/logger");

const { APPS, PRODUCTS } = require("../products");

const SUPPORT = "yarpdevelopers@gmail.com";

function licenceEmail(product, licenseKey) {
  const bought = PRODUCTS[product];
  const apps = bought.apps.map((id) => APPS[id]);
  const lines = [
    `Thank you for buying ${bought.name}.`,
    "",
    "Your licence key:",
    "",
    `    ${licenseKey}`,
    "",
    "To unlock:",
    "",
    ...apps.flatMap((app) => [
      `  ${app.name}: open it, ${app.whereIsLicence}, paste the key and click Unlock.`,
      `  Not installed yet? Download it here: ${app.download}`,
      "",
    ]),
    "The key is checked on your computer, so it keeps working offline, and on any computer of your own.",
    "Keep this email: it's your copy of the key.",
    "",
    `Questions, or a refund within 30 days: reply to this email or write to ${SUPPORT}.`,
    "",
    "Kelvin Gitu",
    "Yarp Developers",
  ];
  return { subject: `Your ${bought.name} licence key`, text: lines.join("\n") };
}

/**
 * @returns {Promise<"sent" | "disabled" | "failed">} "disabled" means email
 * isn't configured (the key is logged instead); "failed" is worth a retry.
 */
async function sendLicense({ to, product, licenseKey, apiKey, from }) {
  const { subject, text } = licenceEmail(product, licenseKey);
  if (!apiKey || !from) {
    // Loud: a silent failure here means someone paid and got nothing by email.
    logger.error("[email] RESEND_API_KEY/RESEND_FROM not set; licence NOT emailed", { to, product, licenseKey });
    return "disabled";
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: SUPPORT, subject, text }),
    });
    if (!res.ok) {
      logger.error("[email] Resend refused the send", { to, status: res.status, body: await res.text() });
      return "failed";
    }
    return "sent";
  } catch (err) {
    logger.error("[email] couldn't reach Resend", { to, err: String(err) });
    return "failed";
  }
}

module.exports = { sendLicense, licenceEmail };
