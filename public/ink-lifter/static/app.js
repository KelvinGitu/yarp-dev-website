/* Ink Lifter: open photos, lift the ink off in a worker, save the results.

   Images live only in this window. Nothing is uploaded; the local server is
   asked only to check the licence and to write "Export all" into a folder. */

import { DEFAULTS } from "./ink.js";

// The same page runs two ways: in the desktop app, behind Ink Lifter's own
// local server, and at yarpdevelopers.com/ink-lifter (web/build.py), where
// there is no server and web/local-api.js answers the licence requests.
const WEB = document.documentElement.dataset.mode === "web";
const localApi = WEB ? (await import("./web/local-api.js")).default : null;

// A phone: less memory, so fewer workers and a smaller working size
// (worker.js), and Share rather than Copy.
const PHONE = WEB && matchMedia("(pointer: coarse)").matches;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? "" : v);
  }
  node.append(...children.filter((c) => c != null));
  return node;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function api(path, { method = "GET", body } = {}) {
  if (localApi) return localApi(method, path, body);
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try { detail = (await res.json()).detail || detail; } catch { /* not JSON */ }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ------------------------------------------------------------ settings

// What a new image starts with: the last settings you used, remembered by
// this window. Rotation belongs to one photo, so it isn't carried over.
const FACTORY = {
  start: DEFAULTS.start,
  solid: DEFAULTS.solid,
  cell: DEFAULTS.cell,
  specks: DEFAULTS.specks,
  ink: "",
  custom: "#b3362c",
  margin: 8,
  size: 0,
  format: "png",
};
const STORE_KEY = "inklifter.settings";

function loadDefaults() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return { ...FACTORY, ...saved };
  } catch {
    return { ...FACTORY };
  }
}

function saveDefaults(s) {
  const { rotate, force, ...keep } = s;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(keep)); } catch { /* storage off */ }
}

let defaults = loadDefaults();

const inkOf = (s) => (s.ink === "custom" ? s.custom : s.ink);

// ------------------------------------------------------------ state

const state = {
  items: [],
  selected: null,
  view: "after",
  backdrop: "checker",
  actual: false,
  split: 0.5,
  license: null,
  exporting: false,
};
let nextId = 1;

const current = () => state.items.find((i) => i.id === state.selected) || null;
const finished = () => state.items.filter((i) => i.status === "done");
const busy = () => state.items.some((i) => i.status === "queued" || i.status === "working");

function setDirty() {
  const dirty = state.items.some((i) => i.status === "done" && !i.saved);
  window.pywebview?.api?.set_dirty(dirty);
}

const inDesktopApp = () => Boolean(window.pywebview?.api?.save_file);

window.addEventListener("pywebviewready", setDirty);

// ------------------------------------------------------------ workers

// A few workers, so a batch uses the cores it has without starving the page.
// Each holds a full-size photo's pixels while it works, so a phone gets two.
const POOL = Math.max(1, Math.min(PHONE ? 2 : 4, (navigator.hardwareConcurrency || 2) - 1));
// Working size: see MAX_SIDE in worker.js. A phone's photos are shrunk more.
const MAX_SIDE = PHONE ? 2560 : undefined;
const workers = Array.from({ length: POOL }, () => {
  const w = { worker: new Worker(new URL("./worker.js", import.meta.url), { type: "module" }), job: null };
  w.worker.onmessage = ({ data }) => finish(w, data);
  w.worker.onerror = (e) => {
    const item = w.job && state.items.find((i) => i.id === w.job.id);
    w.job = null;
    if (item) {
      item.status = "error";
      item.error = e.message || "The image couldn't be processed.";
      renderItem(item);
      if (item.id === state.selected) render();
    }
    schedule();
  };
  return w;
});

function schedule() {
  for (const w of workers) {
    if (w.job) continue;
    const waiting = state.items.filter((i) => i.status === "queued" && !i.inflight);
    // The image on screen first, then the rest in order.
    const item = waiting.find((i) => i.id === state.selected) || waiting[0];
    if (!item) break;
    item.inflight = true;
    item.status = "working";
    w.job = { id: item.id, version: item.version };
    const s = item.settings;
    w.worker.postMessage({
      id: item.id,
      bitmap: item.bitmap,
      settings: {
        start: s.start, solid: s.solid, cell: s.cell, specks: s.specks,
        recolor: inkOf(s), force: s.force, rotate: s.rotate, margin: s.margin, size: s.size,
        maxSide: MAX_SIDE,
      },
    });
    renderItem(item);
    if (item.id === state.selected) renderStatus();
  }
  updateActions();
}

