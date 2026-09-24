/* pdfsign front end. pdf.js paints the pages, stamps are laid over them as
   DOM, and pdf-lib writes the result. The PDF never leaves the browser unless
   you press Save to folder, which hands it to the local server. */

import * as pdfjs from "./vendor/pdfjs/pdf.min.mjs";
import { attachPen, liftInk, trimCanvas } from "./ink.js";

// The same page runs two ways: in the desktop app, behind pdfsign's own local
// server, and at yarpdevelopers.com/pdfsign (web/build.py), where there is no
// server and web/local-api.js answers the same requests from browser storage.
const WEB = document.documentElement.dataset.mode === "web";
const localApi = WEB ? (await import("./web/local-api.js")).default : null;

const {
  PDFDocument, PDFName, PDFBool, PDFRef, PDFDict, PDFArray, PDFStream,
  rgb, degrees, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList,
} = window.PDFLib;

// Relative to this file, so the page works wherever it's served from.
const asset = (path) => new URL(path, import.meta.url).href;

pdfjs.GlobalWorkerOptions.workerSrc = asset("vendor/pdfjs/pdf.worker.min.mjs");

const PDFJS_ASSETS = {
  cMapUrl: asset("vendor/pdfjs/cmaps/"),
  cMapPacked: true,
  standardFontDataUrl: asset("vendor/pdfjs/standard_fonts/"),
  wasmUrl: asset("vendor/pdfjs/wasm/"),
  iccUrl: asset("vendor/pdfjs/iccs/"),
};

const INKS = { blue: "#1f3aa8", black: "#1a1c1e" };

// Text uses the fonts every PDF reader has built in, so it stays real,
// searchable text. On screen each is previewed with its metric twin (Arial
// for Helvetica and so on), so the preview and the written result line up.
const FACES = {
  sans: { label: "Sans", css: "Arial, Helvetica, sans-serif", pdf: ["Helvetica", "Helvetica-Bold"] },
  serif: { label: "Serif", css: '"Times New Roman", Times, serif', pdf: ["Times-Roman", "Times-Bold"] },
  mono: { label: "Typewriter", css: '"Courier New", Courier, monospace', pdf: ["Courier", "Courier-Bold"] },
};

// Text has its own colours: most form text is black, whatever ink you sign in.
const TEXT_COLORS = { black: "#1a1c1e", blue: "#1f3aa8", red: "#b3261e" };

const LINE = 1.2;

const cssFont = (style, size) => `${style.bold ? "700 " : ""}${size}px ${FACES[style.face || "sans"].css}`;

const TYPE_FONTS = [
  { family: "Mrs Saint Delafield", scale: 1.3 },
  { family: "Homemade Apple", scale: 0.78 },
  { family: "Herr Von Muellerhoff", scale: 1.35 },
  { family: "Caveat", scale: 1.05 },
];

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "D MMMM YYYY", "MMMM D, YYYY"];

// ------------------------------------------------------------- helpers

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const el = (tag, props = {}, ...kids) => {
  // dataset is a read-only accessor: assigning to it throws, so its keys have
  // to be copied onto the existing DOMStringMap instead.
  const { dataset, ...rest } = props;
  const node = Object.assign(document.createElement(tag), rest);
  if (dataset) Object.assign(node.dataset, dataset);
  for (const kid of kids.flat()) {
    if (kid !== null && kid !== undefined && kid !== false) node.append(kid);
  }
  return node;
};

// A failed request throws with the server's message and its HTTP status.
const api = async (path, body, method) => {
  method = method || (body === undefined ? "GET" : "POST");
  if (localApi) return localApi(method, path, body);
  const res = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.detail || `Request failed (${res.status})`), { status: res.status });
  return data;
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const store = {
  get(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* private window */ }
  },
};

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("Couldn't load that image."));
  img.src = src;
});

const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

function formatDate(date, fmt) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const month = date.toLocaleString("en", { month: "long" });
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  switch (fmt) {
    case "MM/DD/YYYY": return `${pad(m)}/${pad(d)}/${y}`;
    case "YYYY-MM-DD": return `${y}-${pad(m)}-${pad(d)}`;
    case "D MMMM YYYY": return `${d} ${month} ${y}`;
    case "MMMM D, YYYY": return `${month} ${d}, ${y}`;
    default: return `${pad(d)}/${pad(m)}/${y}`;
  }
}

// ------------------------------------------------------------- state

// New text starts in whatever style you used last.
function loadTextStyle() {
  const fallback = { face: "sans", bold: false, color: TEXT_COLORS.black };
  try {
    const saved = JSON.parse(store.get("pdfsign.text", "null"));
    if (saved && FACES[saved.face] && Object.values(TEXT_COLORS).includes(saved.color)) {
      return { face: saved.face, bold: Boolean(saved.bold), color: saved.color };
    }
  } catch { /* fall through */ }
  return fallback;
}

const state = {
  sources: [],           // every PDF opened or added; the first is the base
  pages: [],             // in display order, see buildPage
  zoom: 1,
  fitZoom: 1,
  items: [],
  selected: null,
  tool: "select",
  armed: null,           // what the next click on a page will place
  ink: store.get("pdfsign.ink", "blue") === "black" ? "black" : "blue",
  textStyle: loadTextStyle(),
  formValues: new Map(), // fieldName -> { kind, value, label }
  profile: { name: "", initials: "", date_format: "DD/MM/YYYY" },
  signatures: [],
  outputDir: "",
  dirty: false,
  lockFailed: false,     // the last export couldn't lock the form fields
};

let nextId = 1;

// In the desktop app, closing the window asks first when there's unsaved work,
// so the window has to be told whenever that changes.
{
  let dirty = false;
  Object.defineProperty(state, "dirty", {
    get: () => dirty,
    set: (value) => {
      if (value === dirty) return;
      dirty = value;
      window.pywebview?.api?.set_dirty(value);
    },
  });
}

// True inside the desktop app's window, where files go through the Windows
// Save dialog instead of the browser's downloads.
const inDesktopApp = () => Boolean(window.pywebview?.api?.save_file);

window.addEventListener("pywebviewready", () => {
  $("#download-label").textContent = "Save as…";
  window.pywebview.api.set_dirty(state.dirty);
});

const desk = $("#desk");
const pagesEl = $("#pages");
const empty = $("#empty");
const hint = $("#hint");
const thumbsEl = $("#thumbs");
const thumbList = $("#thumb-list");

const isOpen = () => state.sources.length > 0;

// Page nodes and thumbnails back to the page they show.
const pageOf = new WeakMap();

// ------------------------------------------------------------- toast + hint

let toastTimer;

function toast(message, { tone = "info", action, onAction, sticky = false, duration } = {}) {
  const box = $("#toast");
  const btn = $("#toast-action");
  $("#toast-text").textContent = message;
  box.dataset.tone = tone;
  btn.hidden = !action;
  if (action) {
    btn.textContent = action;
    btn.onclick = () => { box.hidden = true; onAction(); };
  }
  box.hidden = false;
  clearTimeout(toastTimer);
  if (!sticky) toastTimer = setTimeout(() => { box.hidden = true; }, duration ?? (tone === "error" ? 8000 : 5000));
}

// The banner that says a tool is armed. It shows what you're about to place,
// because you may have looked away (to sign on your phone, say) and need to
// see at a glance that the next click puts a signature down.
function showHint(armed) {
  if (!armed) {
    hint.hidden = true;
    return;
  }
  let preview = null;
  if (armed.type === "image") {
    preview = el("span", { className: "hint__preview" }, el("img", { src: armed.src, alt: "" }));
  } else if (armed.type === "text" && armed.text) {
    preview = el("span", { className: "hint__preview hint__preview--text", textContent: armed.text });
    preview.style.font = cssFont(state.textStyle, 16);
    preview.style.color = state.textStyle.color;
  }
  hint.replaceChildren(
    ...(preview ? [preview] : []),
    el("span", { className: "hint__text", textContent: TOOL_HINTS[armed.hint || armed.type] }),
    el("button", {
      type: "button",
      className: "hint__cancel",
      textContent: armed.sticky ? "Done" : "Cancel",
      title: "Esc",
      onclick: disarm,
    }),
  );
  hint.hidden = false;
  nudgeHint();
}

// Replay the banner's entrance so it catches the eye.
function nudgeHint() {
  hint.classList.remove("is-nudging");
  void hint.offsetWidth; // restart the animation
  hint.classList.add("is-nudging");
}

// Coming back to this window with a tool still armed: point at the banner.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.armed) nudgeHint();
});

// ------------------------------------------------------------- undo

// Every change to the document records how to take itself back and how to
// do itself again. Form fields aren't in here: the browser already undoes
// typing inside a field.
const history = { past: [], future: [] };

function record(label, undo, redo, extra = {}) {
  const entry = { label, undo, redo, at: Date.now(), ...extra };
  history.past.push(entry);
  if (history.past.length > 300) history.past.shift();
  history.future = [];
  syncHistory();
  return entry;
}

// Undo the most recent change, or redo the last undone one.
function stepHistory(dir) {
  commitEditing();
  const from = dir === "undo" ? history.past : history.future;
  const to = dir === "undo" ? history.future : history.past;
  const entry = from.pop();
  if (!entry) return;
  select(null);
  entry[dir]();
  to.push(entry);
  state.dirty = true;
  syncHistory();
}

const undo = () => stepHistory("undo");
const redo = () => stepHistory("redo");

// The Undo in a toast undoes that change, even if something came after it.
function undoEntry(entry) {
  if (history.past.at(-1) === entry) { undo(); return; }
  const i = history.past.indexOf(entry);
  if (i < 0) return;
  history.past.splice(i, 1);
  entry.undo();
  state.dirty = true;
  syncHistory();
}

function clearHistory() {
  history.past = [];
  history.future = [];
  syncHistory();
}

function syncHistory() {
  $("#undo").disabled = !history.past.length;
  $("#redo").disabled = !history.future.length;
}

$("#undo").addEventListener("click", undo);
$("#redo").addEventListener("click", redo);

// Finish typing into a text stamp, so its edit lands in the history first.
function commitEditing() {
  const editing = state.items.find((i) => i.editing);
  if (editing) editing.node.querySelector(".item__text").blur();
}

// ------------------------------------------------------------- opening a PDF

// Each PDF you open or add is a source, and every page points at its source,
// so a merged document can be reordered freely. The first source is the base
// the export writes into, and the only one whose form fields are fillable.
async function loadSource(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  if (!head.includes("%PDF-")) {
    toast(`${file.name} isn't a PDF.`, { tone: "error" });
    return null;
  }
  try {
    // pdf.js takes ownership of the buffer it's given, so it gets a copy;
    // pdf-lib needs the original bytes again at export time.
    const doc = await pdfjs.getDocument({ data: bytes.slice(), ...PDFJS_ASSETS }).promise;
    return { id: nextId++, name: file.name, bytes, doc };
  } catch (err) {
    if (err?.name === "PasswordException") {
      toast(`${file.name} is password-protected. Remove the password in the app that made it, then try again.`, { tone: "error" });
    } else {
      toast(`Couldn't read ${file.name}: ${err?.message || err}`, { tone: "error" });
    }
    return null;
  }
}

