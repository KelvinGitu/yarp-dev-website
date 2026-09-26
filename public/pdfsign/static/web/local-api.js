/* The browser version's stand-in for pdfsign's local server (app/main.py).
   app.js's api() hands every request here in web mode, and gets back the same
   shapes and messages the server would give, so the rest of the page doesn't
   know the difference. When a route in main.py changes, change it here too.

   Saved signatures go in IndexedDB and the profile in localStorage.
   Nothing leaves the browser. Saving to a folder and the phone relay need the desktop app, so
   the page hides them and they aren't answered here. */

const VERSION = document.documentElement.dataset.version || "dev";

// app/store.py's limits.
const KINDS = new Set(["signature", "initials"]);
const MAX_PNG_BYTES = 2 * 1024 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const DEFAULT_PROFILE = { name: "", initials: "", date_format: "DD/MM/YYYY", snippets: [] };
const DATE_FORMATS = new Set(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "D MMMM YYYY", "MMMM D, YYYY"]);
const MAX_SNIPPETS = 30;
const PROFILE_KEY = "pdfsign.profile";

const fail = (status, detail) => Object.assign(new Error(detail), { status });

// ------------------------------------------------------------- signatures

// One IndexedDB store of { id, kind, label, created, png: Blob }. If the
// browser refuses IndexedDB (some private windows), signatures last until
// the tab closes instead.
const db = new Promise((resolve) => {
  try {
    const req = indexedDB.open("pdfsign", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("signatures", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  } catch {
    resolve(null);
  }
});
const memory = new Map();

async function tx(mode, work) {
  const conn = await db;
  if (!conn) return work(null);
  return new Promise((resolve, reject) => {
    const t = conn.transaction("signatures", mode);
    const req = work(t.objectStore("signatures"));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(fail(500, "This browser couldn't store your signature."));
  });
}

const allRows = () => tx("readonly", (s) => (s ? s.getAll() : null)).then((rows) => rows ?? [...memory.values()]);
const putRow = (row) => tx("readwrite", (s) => (s ? s.put(row) : memory.set(row.id, row)));
const deleteRow = (id) => tx("readwrite", (s) => (s ? s.delete(id) : memory.delete(id)));

// One object URL per signature for as long as the page is open.
const urls = new Map();
function publicRow({ png, ...row }) {
  if (!urls.has(row.id)) urls.set(row.id, URL.createObjectURL(png));
  return { ...row, url: urls.get(row.id) };
}

function decodePng(dataUrl) {
  const payload = String(dataUrl).split("base64,")[1] ?? "";
  let raw;
  try {
    raw = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  } catch {
    throw fail(400, "The image data is corrupt.");
  }
  if (!PNG_MAGIC.every((b, i) => raw[i] === b)) throw fail(400, "Signatures must be PNG images.");
  if (raw.length > MAX_PNG_BYTES) throw fail(400, "That image is over 2 MB. Crop it or use a smaller one.");
  return new Blob([raw], { type: "image/png" });
}

async function listSignatures() {
  const rows = await allRows();
  return rows.sort((a, b) => b.created - a.created).map(publicRow);
}

async function addSignature({ kind = "signature", label = "", png }) {
  if (!KINDS.has(kind)) throw fail(400, `Unknown kind '${kind}'.`);
  const row = {
    id: crypto.randomUUID().replaceAll("-", ""),
    kind,
    label: String(label).trim().slice(0, 60),
    created: Date.now() / 1000,
    png: decodePng(png),
  };
  await putRow(row);
  return publicRow(row);
}

async function deleteSignature(id) {
  const known = (await allRows()).some((r) => r.id === id);
  await deleteRow(id);
  if (urls.has(id)) {
    URL.revokeObjectURL(urls.get(id));
    urls.delete(id);
  }
  return { deleted: known };
}

// ------------------------------------------------------------- profile

function getProfile() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") ?? {};
  } catch { /* unreadable: start fresh */ }
  return { ...DEFAULT_PROFILE, snippets: [], ...saved };
}

function cleanSnippets(snippets) {
  const out = [];
  for (const s of snippets.slice(0, MAX_SNIPPETS)) {
    const text = String(s?.text ?? "").replaceAll("\r\n", "\n").trim().slice(0, 500);
    if (text) out.push({ label: String(s?.label ?? "").trim().slice(0, 40), text });
  }
  return out;
}

function saveProfile({ name = "", initials = "", date_format: fmt = DEFAULT_PROFILE.date_format, snippets = null }) {
  const profile = {
    name: String(name).trim().slice(0, 80),
    initials: String(initials).trim().slice(0, 8),
    date_format: DATE_FORMATS.has(fmt) ? fmt : DEFAULT_PROFILE.date_format,
    snippets: cleanSnippets(Array.isArray(snippets) ? snippets : getProfile().snippets),
  };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    throw fail(500, "This browser won't let pdfsign keep your profile. Is it a private window?");
  }
  return profile;
}

// ------------------------------------------------------------- routes

export default async function localApi(method, path, body = {}) {
  const route = `${method} ${path}`;
  switch (route) {
    case "GET /api/health": return { output_dir: "", signatures: (await allRows()).length, version: VERSION };
    case "GET /api/profile": return getProfile();
    case "PUT /api/profile": return saveProfile(body);
    case "GET /api/signatures": return listSignatures();
    case "POST /api/signatures": return addSignature(body);
  }
  const sig = route.match(/^DELETE \/api\/signatures\/([a-f0-9]{32})$/);
  if (sig) return deleteSignature(sig[1]);
  throw fail(404, "That needs the pdfsign desktop app.");
}