function finish(w, data) {
  const job = w.job;
  w.job = null;
  const item = state.items.find((i) => i.id === job?.id);
  if (item) {
    item.inflight = false;
    // Settings changed while this was running: the result is stale.
    if (item.version !== job.version) {
      item.status = "queued";
    } else if (!data.ok) {
      item.status = "error";
      item.error = data.error;
    } else if (data.empty) {
      item.status = "empty";
      item.lifted = data.lifted;
      item.result = null;
    } else {
      item.result?.before.close();
      item.result?.after.close();
      item.result = { before: data.before, after: data.after, width: data.width, height: data.height };
      item.lifted = data.lifted;
      item.status = "done";
      item.saved = false;
    }
    renderItem(item);
    if (item.id === state.selected) render();
  } else {
    data.before?.close();
    data.after?.close();
  }
  setDirty();
  schedule();
}

function reprocess(item) {
  item.version++;
  item.status = "queued";
  schedule();
}

// ------------------------------------------------------------ opening

const EXT = /\.[^.]+$/;

async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name));
  if (!images.length) {
    toast("Those aren't images Ink Lifter can open. Try JPEG, PNG or WebP.", { tone: "error" });
    return;
  }
  let first = null;
  const failed = [];
  for (const file of images) {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      failed.push(file.name);
      continue;
    }
    const item = {
      id: nextId++,
      name: (file.name || "Pasted image").replace(EXT, "") || "image",
      bitmap,
      settings: { ...defaults, rotate: 0, force: false },
      version: 0,
      status: "queued",
      result: null,
      saved: false,
    };
    state.items.push(item);
    $("#queue").append(itemNode(item));
    first ??= item;
  }
  if (failed.length) {
    toast(`Couldn't open ${failed.join(", ")}. iPhone HEIC photos need saving as JPEG first.`, { tone: "error" });
  }
  if (first) select(first.id);
  schedule();
  render();
}

function openPicker() {
  $("#file").value = "";
  $("#file").click();
}

// ------------------------------------------------------------ queue

function itemNode(item) {
  const thumb = el("canvas", { class: "qitem__thumb", width: 88, height: 60 });
  const node = el("li", {
    class: "qitem",
    role: "option",
    tabindex: "-1",
    dataset: { id: item.id },
    onclick: () => select(item.id),
  },
  thumb,
  el("span", { class: "qitem__text" },
    el("span", { class: "qitem__name" }, item.name),
    el("span", { class: "qitem__state" })),
  el("button", {
    type: "button",
    class: "qitem__remove",
    title: "Remove",
    "aria-label": `Remove ${item.name}`,
    onclick: (e) => { e.stopPropagation(); remove(item.id); },
  }, "×"));
  item.node = node;
  renderItem(item);
  return node;
}

const STATE_TEXT = {
  queued: "Waiting",
  working: "Lifting…",
  empty: "No ink found",
  error: "Couldn't process",
};

function renderItem(item) {
  const node = item.node;
  if (!node) return;
  node.dataset.status = item.status;
  node.setAttribute("aria-selected", String(item.id === state.selected));
  const note = item.status === "done"
    ? (item.saved ? "Saved" : `${item.result.width} × ${item.result.height}`)
    : STATE_TEXT[item.status];
  $(".qitem__state", node).textContent = note;

  const c = $(".qitem__thumb", node);
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  const src = item.result?.after || item.bitmap;
  const k = Math.min(c.width / src.width, c.height / src.height);
  const w = src.width * k;
  const h = src.height * k;
  ctx.drawImage(src, (c.width - w) / 2, (c.height - h) / 2, w, h);
}

function select(id) {
  state.selected = id;
  for (const item of state.items) item.node?.setAttribute("aria-selected", String(item.id === id));
  current()?.node?.scrollIntoView({ block: "nearest" });
  fillForm();
  render();
  schedule();
}