async function openFile(file) {
  if (!file) return;
  if (state.dirty && !confirm("Open a different PDF? The changes to this one haven't been downloaded or saved.")) return;
  const src = await loadSource(file);
  if (!src) return;

  closeDocument();
  state.sources = [src];
  empty.hidden = true;
  for (const id of ["#download", "#save", "#zoom-in", "#zoom-out", "#zoom-fit", "#pages-toggle"]) $(id).disabled = false;
  showThumbs(wideScreen() && store.get("pdfsign.thumbs", "open") === "open");

  // Fit the widest page, so a landscape page among portrait ones doesn't
  // push the whole document into sideways scrolling.
  const proxies = await Promise.all(Array.from({ length: src.doc.numPages }, (_, i) => src.doc.getPage(i + 1)));
  const width = Math.max(...proxies.map((p) => p.getViewport({ scale: 1 }).width));
  state.fitZoom = clamp((desk.clientWidth - 48) / width, 0.3, 1.25);
  state.zoom = state.fitZoom;
  updateZoomLabel();

  await addPages(src);
  desk.scrollTop = 0;
}

// Merging: append every page of each file. Opens the first if nothing is.
async function addFiles(files) {
  const list = [...files];
  if (!list.length) return;
  if (!isOpen()) {
    await openFile(list.shift());
    if (!isOpen()) return;
  }
  for (const file of list) {
    const src = await loadSource(file);
    if (!src) continue;
    state.sources.push(src);
    const firstNew = state.pages.length;
    await addPages(src);
    state.dirty = true;
    const n = src.doc.numPages;
    toast(`Added ${n} ${n === 1 ? "page" : "pages"} from ${file.name}.`);
    state.pages[firstNew]?.node.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

async function addPages(src, at = state.pages.length) {
  for (let i = 0; i < src.doc.numPages; i++) {
    const proxy = await src.doc.getPage(i + 1);
    if (!state.sources.includes(src)) return; // closed meanwhile
    buildPage(src, i, proxy, at + i);
  }
  renumber();
}

function closeDocument() {
  for (const page of state.pages) {
    page.task?.cancel();
    observer.unobserve(page.node);
    thumbObserver.unobserve(page.thumb.node);
  }
  for (const src of state.sources) src.doc.destroy();
  state.sources = [];
  state.pages = [];
  state.items = [];
  state.selected = null;
  state.formValues.clear();
  state.dirty = false;
  pagesEl.replaceChildren();
  thumbList.replaceChildren();
  disarm();
  clearHistory();
  updateFieldNav();
}

// Pages can be turned on top of whatever rotation the PDF gave them.
const rotationOf = (page) => (page.proxy.rotate + page.rot) % 360;
const viewportOf = (page, scale) => page.proxy.getViewport({ scale, rotation: rotationOf(page) });

function buildPage(src, srcIndex, proxy, at) {
  const canvas = el("canvas", { className: "page__canvas" });
  const fieldLayer = el("div", { className: "page__fields" });
  const itemLayer = el("div", { className: "page__items" });
  const node = el("section", { className: "page" }, canvas, fieldLayer, itemLayer);

  const page = {
    id: nextId++, src, srcIndex, proxy, rot: 0, vp: null,
    node, canvas, fieldLayer, itemLayer,
    fields: [], renderedZoom: 0, pendingZoom: 0, task: null, visible: false,
  };
  page.vp = viewportOf(page, 1);
  pageOf.set(node, page);
  // The DOM mirrors state.pages, so the node now at `at` is the one to go before.
  pagesEl.insertBefore(node, pagesEl.children[at] || null);
  state.pages.splice(at, 0, page);
  buildThumb(page, at);
  sizePage(page);
  observer.observe(node);
  bindPage(page);
  if (src === state.sources[0]) loadFields(page);
}

function sizePage(page) {
  const z = state.zoom;
  page.node.style.width = `${page.vp.width * z}px`;
  page.node.style.height = `${page.vp.height * z}px`;
  for (const f of page.fields) layoutField(f);
  for (const item of state.items) if (item.page === page) layoutItem(item);
}

function renumber() {
  state.pages.forEach((page, i) => {
    page.node.ariaLabel = `Page ${i + 1}`;
    page.thumb.num.textContent = i + 1;
    page.thumb.node.ariaLabel = `Page ${i + 1}`;
  });
  const n = state.pages.length;
  $("#doc-name").replaceChildren(
    el("strong", { textContent: state.sources[0]?.name || "" }),
    ` · ${n} ${n === 1 ? "page" : "pages"}`,
  );
}

// Pages are rendered only when near the viewport, so a 300-page contract
// opens as fast as a one-pager.
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const page = pageOf.get(entry.target);
    if (!page) continue;
    page.visible = entry.isIntersecting;
    if (page.visible) renderPage(page);
  }
}, { root: desk, rootMargin: "900px 0px" });

async function renderPage(page) {
  const zoom = state.zoom;
  if (page.renderedZoom === zoom || (page.task && page.pendingZoom === zoom)) return;
  page.task?.cancel();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = viewportOf(page, zoom * dpr);
  // Render off-screen and swap in, so zooming never flashes a blank page.
  const canvas = el("canvas", {
    className: "page__canvas",
    width: Math.floor(viewport.width),
    height: Math.floor(viewport.height),
  });
  const task = page.proxy.render({
    canvas,
    viewport,
    // The base PDF's form widgets are live inputs on top, not baked into the
    // canvas. Added PDFs aren't fillable, so their fields draw as printed.
    annotationMode: page.src === state.sources[0]
      ? pdfjs.AnnotationMode.ENABLE_FORMS
      : pdfjs.AnnotationMode.ENABLE,
  });
  page.task = task;
  page.pendingZoom = zoom;
  try {
    await task.promise;
  } catch (err) {
    if (err?.name !== "RenderingCancelledException") console.error(err);
    return;
  }
  if (page.task !== task) return;
  page.task = null;
  page.canvas.replaceWith(canvas);
  page.canvas = canvas;
  page.renderedZoom = zoom;
}

// ------------------------------------------------------------- page panel

const THUMB_W = 112;
const THUMB_H = 150;

const ICONS = {
  left: '<svg viewBox="0 0 24 24"><path d="M4.5 13a7.5 7.5 0 1 0 2.2-5.3L4 10.4"/><path d="M4 5v5.4h5.4"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M19.5 13a7.5 7.5 0 1 1-2.2-5.3l2.7 2.7"/><path d="M20 5v5.4h-5.4"/></svg>',
  del: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>',
  grip: '<svg viewBox="0 0 24 24"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/></svg>',
  duplicate: '<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 00-1.5-1.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5"/></svg>',
  everyPage: '<svg viewBox="0 0 24 24"><path d="M9 3.5h10.5v13.5H9z"/><path d="M6.5 6.5V20H17"/><path d="M4 9.5V22.5h10.5"/></svg>',
};

const wideScreen = () => window.matchMedia("(min-width: 761px)").matches;

function showThumbs(open) {
  thumbsEl.hidden = !open;
  $("#pages-toggle").setAttribute("aria-pressed", String(open));
  if (open) updateCurrent();
}

$("#pages-toggle").addEventListener("click", () => {
  const open = thumbsEl.hidden;
  showThumbs(open);
  if (wideScreen()) store.set("pdfsign.thumbs", open ? "open" : "closed");
});

const thumbObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const page = pageOf.get(entry.target);
    if (page && entry.isIntersecting) renderThumb(page);
  }
}, { root: thumbList, rootMargin: "400px 0px" });

function buildThumb(page, at) {
  const button = (icon, title, onclick, extra = "") => el("button", {
    type: "button",
    className: `thumb__btn ${extra}`,
    title,
    ariaLabel: title,
    innerHTML: icon,
    onclick: (e) => { e.stopPropagation(); onclick(); },
  });
  const canvas = el("canvas");
  const frame = el("div", { className: "thumb__frame" }, canvas);
  const num = el("span", { className: "thumb__num" });
  const grip = el("span", { className: "thumb__grip", innerHTML: ICONS.grip, title: "Drag to move" });
  const node = el("li", { className: "thumb", tabIndex: 0 },
    frame,
    el("div", { className: "thumb__bar" },
      grip,
      num,
      el("div", { className: "thumb__tools" },
        button(ICONS.left, "Rotate left", () => rotatePage(page, -90)),
        button(ICONS.right, "Rotate right", () => rotatePage(page, 90)),
        button(ICONS.del, "Delete page", () => deletePage(page), "thumb__btn--danger"),
      ),
    ),
  );
  page.thumb = { node, frame, canvas, num, renderedRot: null, pendingRot: null };
  pageOf.set(node, page);
  thumbList.insertBefore(node, thumbList.children[at] || null);
  sizeThumb(page);
  thumbObserver.observe(node);
  bindThumb(page);
}

const thumbScale = (page) => Math.min(THUMB_W / page.vp.width, THUMB_H / page.vp.height);

function sizeThumb(page) {
  const k = thumbScale(page);
  page.thumb.frame.style.width = `${page.vp.width * k}px`;
  page.thumb.frame.style.height = `${page.vp.height * k}px`;
}

async function renderThumb(page) {
  const t = page.thumb;
  const rot = rotationOf(page);
  if (t.pendingRot === rot) return;
  if (t.renderedRot === rot) {
    // Turned and straight back (undo): drop the drawing still in flight.
    t.pendingRot = null;
    return;
  }
  t.pendingRot = rot;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = viewportOf(page, thumbScale(page) * dpr);
  const canvas = el("canvas", { width: Math.floor(viewport.width), height: Math.floor(viewport.height) });
  try {
    await page.proxy.render({ canvas, viewport }).promise;
  } catch {
    t.pendingRot = null;
    return;
  }
  if (t.pendingRot !== rot) return; // turned again while this was drawing
  t.pendingRot = null;
  t.canvas.replaceWith(canvas);
  t.canvas = canvas;
  t.renderedRot = rot;
}

function goToPage(page) {
  page.node.scrollIntoView({ block: "start" });
  if (!wideScreen()) showThumbs(false);
}

function rotatePage(page, delta, { remember = true } = {}) {
  if (remember) {
    record("Turn page", () => rotatePage(page, -delta, { remember: false }), () => rotatePage(page, delta, { remember: false }));
  }
  const { width: W, height: H } = page.vp;
  page.rot = (page.rot + delta + 360) % 360;
  page.vp = viewportOf(page, 1);

  // Stamps are stuck to the paper: each one turns with its page.
  for (const item of state.items) {
    if (item.page !== page) continue;
    const { bw, bh } = boxOf(item);
    if (delta > 0) [item.x, item.y] = [H - (item.y + bh), item.x];
    else [item.x, item.y] = [item.y, W - (item.x + bw)];
    if (item.type === "rect") [item.w, item.h] = [item.h, item.w];
    else item.rot = ((item.rot || 0) + delta + 360) % 360;
  }
  for (const f of page.fields) placeField(page, f);

  page.task?.cancel();
  page.task = null;
  page.renderedZoom = 0;
  sizePage(page);
  if (page.visible) renderPage(page);
  sizeThumb(page);
  renderThumb(page);
  state.dirty = true;
}

