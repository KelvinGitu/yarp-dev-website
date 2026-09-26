/* The browser version's stand-in for Resume Maker's local server
   (app/main.py). app.js's api() hands every request here in web mode, and
   gets back the same shapes and messages the server would give. When a
   route in main.py or a rule in app/library.py changes, change it here too.

   Resumes go in IndexedDB (deleted ones in a trash store, so Undo works),
   and rendering is web/render.js. Nothing leaves the browser. There's no PDF route:
   in a browser the resume prints itself (app.js, printPage below). */

import { createRenderer } from "./render.js";

const VERSION = document.documentElement.dataset.version || "dev";

const here = (path) => new URL(path, import.meta.url).href;
const fetchJson = async (path) => {
  const res = await fetch(here(path));
  if (!res.ok) throw new Error(`Couldn't load ${path} (${res.status}).`);
  return res.json();
};

// Nunjucks ships as a classic script that sets window.nunjucks.
const nunjucks = window.nunjucks ?? await new Promise((resolve, reject) => {
  const s = document.createElement("script");
  s.src = here("../vendor/nunjucks.min.js");
  s.onload = () => resolve(window.nunjucks);
  s.onerror = () => reject(new Error("Couldn't load the template engine."));
  document.head.append(s);
});

// Written by web/build.py from app/render.py and templates/.
const [CATALOG, TEMPLATES] = await Promise.all([fetchJson("catalog.json"), fetchJson("templates.json")]);
const renderer = createRenderer({ nunjucks, catalog: CATALOG, templates: TEMPLATES, fontBase: here("../fonts/") });

const fail = (status, detail) => Object.assign(new Error(detail), { status });
const clone = (v) => JSON.parse(JSON.stringify(v));

// ------------------------------------------------------------- storage