function remove(id) {
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  const [item] = state.items.splice(idx, 1);
  item.node?.remove();
  item.bitmap.close();
  item.result?.before.close();
  item.result?.after.close();
  if (state.selected === id) {
    const next = state.items[idx] || state.items[idx - 1];
    state.selected = next?.id ?? null;
    if (next) select(next.id);
  }
  setDirty();
  render();
}

function clearAll() {
  const unsaved = state.items.filter((i) => i.status === "done" && !i.saved).length;
  if (unsaved) {
    toast(`${plural(unsaved, "image")} not saved yet. Clear anyway?`, {
      tone: "error",
      action: "Clear",
      onAction: () => { for (const i of [...state.items]) remove(i.id); },
    });
    return;
  }
  for (const i of [...state.items]) remove(i.id);
}

// ------------------------------------------------------------ preview

const view = $("#view");

function render() {
  const item = current();
  const empty = !state.items.length;
  $("#work").dataset.empty = String(empty);
  $("#queue-count").textContent = state.items.length ? `(${state.items.length})` : "";
  $("#doc-name").replaceChildren(...(item ? [el("strong", {}, item.name)] : []));
  $("#settings").toggleAttribute("inert", !item);
  $("#force-row").hidden = !item || (item.lifted !== false && !item.settings.force);

  // While a setting change reprocesses, the last result stays up, dimmed.
  const result = item?.status === "empty" || item?.status === "error" ? null : item?.result;
  $("#frame").hidden = !result;
  $("#size-note").textContent = result ? `${result.width} × ${result.height} px` : "";
  if (result) draw(result);
  renderStatus();
  updateActions();
}

function renderStatus() {
  const item = current();
  const status = $("#status");
  let text = "";
  if (item?.status === "queued" || item?.status === "working") text = item.result ? "" : "Lifting the ink…";
  else if (item?.status === "empty") {
    text = "No ink found in this photo. Raise Sensitivity, or check it's dark ink on light paper.";
  } else if (item?.status === "error") text = `Couldn't process this image: ${item.error}`;
  status.textContent = text;
  status.hidden = !text;
  $("#viewport").classList.toggle("is-working", item?.status === "working" && Boolean(item.result));
}

function draw(result) {
  const { width: w, height: h, before, after } = result;
  view.width = w;
  view.height = h;
  const ctx = view.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  if (state.view === "before") {
    ctx.drawImage(before, 0, 0);
  } else if (state.view === "split") {
    const x = Math.round(w * state.split);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, x, h);
    ctx.clip();
    ctx.drawImage(before, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, w - x, h);
    ctx.clip();
    ctx.drawImage(after, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(after, 0, 0);
  }
  $("#split-handle").hidden = state.view !== "split";
  $("#split-handle").style.left = `${state.split * 100}%`;
  $("#frame").dataset.backdrop = state.backdrop;
  $("#frame").classList.toggle("is-actual", state.actual);
}

function wireStage() {
  for (const b of $$("[data-view]")) {
    b.addEventListener("click", () => {
      state.view = b.dataset.view;
      for (const o of $$("[data-view]")) o.setAttribute("aria-checked", String(o === b));
      render();
    });
  }
  for (const b of $$("[data-backdrop]")) {
    b.addEventListener("click", () => {
      state.backdrop = b.dataset.backdrop;
      for (const o of $$("[data-backdrop]")) o.setAttribute("aria-checked", String(o === b));
      render();
    });
  }
  $("#zoom").addEventListener("click", () => {
    state.actual = !state.actual;
    $("#zoom").setAttribute("aria-pressed", String(state.actual));
    $("#zoom").textContent = state.actual ? "Fit" : "Actual size";
    render();
  });

  // Drag anywhere on the image to move the compare line.
  const frame = $("#frame");
  let dragging = false;
  const move = (e) => {
    const box = view.getBoundingClientRect();
    state.split = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const item = current();
    if (item?.result) draw(item.result);
  };
  frame.addEventListener("pointerdown", (e) => {
    if (state.view !== "split") return;
    dragging = true;
    frame.setPointerCapture(e.pointerId);
    move(e);
  });
  frame.addEventListener("pointermove", (e) => { if (dragging) move(e); });
  frame.addEventListener("pointerup", () => { dragging = false; });
  frame.addEventListener("pointercancel", () => { dragging = false; });
}

// ------------------------------------------------------------ settings form

const form = $("#settings");