function deletePage(page) {
  if (state.pages.length === 1) {
    toast("A PDF needs at least one page.");
    return;
  }
  const taken = removePage(page);
  const entry = record(
    `Delete page ${taken.at + 1}`,
    () => restorePage(page, taken.at, taken.items),
    () => Object.assign(taken, removePage(page)),
  );
  toast(`Deleted page ${taken.at + 1}.`, { action: "Undo", onAction: () => undoEntry(entry) });
}

// Take a page (and whatever's placed on it) out of the document. Returns
// what restorePage needs to put it back.
function removePage(page) {
  const at = state.pages.indexOf(page);
  const items = state.items.filter((i) => i.page === page);
  if (items.includes(state.selected)) select(null);
  state.items = state.items.filter((i) => i.page !== page);
  state.pages.splice(at, 1);
  page.task?.cancel();
  page.task = null;
  page.renderedZoom = 0;
  observer.unobserve(page.node);
  thumbObserver.unobserve(page.thumb.node);
  page.node.remove();
  page.thumb.node.remove();
  renumber();
  updateCurrent();
  updateFieldNav();
  state.dirty = true;
  return { at, items };
}

function restorePage(page, at, items) {
  if (!state.sources.includes(page.src)) return; // a different PDF is open now
  at = Math.min(at, state.pages.length);
  pagesEl.insertBefore(page.node, pagesEl.children[at] || null);
  thumbList.insertBefore(page.thumb.node, thumbList.children[at] || null);
  state.pages.splice(at, 0, page);
  observer.observe(page.node);
  thumbObserver.observe(page.thumb.node);
  state.items.push(...items);
  renumber();
  updateCurrent();
  updateFieldNav();
}

function movePage(page, to) {
  const from = state.pages.indexOf(page);
  to = clamp(to, 0, state.pages.length - 1);
  if (from === to) return;
  const order = [...state.pages];
  order.splice(from, 1);
  order.splice(to, 0, page);
  reorderPages(order);
}

// Put the pages in a new order, remembering the old one.
function reorderPages(order) {
  const before = [...state.pages];
  const apply = (o) => { state.pages = [...o]; syncOrder(); };
  record("Move page", () => apply(before), () => apply(order));
  apply(order);
}

// Put page nodes and thumbnails back in state.pages order.
function syncOrder() {
  for (const page of state.pages) {
    pagesEl.append(page.node);
    thumbList.append(page.thumb.node);
  }
  renumber();
  updateCurrent();
  state.dirty = true;
}

function bindThumb(page) {
  const { node } = page.thumb;
  let dragged = false;

  node.addEventListener("click", () => {
    if (!dragged) goToPage(page);
  });

  node.addEventListener("keydown", (e) => {
    if (e.target !== node) return; // its own buttons handle their keys
    const at = state.pages.indexOf(page);
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      movePage(page, at + (e.key === "ArrowUp" ? -1 : 1));
      node.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      state.pages[at + (e.key === "ArrowUp" ? -1 : 1)]?.thumb.node.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      goToPage(page);
    } else if (e.key === "Delete") {
      deletePage(page);
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  });

  // Drag to reorder. A mouse can grab the whole thumbnail; on touch only the
  // grip starts a drag, so the list still scrolls under a finger.
  node.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || e.target.closest("button")) return;
    if (e.pointerType === "touch" && !e.target.closest(".thumb__grip")) return;
    const startY = e.clientY;
    let dragging = false;
    dragged = false;

    const move = (ev) => {
      if (!dragging) {
        if (Math.abs(ev.clientY - startY) < 6) return;
        dragging = true;
        dragged = true;
        node.setPointerCapture(ev.pointerId);
        node.classList.add("is-dragging");
        thumbsEl.classList.add("is-sorting");
      }
      let before = null;
      for (const other of thumbList.children) {
        if (other === node) continue;
        const r = other.getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { before = other; break; }
      }
      if (before !== node.nextSibling) thumbList.insertBefore(node, before);
      const box = thumbList.getBoundingClientRect();
      if (ev.clientY < box.top + 40) thumbList.scrollTop -= 14;
      else if (ev.clientY > box.bottom - 40) thumbList.scrollTop += 14;
    };

    const end = () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", end);
      node.removeEventListener("pointercancel", end);
      if (!dragging) return;
      node.classList.remove("is-dragging");
      thumbsEl.classList.remove("is-sorting");
      const order = [...thumbList.children].map((n) => pageOf.get(n));
      if (order.some((p, i) => p !== state.pages[i])) reorderPages(order);
    };

    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", end);
    node.addEventListener("pointercancel", end);
  });
}

// The page you're looking at: the one across a line a third of the way down.
function pageInView() {
  const box = desk.getBoundingClientRect();
  const line = box.top + box.height * 0.35;
  return state.pages.find((p) => p.node.getBoundingClientRect().bottom > line) || state.pages.at(-1);
}

// Mark the thumbnail of the page you're looking at.
let currentFrame = 0;

function updateCurrent() {
  cancelAnimationFrame(currentFrame);
  currentFrame = requestAnimationFrame(() => {
    const current = pageInView();
    for (const page of state.pages) {
      const on = page === current;
      if (on === (page.thumb.node.ariaCurrent === "page")) continue;
      page.thumb.node.ariaCurrent = on ? "page" : null;
      if (on && !thumbsEl.hidden) page.thumb.node.scrollIntoView({ block: "nearest" });
    }
  });
}

desk.addEventListener("scroll", updateCurrent, { passive: true });

$("#add-file").addEventListener("change", (e) => {
  addFiles(e.target.files);
  e.target.value = "";
});

// ------------------------------------------------------------- zoom

function setZoom(zoom) {
  zoom = clamp(Math.round(zoom * 100) / 100, 0.25, 4);
  if (!isOpen() || zoom === state.zoom) return;
  const ratioY = desk.scrollTop / Math.max(1, desk.scrollHeight);
  state.zoom = zoom;
  for (const page of state.pages) {
    sizePage(page);
    if (page.visible) renderPage(page);
  }
  desk.scrollTop = ratioY * desk.scrollHeight;
  updateZoomLabel();
}

function updateZoomLabel() {
  $("#zoom-fit").textContent = `${Math.round(state.zoom * 100)}%`;
}

$("#zoom-in").addEventListener("click", () => setZoom(state.zoom * 1.2));
$("#zoom-out").addEventListener("click", () => setZoom(state.zoom / 1.2));
$("#zoom-fit").addEventListener("click", () => setZoom(state.fitZoom));

desk.addEventListener("wheel", (e) => {
  if (!e.ctrlKey || !isOpen()) return;
  e.preventDefault();
  setZoom(state.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
}, { passive: false });

// ------------------------------------------------------------- form fields

async function loadFields(page) {
  let annotations;
  try {
    annotations = await page.proxy.getAnnotations({ intent: "display" });
  } catch {
    return;
  }

  for (const a of annotations) {
    if (a.subtype !== "Widget" || !a.fieldName || a.hidden) continue;

    let input;
    let kind;
    if (a.fieldType === "Tx") {
      kind = "text";
      input = a.multiLine ? el("textarea") : el("input", { type: "text" });
      input.value = typeof a.fieldValue === "string" ? a.fieldValue : "";
      if (a.maxLen) input.maxLength = a.maxLen;
    } else if (a.fieldType === "Btn" && a.checkBox) {
      kind = "check";
      input = el("input", { type: "checkbox" });
      input.checked = Boolean(a.fieldValue) && a.fieldValue !== "Off" && a.fieldValue === a.exportValue;
    } else if (a.fieldType === "Btn" && a.radioButton) {
      kind = "radio";
      input = el("input", { type: "radio", name: `field:${a.fieldName}`, value: a.buttonValue });
      input.checked = a.fieldValue === a.buttonValue;
    } else if (a.fieldType === "Ch") {
      kind = "choice";
      input = el("select");
      for (const o of a.options || []) {
        input.append(el("option", { value: o.exportValue, textContent: o.displayValue }));
      }
      const current = Array.isArray(a.fieldValue) ? a.fieldValue[0] : a.fieldValue;
      input.value = current ?? "";
    } else {
      continue; // push buttons and signature fields
    }

    input.className = `field field--${kind}`;
    input.dataset.field = a.fieldName;
    input.disabled = Boolean(a.readOnly);
    input.ariaLabel = a.alternativeText || a.fieldName;
    input.title = a.alternativeText || a.fieldName;

    const field = { input, kind, name: a.fieldName, raw: a.rect, rect: null, page };
    input.addEventListener(kind === "text" ? "input" : "change", () => recordField(field));
    // Enter in a one-line field moves on to the next one still empty.
    if (input.tagName === "INPUT" && kind === "text") {
      input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
        e.preventDefault();
        goToEmptyField(1, field);
      });
    }
    page.fields.push(field);
    page.fieldLayer.append(input);
    placeField(page, field);
  }
  updateFieldNav();
}

// Every live field in reading order: page by page, then top to bottom and
// left to right (widgets within a few points count as one row).
function fieldsInOrder() {
  return state.pages.flatMap((page) => [...page.fields]
    .filter((f) => !f.input.disabled)
    .sort((a, b) => (Math.abs(a.rect.y - b.rect.y) > 4 ? a.rect.y - b.rect.y : a.rect.x - b.rect.x)));
}

// A field counts as filled once any of its widgets has an answer.
function isFilled(name) {
  const widgets = state.pages.flatMap((p) => p.fields.filter((f) => f.name === name));
  return widgets.some(({ input, kind }) => (kind === "check" || kind === "radio" ? input.checked : input.value.trim() !== ""));
}

function updateFieldNav() {
  const names = [...new Set(fieldsInOrder().map((f) => f.name))];
  const nav = $("#fieldnav");
  nav.hidden = !names.length;
  if (!names.length) return;
  const filled = names.filter(isFilled).length;
  const done = filled === names.length;
  nav.dataset.done = String(done);
  $("#field-count").textContent = done ? `All ${names.length} filled` : `${filled} of ${names.length} filled`;
  $("#field-count").title = done ? "Every form field has an answer" : `${names.length - filled} form fields still empty. Click to go to the next one.`;
}

