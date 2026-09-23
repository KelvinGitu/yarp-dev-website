// Delivery: the one step that has to work after a purchase. The buyer's
// licence key reaches them here, or on the success page, or not at all.
// Sent through Resend's HTTP API with plain fetch, so there's no SDK to keep up.

const logger = require("firebase-functions/logger");

const { APPS, PRODUCTS } = require("../products");

const SUPPORT = "yarpdevelopers@gmail.com";

/**
 * @returns {Promise<"sent" | "disabled" | "failed">} "disabled" means email
 * isn't configured (nothing is sent); "failed" is worth a retry.
 */
async function sendEmail({ to, subject, text, apiKey, from }) {
  if (!apiKey || !from) {
    logger.error("[email] RESEND_API_KEY/RESEND_FROM not set; nothing sent", { to, subject });
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

async function sendLicense({ to, product, licenseKey, apiKey, from }) {
  const { subject, text } = licenceEmail(product, licenseKey);
  const result = await sendEmail({ to, subject, text, apiKey, from });
  // Loud: a silent failure here means someone paid and got nothing by email.
  if (result === "disabled") logger.error("[email] licence NOT emailed", { to, product, licenseKey });
  return result;
}

function updateEmail(app, version, notes) {
  const info = APPS[app];
  const lines = [
    `${info.name} ${version} is out.`,
    "",
    ...(notes ? [notes, ""] : []),
    `Download it here: ${info.download}`,
    "",
    "Your licence key still works — no need to buy or re-enter anything, just install over the old version.",
    "",
    `Questions? Reply to this email or write to ${SUPPORT}.`,
    "",
    "Kelvin Gitu",
    "Yarp Developers",
  ];
  return { subject: `${info.name} ${version} is out`, text: lines.join("\n") };
}

async function sendUpdateEmail({ to, app, version, notes, apiKey, from }) {
  const { subject, text } = updateEmail(app, version, notes);
  return sendEmail({ to, subject, text, apiKey, from });
}

module.exports = { sendLicense, licenceEmail, sendUpdateEmail, updateEmail };