function fillForm() {
  const s = current()?.settings || defaults;
  form.start.value = s.start;
  form.solid.value = s.solid;
  form.specks.checked = s.specks;
  form.cell.value = String(s.cell);
  form.force.checked = Boolean(s.force);
  form.margin.value = s.margin;
  form.size.value = String(s.size);
  form.format.value = s.format;
  form.custom.value = s.custom;
  for (const r of form.querySelectorAll('input[name="ink"]')) r.checked = r.value === s.ink;
  fillOutputs(s);
}

function fillOutputs(s) {
  $("#start-out").textContent = Math.round((s.start - 0.7) / 0.27 * 100);
  $("#solid-out").textContent = Math.round((s.solid - 0.25) / 0.55 * 100);
  $("#margin-out").textContent = `${s.margin} px`;
}

function readForm() {
  const ink = form.querySelector('input[name="ink"]:checked')?.value ?? "";
  return {
    start: Number(form.start.value),
    solid: Number(form.solid.value),
    specks: form.specks.checked,
    cell: Number(form.cell.value),
    force: form.force.checked,
    margin: Number(form.margin.value),
    size: Number(form.size.value),
    format: form.format.value,
    ink,
    custom: form.custom.value,
  };
}

// Changing a setting reprocesses the image on screen. Sliders fire many
// times a second, so wait until they settle a moment.
let settleTimer = 0;

function onSettingsChanged({ settle = false } = {}) {
  const item = current();
  if (!item) return;
  const next = { ...item.settings, ...readForm() };
  // Format only changes how the file is written, not the pixels.
  const pixelsChanged = Object.keys(next).some((k) => k !== "format" && next[k] !== item.settings[k]);
  item.settings = next;
  defaults = { ...defaults, ...next };
  saveDefaults(defaults);
  fillOutputs(next);
  if (!pixelsChanged) return;
  clearTimeout(settleTimer);
  if (settle) settleTimer = setTimeout(() => reprocess(item), 140);
  else reprocess(item);
}

function wireForm() {
  form.addEventListener("input", (e) => {
    const t = e.target;
    // Picking a custom colour means you want it.
    if (t.name === "custom") form.querySelector('input[name="ink"][value="custom"]').checked = true;
    onSettingsChanged({ settle: t.type === "range" || t.type === "color" });
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  const turn = (by) => {
    const item = current();
    if (!item) return;
    item.settings.rotate = (item.settings.rotate + by + 360) % 360;
    reprocess(item);
  };
  $("#rotate-left").addEventListener("click", () => turn(-90));
  $("#rotate-right").addEventListener("click", () => turn(90));

  $("#reset").addEventListener("click", () => {
    const item = current();
    if (!item) return;
    item.settings = { ...FACTORY, rotate: item.settings.rotate, force: false };
    defaults = { ...FACTORY };
    saveDefaults(defaults);
    fillForm();
    reprocess(item);
  });

  $("#apply-all").addEventListener("click", () => {
    const item = current();
    if (!item) return;
    const { rotate, ...shared } = item.settings;
    let n = 0;
    for (const other of state.items) {
      if (other === item) continue;
      other.settings = { ...shared, rotate: other.settings.rotate };
      reprocess(other);
      n++;
    }
    toast(n ? `Applied to ${plural(n, "other image")}.` : "There's only one image.");
  });
}

// ------------------------------------------------------------ saving

function outputName(item) {
  return `${item.name}-ink.${item.settings.format}`;
}

function encode(item, format = item.settings.format) {
  const { after, width, height } = item.result;
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  c.getContext("2d").drawImage(after, 0, 0);
  const type = format === "webp" ? "image/webp" : "image/png";
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("the image couldn't be encoded"))), type, 0.92);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function canExport() {
  const lic = state.license;
  return !lic || lic.licensed;
}

// Check the licence before saving or copying. False (and the Licence
// dialog) unless a key is set.
async function spendExport() {
  let lic;
  try {
    lic = await api("/api/license/consume", { method: "POST" });
  } catch (err) {
    if (err.status === 402) {
      await refreshLicense();
      openLicense({ needsLicense: true });
    } else {
      toast("Couldn't reach Ink Lifter's own server. Is it still running?", { tone: "error" });
    }
    return false;
  }
  noteLicense(lic);
  return true;
}

function noteLicense(lic) {
  state.license = lic;
  paintLicense();
}