// Jump to the next (dir 1) or previous (dir -1) field that's still empty,
// starting from `from`, the field you're in, or the page you're looking at.
function goToEmptyField(dir, from = null) {
  const list = fieldsInOrder();
  if (!list.length) return;
  from ??= list.find((f) => f.input === document.activeElement) || null;
  let start;
  if (from) {
    start = list.indexOf(from);
  } else {
    const here = state.pages.indexOf(pageInView());
    const first = list.findIndex((f) => state.pages.indexOf(f.page) >= here);
    start = (first < 0 ? list.length : first) - (dir > 0 ? 1 : 0);
  }
  for (let step = 1; step <= list.length; step++) {
    const f = list[(start + dir * step + list.length * 2) % list.length];
    if (f.name === from?.name || isFilled(f.name)) continue;
    f.input.focus({ preventScroll: true });
    f.input.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  from?.input.blur();
  toast("Every field is filled.");
}

$("#field-next").addEventListener("click", () => goToEmptyField(1));
$("#field-count").addEventListener("click", () => goToEmptyField(1));
$("#field-prev").addEventListener("click", () => goToEmptyField(-1));

// Lock the fields in the saved copy, so answers can't be changed afterwards.
const lockOnSave = () => $("#flatten").getAttribute("aria-pressed") === "true";

function setLockOnSave(on) {
  $("#flatten").setAttribute("aria-pressed", String(on));
  store.set("pdfsign.flatten", on ? "yes" : "no");
}

setLockOnSave(store.get("pdfsign.flatten", "no") === "yes");
$("#flatten").addEventListener("click", () => {
  setLockOnSave(!lockOnSave());
  toast(lockOnSave()
    ? "Saved copies will have their fields locked: your answers show, but can't be changed."
    : "Saved copies will keep their fields editable.");
});

// The widget's rectangle in PDF space, turned into the page as displayed.
function placeField(page, field) {
  const [x1, y1] = page.vp.convertToViewportPoint(field.raw[0], field.raw[1]);
  const [x2, y2] = page.vp.convertToViewportPoint(field.raw[2], field.raw[3]);
  field.rect = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
  layoutField(field);
}

function layoutField({ input, rect, kind }) {
  const z = state.zoom;
  Object.assign(input.style, {
    left: `${rect.x * z}px`,
    top: `${rect.y * z}px`,
    width: `${rect.w * z}px`,
    height: `${rect.h * z}px`,
  });
  if (kind === "text" || kind === "choice") {
    const size = input.tagName === "TEXTAREA" ? 10 : clamp(rect.h * 0.62, 7, 14);
    input.style.fontSize = `${size * z}px`;
  }
}

function recordField(field) {
  const { input, kind, name } = field;
  let entry;
  if (kind === "text") entry = { kind, value: input.value };
  else if (kind === "check") entry = { kind, value: input.checked };
  else if (kind === "radio") entry = { kind, value: input.value };
  else entry = { kind, value: input.value, label: input.selectedOptions[0]?.textContent };
  state.formValues.set(name, entry);
  state.dirty = true;

  // One field can have several widgets (a name printed on every page).
  // Radios group themselves through the shared name attribute.
  if (kind !== "radio") {
    for (const page of state.pages) {
      for (const other of page.fields) {
        if (other === field || other.name !== name) continue;
        if (kind === "check") other.input.checked = input.checked;
        else other.input.value = input.value;
      }
    }
  }
  updateFieldNav();
}

// ------------------------------------------------------------- items

const measureCtx = document.createElement("canvas").getContext("2d");

function measureText(text, size, style) {
  measureCtx.font = cssFont(style, size);
  const lines = text.split("\n");
  const w = Math.max(...lines.map((line) => measureCtx.measureText(line).width), size * 0.5);
  return { w, h: lines.length * size * LINE };
}

// Where line `i`'s baseline sits below the top of a text item, matching how
// the browser lays out `line-height: 1.2` in that typeface.
function baselineOffset(style, size, i) {
  measureCtx.font = cssFont(style, 100);
  const m = measureCtx.measureText("Hg");
  const ascent = (m.fontBoundingBoxAscent ?? 90.5) / 100;
  const descent = (m.fontBoundingBoxDescent ?? 21.2) / 100;
  return size * ((LINE - ascent - descent) / 2 + ascent + i * LINE);
}

const KIND_NAMES = { image: "stamp", text: "text", rect: "whiteout" };

// Put a new item on its page, without selecting it or recording it.
function createItem(props) {
  const item = { id: nextId++, ...props };
  state.items.push(item);
  mountItem(item);
  state.dirty = true;
  return item;
}

function addItem(props) {
  const item = createItem(props);
  item.added = record(`Add ${KIND_NAMES[item.type]}`, () => detachItem(item), () => attachItem(item));
  select(item);
  return item;
}

function removeItem(item) {
  detachItem(item);
  record(`Delete ${KIND_NAMES[item.type]}`, () => attachItem(item), () => detachItem(item));
}

// Undo and redo take items off the page and put them back, node and all.
function detachItem(item) {
  state.items = state.items.filter((i) => i !== item);
  item.node.remove();
  if (state.selected === item) state.selected = null;
  state.dirty = true;
}

function attachItem(item) {
  if (!state.items.includes(item)) state.items.push(item);
  item.page.itemLayer.append(item.node);
  layoutItem(item);
  state.dirty = true;
}

// What a copy of an item needs: everything but its identity and its node.
function copyable(item) {
  const { id, node, page, editing, added, fresh, ...rest } = item;
  return rest;
}

function duplicateItem(item) {
  const copy = addItem({ ...copyable(item), page: item.page, x: item.x + 12, y: item.y + 12 });
  keepOnPage(copy);
  layoutItem(copy);
  return copy;
}

// Put a copy on every other page, in the same corner of each: initials that
// sit 30pt from the bottom-right edge do on every page, whatever its size.
function stampEveryPage(item) {
  const others = state.pages.filter((p) => p !== item.page);
  if (!others.length) {
    toast("This PDF has only one page.");
    return;
  }
  const { vp } = item.page;
  const { bw, bh } = boxOf(item);
  const right = item.x + bw / 2 > vp.width / 2;
  const bottom = item.y + bh / 2 > vp.height / 2;
  const dx = right ? vp.width - (item.x + bw) : item.x;
  const dy = bottom ? vp.height - (item.y + bh) : item.y;

  // Copies go on upright, however the original's page has been turned.
  const made = others.map((page) => {
    const copy = { ...copyable(item), page, rot: 0 };
    copy.x = right ? page.vp.width - dx - copy.w : dx;
    copy.y = bottom ? page.vp.height - dy - copy.h : dy;
    keepOnPage(copy);
    return createItem(copy);
  });
  const entry = record(
    `Add to ${others.length} pages`,
    () => made.forEach(detachItem),
    () => made.forEach(attachItem),
  );
  const n = others.length;
  toast(`Added to ${n} more ${n === 1 ? "page" : "pages"}.`, { action: "Undo", onAction: () => undoEntry(entry) });
}

// Copy and paste between pages. Paste lands on the page you're looking at.
let clipboard = null;

function copyItem(item) {
  clipboard = copyable(item);
  toast(`Copied. Ctrl+V pastes it onto the page you're looking at.`);
}

function pasteItem() {
  if (!clipboard || !isOpen()) return false;
  const page = pageInView();
  const clash = state.items.some((i) => i.page === page && i.x === clipboard.x && i.y === clipboard.y);
  const copy = addItem({ ...clipboard, page, x: clipboard.x + (clash ? 12 : 0), y: clipboard.y + (clash ? 12 : 0) });
  keepOnPage(copy);
  layoutItem(copy);
  return true;
}

// Size, place and look of an item, for recording a change to them.
const LOOK = ["x", "y", "w", "h", "size", "face", "bold", "color"];
const lookOf = (item) => Object.fromEntries(LOOK.filter((k) => k in item).map((k) => [k, item[k]]));

function applyLook(item, look) {
  Object.assign(item, look);
  if (item.type === "text") paintText(item);
  layoutItem(item);
}

// Record a change to an item's look. Quick repeats of the same kind of change
// (nudging with the arrows, clicking A+ a few times) fold into one step.
function recordLook(item, before, label, kind) {
  const after = lookOf(item);
  if (LOOK.every((k) => before[k] === after[k])) return;
  const last = history.past.at(-1);
  if (kind && last?.item === item && last.kind === kind && Date.now() - last.at < 1200 && !history.future.length) {
    last.after = after;
    last.at = Date.now();
    return;
  }
  const entry = record(label, () => applyLook(item, entry.before), () => applyLook(item, entry.after), { item, kind, before, after });
}

// An item's footprint on the page. w/h are its own upright size; a stamp on
// a page that was turned afterwards is turned too (rot, clockwise).
const boxOf = (item) => ((item.rot || 0) % 180 ? { bw: item.h, bh: item.w } : { bw: item.w, bh: item.h });

function mountItem(item) {
  const { page } = item;
  const node = el("div", { className: `item item--${item.type}`, tabIndex: 0 });

  if (item.type === "image") {
    node.append(el("img", { src: item.src, alt: item.label || "", draggable: false }));
    node.ariaLabel = item.label || "Stamp";
  } else if (item.type === "text") {
    const body = el("div", { className: "item__text", textContent: item.text });
    node.append(body);
    node.ariaLabel = "Text";
  } else {
    node.ariaLabel = "Whiteout";
  }

  const chip = el("div", { className: "item__chip" });
  if (item.type === "text") chip.append(...textControls(item), el("span", { className: "item__chip-sep", ariaHidden: "true" }));
  const iconBtn = (icon, title, onclick) => el("button", { type: "button", className: "chip-icon", title, ariaLabel: title, innerHTML: icon, onclick });
  chip.append(
    iconBtn(ICONS.duplicate, "Duplicate (Ctrl+D)", () => duplicateItem(item)),
    iconBtn(ICONS.everyPage, "Put on every page", () => stampEveryPage(item)),
    el("button", { type: "button", className: "danger", textContent: "Delete", onclick: () => removeItem(item) }),
  );
  chip.addEventListener("pointerdown", (e) => e.stopPropagation());

  node.append(chip, el("span", { className: "item__handle", ariaHidden: "true" }));
  item.node = node;
  page.itemLayer.append(node);
  if (item.type === "text") paintText(item);
  layoutItem(item);
  bindItem(item);
}

// The style bar on a selected text item: typeface, bold, colour, size.
function textControls(item) {
  const sep = () => el("span", { className: "item__chip-sep", ariaHidden: "true" });
  const faces = Object.entries(FACES).map(([face, f]) => el("button", {
    type: "button",
    className: "chip-face",
    textContent: "Aa",
    title: f.label,
    ariaLabel: f.label,
    dataset: { face },
    style: `font-family:${f.css}`,
    onclick: () => styleText(item, { face }),
  }));
  const bold = el("button", {
    type: "button",
    className: "chip-bold",
    textContent: "B",
    title: "Bold",
    ariaLabel: "Bold",
    onclick: () => styleText(item, { bold: !item.bold }),
  });
  const colors = Object.entries(TEXT_COLORS).map(([name, hex]) => el("button", {
    type: "button",
    className: "chip-color",
    title: name[0].toUpperCase() + name.slice(1),
    ariaLabel: name[0].toUpperCase() + name.slice(1),
    dataset: { color: hex },
    style: `--swatch:${hex}`,
    onclick: () => styleText(item, { color: hex }),
  }));
  return [
    ...faces, bold, sep(),
    ...colors, sep(),
    el("button", { type: "button", textContent: "A−", title: "Smaller", onclick: () => resizeText(item, -1) }),
    el("button", { type: "button", textContent: "A+", title: "Larger", onclick: () => resizeText(item, 1) }),
    sep(),
    el("button", { type: "button", textContent: "Edit", onclick: () => startEditing(item) }),
  ];
}

// Show a text item in its style, and mark the current choices in its bar.
function paintText(item) {
  const body = item.node.querySelector(".item__text");
  body.style.fontFamily = FACES[item.face || "sans"].css;
  body.style.fontWeight = item.bold ? "700" : "400";
  body.style.color = item.color;
  for (const b of item.node.querySelectorAll(".chip-face")) b.ariaPressed = String(b.dataset.face === (item.face || "sans"));
  item.node.querySelector(".chip-bold").ariaPressed = String(Boolean(item.bold));
  for (const b of item.node.querySelectorAll(".chip-color")) b.ariaPressed = String(b.dataset.color === item.color);
}

function styleText(item, patch) {
  const before = lookOf(item);
  Object.assign(item, patch);
  Object.assign(item, measureText(item.text || " ", item.size, item));
  paintText(item);
  layoutItem(item);
  // The next text you add picks up this style.
  state.textStyle = { face: item.face || "sans", bold: Boolean(item.bold), color: item.color };
  store.set("pdfsign.text", JSON.stringify(state.textStyle));
  state.dirty = true;
  recordLook(item, before, "Change text style");
}

function layoutItem(item) {
  const z = state.zoom;
  const rot = item.rot || 0;
  const s = item.node.style;
  const content = item.node.querySelector("img, .item__text");
  s.left = `${item.x * z}px`;
  s.top = `${item.y * z}px`;
  if (item.type === "text") content.style.fontSize = `${item.size * z}px`;

  // Upright text sizes itself, so it can grow while you type.
  if (item.type === "text" && !rot) {
    s.width = s.height = "";
  } else {
    const { bw, bh } = boxOf(item);
    s.width = `${bw * z}px`;
    s.height = `${bh * z}px`;
  }

  placeChip(item);
  if (!content) return;
  content.classList.toggle("is-turned", rot !== 0);
  if (rot) {
    content.style.width = `${item.w * z}px`;
    content.style.height = `${item.h * z}px`;
    content.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
  } else {
    content.style.width = content.style.height = content.style.transform = "";
  }
}

function resizeText(item, step) {
  const before = lookOf(item);
  item.size = clamp(item.size + step, 5, 96);
  Object.assign(item, measureText(item.text, item.size, item));
  layoutItem(item);
  state.dirty = true;
  recordLook(item, before, "Change text size", "text-size");
}

function select(item) {
  if (state.selected && state.selected !== item) {
    state.selected.node.classList.remove("is-selected");
  }
  state.selected = item;
  if (item) {
    item.node.classList.add("is-selected");
    placeChip(item);
  }
}

// Centre the selected item's toolbar over it, but keep it on the page: the
// text style bar is wider than most of what it edits.
function placeChip(item) {
  if (state.selected !== item) return;
  const chip = item.node.querySelector(".item__chip");
  const pageW = item.page.node.clientWidth;
  const left = item.node.offsetLeft;
  const width = chip.offsetWidth;
  let x = (item.node.offsetWidth - width) / 2;
  x = Math.min(x, pageW - left - width - 4);
  x = Math.max(x, 4 - left);
  chip.style.left = `${x}px`;
}

function keepOnPage(item) {
  const { vp } = item.page;
  const { bw, bh } = boxOf(item);
  item.x = clamp(item.x, 0, Math.max(0, vp.width - bw));
  item.y = clamp(item.y, 0, Math.max(0, vp.height - bh));
}

function bindItem(item) {
  const { node } = item;

  node.addEventListener("pointerdown", (e) => {
    if (item.editing || e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    const wasSelected = state.selected === item;
    select(item);
    node.focus({ preventScroll: true });

    const resizing = e.target.classList.contains("item__handle");
    const before = lookOf(item);
    const start = { px: e.clientX, py: e.clientY, x: item.x, y: item.y, w: item.w, h: item.h, size: item.size, ...boxOf(item) };
    let moved = false;
    node.setPointerCapture(e.pointerId);

    const move = (ev) => {
      const dx = (ev.clientX - start.px) / state.zoom;
      const dy = (ev.clientY - start.py) / state.zoom;
      if (Math.abs(dx) + Math.abs(dy) > 1.5) moved = true;
      if (resizing && item.type === "rect") {
        item.w = Math.max(4, start.w + dx);
        item.h = Math.max(4, start.h + dy);
      } else if (resizing) {
        // Stamps and text keep their proportions.
        const k = Math.max(0.15, (start.bw + dx) / start.bw);
        item.w = start.w * k;
        item.h = start.h * k;
        if (item.type === "text") item.size = start.size * k;
      } else {
        item.x = start.x + dx;
        item.y = start.y + dy;
        keepOnPage(item);
      }
      layoutItem(item);
    };

    const end = () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", end);
      node.removeEventListener("pointercancel", end);
      if (moved) {
        state.dirty = true;
        recordLook(item, before, resizing ? `Resize ${KIND_NAMES[item.type]}` : `Move ${KIND_NAMES[item.type]}`);
      } else if (!resizing && wasSelected && item.type === "text") {
        startEditing(item);
      }
    };

    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", end);
    node.addEventListener("pointercancel", end);
  });

  if (item.type === "text") node.addEventListener("dblclick", () => startEditing(item));
}

function startEditing(item) {
  if (item.editing) return;
  const body = item.node.querySelector(".item__text");
  const before = { text: item.text, w: item.w, h: item.h };
  item.editing = true;
  item.node.classList.add("is-editing");
  try { body.contentEditable = "plaintext-only"; } catch { body.contentEditable = "true"; }
  body.focus();
  const range = document.createRange();
  range.selectNodeContents(body);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const onKey = (e) => {
    e.stopPropagation();
    // Enter finishes, Shift+Enter starts a new line.
    if ((e.key === "Enter" && !e.shiftKey) || e.key === "Escape") {
      e.preventDefault();
      body.blur();
    }
  };

  body.addEventListener("keydown", onKey);
  body.addEventListener("blur", () => {
    body.removeEventListener("keydown", onKey);
    body.contentEditable = "false";
    item.editing = false;
    item.node.classList.remove("is-editing");
    item.text = body.innerText.replace(/\n+$/, "");
    body.textContent = item.text;
    // Typing into text you've only just placed is part of placing it: one
    // step, "Add text". Later edits are steps of their own.
    const justAdded = item.fresh && item.added && history.past.at(-1) === item.added;
    item.fresh = false;
    if (!item.text.trim()) {
      if (justAdded) {
        history.past.pop(); // never really added
        syncHistory();
        detachItem(item);
      } else {
        // Deleted by clearing it: undo brings back what it said before.
        Object.assign(item, before);
        body.textContent = item.text;
        removeItem(item);
      }
      return;
    }
    Object.assign(item, measureText(item.text, item.size, item));
    placeChip(item);
    state.dirty = true;
    if (!justAdded && item.text !== before.text) {
      const after = { text: item.text, w: item.w, h: item.h };
      const apply = (v) => { Object.assign(item, v); body.textContent = item.text; layoutItem(item); };
      record("Edit text", () => apply(before), () => apply(after));
    }
  }, { once: true });
}

// ------------------------------------------------------------- tools

const TOOL_HINTS = {
  image: "Click where it goes",
  mark: "Click each box to mark it",
  text: "Click where the text starts",
  rect: "Drag over what you want to hide",
};

function setTool(tool) {
  state.tool = tool;
  for (const btn of $$(".tool[data-tool]")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.tool === tool));
  }
}

