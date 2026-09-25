// Delivery: the one step that has to work after a purchase. The buyer's
// licence key reaches them here, or on the success page, or not at all.
// Sent through Resend's HTTP API with plain fetch, so there's no SDK to keep up.

const logger = require("firebase-functions/logger");

const { APPS, PRODUCTS } = require("../products");

const SUPPORT = "support@yarpdevelopers.com";

/**
 * @returns {Promise<"sent" | "disabled" | "failed">} "disabled" means email
 * isn't configured (nothing is sent); "failed" is worth a retry.
 */
async function sendEmail({ to, subject, text, html, apiKey, from }) {
  if (!apiKey || !from) {
    logger.error("[email] RESEND_API_KEY/RESEND_FROM not set; nothing sent", { to, subject });
    return "disabled";
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: SUPPORT, subject, text, ...(html ? { html } : {}) }),
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

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Sent as HTML, so the key can stand out, with a plain-text copy for mail
// apps that don't show HTML. Nothing is indented: mail apps wrap and
// reflow indented lines unpredictably. Links go to each app's store page,
// not straight to the installer.
function licenceEmail(product, licenseKey) {
  const bought = PRODUCTS[product];
  const apps = bought.apps.map((id) => APPS[id]);
  const subject = `Your ${bought.name} licence key`;

  const text = [
    `Thank you for buying ${bought.name}.`,
    "",
    "Your licence key:",
    "",
    licenseKey,
    "",
    "To unlock:",
    "",
    ...apps.flatMap((app) => [
      `${app.name}: open it, ${app.whereIsLicence}, paste the key and click Unlock.`,
      `Not installed yet? Download it from ${app.page}`,
      ...(app.web ? [`On your phone? Open ${app.web}, ${app.whereIsWebLicence} and paste the same key.`] : []),
      "",
    ]),
    "The key is checked on your computer, so it keeps working offline, and on any computer of your own.",
    "Keep this email: it's your copy of the key.",
    "",
    `Questions, or a refund within 30 days: reply to this email or write to ${SUPPORT}.`,
    "",
    "Kelvin Gitu",
    "Yarp Developers",
  ].join("\n");

  const p = (inner) => `<p style="margin:0 0 16px">${inner}</p>`;
  const html = [
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1f2b;max-width:560px">',
    p(`Thank you for buying ${escapeHtml(bought.name)}.`),
    p("Your licence key:"),
    '<p style="margin:0 0 24px;padding:14px 16px;background:#fbf5e3;border:1px solid #e0c878;border-radius:8px;' +
      'font-family:Consolas,Menlo,monospace;font-size:16px;font-weight:700;letter-spacing:0.02em;word-break:break-all">' +
      `${escapeHtml(licenseKey)}</p>`,
    p("<strong>To unlock:</strong>"),
    ...apps.map((app) => p(
      `<strong>${escapeHtml(app.name)}</strong>: open it, ${escapeHtml(app.whereIsLicence)}, paste the key and click Unlock.<br>` +
      `Not installed yet? <a href="${app.page}" style="color:#8a6a12">Download ${escapeHtml(app.name)}</a>` +
      (app.web
        ? `<br>On your phone? <a href="${app.web}" style="color:#8a6a12">Open ${escapeHtml(app.name)} in your browser</a>, ` +
          `${escapeHtml(app.whereIsWebLicence)} and paste the same key.`
        : ""),
    )),
    p("The key is checked on your computer, so it keeps working offline, and on any computer of your own. " +
      "Keep this email: it's your copy of the key."),
    p(`Questions, or a refund within 30 days: reply to this email or write to <a href="mailto:${SUPPORT}" style="color:#8a6a12">${SUPPORT}</a>.`),
    '<p style="margin:0">Kelvin Gitu<br>Yarp Developers</p>',
    "</div>",
  ].join("\n");

  return { subject, text, html };
}

async function sendLicense({ to, product, licenseKey, apiKey, from }) {
  const { subject, text, html } = licenceEmail(product, licenseKey);
  const result = await sendEmail({ to, subject, text, html, apiKey, from });
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