async function saveCurrent() {
  const item = current();
  if (item?.status !== "done") return;
  if (!canExport()) { openLicense({ needsLicense: true }); return; }
  let blob;
  try {
    blob = await encode(item);
  } catch (err) {
    toast(`Couldn't save: ${err.message}`, { tone: "error" });
    return;
  }
  const name = outputName(item);

  if (inDesktopApp()) {
    // The Save dialog comes first, so cancelling it doesn't cost an export.
    let saved;
    try {
      const b64 = (await blobToDataUrl(blob)).split(",")[1];
      saved = await window.pywebview.api.save_file(name, b64);
    } catch (err) {
      toast(`Couldn't save: ${err.message || err}`, { tone: "error" });
      return;
    }
    if (saved.error) { toast(saved.error, { tone: "error" }); return; }
    if (!saved.saved) return;
    try { noteLicense(await api("/api/license/consume", { method: "POST" })); } catch { refreshLicense(); }
    markSaved(item);
    toast(`Saved ${saved.name}.`, { action: "Show in folder", onAction: () => window.pywebview.api.reveal(saved.path) });
    return;
  }

  if (!(await spendExport())) return;
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  markSaved(item);
}

async function copyCurrent() {
  const item = current();
  if (item?.status !== "done") return;
  if (!canExport()) { openLicense({ needsLicense: true }); return; }
  let blob;
  try {
    // The clipboard only takes PNG.
    blob = await encode(item, "png");
  } catch (err) {
    toast(`Couldn't copy: ${err.message}`, { tone: "error" });
    return;
  }
  if (!(await spendExport())) return;
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  } catch (err) {
    toast(`Couldn't copy: ${err.message || err}`, { tone: "error" });
    return;
  }
  toast("Copied. Paste it into a document, slide or email.");
}

// Browser version: hand the image to the phone's share sheet (WhatsApp,
// email, Drive...). Only offered where the browser can share files.
const SHARE = WEB && Boolean(navigator.canShare?.({ files: [new File([new Blob()], "ink.png", { type: "image/png" })] }));

async function shareFiles(files, items) {
  try {
    await navigator.share({ files });
  } catch (err) {
    if (err.name !== "AbortError") toast(`Couldn't share: ${err.message || err}`, { tone: "error" });
    return;
  }
  items.forEach(markSaved);
}

async function shareCurrent() {
  const item = current();
  if (item?.status !== "done") return;
  if (!canExport()) { openLicense({ needsLicense: true }); return; }
  let blob;
  try {
    blob = await encode(item);
  } catch (err) {
    toast(`Couldn't share: ${err.message}`, { tone: "error" });
    return;
  }
  if (!(await spendExport())) return;
  await shareFiles([new File([blob], outputName(item), { type: blob.type })], [item]);
}