function arm(armed, tool) {
  if (!isOpen()) {
    toast("Open a PDF first.");
    setTool("select");
    return;
  }
  state.armed = armed;
  ghost.remove(); // it may still be showing the previous tool's preview
  setTool(tool);
  pagesEl.dataset.armed = armed.type;
  showHint(armed);
  select(null);
}

function disarm() {
  state.armed = null;
  delete pagesEl.dataset.armed;
  ghost.remove();
  showHint(null);
  setTool("select");
}

async function armImage(src, kind, label) {
  const img = await loadImage(src);
  // Default to a height that looks like a hand-signed line on letter/A4.
  const h = kind === "initials" ? 24 : kind === "mark" ? 11 : 34;
  let w = h * (img.naturalWidth / img.naturalHeight);
  const maxW = kind === "initials" ? 90 : 210;
  const k = w > maxW ? maxW / w : 1;
  arm({
    type: "image", src, w: w * k, h: h * k, label,
    sticky: kind === "mark", hint: kind === "mark" ? "mark" : "image",
  }, kind === "mark" ? state.tool : kind);
}

function markPng(kind) {
  const c = el("canvas", { width: 96, height: 96 });
  const ctx = c.getContext("2d");
  ctx.strokeStyle = INKS[state.ink];
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === "check") {
    ctx.moveTo(14, 52); ctx.lineTo(38, 76); ctx.lineTo(84, 20);
  } else {
    ctx.moveTo(18, 18); ctx.lineTo(78, 78); ctx.moveTo(78, 18); ctx.lineTo(18, 78);
  }
  ctx.stroke();
  return c.toDataURL("image/png");
}

function armText(text, { size = 11, edit = false } = {}) {
  arm({ type: "text", text, size, edit }, state.tool);
}

$("#tools").addEventListener("click", (e) => {
  const btn = e.target.closest(".tool[data-tool]");
  if (!btn) return;
  const tool = btn.dataset.tool;
  if (tool === "select") { disarm(); return; }
  if (!isOpen()) { toast("Open a PDF first."); return; }
  setTool(tool);

  switch (tool) {
    case "signature":
    case "initials":
      openPicker(tool);
      break;
    case "text":
      armText("", { size: 11, edit: true });
      break;
    case "date":
      armText(formatDate(new Date(), state.profile.date_format));
      break;
    case "name":
      if (!state.profile.name) {
        openProfile(() => {
          if (!state.profile.name) return;
          setTool("name");
          armText(state.profile.name);
        });
      } else {
        armText(state.profile.name);
      }
      break;
    case "snippet":
      openSnippets();
      break;
    case "check":
    case "cross":
      armImage(markPng(tool), "mark", tool === "check" ? "Check mark" : "Cross mark");
      break;
    case "whiteout":
      arm({ type: "rect" }, "whiteout");
      break;
  }
});

// Inks: one colour for everything you add, remembered between visits.
function setInk(ink) {
  state.ink = ink;
  store.set("pdfsign.ink", ink);
  for (const btn of $$(".ink")) btn.setAttribute("aria-checked", String(btn.dataset.ink === ink));
  $("#ink-label").textContent = ink === "black" ? "Black ink" : "Blue ink";
  if (padState.tab === "type") renderFontChoices();
  if (padState.tab === "upload" && $("#pad-recolor").checked) processPhoto();
  // A mark tool already armed should pick up the new colour.
  if (state.armed?.sticky && (state.tool === "check" || state.tool === "cross")) {
    armImage(markPng(state.tool), "mark", state.armed.label);
  }
}

for (const btn of $$(".ink")) btn.addEventListener("click", () => setInk(btn.dataset.ink));

// ------------------------------------------------------------- placing on a page

const ghost = el("div", { className: "ghost" });

function pagePoint(page, e) {
  const box = page.node.getBoundingClientRect();
  return { x: (e.clientX - box.left) / state.zoom, y: (e.clientY - box.top) / state.zoom };
}