// Stores: resumes { id, data, updated } and trash { filed, id, data, updated }.
// If the browser refuses IndexedDB (some private windows), resumes last until
// the tab closes instead.
const db = new Promise((resolve) => {
  try {
    const req = indexedDB.open("resume-maker", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("resumes", { keyPath: "id" });
      req.result.createObjectStore("trash", { keyPath: "filed" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  } catch {
    resolve(null);
  }
});
const memory = { resumes: new Map(), trash: new Map() };

async function tx(stores, mode, work) {
  const conn = await db;
  if (!conn) return work(null);
  return new Promise((resolve, reject) => {
    const t = conn.transaction(stores, mode);
    let result;
    Promise.resolve(work(t)).then((r) => { result = r; }, reject);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(fail(500, "This browser couldn't save your resume."));
  });
}
const req = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

const allResumes = () => tx(["resumes"], "readonly", (t) => (t ? req(t.objectStore("resumes").getAll()) : [...memory.resumes.values()]));
const getResume = (id) => tx(["resumes"], "readonly", (t) => (t ? req(t.objectStore("resumes").get(id)) : memory.resumes.get(id)));
const putResume = (row) => tx(["resumes"], "readwrite", (t) => (t ? req(t.objectStore("resumes").put(row)) : memory.resumes.set(row.id, row)));

// ------------------------------------------------------------- library (app/library.py)

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const ACRONYMS = new Set(["ai", "ui", "ux", "ml", "qa", "it", "hr", "cv", "ios", "api", "ats"]);

function slug(name) {
  const s = String(name).trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
  return s.slice(0, 60) || "resume";
}

/** A readable name from the id: resume_backend_cloud -> Backend cloud. */
function label(rid) {
  if (rid === "resume") return "Main";
  let s = rid.replace(/^resume[_-]/, "").replaceAll("_", " ").replaceAll("-", " ").trim();
  s = s.split(/\s+/).filter(Boolean).map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w)).join(" ");
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function summary(row) {
  const pi = row.data?.personal_info || {};
  const design = row.data?.design || {};
  return { id: row.id, label: label(row.id), updated: Math.floor(row.updated / 1000), title: pi.title ?? "", template: design.template ?? "classic" };
}

const missing = (rid) => fail(404, `There's no resume called '${rid}' in this browser.`);

async function freeId(base) {
  const taken = new Set((await allResumes()).map((r) => r.id));
  let rid = base;
  for (let n = 2; taken.has(rid); n++) rid = `${base}_${n}`;
  return rid;
}

const baseFor = (name) => {
  const base = slug(name);
  return base !== "resume" && !base.startsWith("resume_") ? `resume_${base}` : base;
};

async function listResumes() {
  const rows = (await allResumes()).filter((r) => ID_RE.test(r.id)).map(summary);
  // Main first, then alphabetical.
  return rows.sort((a, b) => (a.id !== "resume") - (b.id !== "resume") || (a.label.toLowerCase() < b.label.toLowerCase() ? -1 : a.label.toLowerCase() > b.label.toLowerCase() ? 1 : 0));
}

async function read(rid) {
  const row = ID_RE.test(rid) ? await getResume(rid) : null;
  if (!row) throw missing(rid);
  return row.data;
}

async function save(rid, data) {
  const row = ID_RE.test(rid) ? await getResume(rid) : null;
  if (!row) throw missing(rid);
  const next = { id: rid, data, updated: Date.now() };
  await putResume(next);
  return summary(next);
}

async function create({ name = "", source = null }) {
  const data = source ? await read(source) : clone(CATALOG.BLANK);
  const row = { id: await freeId(baseFor(name)), data, updated: Date.now() };
  await putResume(row);
  return summary(row);
}

async function rename(rid, { name = "" }) {
  const row = ID_RE.test(rid) ? await getResume(rid) : null;
  if (!row) throw missing(rid);
  const base = baseFor(name);
  if (base === rid) return summary(row);
  const moved = { ...row, id: await freeId(base) };
  await tx(["resumes"], "readwrite", (t) => {
    if (!t) { memory.resumes.delete(rid); memory.resumes.set(moved.id, moved); return; }
    const s = t.objectStore("resumes");
    s.delete(rid);
    s.put(moved);
  });
  return summary(moved);
}

/** Move a resume into the trash; returns the name it was filed under there. */
async function trash(rid) {
  const row = ID_RE.test(rid) ? await getResume(rid) : null;
  if (!row) throw missing(rid);
  const filed = `${rid}.${Math.floor(Date.now() / 1000)}.json`;
  await tx(["resumes", "trash"], "readwrite", (t) => {
    if (!t) { memory.resumes.delete(rid); memory.trash.set(filed, { ...row, filed }); return; }
    t.objectStore("resumes").delete(rid);
    t.objectStore("trash").put({ ...row, filed });
  });
  return { filed };
}

async function restore(filed) {
  const m = filed.match(/^([A-Za-z0-9][A-Za-z0-9_-]{0,79})\.\d+\.json$/);
  const row = m && await tx(["trash"], "readonly", (t) => (t ? req(t.objectStore("trash").get(filed)) : memory.trash.get(filed)));
  if (!row) throw fail(404, "That resume is no longer in the trash.");
  const back = { id: await freeId(m[1]), data: row.data, updated: Date.now() };
  await tx(["resumes", "trash"], "readwrite", (t) => {
    if (!t) { memory.trash.delete(filed); memory.resumes.set(back.id, back); return; }
    t.objectStore("trash").delete(filed);
    t.objectStore("resumes").put(back);
  });
  return summary(back);
}

// A first visit starts from the fictional example, like the desktop app's
// seed_if_empty, so the editor has something to show.
if (!(await allResumes()).length) {
  await putResume({ id: "resume", data: await fetchJson("sample.json"), updated: Date.now() });
}

// ------------------------------------------------------------- printing

// The page app.js opens in its own tab to print: the resume at the scale
// the preview fitted it to, titled so "Save as PDF" suggests a good file
// name, and a note on screen (never on paper) about the print window.
function printPage({ data, scale = 1 }) {
  const pi = data.personal_info || {};
  const person = [pi.first_name, pi.last_name].filter(Boolean).join(" ").trim();
  const title = person ? `${person} Resume` : "Resume";
  const paper = renderer.pageSizeOf(data) === "a4" ? "A4" : "Letter";
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const note = `
<div class="rm-print-note" role="note">
  <p><strong>Saving your PDF:</strong> in the print window, choose <strong>Save as PDF</strong>, check that
  paper size says <strong>${paper}</strong>, then save.</p>
  <button type="button" onclick="print()">Open the print window again</button>
</div>
<style>
  .rm-print-note { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 10; max-width: 30rem; margin: 0 auto;
    padding: 12px 14px; border-radius: 12px; background: #1b1e22; color: #eceff1; font: 15px/1.45 system-ui, sans-serif;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
  .rm-print-note p { margin: 0 0 10px; }
  .rm-print-note button { font: inherit; font-weight: 600; padding: 8px 12px; border: 0; border-radius: 8px; background: #4aa6c9; color: #0b1216; }
  @media print { .rm-print-note { display: none !important; } }
</style>
<script>
  addEventListener("load", () => document.fonts.ready.then(() => setTimeout(() => print(), 300)));
</script>`;
  let html = renderer.renderHtml(data, null, scale);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace("</body>", `${note}\n</body>`);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ------------------------------------------------------------- routes

export default async function localApi(method, path, body = {}) {
  const url = new URL(path, location.origin);
  const route = `${method} ${url.pathname}`;
  switch (route) {
    case "GET /api/health": return { resumes: (await allResumes()).length, browser: null, version: VERSION };
    case "GET /api/templates":
      return {
        templates: Object.entries(CATALOG.TEMPLATES).map(([id, t]) => ({ id, name: t.name, blurb: t.blurb, accent: t.accent })),
        sections: CATALOG.SECTIONS,
        default_titles: CATALOG.DEFAULT_TITLES,
        section_kinds: CATALOG.SECTION_KINDS,
        min_scale: CATALOG.MIN_SCALE,
        scale_step: CATALOG.SCALE_STEP,
        output_dir: "",
      };
    case "GET /api/resumes": return listResumes();
    case "POST /api/resumes": return create(body);
    case "POST /api/preview":
      return new Response(renderer.renderHtml(body.data, body.template ?? null), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    case "POST /api/print": return printPage(body);
  }
  let m;
  if ((m = route.match(/^(GET|PUT|DELETE) \/api\/resumes\/([^/]+)$/))) {
    const rid = decodeURIComponent(m[2]);
    if (m[1] === "GET") return read(rid);
    if (m[1] === "PUT") return save(rid, body);
    return trash(rid);
  }
  if ((m = route.match(/^POST \/api\/resumes\/([^/]+)\/rename$/))) return rename(decodeURIComponent(m[1]), body);
  if ((m = route.match(/^POST \/api\/trash\/([^/]+)\/restore$/))) return restore(decodeURIComponent(m[1]));
  throw fail(404, "That needs the Resume Maker desktop app.");
}
