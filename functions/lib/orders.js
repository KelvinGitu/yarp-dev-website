// An audit copy of each sale in Firestore (collection "store_orders", one
// document per Stripe session). Optional by design: keys are re-derived from
// the Stripe session (see license.js), so fulfilment never depends on this.
// A Firestore problem is logged, never allowed to fail a purchase.

const logger = require("firebase-functions/logger");

let db = null;

// Firestore retries unreachable or missing databases for a long time. An
// audit copy isn't worth making Stripe wait (it gives up after ~20 s and
// retries), so every call gets a few seconds and no more.
const LIMIT_MS = 2500;

function withinLimit(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${LIMIT_MS} ms`)), LIMIT_MS)),
  ]);
}

function firestore() {
  if (db) return db;
  const { initializeApp, getApps } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");
  if (!getApps().length) initializeApp();
  db = getFirestore();
  return db;
}

async function findOrder(sessionId) {
  try {
    const snap = await withinLimit(firestore().collection("store_orders").doc(sessionId).get());
    return snap.exists ? snap.data() : null;
  } catch (err) {
    logger.warn("[orders] lookup failed", { sessionId, err: String(err) });
    return null;
  }
}

async function recordOrder(sessionId, fields) {
  try {
    await withinLimit(firestore().collection("store_orders").doc(sessionId).set(fields, { merge: true }));
    return true;
  } catch (err) {
    logger.warn("[orders] couldn't record order", { sessionId, err: String(err) });
    return false;
  }
}

// Every order for any of the given `product` values (e.g. an app plus any
// bundle that includes it). Firestore's `in` operator caps out at 30 values,
// far more than the product list will ever have.
async function listOrdersForProducts(products) {
  try {
    const snap = await withinLimit(
      firestore().collection("store_orders").where("product", "in", products).get(),
    );
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    logger.warn("[orders] couldn't list orders", { products, err: String(err) });
    return [];
  }
}

async function markNotified(sessionId, version) {
  try {
    const { FieldValue } = require("firebase-admin/firestore");
    await withinLimit(
      firestore().collection("store_orders").doc(sessionId).update({ notifiedVersions: FieldValue.arrayUnion(version) }),
    );
    return true;
  } catch (err) {
    logger.warn("[orders] couldn't mark order notified", { sessionId, version, err: String(err) });
    return false;
  }
}

module.exports = { findOrder, recordOrder, listOrdersForProducts, markNotified };