function bindPage(page) {
  page.node.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".item") || (!state.armed && e.target.closest(".field"))) return;
    if (!state.armed) {
      select(null);
      return;
    }
    e.preventDefault();
    const pt = pagePoint(page, e);
    if (state.armed.type === "rect") drawWhiteout(page, pt, e);
    else place(page, pt);
  });

  page.node.addEventListener("pointermove", (e) => {
    const a = state.armed;
    if (!a || a.type === "rect" || e.pointerType === "touch") return;
    const pt = pagePoint(page, e);
    if (ghost.parentNode !== page.itemLayer) {
      ghost.replaceChildren(
        a.type === "image"
          ? el("img", { src: a.src, alt: "" })
          : el("div", { className: "item__text", textContent: a.text || "Text" }),
      );
      page.itemLayer.append(ghost);
    }
    const z = state.zoom;
    if (a.type === "image") {
      Object.assign(ghost.style, {
        left: `${(pt.x - a.w / 2) * z}px`, top: `${(pt.y - a.h / 2) * z}px`,
        width: `${a.w * z}px`, height: `${a.h * z}px`,
      });
    } else {
      const { h } = measureText(a.text || "Text", a.size, state.textStyle);
      Object.assign(ghost.style, { left: `${pt.x * z}px`, top: `${(pt.y - h / 2) * z}px`, width: "", height: "" });
      ghost.firstChild.style.font = cssFont(state.textStyle, a.size * z);
      ghost.firstChild.style.color = state.textStyle.color;
    }
  });

  page.node.addEventListener("pointerleave", () => ghost.remove());
}

function place(page, pt) {
  const a = state.armed;
  let item;
  if (a.type === "image") {
    item = { type: "image", page, src: a.src, label: a.label, w: a.w, h: a.h, x: pt.x - a.w / 2, y: pt.y - a.h / 2 };
  } else {
    const size = a.size;
    const style = { ...state.textStyle };
    const { w, h } = measureText(a.text || " ", size, style);
    item = { type: "text", page, text: a.text, size, ...style, w, h, x: pt.x, y: pt.y - h / 2 };
  }
  keepOnPage(item);
  const placed = addItem(item);
  if (!a.sticky) disarm();
  if (a.edit) {
    placed.fresh = true;
    startEditing(placed);
  }
}

function drawWhiteout(page, start, e) {
  const item = addItem({ type: "rect", page, x: start.x, y: start.y, w: 0, h: 0 });
  page.node.setPointerCapture(e.pointerId);

  const move = (ev) => {
    const pt = pagePoint(page, ev);
    item.x = Math.min(start.x, pt.x);
    item.y = Math.min(start.y, pt.y);
    item.w = Math.abs(pt.x - start.x);
    item.h = Math.abs(pt.y - start.y);
    layoutItem(item);
  };

  const end = () => {
    page.node.removeEventListener("pointermove", move);
    page.node.removeEventListener("pointerup", end);
    page.node.removeEventListener("pointercancel", end);
    // A click without a drag gets a box the size of a line of text.
    if (item.w < 3 && item.h < 3) Object.assign(item, { w: 110, h: 16, y: start.y - 8 });
    keepOnPage(item);
    layoutItem(item);
    disarm();
    select(item);
  };

  page.node.addEventListener("pointermove", move);
  page.node.addEventListener("pointerup", end);
  page.node.addEventListener("pointercancel", end);
}

// ------------------------------------------------------------- keyboard

document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='plaintext-only'], dialog")) return;
  const item = state.selected;
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  // In a field or while typing a stamp, these are the browser's own.
  if (mod && isOpen()) {
    if (key === "z") { e.preventDefault(); (e.shiftKey ? redo : undo)(); return; }
    if (key === "y") { e.preventDefault(); redo(); return; }
    if (key === "d" && item) { e.preventDefault(); duplicateItem(item); return; }
    if (key === "c" && item && !getSelection().toString()) { e.preventDefault(); copyItem(item); return; }
    if (key === "v" && clipboard) { e.preventDefault(); pasteItem(); return; }
  }

  if (e.key === "Escape") {
    if (state.armed) disarm();
    else select(null);
    return;
  }
  if (!item) return;

  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    removeItem(item);
  } else if (e.key.startsWith("Arrow")) {
    e.preventDefault();
    const before = lookOf(item);
    const step = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowLeft") item.x -= step;
    if (e.key === "ArrowRight") item.x += step;
    if (e.key === "ArrowUp") item.y -= step;
    if (e.key === "ArrowDown") item.y += step;
    keepOnPage(item);
    layoutItem(item);
    state.dirty = true;
    recordLook(item, before, `Move ${KIND_NAMES[item.type]}`, "nudge");
  } else if (e.key === "Enter" && item.type === "text") {
    e.preventDefault();
    startEditing(item);
  }
});

// ------------------------------------------------------------- dialogs

for (const btn of $$("[data-close]")) {
  btn.addEventListener("click", () => btn.closest("dialog").close());
}

for (const dialog of $$("dialog")) {
  // Picking a tool that opens a dialog, then cancelling, shouldn't leave the
  // tool looking active.
  dialog.addEventListener("close", () => { if (!state.armed) setTool("select"); });
  // Click on the backdrop closes.
  dialog.addEventListener("pointerdown", (e) => { if (e.target === dialog) dialog.close(); });
}

// --- saved signature picker ---

const picker = $("#picker");
let pickerKind = "signature";

function openPicker(kind) {
  pickerKind = kind;
  const saved = state.signatures.filter((s) => s.kind === kind);
  if (!saved.length) { openPad(kind); return; }
  $("#picker-title").textContent = kind === "initials" ? "Your initials" : "Your signatures";
  $("#picker-new").textContent = kind === "initials" ? "New initials" : "New signature";
  renderStamps();
  picker.showModal();
}

function renderStamps() {
  const saved = state.signatures.filter((s) => s.kind === pickerKind);
  const grid = $("#stamps");
  grid.replaceChildren();
  if (!saved.length) {
    grid.append(el("p", { className: "stamps__empty", textContent: "Nothing saved yet." }));
    return;
  }
  for (const sig of saved) {
    const use = el("button", {
      type: "button",
      className: "stamp",
      ariaLabel: `Use this ${pickerKind === "initials" ? "set of initials" : "signature"}`,
      onclick: () => {
        picker.close();
        armImage(sig.url, pickerKind, pickerKind === "initials" ? "Initials" : "Signature");
      },
    }, el("img", { src: sig.url, alt: "" }));
    const del = el("button", {
      type: "button",
      className: "stamp__delete",
      ariaLabel: "Delete",
      title: "Delete",
      textContent: "×",
      onclick: async (e) => {
        e.stopPropagation();
        try {
          await api(`/api/signatures/${sig.id}`, undefined, "DELETE");
          state.signatures = state.signatures.filter((s) => s.id !== sig.id);
          renderStamps();
        } catch (err) {
          toast(err.message, { tone: "error" });
        }
      },
    });
    grid.append(el("div", { style: "position:relative" }, use, del));
  }
}

$("#picker-new").addEventListener("click", () => {
  picker.close();
  openPad(pickerKind);
});

// --- signature pad: draw, type, upload, or sign on your phone ---

const pad = $("#pad");
const pen = attachPen($("#pad-canvas"), { color: () => INKS[state.ink] });
const padState = { kind: "signature", tab: "draw", font: 0, photo: null, upload: null };

function openPad(kind) {
  padState.kind = kind;
  $("#pad-title").textContent = kind === "initials" ? "New initials" : "New signature";
  $("#pad-text").value = kind === "initials" ? state.profile.initials : state.profile.name;
  $("#pad-error").hidden = true;
  pad.showModal();
  setTab(padState.tab);
}

function setTab(tab) {
  padState.tab = tab;
  for (const btn of $$("[role=tab]", pad)) btn.setAttribute("aria-selected", String(btn.dataset.tab === tab));
  for (const panel of $$("[data-panel]", pad)) panel.hidden = panel.dataset.panel !== tab;
  $("#pad-error").hidden = true;
  // The phone tab finishes on its own when the signature arrives.
  $("#pad-use").hidden = tab === "phone";
  if (tab === "type") renderFontChoices();
  if (tab === "draw") pen.reset();
  if (tab === "phone") startPhone();
  else stopPhone();
}

for (const btn of $$("[role=tab]", pad)) btn.addEventListener("click", () => setTab(btn.dataset.tab));
pad.addEventListener("close", stopPhone);

$("#pad-clear").addEventListener("click", () => pen.reset());

function renderFontChoices() {
  const wrap = $("#pad-fonts");
  const text = $("#pad-text").value.trim() || (padState.kind === "initials" ? "AB" : "Your name");
  wrap.replaceChildren(...TYPE_FONTS.map((f, i) => el("button", {
    type: "button",
    role: "radio",
    ariaChecked: String(i === padState.font),
    ariaLabel: f.family,
    textContent: text,
    style: `font-family:"${f.family}",cursive;font-size:${Math.round(34 * f.scale)}px;color:${INKS[state.ink]}`,
    onclick: () => { padState.font = i; renderFontChoices(); },
  })));
}

$("#pad-text").addEventListener("input", renderFontChoices);

async function renderTyped() {
  const text = $("#pad-text").value.trim();
  if (!text) return null;
  const f = TYPE_FONTS[padState.font];
  const size = Math.round(120 * f.scale);
  const font = `${size}px "${f.family}"`;
  await document.fonts.load(font, text);
  const ctx = el("canvas").getContext("2d");
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width + size);
  const c = el("canvas", { width, height: Math.ceil(size * 2) });
  const cx = c.getContext("2d");
  cx.font = font;
  cx.fillStyle = INKS[state.ink];
  cx.textBaseline = "middle";
  cx.fillText(text, size / 2, size);
  return trimCanvas(c, 10);
}

// Uploaded photos and scans: lift the ink off the paper so the stamp sits on
// the page instead of pasting a grey rectangle over it.
async function loadPhoto() {
  const file = $("#pad-file").files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    padState.photo = await loadImage(url);
  } catch (err) {
    padError(err.message);
    return;
  } finally {
    URL.revokeObjectURL(url);
  }
  processPhoto();
}

function processPhoto() {
  const img = padState.photo;
  if (!img) return;
  const knockout = $("#pad-knockout").checked;
  $("#pad-recolor").disabled = !knockout;

  const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = el("canvas", { width: Math.round(img.naturalWidth * k), height: Math.round(img.naturalHeight * k) });
  c.getContext("2d", { willReadFrequently: true }).drawImage(img, 0, 0, c.width, c.height);
  if (knockout) {
    liftInk(c, { recolor: $("#pad-recolor").checked ? INKS[state.ink] : undefined });
  }

  const trimmed = trimCanvas(c, 8);
  if (!trimmed) {
    padError("Nothing was left after removing the background. Try a darker pen, or turn off background removal.");
    return;
  }
  padState.upload = trimmed;
  const preview = $("#pad-preview");
  preview.width = trimmed.width;
  preview.height = trimmed.height;
  preview.getContext("2d").drawImage(trimmed, 0, 0);
  preview.hidden = false;
  $("#pad-drop-text").textContent = "Choose a different image";
  $("#pad-error").hidden = true;
}

$("#pad-file").addEventListener("change", loadPhoto);
$("#pad-knockout").addEventListener("change", processPhoto);
$("#pad-recolor").addEventListener("change", processPhoto);

function padError(message) {
  const box = $("#pad-error");
  box.textContent = message;
  box.hidden = false;
}