// Browser version of Export all: one share sheet with every image where the
// browser can share files (phones), otherwise each one downloaded in turn.
async function exportAllWeb(items) {
  if (!(await spendExport())) return;
  state.exporting = true;
  updateActions();
  const files = [];
  try {
    for (const [n, item] of items.entries()) {
      $("#export-all-label").textContent = `Preparing ${n + 1} of ${items.length}…`;
      const blob = await encode(item);
      files.push(new File([blob], outputName(item), { type: blob.type }));
    }
  } catch (err) {
    toast(`Couldn't export: ${err.message}`, { tone: "error" });
    return;
  } finally {
    state.exporting = false;
    updateActions();
  }
  if (SHARE && navigator.canShare({ files })) {
    await shareFiles(files, items);
    return;
  }
  for (const [n, file] of files.entries()) {
    const url = URL.createObjectURL(file);
    const a = el("a", { href: url, download: file.name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    markSaved(items[n]);
    // Browsers drop downloads started all at once.
    await new Promise((r) => setTimeout(r, 250));
  }
  toast(`Downloaded ${plural(files.length, "image")}.`);
}

function markSaved(item) {
  item.saved = true;
  renderItem(item);
  setDirty();
}

const LAST_DIR = "inklifter.exportDir";

async function exportAll() {
  const items = finished();
  if (!items.length || state.exporting) return;
  if (!canExport()) { openLicense({ needsLicense: true }); return; }
  if (WEB) return exportAllWeb(items);

  let dir = "";
  if (inDesktopApp() && window.pywebview.api.choose_folder) {
    let start = "";
    try { start = localStorage.getItem(LAST_DIR) || ""; } catch { /* storage off */ }
    if (!start) {
      try { start = (await api("/api/health")).output_dir; } catch { /* the dialog starts at home */ }
    }
    dir = await window.pywebview.api.choose_folder(start);
    if (!dir) return;
    try { localStorage.setItem(LAST_DIR, dir); } catch { /* storage off */ }
  }

  state.exporting = true;
  updateActions();
  let saved = 0;
  let lastPath = "";
  let stopped = null;
  for (const [n, item] of items.entries()) {
    $("#export-all-label").textContent = `Saving ${n + 1} of ${items.length}…`;
    try {
      const data = await blobToDataUrl(await encode(item));
      const res = await api("/api/export", { method: "POST", body: { name: outputName(item), data, dir } });
      lastPath = res.path;
      state.license = res.license;
      markSaved(item);
      saved++;
    } catch (err) {
      stopped = err;
      break;
    }
  }
  state.exporting = false;
  paintLicense();
  updateActions();

  const folder = lastPath ? lastPath.replace(/[\\/][^\\/]*$/, "") : dir;
  const show = inDesktopApp() && folder
    ? { action: "Show folder", onAction: () => window.pywebview.api.reveal(folder) }
    : {};
  if (stopped?.status === 402) {
    toast(saved ? `Saved ${plural(saved, "image")}; a licence is needed for the rest.` : stopped.message, { tone: "error", ...show });
    openLicense({ needsLicense: true });
  } else if (stopped) {
    toast(`${saved ? `Saved ${plural(saved, "image")}, then stopped: ` : ""}${stopped.message}`, { tone: "error", ...show });
  } else {
    toast(`Saved ${plural(saved, "image")} to ${folder}.`, show);
  }
}

function updateActions() {
  const item = current();
  const ready = item?.status === "done";
  $("#save").disabled = !ready;
  $("#copy").disabled = !ready;
  $("#share").disabled = !ready;
  const count = finished().length;
  $("#export-all").disabled = state.exporting || !count || busy();
  if (!state.exporting) {
    $("#export-all-label").textContent = busy() ? "Working…" : count > 1 ? `Export all ${count}` : "Export all";
  }
  $("#clear").disabled = !state.items.length;
  $("#apply-all").disabled = state.items.length < 2;
}

// ------------------------------------------------------------ licence

// The licence key is checked by this computer's own server (app/license.py);
// nothing here talks to the internet. Saving, copying or exporting needs one.

async function refreshLicense() {
  try { state.license = await api("/api/license"); } catch { return; }
  paintLicense();
}

function paintLicense() {
  const lic = state.license;
  if (!lic) return;
  const chip = $("#license-open");
  chip.dataset.licensed = String(lic.licensed);
  chip.textContent = lic.licensed ? "Licensed" : "Unlicensed";
  chip.title = lic.licensed ? `Licensed to ${lic.email}` : "Enter a licence key, or buy one, to save or export";
}

function openLicense({ needsLicense = false } = {}) {
  const lic = state.license || { licensed: false };
  let text;
  if (lic.licensed) {
    text = `Licensed to ${lic.email}. Thank you for buying Ink Lifter.`;
  } else if (needsLicense) {
    text = "Enter the licence key from your purchase email to save, copy or export images. Opening and previewing keep working.";
  } else {
    text = "Opening and previewing are free. Enter the licence key from your purchase email to save, copy or export images.";
  }
  $("#license-state").textContent = text;
  $("#license-version").textContent = lic.version ? `Version ${lic.version}.` : "";
  $("#license-field").hidden = lic.licensed;
  $("#license-unlock").hidden = lic.licensed;
  $("#license-remove").hidden = !lic.licensed;
  $("#license-buy").hidden = lic.licensed;
  $("#license-buy").href = lic.store_url || "https://yarpdevelopers.com/store/ink-lifter";
  $("#license-error").hidden = true;
  $("#license-form").key.value = "";
  $("#license").showModal();
  if (!lic.licensed) $("#license-form").key.focus();
}

function wireLicense() {
  $("#license-open").addEventListener("click", () => openLicense());
  $("#license [data-close]").addEventListener("click", () => $("#license").close());
  $("#license-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      state.license = await api("/api/license", { method: "POST", body: { key: $("#license-form").key.value.trim() } });
    } catch (err) {
      $("#license-error").textContent = err.message;
      $("#license-error").hidden = false;
      return;
    }
    paintLicense();
    $("#license").close();
    toast(`Unlocked. Thank you, ${state.license.email}.`);
  });
  $("#license-remove").addEventListener("click", async () => {
    state.license = await api("/api/license", { method: "DELETE" });
    paintLicense();
    $("#license").close();
    toast(`Licence key removed from ${WEB ? "this browser" : "this computer"}.`);
  });

  if (WEB) {
    $(".license__privacy").firstChild.textContent =
      "Your key is checked and kept in this browser: enter it again if you clear your browsing data. " +
      "Ink Lifter never sends it, or your images, anywhere. ";
    // The store's thank-you page, open in another tab, saves a new key here.
    window.addEventListener("storage", (e) => { if (e.key === "yarp.keys") refreshLicense(); });
  }
}