// Every way of making a signature ends here: keep it if asked, then arm it.
async function finishSignature(png) {
  const kind = padState.kind;
  if ($("#pad-keep").checked) {
    try {
      const row = await api("/api/signatures", { kind, png });
      state.signatures.unshift(row);
    } catch (err) {
      padError(`Couldn't save it: ${err.message}`);
      return;
    }
  }
  pad.close();
  armImage(png, kind, kind === "initials" ? "Initials" : "Signature");
}

$("#pad-use").addEventListener("click", async () => {
  let canvas = null;
  if (padState.tab === "draw") {
    canvas = pen.hasInk() ? trimCanvas($("#pad-canvas"), 12) : null;
    if (!canvas) return padError("Sign in the box first.");
  } else if (padState.tab === "type") {
    canvas = await renderTyped();
    if (!canvas) return padError("Type your name first.");
  } else {
    canvas = padState.upload;
    if (!canvas) return padError("Choose an image first.");
  }
  finishSignature(canvas.toDataURL("image/png"));
});

// --- sign on your phone ---
//
// The server hands out a one-time link, shown as a QR code. The phone opens
// it, you sign with a finger, and this page picks the result up by polling.

const phone = { token: null, timer: 0 };

function phoneStatus(message, { retry = false } = {}) {
  $("#phone-status").textContent = message;
  $("#phone-retry").hidden = !retry;
}

async function startPhone() {
  stopPhone();
  $("#phone-qr").replaceChildren();
  $("#phone-url").textContent = "";
  $("#phone").dataset.state = "loading";
  phoneStatus("Making a code…");

  let session;
  try {
    session = await api("/api/phone", { kind: padState.kind, ink: state.ink });
  } catch (err) {
    $("#phone").dataset.state = "error";
    phoneStatus(err.message, { retry: true });
    return;
  }
  // The dialog may have moved on while the code was being made.
  if (!pad.open || padState.tab !== "phone") {
    api(`/api/phone/${session.token}`, undefined, "DELETE").catch(() => {});
    return;
  }
  phone.token = session.token;
  $("#phone-qr").innerHTML = session.qr; // SVG from our own server
  $("#phone-url").textContent = session.url;
  $("#phone").dataset.state = "waiting";
  phoneStatus("Point your phone's camera at the code.");
  pollPhone(session.token);
}

function pollPhone(token) {
  phone.timer = setTimeout(async () => {
    if (token !== phone.token) return;
    let session;
    try {
      session = await api(`/api/phone/${token}`);
    } catch {
      if (token !== phone.token) return;
      phone.token = null;
      $("#phone").dataset.state = "error";
      phoneStatus("That code expired.", { retry: true });
      return;
    }
    if (token !== phone.token) return;
    if (session.status === "done") {
      phone.token = null;
      finishSignature(session.png);
      return;
    }
    if (session.status === "opened") {
      $("#phone").dataset.state = "opened";
      phoneStatus("Connected. Sign on your phone, then tap Send.");
    }
    pollPhone(token);
  }, 1200);
}

function stopPhone() {
  clearTimeout(phone.timer);
  if (phone.token) {
    api(`/api/phone/${phone.token}`, undefined, "DELETE").catch(() => {});
    phone.token = null;
  }
}

$("#phone-retry").addEventListener("click", startPhone);

// --- snippets: text you put on forms again and again ---

const snippetsDialog = $("#snippets");

// Editing snippets from the Snippets tool comes back to the picker after.
const editSnippets = () => openProfile(() => { if (state.profile.snippets?.length) openSnippets(); }, { snippets: true });

function openSnippets() {
  const snippets = state.profile.snippets || [];
  if (!snippets.length) {
    editSnippets();
    return;
  }
  $("#snip-list").replaceChildren(...snippets.map((s) => el("button", {
    type: "button",
    className: "snip",
    onclick: () => {
      snippetsDialog.close();
      setTool("snippet");
      armText(s.text);
    },
  },
  s.label ? el("span", { className: "snip__label", textContent: s.label }) : null,
  el("span", { className: "snip__text", textContent: s.text }))));
  snippetsDialog.showModal();
  $("#snip-list .snip")?.focus();
}

$("#snip-manage").addEventListener("click", () => {
  snippetsDialog.close();
  editSnippets();
});

// The snippet rows in the profile form.
function snippetRow(s = { label: "", text: "" }) {
  const row = el("div", { className: "snip-row" },
    el("label", { className: "input" }, el("span", { textContent: "Label" }),
      el("input", { name: "snip-label", value: s.label, maxLength: 40, placeholder: "Home address" })),
    el("label", { className: "input" }, el("span", { textContent: "Text" }),
      el("textarea", { name: "snip-text", value: s.text, maxLength: 500, rows: 2, placeholder: "12 Rue Example\n1000 Brussels" })),
  );
  row.append(el("button", {
    type: "button",
    className: "snip-row__remove",
    title: "Remove snippet",
    ariaLabel: "Remove snippet",
    innerHTML: ICONS.del,
    onclick: () => row.remove(),
  }));
  return row;
}

$("#snip-add").addEventListener("click", () => {
  const row = snippetRow();
  $("#snip-rows").append(row);
  row.querySelector("input").focus();
});

// --- profile ---

const profileDialog = $("#profile");
let afterProfile = null;

$("#date-format").append(...DATE_FORMATS.map((f) => el("option", {
  value: f,
  textContent: `${formatDate(new Date(), f)}  (${f.toLowerCase()})`,
})));

function openProfile(then, { snippets = false } = {}) {
  afterProfile = then || null;
  const form = $("#profile-form");
  form.name.value = state.profile.name;
  form.initials.value = state.profile.initials;
  form.date_format.value = state.profile.date_format;
  $("#snip-rows").replaceChildren(...(state.profile.snippets || []).map(snippetRow));
  $("#profile-dir").textContent = state.outputDir ? `Save to folder writes into ${state.outputDir}` : "";
  profileDialog.showModal();
  // Came here from the Snippets tool: go straight to them, with a row ready.
  if (snippets) {
    if (!state.profile.snippets?.length) $("#snip-add").click();
    $("#snip-edit").scrollIntoView({ block: "start" });
    $("#snip-rows input")?.focus();
  }
}

$("#profile-open").addEventListener("click", () => openProfile());

$("#profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    const snippets = $$(".snip-row", form).map((row) => ({
      label: row.querySelector("[name=snip-label]").value,
      text: row.querySelector("[name=snip-text]").value,
    })).filter((s) => s.text.trim());
    state.profile = await api("/api/profile", {
      name: form.name.value,
      initials: form.initials.value,
      date_format: form.date_format.value,
      snippets,
    }, "PUT");
  } catch (err) {
    toast(err.message, { tone: "error" });
    return;
  }
  profileDialog.close();
  toast("Profile saved.");
  const then = afterProfile;
  afterProfile = null;
  if (then) then();
});

// ------------------------------------------------------------- export

function fillForm(doc, skipped) {
  let form;
  try {
    form = doc.getForm();
  } catch {
    skipped.push("all form fields");
    return;
  }
  for (const [name, { kind, value, label }] of state.formValues) {
    try {
      const field = form.getField(name);
      if (field instanceof PDFTextField) {
        field.setText(value || undefined);
      } else if (field instanceof PDFCheckBox) {
        if (value) field.check(); else field.uncheck();
      } else if (field instanceof PDFRadioGroup) {
        field.select(value);
      } else if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
        // pdf-lib names options by export value or display text depending
        // on how the form was authored; try both.
        try { field.select(value); } catch { field.select(label); }
      } else {
        throw new Error(`unexpected ${kind} field`);
      }
    } catch {
      skipped.push(name);
    }
  }
}

// pdf-lib's flatten deletes the field widgets but can leave pages pointing
// at them. Readers cope, but it's a broken file; drop the dead references.
function dropDeadAnnots(doc) {
  for (const page of doc.getPages()) {
    const annots = page.node.lookup(PDFName.of("Annots"));
    if (!(annots instanceof PDFArray)) continue;
    const alive = annots.asArray().filter((ref) => !(ref instanceof PDFRef) || doc.context.lookup(ref));
    if (alive.length === annots.size()) continue;
    if (alive.length) page.node.set(PDFName.of("Annots"), doc.context.obj(alive));
    else page.node.delete(PDFName.of("Annots"));
  }
}

async function loadForWriting(src) {
  try {
    return await PDFDocument.load(src.bytes, { updateMetadata: false });
  } catch (err) {
    if (/encrypt/i.test(err.message)) {
      throw new Error(`${src.name} has editing restrictions set by whoever made it, so pdfsign can't write into it.`);
    }
    throw err;
  }
}

// A deleted page's text and images would otherwise still sit in the saved
// file: invisible, but readable by anyone who looks. Blank the page itself
// (bookmarks or form fields may still point at it), then drop every object
// the finished document no longer reaches.
function purgeDeleted(doc, dropped) {
  for (const page of dropped) {
    for (const key of ["Contents", "Resources", "Annots", "Thumb"]) page.node.delete(PDFName.of(key));
  }
  const { context } = doc;
  const reached = new Set();
  const visit = (obj) => {
    if (obj instanceof PDFRef) {
      if (reached.has(obj.tag)) return;
      reached.add(obj.tag);
      visit(context.lookup(obj));
    } else if (obj instanceof PDFDict) {
      for (const [, value] of obj.entries()) visit(value);
    } else if (obj instanceof PDFArray) {
      for (const value of obj.asArray()) visit(value);
    } else if (obj instanceof PDFStream) {
      visit(obj.dict);
    }
  };
  visit(context.trailerInfo.Root);
  visit(context.trailerInfo.Info);
  for (const [ref] of context.enumerateIndirectObjects()) {
    if (!reached.has(ref.tag)) context.delete(ref);
  }
}

// Where a point of an item's own upright content lands on its page, for an
// item turned clockwise by item.rot.
function contentPoint(item, cx, cy) {
  const { bw, bh } = boxOf(item);
  switch (item.rot || 0) {
    case 90: return [item.x + bw - cy, item.y + cx];
    case 180: return [item.x + bw - cx, item.y + bh - cy];
    case 270: return [item.x + cy, item.y + bh - cx];
    default: return [item.x + cx, item.y + cy];
  }
}

async function buildPdf() {
  const [base, ...added] = state.sources;
  const doc = await loadForWriting(base);

  const skipped = [];
  if (state.formValues.size) fillForm(doc, skipped);

  // Lock the fields: their answers are drawn onto the page and the fields
  // themselves removed, so nobody can change them in the saved copy.
  let flattened = false;
  state.lockFailed = false;
  if (lockOnSave() && !$("#fieldnav").hidden) {
    try {
      doc.getForm().flatten();
      dropDeadAnnots(doc);
      flattened = true;
    } catch {
      state.lockFailed = true;
    }
  }

  // Assemble the page order. The base PDF's own pages are moved in place, so
  // its form keeps working; pages from added PDFs are copied in.
  const own = doc.getPages();
  const copied = new Map();
  for (const src of added) {
    const used = state.pages.filter((p) => p.src === src);
    if (!used.length) continue;
    const from = await loadForWriting(src);
    const pages = await doc.copyPages(from, used.map((p) => p.srcIndex));
    used.forEach((p, i) => copied.set(p, pages[i]));
  }
  const kept = new Set(state.pages.filter((p) => p.src === base).map((p) => p.srcIndex));
  const dropped = own.filter((_, i) => !kept.has(i));

  for (let i = doc.getPageCount() - 1; i >= 0; i--) doc.removePage(i);
  const outPages = new Map();
  state.pages.forEach((page, i) => {
    const out = page.src === base ? own[page.srcIndex] : copied.get(page);
    doc.insertPage(i, out);
    out.setRotation(degrees(rotationOf(page)));
    outPages.set(page, out);
  });

  const fonts = new Map();
  const fontFor = async (item) => {
    const name = FACES[item.face || "sans"].pdf[item.bold ? 1 : 0];
    if (!fonts.has(name)) fonts.set(name, await doc.embedFont(name));
    return fonts.get(name);
  };
  const images = new Map();
  const embed = async (src) => {
    if (!images.has(src)) {
      const bytes = await (await fetch(src)).arrayBuffer();
      images.set(src, await doc.embedPng(bytes));
    }
    return images.get(src);
  };

  for (const item of state.items) {
    const { page } = item;
    const out = outPages.get(page);
    // pdf.js speaks the page as displayed (rotation, crop box); convert each
    // anchor back into the page's own coordinates. Turning by the page's
    // rotation makes a stamp read upright; its own rot turns it back again.
    const rotate = degrees(rotationOf(page) - (item.rot || 0));
    const at = (x, y) => {
      const [px, py] = page.vp.convertToPdfPoint(x, y);
      return { x: px, y: py };
    };
    const image = async (src) => {
      out.drawImage(await embed(src), { ...at(...contentPoint(item, 0, item.h)), width: item.w, height: item.h, rotate });
    };

    if (item.type === "image") {
      await image(item.src);
    } else if (item.type === "rect") {
      out.drawRectangle({ ...at(item.x, item.y + item.h), width: item.w, height: item.h, color: rgb(1, 1, 1), rotate });
    } else if (item.type === "text") {
      const lines = item.text.split("\n");
      const font = await fontFor(item);
      let encodable = true;
      try { lines.forEach((line) => font.encodeText(line)); } catch { encodable = false; }

      if (encodable) {
        lines.forEach((line, i) => {
          out.drawText(line, {
            ...at(...contentPoint(item, 0, baselineOffset(item, item.size, i))),
            size: item.size, font, color: hexRgb(item.color), rotate,
          });
        });
      } else {
        // The built-in fonts only cover Western European characters. Anything else
        // (Swahili is fine; Greek, emoji, CJK aren't) goes in as an image.
        await image(textPng(item));
      }
    }
  }

  if (dropped.length) purgeDeleted(doc, dropped);

  try {
    return { bytes: await doc.save(), skipped };
  } catch (err) {
    if (!state.formValues.size || flattened) throw err;
    // Usually a filled-in value the default form font can't draw. Leave the
    // appearance to the viewer instead of failing the whole save.
    doc.getForm().acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.True);
    return { bytes: await doc.save({ updateFieldAppearances: false }), skipped };
  }
}

function textPng(item) {
  const scale = 4;
  const c = el("canvas", { width: Math.ceil(item.w * scale), height: Math.ceil(item.h * scale) });
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);
  ctx.font = cssFont(item, item.size);
  ctx.fillStyle = item.color;
  item.text.split("\n").forEach((line, i) => ctx.fillText(line, 0, baselineOffset(item, item.size, i)));
  return c.toDataURL("image/png");
}

function outputName() {
  const stem = state.sources[0].name.replace(/\.pdf$/i, "");
  return `${stem}-signed.pdf`;
}

async function exportPdf(dest) {
  if (!isOpen()) return;
  document.activeElement?.blur(); // commit a text item still being typed
  select(null);

  const buttons = [$("#download"), $("#save")];
  buttons.forEach((b) => { b.disabled = true; });
  let result;
  try {
    result = await buildPdf();
  } catch (err) {
    toast(`Couldn't write the PDF: ${err.message}`, { tone: "error" });
    return;
  } finally {
    buttons.forEach((b) => { b.disabled = false; });
  }

  let note = result.skipped.length ? ` Couldn't fill: ${result.skipped.join(", ")}.` : "";
  if (state.lockFailed) note += " Couldn't lock the fields, so they can still be edited.";
  state.lockFailed = false;
  const name = outputName();

  // The licence is checked only once a PDF exists, so a failed build above costs nothing.
  if (!(await spendExport())) return;

  if (dest === "download" && inDesktopApp()) {
    let saved;
    try {
      saved = await window.pywebview.api.save_file(name, bytesToBase64(result.bytes));
    } catch (err) {
      toast(`Couldn't save: ${err.message || err}`, { tone: "error" });
      return;
    }
    if (saved.error) { toast(saved.error, { tone: "error" }); return; }
    if (!saved.saved) return; // cancelled the dialog
    state.dirty = false;
    toast(`Saved ${saved.name}.${note}`, {
      tone: note ? "error" : "info",
      action: "Show in folder",
      onAction: () => window.pywebview.api.reveal(saved.path),
    });
    return;
  }

  if (dest === "download") {
    const url = URL.createObjectURL(new Blob([result.bytes], { type: "application/pdf" }));
    const a = el("a", { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    state.dirty = false;
    // On a phone the signed PDF usually goes straight on to WhatsApp or email.
    const file = new File([result.bytes], name, { type: "application/pdf" });
    const share = WEB && navigator.canShare?.({ files: [file] });
    toast(`Downloaded ${name}.${note}`, {
      tone: note ? "error" : "info",
      ...(share && {
        action: "Share",
        onAction: () => navigator.share({ files: [file] }).catch(() => { /* closed the share sheet */ }),
        duration: 12000,
      }),
    });
    return;
  }

  try {
    const res = await fetch(`/api/output?name=${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: result.bytes,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
    state.dirty = false;
    toast(`Saved ${data.name}.${note}`, {
      tone: note ? "error" : "info",
      action: "Show folder",
      onAction: () => api("/api/reveal", {}).catch(() => {}),
    });
  } catch (err) {
    toast(`Couldn't save: ${err.message}`, { tone: "error" });
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// ------------------------------------------------------------- licence

// The licence key is checked by this computer's own server (app/license.py),
// or on the web by the same check ported to web/license.js; nothing here
// talks to the internet. Exporting needs a key.

const licenseDialog = $("#license");
const here = WEB ? "this browser" : "this computer";

if (WEB) {
  $(".empty p").textContent =
    "Choose one, or drop it on this page. It's opened right here in your browser and never uploaded. " +
    "Add more PDFs later to join their pages.";
  $(".license__privacy").firstChild.textContent =
    "Your key is checked and kept in this browser: enter it again if you clear your browsing data. " +
    "pdfsign never sends it, or your documents, anywhere. ";
  // The store's thank-you page, open in another tab, saves a new key here.
  window.addEventListener("storage", (e) => { if (e.key === "yarp.keys") refreshLicense(); });
}

async function refreshLicense() {
  try {
    state.license = await api("/api/license");
  } catch {
    return;
  }
  const lic = state.license;
  $("#license-open").dataset.licensed = String(lic.licensed);
  $("#license-label").textContent = lic.licensed ? "Licence" : "Unlicensed";
  $("#license-open").title = lic.licensed
    ? `Licensed to ${lic.email}`
    : "Enter a licence key, or buy one, to export";
}

function openLicense({ needsLicense = false } = {}) {
  const lic = state.license || { licensed: false };
  let text;
  if (lic.licensed) {
    text = `Licensed to ${lic.email}. Thank you for buying pdfsign.`;
  } else if (needsLicense) {
    text = "Enter the licence key from your purchase email to export. Everything else keeps working.";
  } else {
    text = "Filling and editing are free. Enter the licence key from your purchase email to download or save.";
  }
  $("#license-state").textContent = text;
  $("#license-version").textContent = lic.version ? `Version ${lic.version}.` : "";
  $("#license-field").hidden = lic.licensed;
  $("#license-unlock").hidden = lic.licensed;
  $("#license-remove").hidden = !lic.licensed;
  $("#license-buy").hidden = lic.licensed;
  $("#license-buy").href = lic.store_url || "https://yarpdevelopers.com/store/pdfsign";
  $("#license-error").hidden = true;
  $("#license-form").key.value = "";
  licenseDialog.showModal();
  if (!lic.licensed) $("#license-form").key.focus();
}

// Check the licence before spending an export. False (and the Licence
// dialog) unless a key is set.
async function spendExport() {
  try {
    state.license = await api("/api/license/consume", {});
  } catch (err) {
    if (err.status === 402) {
      await refreshLicense();
      openLicense({ needsLicense: true });
    } else {
      toast(WEB ? `Couldn't check the licence: ${err.message}` : "Couldn't reach pdfsign's own server. Is it still running?", { tone: "error" });
    }
    return false;
  }
  refreshLicense();
  return true;
}

$("#license-open").addEventListener("click", () => openLicense());

$("#license-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = e.target.key.value.trim();
  const box = $("#license-error");
  try {
    state.license = await api("/api/license", { key });
  } catch (err) {
    box.textContent = err.message;
    box.hidden = false;
    return;
  }
  await refreshLicense();
  licenseDialog.close();
  toast(`Unlocked. Thank you, ${state.license.email}.`);
});

$("#license-remove").addEventListener("click", async () => {
  state.license = await api("/api/license", undefined, "DELETE");
  await refreshLicense();
  licenseDialog.close();
  toast(`Licence key removed from ${here}.`);
});

$("#download").addEventListener("click", () => exportPdf("download"));
$("#save").addEventListener("click", () => exportPdf("save"));

// ------------------------------------------------------------- file intake

$("#file").addEventListener("change", (e) => {
  openFile(e.target.files[0]);
  e.target.value = "";
});

// Drop a PDF anywhere on the window.
let dragDepth = 0;
window.addEventListener("dragenter", (e) => {
  if (!e.dataTransfer?.types.includes("Files")) return;
  dragDepth++;
  desk.classList.add("is-dropping");
});
window.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) desk.classList.remove("is-dropping");
});
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  dragDepth = 0;
  desk.classList.remove("is-dropping");
  if (pad.open) return; // the pad has its own image picker
  // With a PDF already open, dropped PDFs are added to it; Open PDF replaces.
  const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
  if (files.length) addFiles(files);
  else if (e.dataTransfer?.files.length) toast("That file isn't a PDF.", { tone: "error" });
});

window.addEventListener("beforeunload", (e) => {
  if (state.dirty) e.preventDefault();
});

// ------------------------------------------------------------- boot

setInk(state.ink);

(async () => {
  try {
    const [profile, signatures, health] = await Promise.all([
      api("/api/profile"), api("/api/signatures"), api("/api/health"),
    ]);
    state.profile = profile;
    state.signatures = signatures;
    state.outputDir = health.output_dir;
    refreshLicense();
  } catch (err) {
    toast(WEB ? `pdfsign couldn't start: ${err.message}` : "Can't reach the pdfsign server. Is run.ps1 still running?", { tone: "error", sticky: true });
  }
})();