// ------------------------------------------------------------ toast

let toastTimer = 0;

function toast(text, { tone = "info", action, onAction } = {}) {
  const t = $("#toast");
  $("#toast-text").textContent = text;
  t.dataset.tone = tone;
  const btn = $("#toast-action");
  btn.hidden = !action;
  btn.textContent = action || "";
  btn.onclick = action ? () => { t.hidden = true; onAction(); } : null;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, action ? 7000 : 4200);
}

// ------------------------------------------------------------ input

function typing(e) {
  const t = e.target;
  return t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) && t.type !== "range" && t.type !== "checkbox" && t.type !== "radio";
}

function wireInput() {
  $("#add").addEventListener("click", openPicker);
  $("#open-empty").addEventListener("click", openPicker);
  $("#file").addEventListener("change", (e) => addFiles(e.target.files));
  $("#clear").addEventListener("click", clearAll);
  $("#save").addEventListener("click", saveCurrent);
  $("#copy").addEventListener("click", copyCurrent);
  $("#share").addEventListener("click", shareCurrent);
  $("#export-all").addEventListener("click", exportAll);

  document.addEventListener("paste", (e) => {
    if (typing(e)) return;
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith("image/"));
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  });

  // Drop anywhere in the window.
  const zone = $("#dropzone");
  let depth = 0;
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
  window.addEventListener("dragenter", (e) => { if (hasFiles(e)) { depth++; zone.hidden = false; } });
  window.addEventListener("dragleave", () => { if (--depth <= 0) { depth = 0; zone.hidden = true; } });
  window.addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    zone.hidden = true;
    addFiles(e.dataTransfer.files);
  });

  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "o") { e.preventDefault(); openPicker(); return; }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); saveCurrent(); return; }
    if ($("#license").open || typing(e)) return;
    if (mod && e.key.toLowerCase() === "c" && !String(window.getSelection())) { e.preventDefault(); copyCurrent(); return; }
    if (e.key === "Delete" && current()) { e.preventDefault(); remove(state.selected); return; }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && state.items.length && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      const idx = state.items.findIndex((i) => i.id === state.selected);
      const next = state.items[Math.min(state.items.length - 1, Math.max(0, idx + (e.key === "ArrowDown" ? 1 : -1)))];
      if (next) select(next.id);
    }
  });
}

// ------------------------------------------------------------ start

// The browser version: no Save dialog, no folder, and on a phone the
// camera, Share instead of Copy, and no talk of dragging or Ctrl+V.
if (WEB) {
  $("#save span").textContent = "Save";
  $("#export-all").title = SHARE ? "Share every image at once" : "Download every image";
  $("#share").hidden = !SHARE;
  $("#file").accept = "image/*";
  if (PHONE) {
    $("#copy").hidden = true;
    $(".empty__or").textContent = "Take a photo, or pick one from your gallery.";
  }
}

// Phones: the settings sheet's handle opens and closes it (styles.css).
$("#controls-toggle").addEventListener("click", () => {
  const open = $("#controls").dataset.open !== "true";
  $("#controls").dataset.open = String(open);
  $("#controls-toggle").setAttribute("aria-expanded", String(open));
});

wireStage();
wireForm();
wireLicense();
wireInput();
fillForm();
render();
refreshLicense();
