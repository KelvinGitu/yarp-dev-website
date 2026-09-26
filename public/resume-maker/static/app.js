// resume maker — the editor.
//
// The resume being edited lives here as plain JSON (S.data), exactly the
// shape of data/<id>.json. Typing mutates it in place, then three things
// follow on their own timers: the preview re-renders, the file saves, and
// the change settles into undo history.
//
// The same page runs two ways: in the desktop app, behind Resume Maker's own
// local server, and at yarpdevelopers.com/resume-maker (web/build.py), where
// there is no server and web/local-api.js answers the same requests from
// browser storage, rendering with web/render.js.
const WEB = document.documentElement.dataset.mode === "web";
const localApi = WEB ? (await import("./web/local-api.js")).default : null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ACCENTS = [
  ["Graphite", "#2b2f36"], ["Navy", "#1f3a5f"], ["Teal", "#0f5e5e"], ["Forest", "#2f5d3a"],
  ["Slate blue", "#3b4a8c"], ["Plum", "#5b2a55"], ["Oxblood", "#7a1f2b"], ["Ochre", "#8a5a12"],
];

const PAGE_PX = { letter: { w: 816, h: 1056 }, a4: { w: 793.7, h: 1122.5 } };

const ICONS = {
  up: '<path d="M6 14l6-6 6 6"/>',
  down: '<path d="M6 10l6 6 6-6"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 00-1.5-1.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M4 4l16 16M10 5.7a9.6 9.6 0 012-.2c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.9 3.7M6.6 6.9A16.4 16.4 0 002.5 12s3.5 6.5 9.5 6.5a9.3 9.3 0 004.6-1.2"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

const S = {
  id: null,
  data: null,
  meta: null,        // /api/templates
  list: [],          // /api/resumes
  scale: 1,
  pages: 1,
  snapshot: "",      // last settled state, for undo
  past: [],
  future: [],
  open: loadPref("open", {}),   // which section cards are expanded
};

const openEntries = new WeakMap();  // entry object -> expanded?

// ------------------------------------------------------------ small helpers

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

function iconBtn(name, label, onclick, { disabled = false, danger = false } = {}) {
  return h("button", {
    type: "button", class: "icon-btn" + (danger ? " icon-btn--danger" : ""),
    "aria-label": label, title: label, html: icon(name), disabled, onclick,
  });
}

function loadPref(key, fallback) {
  try { return JSON.parse(localStorage.getItem("resume." + key)) ?? fallback; } catch { return fallback; }
}
function savePref(key, value) {
  try { localStorage.setItem("resume." + key, JSON.stringify(value)); } catch { /* private window */ }
}

async function api(path, { method = "GET", body, raw = false } = {}) {
  if (localApi) return localApi(method, path, body);
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try { detail = (await res.json()).detail || detail; } catch { /* not JSON */ }
    throw Object.assign(new Error(detail), { status: res.status });
  }
  return raw ? res : res.json();
}

function move(arr, i, by) {
  const j = i + by;
  if (j < 0 || j >= arr.length) return false;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return true;
}

const clone = (v) => JSON.parse(JSON.stringify(v));
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ------------------------------------------------------------ data shape

function normalize(d) {
  d.personal_info ??= {};
  if (!Array.isArray(d.personal_info.links)) d.personal_info.links = [];
  d.summary ??= "";
  for (const k of ["experience", "projects", "education", "skill_groups", "languages", "skills", "extra_sections"]) {
    if (!Array.isArray(d[k])) d[k] = [];
  }
  d.design = { template: "classic", accent: "", density: "standard", max_pages: 1, ...(d.design || {}) };
  d.section_titles ??= {};
  // Older files named the skills heading with skills_title; fold it in.
  if (d.skills_title) {
    d.section_titles.skills ??= d.skills_title;
    delete d.skills_title;
  }
  if (!Array.isArray(d.section_order)) d.section_order = [...S.meta.sections];
  d.page_size = d.page_size === "a4" ? "a4" : "letter";
  return d;
}

// What gets written to disk: the same data without the blank lines and
// trailing commas the editor tolerates while you type.
function cleaned(d) {
  const out = clone(d);
  const tidy = (list) => (list || []).map((s) => String(s).trim()).filter(Boolean);
  for (const e of [...out.experience, ...out.projects]) {
    e.highlights = tidy(e.highlights);
    if ("tech_stack" in e) e.tech_stack = tidy(e.tech_stack);
  }
  for (const e of out.education) if ("highlights" in e) e.highlights = tidy(e.highlights);
  for (const sec of out.extra_sections) {
    if (layoutOf(sec) === "list") sec.items = tidy(sec.items);
    else if (layoutOf(sec) === "entries") for (const e of sec.items) e.highlights = tidy(e.highlights);
  }
  for (const g of out.skill_groups) g.items = tidy(g.items);
  out.skills = tidy(out.skills);
  return out;
}

// ------------------------------------------------------------ change flow

let settleTimer = 0;

// Call after any edit. `structural` edits (add, remove, reorder, design
// choices) settle into history at once; typing settles after a pause, so one
// undo takes back a burst of typing rather than one letter.
function changed({ structural = false } = {}) {
  clearTimeout(settleTimer);
  if (structural) settle();
  else settleTimer = setTimeout(settle, 700);
  schedulePreview();
  scheduleSave();
}

function settle() {
  clearTimeout(settleTimer);
  const now = JSON.stringify(S.data);
  if (now !== S.snapshot) {
    S.past.push(S.snapshot);
    if (S.past.length > 200) S.past.shift();
    S.future = [];
    S.snapshot = now;
  }
  updateHistoryButtons();
}

function undo() { stepHistory(S.past, S.future); }
function redo() { stepHistory(S.future, S.past); }

function stepHistory(from, to) {
  settle();
  if (!from.length) return;
  to.push(S.snapshot);
  S.snapshot = from.pop();
  S.data = JSON.parse(S.snapshot);
  updateHistoryButtons();
  buildForm();
  syncDesign();
  schedulePreview(0);
  scheduleSave();
}

function updateHistoryButtons() {
  $("#undo").disabled = !S.past.length;
  $("#redo").disabled = !S.future.length;
}

// ------------------------------------------------------------ saving

let saveTimer = 0;
let saving = Promise.resolve();

function scheduleSave() {
  setStatus("Unsaved changes");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 600);
}

function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = 0;
  const id = S.id;
  const body = cleaned(S.data);
  setStatus("Saving…");
  saving = saving.then(async () => {
    try {
      await api(`/api/resumes/${id}`, { method: "PUT", body });
      if (id === S.id && !saveTimer) setStatus("Saved");
    } catch (err) {
      setStatus(`Couldn't save: ${err.message}`, "error");
    }
  });
  return saving;
}

async function flushSave() {
  if (saveTimer) await saveNow();
  else await saving;
}

function setStatus(text, state = "") {
  const el = $("#save-status");
  el.textContent = text;
  el.dataset.state = state;
  // The desktop app waits for the last save before closing; this is how it knows.
  window.pywebview?.api?.set_dirty(text !== "Saved");
}

// Called by the desktop app when its window is closing with a save pending:
// finish saving, then let it close. Closes even if the save fails, so the
// window can never get stuck open.
window.__flushAndClose = async () => {
  try { await flushSave(); } catch { /* reported in the status line */ }
  window.pywebview.api.close_now();
};

// True inside the desktop app's window, where PDFs go through the Windows
// Save dialog instead of the browser's downloads.
const inDesktopApp = () => Boolean(window.pywebview?.api?.save_file);
const EXPORT_LABEL = () => (inDesktopApp() ? "Save PDF…" : WEB ? "Save PDF" : "Download PDF");

window.addEventListener("pywebviewready", () => {
  $("#export span").textContent = EXPORT_LABEL();
});
if (WEB) $("#export span").textContent = EXPORT_LABEL();

// ------------------------------------------------------------ preview

let previewTimer = 0;
let previewSeq = 0;

function schedulePreview(delay = 180) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, delay);
  if ($("#panel-design").hidden === false) scheduleThumbs();
}

async function fetchPreview(data, template) {
  const res = await api("/api/preview", { method: "POST", body: { data, template }, raw: true });
  return res.text();
}

// Write HTML into an iframe without navigating it, so the swap doesn't flash.
async function writeFrame(frame, html) {
  const doc = frame.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
  doc.body?.offsetHeight;   // lay out, so the fonts it needs start loading
  await doc.fonts.ready;
  return doc;
}

// Print lays text out a hair looser than the screen, so a page the preview
// fills to the last pixel can spill in the PDF. Counting this much extra
// keeps the preview's fit honest, so the PDF usually prints at the same size.
const PRINT_SLACK = 0.015;

function measurePages(doc, pageH) {
  const sheet = doc.querySelector(".sheet");
  if (!sheet) return 1;
  const cs = doc.defaultView.getComputedStyle(sheet);
  const top = parseFloat(cs.paddingTop) || 0;
  const bottom = parseFloat(cs.paddingBottom) || 0;
  const content = sheet.getBoundingClientRect().height - top - bottom;
  const room = pageH - top - bottom;
  return Math.max(1, Math.ceil((content + room * PRINT_SLACK) / room));
}

// Shrink the document's --s until it fits the page limit (or hits the floor).
// The same scale is handed to the PDF export, so the two agree.
function fit(doc, data) {
  const { h: pageH } = PAGE_PX[data.page_size];
  const limit = Number(data.design.max_pages) || 0;
  const { min_scale: min, scale_step: step } = S.meta;
  const root = doc.documentElement;
  let scale = 1;
  root.style.setProperty("--s", scale);
  let pages = measurePages(doc, pageH);
  while (limit && pages > limit && scale > min + 1e-9) {
    scale = Math.max(min, Math.round((scale - step) * 1000) / 1000);
    root.style.setProperty("--s", scale);
    pages = measurePages(doc, pageH);
  }
  return { scale, pages, over: Boolean(limit) && pages > limit };
}

async function renderPreview() {
  const seq = ++previewSeq;
  let html;
  try {
    html = await fetchPreview(S.data);
  } catch (err) {
    toast(`Preview failed: ${err.message}`, { kind: "error" });
    return;
  }
  if (seq !== previewSeq) return;
  const frame = $("#preview");
  const { w, h: pageH } = PAGE_PX[S.data.page_size];
  frame.style.width = `${w}px`;
  const doc = await writeFrame(frame, html);
  if (seq !== previewSeq) return;
  const result = fit(doc, S.data);
  S.scale = result.scale;
  S.pages = result.pages;
  frame.style.height = `${result.pages * pageH}px`;

  const breaks = $("#breaks");
  breaks.replaceChildren();
  for (let i = 1; i < result.pages; i++) {
    breaks.append(h("div", { class: "break", style: `top:${i * pageH}px` }, h("span", { text: `Page ${i + 1}` })));
  }
  $("#paper-wrap").dataset.loading = "false";
  layoutPaper();
  showFit(result);
  $("#export").disabled = false;
}

function layoutPaper() {
  const desk = $("#desk");
  const paper = $("#paper-wrap");
  const { w } = PAGE_PX[S.data?.page_size || "letter"];
  const room = desk.clientWidth - 56;
  paper.style.width = `${w}px`;
  paper.style.zoom = Math.min(1, Math.max(0.3, room / w)).toFixed(3);
}

function showFit({ scale, pages, over }) {
  const el = $("#fit-status");
  const limit = Number(S.data.design.max_pages) || 0;
  el.dataset.state = over ? "over" : "";
  if (over) el.textContent = `${plural(pages, "page")}, over your ${limit} even at ${Math.round(scale * 100)}%`;
  else if (scale < 0.999) el.textContent = `${plural(pages, "page")} at ${Math.round(scale * 100)}% size`;
  else el.textContent = plural(pages, "page");
}

// ------------------------------------------------------------ form

function field(label, obj, key, o = {}) {
  const input = o.area
    ? h("textarea", { rows: o.rows || 3, spellcheck: "true" })
    : h("input", { type: o.type || "text", spellcheck: o.spell ? "true" : "false", autocomplete: "off" });
  input.placeholder = o.placeholder || "";
  const value = obj[key];
  input.value = o.list === "lines" ? (value || []).join("\n")
    : o.list === "comma" ? (value || []).join(", ")
    : (value ?? "");
  const count = o.count ? h("span", { class: "count" }) : null;
  const recount = () => { if (count) count.textContent = o.count(input.value); };
  recount();
  input.addEventListener("input", () => {
    const t = input.value;
    obj[key] = o.list === "lines" ? t.split("\n")
      : o.list === "comma" ? t.split(",").map((s) => s.trim())
      : t;
    recount();
    o.onInput?.();
    changed();
  });
  const cap = h("span", {}, label, count);
  return h("label", { class: "field" + (o.cls ? " " + o.cls : "") }, cap, input);
}

const words = (t) => plural(t.trim() ? t.trim().split(/\s+/).length : 0, "word");

function buildForm() {
  const form = $("#form");
  const keepScroll = $(".editor__scroll").scrollTop;
  form.replaceChildren(headerCard());
  const all = [...S.meta.sections, ...S.data.extra_sections.map((x) => x.id)];
  const order = S.data.section_order.filter((s) => all.includes(s));
  const hidden = all.filter((s) => !order.includes(s));
  for (const name of [...order, ...hidden]) form.append(sectionCard(name));
  form.append(addSectionMenu());
  $(".editor__scroll").scrollTop = keepScroll;
}

// Rows of small repeated things (skill groups, languages, links) inside a card.
function rowTools(arr, i, noun) {
  return h("div", { class: "row__tools" },
    iconBtn("up", `Move ${noun} up`, () => { if (move(arr, i, -1)) { changed({ structural: true }); buildForm(); } }, { disabled: i === 0 }),
    iconBtn("trash", `Remove ${noun}`, () => { arr.splice(i, 1); changed({ structural: true }); buildForm(); toast(`Removed ${noun}`, { action: "Undo", onAction: undo }); }, { danger: true }),
  );
}

function addRowBtn(cardKey, noun, fn) {
  return h("button", {
    type: "button", class: "add", html: `${icon("plus")}<span>Add ${noun}</span>`,
    onclick: () => {
      fn();
      changed({ structural: true });
      buildForm();
      $$(`.card[data-key="${cardKey}"] .rows[data-kind="${noun}"] .row`).pop()?.querySelector("input")?.focus();
    },
  });
}

function cardShell({ key, title, tools = [], body }) {
  const open = S.open[key] ?? true;
  const card = h("section", { class: "card", "data-key": key, "data-open": String(open) });
  const toggle = h("button", {
    type: "button", class: "card__toggle", html: icon("chevron"),
    "aria-expanded": String(open), "aria-label": "Show or hide this section's fields",
    onclick: () => {
      const now = card.dataset.open !== "true";
      card.dataset.open = String(now);
      toggle.setAttribute("aria-expanded", String(now));
      S.open[key] = now;
      savePref("open", S.open);
    },
  });
  card.append(h("div", { class: "card__head" }, toggle, title, h("div", { class: "card__tools" }, tools)), h("div", { class: "card__body" }, body));
  return card;
}

function headerCard() {
  const pi = S.data.personal_info;
  return cardShell({
    key: "header",
    title: h("span", { class: "card__fixed", text: "Name and contact" }),
    body: [
      h("div", { class: "grid2" },
        field("First name", pi, "first_name"),
        field("Last name", pi, "last_name"),
        field("Headline", pi, "title", { cls: "span2", placeholder: "e.g. Full Stack Flutter Engineer", spell: true }),
        field("Email", pi, "email", { type: "email" }),
        field("Phone", pi, "phone", { type: "tel" }),
        field("Location", pi, "location", { cls: "span2", placeholder: "City, Country" }),
      ),
      h("p", { class: "subhead", text: "Links" }),
      ...[["linkedin", "LinkedIn"], ["github", "GitHub"], ["portfolio", "Portfolio"]].map(([k, name]) =>
        h("div", { class: "grid2" },
          field(`${name} URL`, pi, `${k}_url`, { type: "url", placeholder: "https://" }),
          field("Shown as", pi, `${k}_label`, { placeholder: name }),
        )),
      h("div", { class: "rows", "data-kind": "link" }, pi.links.map((l, i) =>
        h("div", { class: "row row--link" },
          field("Other link", l, "url", { type: "url", placeholder: "https://" }),
          field("Shown as", l, "label", { placeholder: "Behance, Website…" }),
          rowTools(pi.links, i, "link"),
        ))),
      addRowBtn("header", "link", () => pi.links.push({ url: "", label: "" })),
    ],
  });
}

function sectionCard(name) {
  const order = S.data.section_order;
  const i = order.indexOf(name);
  const visible = i >= 0;
  const titles = S.data.section_titles;
  // A section you added keeps its heading on itself; the built-in five keep
  // theirs in section_titles.
  const extra = S.data.extra_sections.find((x) => x.id === name);
  const defaultTitle = extra ? S.meta.section_kinds[extra.kind].title : S.meta.default_titles[name];

  const title = h("input", {
    class: "card__title", value: (extra ? extra.title : titles[name]) || "",
    placeholder: defaultTitle, "aria-label": "Section heading",
    spellcheck: "true",
  });
  title.addEventListener("input", () => {
    const v = title.value.trim();
    if (extra) extra.title = title.value;
    else if (v) titles[name] = title.value; else delete titles[name];
    changed();
  });

  const reorder = (by) => {
    if (!move(order, i, by)) return;
    changed({ structural: true });
    buildForm();
    $(`.card[data-key="${name}"] .icon-btn[aria-label="${by < 0 ? "Move section up" : "Move section down"}"]`)?.focus();
  };
  const toggleShown = () => {
    if (visible) order.splice(i, 1); else order.push(name);
    changed({ structural: true });
    buildForm();
    $(`.card[data-key="${name}"] .icon-btn[data-eye]`)?.focus();
  };
  const eye = iconBtn(visible ? "eye" : "eyeOff", visible ? "Hide section from the resume" : "Show section on the resume", toggleShown);
  eye.dataset.eye = "";

  const card = cardShell({
    key: name,
    title,
    tools: [
      iconBtn("up", "Move section up", () => reorder(-1), { disabled: !visible || i === 0 }),
      iconBtn("down", "Move section down", () => reorder(1), { disabled: !visible || i === order.length - 1 }),
      eye,
      extra && iconBtn("trash", "Remove section", () => {
        S.data.extra_sections.splice(S.data.extra_sections.indexOf(extra), 1);
        if (visible) order.splice(i, 1);
        changed({ structural: true });
        buildForm();
        toast(`Removed ${extra.title.trim() || defaultTitle}`, { action: "Undo", onAction: undo });
      }, { danger: true }),
    ],
    body: extra ? EXTRA_BODIES[layoutOf(extra)](extra) : BODIES[name](),
  });
  card.dataset.hidden = String(!visible);
  return card;
}

// A list of entries (jobs, projects, degrees), each collapsible to one line.
function entryList(arr, { noun, key = noun, make, summary, fields }) {
  const wrap = h("div", { class: "entries" });
  arr.forEach((item, i) => {
    const open = openEntries.get(item) ?? false;
    const box = h("div", { class: "entry-ed", "data-open": String(open) });
    const titleEl = h("span", { class: "entry-ed__title" });
    const metaEl = h("span", { class: "entry-ed__meta" });
    const refresh = () => {
      const [t, m] = summary(item);
      titleEl.textContent = t || `Untitled ${noun}`;
      metaEl.textContent = m || "";
    };
    refresh();
    const sum = h("button", {
      type: "button", class: "entry-ed__sum", "aria-expanded": String(open),
      onclick: () => {
        const now = box.dataset.open !== "true";
        box.dataset.open = String(now);
        sum.setAttribute("aria-expanded", String(now));
        openEntries.set(item, now);
      },
    }, titleEl, metaEl);
    const restructure = (fn) => () => {
      if (fn() === false) return;
      changed({ structural: true });
      buildForm();
    };
    const up = iconBtn("up", `Move ${noun} up`, restructure(() => move(arr, i, -1)), { disabled: i === 0 });
    const down = iconBtn("down", `Move ${noun} down`, restructure(() => move(arr, i, 1)), { disabled: i === arr.length - 1 });
    const dup = iconBtn("copy", `Duplicate ${noun}`, restructure(() => {
      const copy = clone(item);
      arr.splice(i + 1, 0, copy);
      openEntries.set(copy, true);
    }));
    const del = iconBtn("trash", `Remove ${noun}`, () => {
      const [t] = summary(item);
      arr.splice(i, 1);
      changed({ structural: true });
      buildForm();
      toast(`Removed ${t || `the ${noun}`}`, { action: "Undo", onAction: undo });
    }, { danger: true });
    box.append(
      h("div", { class: "entry-ed__head" }, sum, up, down, dup, del),
      h("div", { class: "entry-ed__body" }, fields(item, refresh)),
    );
    wrap.append(box);
  });
  const add = h("button", {
    type: "button", class: "add", html: `${icon("plus")}<span>Add ${noun}</span>`,
    onclick: () => {
      const item = make();
      arr.push(item);
      openEntries.set(item, true);
      changed({ structural: true });
      buildForm();
      // Put the cursor in the new entry's first field.
      $(`.add[data-noun="${key}"]`)?.previousElementSibling?.lastElementChild?.querySelector("input")?.focus();
    },
  });
  add.dataset.noun = key;
  return [wrap, add];
}

const when = (a, b) => [a, b].filter(Boolean).join(" – ");
const bulletsHint = "One per line. Lead with what you did and what it changed.";

const BODIES = {
  summary: () => [
    field("Two or three sentences on who you are and what you're best at", S.data, "summary", {
      area: true, rows: 4, count: words,
      placeholder: "Engineer who ships…",
    }),
  ],

  experience: () => entryList(S.data.experience, {
    noun: "job",
    make: () => ({ job_title: "", company: "", location: "", start_date: "", end_date: "", highlights: [] }),
    summary: (j) => [j.job_title, [j.company, when(j.start_date, j.end_date)].filter(Boolean).join(", ")],
    fields: (j, refresh) => [
      h("div", { class: "grid2" },
        field("Job title", j, "job_title", { onInput: refresh, cls: "span2", spell: true }),
        field("Company", j, "company", { onInput: refresh }),
        field("Location", j, "location"),
        field("Started", j, "start_date", { onInput: refresh, placeholder: "01/2024" }),
        field("Ended", j, "end_date", { onInput: refresh, placeholder: "Present" }),
        field("Employment type", j, "employment_type", { placeholder: "Optional: Contract, Part-time…" }),
      ),
      field("Bullet points", j, "highlights", { area: true, list: "lines", rows: 4, placeholder: bulletsHint }),
    ],
  }),

  projects: () => entryList(S.data.projects, {
    noun: "project",
    make: () => ({ name: "", role: "", tech_stack: [], highlights: [] }),
    summary: (p) => [p.name, p.role],
    fields: (p, refresh) => [
      h("div", { class: "grid2" },
        field("Project", p, "name", { onInput: refresh, spell: true }),
        field("What it is, or your role", p, "role", { onInput: refresh, spell: true }),
        field("Started", p, "start_date", { placeholder: "Optional" }),
        field("Ended", p, "end_date", { placeholder: "Optional" }),
        field("Built with", p, "tech_stack", { list: "comma", cls: "span2", placeholder: "Flutter, Firebase, Gemini AI" }),
        field("Link", p, "url", { type: "url", cls: "span2", placeholder: "https://" }),
      ),
      field("Bullet points", p, "highlights", { area: true, list: "lines", rows: 3, placeholder: bulletsHint }),
    ],
  }),

  education: () => entryList(S.data.education, {
    noun: "qualification",
    make: () => ({ degree: "", institution: "", graduation_date: "", honors: "", highlights: [] }),
    summary: (e) => [e.degree, [e.institution, e.graduation_date].filter(Boolean).join(", ")],
    fields: (e, refresh) => [
      h("div", { class: "grid2" },
        field("Degree or certificate", e, "degree", { onInput: refresh, cls: "span2", spell: true }),
        field("School", e, "institution", { onInput: refresh, cls: "span2" }),
        field("When", e, "graduation_date", { onInput: refresh, placeholder: "2023, or 2024 – Present" }),
        field("Honours or note", e, "honors", { placeholder: "Second Upper Division" }),
        field("Location", e, "location", { placeholder: "Optional" }),
        field("Grade", e, "grade", { placeholder: "GPA 3.8, First class…" }),
      ),
      field("Details", e, "highlights", { area: true, list: "lines", rows: 2, placeholder: "Coursework, thesis, activities. One per line." }),
    ],
  }),

  skills: () => {
    const groups = S.data.skill_groups;
    const langs = S.data.languages;
    const addBtn = (noun, fn) => addRowBtn("skills", noun, fn);
    return [
      h("p", { class: "card__hint", text: "Group related skills; the items are separated by commas." }),
      h("div", { class: "rows", "data-kind": "group" }, groups.map((g, i) =>
        h("div", { class: "row row--group" },
          field("Group", g, "label", { placeholder: "Mobile development" }),
          field("Skills", g, "items", { list: "comma", placeholder: "Flutter, Dart, Riverpod" }),
          rowTools(groups, i, "group"),
        ))),
      addBtn("group", () => groups.push({ label: "", items: [] })),
      S.data.skills.length ? field("Other skills", S.data, "skills", { list: "comma" }) : null,
      h("p", { class: "subhead", text: "Languages" }),
      h("div", { class: "rows", "data-kind": "language" }, langs.map((l, i) =>
        h("div", { class: "row row--lang" },
          field("Language", l, "name"),
          field("Level", l, "level", { placeholder: "Fluent" }),
          field("Note", l, "note", { placeholder: "Optional" }),
          rowTools(langs, i, "language"),
        ))),
      addBtn("language", () => langs.push({ name: "", level: "" })),
    ];
  },
};

// ------------------------------------------------------------ added sections

// Presets fix their layout; a custom section keeps the one it was made with.
const layoutOf = (sec) => (sec.kind === "custom" && sec.layout) || S.meta.section_kinds[sec.kind]?.layout || "entries";

// How each kind of entries section labels its fields. Sections with one date
// store it as end_date, which the templates show on its own.
const ENTRY_LABELS = {
  certifications: { noun: "certificate", title: "Certificate", subtitle: "Issued by", url: "Credential link" },
  awards: { noun: "award", title: "Award", subtitle: "Awarded by", bullets: true },
  volunteering: { noun: "role", title: "Role", subtitle: "Organisation", location: true, range: true, bullets: true },
  publications: { noun: "publication", title: "Title", subtitle: "Published in", url: "Link", bullets: true },
  custom: { noun: "entry", title: "Title", subtitle: "Subtitle", location: true, range: true, url: "Link", bullets: true },
};

const EXTRA_BODIES = {
  entries: (sec) => {
    const L = ENTRY_LABELS[sec.kind] || ENTRY_LABELS.custom;
    return entryList(sec.items, {
      noun: L.noun, key: sec.id,
      make: () => ({ title: "", subtitle: "", highlights: [] }),
      summary: (e) => [e.title, [e.subtitle, when(e.start_date, e.end_date)].filter(Boolean).join(", ")],
      fields: (e, refresh) => [
        h("div", { class: "grid2" },
          field(L.title, e, "title", { onInput: refresh, cls: "span2", spell: true }),
          field(L.subtitle, e, "subtitle", { onInput: refresh, spell: true }),
          L.location ? field("Location", e, "location") : null,
          L.range ? field("Started", e, "start_date", { onInput: refresh, placeholder: "01/2024" }) : null,
          field(L.range ? "Ended" : "Date", e, "end_date", { onInput: refresh, placeholder: L.range ? "Present" : "2024" }),
          L.url ? field(L.url, e, "url", { type: "url", cls: "span2", placeholder: "https://" }) : null,
        ),
        L.bullets ? field("Bullet points", e, "highlights", { area: true, list: "lines", rows: 2, placeholder: "Optional. One per line." }) : null,
      ],
    });
  },
  list: (sec) => [
    field("Items, separated by commas", sec, "items", { list: "comma", placeholder: "Cycling, Chess, Community radio" }),
  ],
  text: (sec) => [
    field("Text", sec, "text", { area: true, rows: 2, spell: true }),
  ],
};

const CUSTOM_LAYOUTS = [
  ["entries", "Custom: entries", "Title, dates and bullet points, like a job"],
  ["list", "Custom: list", "Short items, like interests"],
  ["text", "Custom: paragraph", "A few sentences of your own"],
];

// The "Add section" button under the cards, and the menu it opens.
function addSectionMenu() {
  const kinds = S.meta.section_kinds;
  const used = new Set(S.data.extra_sections.map((x) => x.kind));
  const option = (label, blurb, onclick) => h("button", { type: "button", class: "add-menu__item", role: "menuitem", onclick },
    h("span", { class: "add-menu__name", text: label }),
    h("span", { class: "add-menu__blurb", text: blurb }));
  const blurbs = { entries: "Entries with dates", list: "A short list", text: "A line or two" };
  const presets = Object.entries(kinds).filter(([k]) => k !== "custom" && !used.has(k));
  const menu = h("div", { class: "add-menu", role: "menu" },
    presets.map(([k, v]) => option(v.title, blurbs[v.layout], () => addSection(k))),
    CUSTOM_LAYOUTS.map(([layout, label, blurb]) => option(label, blurb, () => addSection("custom", layout))),
  );
  return h("details", { class: "add-section" },
    h("summary", { class: "add", html: `${icon("plus")}<span>Add section</span>` }),
    menu);
}

function addSection(kind, layout) {
  const id = kind === "custom" ? `custom-${Math.random().toString(36).slice(2, 8)}` : kind;
  const sec = { id, kind, title: "" };
  if (kind === "custom") sec.layout = layout;
  const shape = layoutOf(sec);
  if (shape === "text") sec.text = kind === "references" ? "Available on request." : "";
  else sec.items = [];
  if (shape === "entries") {
    const first = { title: "", subtitle: "", highlights: [] };
    sec.items.push(first);
    openEntries.set(first, true);
  }
  S.data.extra_sections.push(sec);
  S.data.section_order.push(id);
  S.open[id] = true;
  savePref("open", S.open);
  changed({ structural: true });
  buildForm();
  const card = $(`.card[data-key="${id}"]`);
  card?.scrollIntoView({ block: "nearest" });
  // A custom section needs a name first; a preset already has one.
  (kind === "custom" ? $(".card__title", card) : $(".card__body input, .card__body textarea", card))?.focus();
}

// ------------------------------------------------------------ design panel

function templateName(id) {
  return S.meta.templates.find((t) => t.id === id)?.name || id;
}

function buildDesign() {
  const gallery = $("#gallery");
  gallery.replaceChildren(...S.meta.templates.map((t) => {
    const frame = h("iframe", { title: `${t.name} preview`, tabindex: "-1", "aria-hidden": "true" });
    const card = h("button", {
      type: "button", class: "tpl", role: "radio", "data-id": t.id, "aria-checked": "false",
      onclick: () => setDesign({ template: t.id }),
    },
      h("div", { class: "tpl__page" }, frame),
      h("span", { class: "tpl__name", text: t.name }),
      h("span", { class: "tpl__blurb", text: t.blurb }),
    );
    return card;
  }));

  const sw = $("#swatches");
  const def = h("button", { type: "button", class: "swatch swatch--default", role: "radio", "data-value": "", onclick: () => setDesign({ accent: "" }) },
    h("i"), "Template's own");
  const custom = h("input", { type: "color", "aria-label": "Pick any colour" });
  custom.addEventListener("input", () => setDesign({ accent: custom.value }, { settleLater: true }));
  custom.addEventListener("change", () => settle());
  sw.replaceChildren(
    def,
    ...ACCENTS.map(([name, hex]) => h("button", {
      type: "button", class: "swatch", role: "radio", "data-value": hex, style: `--c:${hex}`,
      "aria-label": name, title: name, onclick: () => setDesign({ accent: hex }),
    })),
    h("label", { class: "swatch swatch--custom", title: "Pick any colour", "data-value": "custom" }, custom),
  );

  for (const [id, apply] of [
    ["#density", (v) => setDesign({ density: v })],
    ["#paper", (v) => { S.data.page_size = v; changed({ structural: true }); syncDesign(); }],
    ["#length", (v) => setDesign({ max_pages: Number(v) })],
  ]) {
    for (const b of $$(`${id} button`)) b.addEventListener("click", () => apply(b.dataset.value));
  }
}

function setDesign(patch, { settleLater = false } = {}) {
  Object.assign(S.data.design, patch);
  changed({ structural: !settleLater });
  syncDesign();
}

// Reflect the current design choices in the panel's controls.
function syncDesign() {
  const d = S.data.design;
  const tpl = S.meta.templates.find((t) => t.id === d.template) || S.meta.templates[0];
  for (const b of $$("#gallery .tpl")) b.setAttribute("aria-checked", String(b.dataset.id === d.template));
  const def = $("#swatches .swatch--default");
  def.style.setProperty("--c", tpl.accent);
  let matched = false;
  for (const b of $$("#swatches [data-value]")) {
    const on = b.dataset.value === d.accent || (b.dataset.value === "custom" && !matched && d.accent && !ACCENTS.some(([, x]) => x === d.accent));
    matched ||= on;
    b.setAttribute("aria-checked", String(on));
  }
  if (d.accent) $("#swatches input[type=color]").value = d.accent;
  const seg = (id, v) => { for (const b of $$(`${id} button`)) b.setAttribute("aria-checked", String(b.dataset.value === String(v))); };
  seg("#density", d.density);
  seg("#paper", S.data.page_size);
  seg("#length", d.max_pages);
  $("#gallery").classList.toggle("a4", S.data.page_size === "a4");
}

let thumbTimer = 0;
function scheduleThumbs(delay = 700) {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(renderThumbs, delay);
}

// Every template, set with your own content.
async function renderThumbs() {
  const data = S.data;
  const { w, h: pageH } = PAGE_PX[data.page_size];
  await Promise.all($$("#gallery .tpl").map(async (card) => {
    try {
      const html = await fetchPreview(data, card.dataset.id);
      const frame = $("iframe", card);
      frame.style.width = `${w}px`;
      frame.style.height = `${pageH}px`;
      const doc = await writeFrame(frame, html);
      fit(doc, { ...data, design: { ...data.design, template: card.dataset.id } });
      frame.style.transform = `scale(${frame.parentElement.clientWidth / w})`;
    } catch { /* the main preview reports errors */ }
  }));
}

// ------------------------------------------------------------ resumes

function currentLabel() {
  return S.list.find((r) => r.id === S.id)?.label || S.id;
}

async function refreshList() {
  S.list = await api("/api/resumes");
  $("#current-name").textContent = currentLabel();
  const ul = $("#menu-list");
  ul.replaceChildren(...S.list.map((r) => h("li", {},
    h("button", {
      type: "button", class: "menu__item", "aria-current": String(r.id === S.id),
      onclick: () => { closeMenu(); if (r.id !== S.id) open(r.id); },
    },
      h("span", { class: "menu__label", text: r.label }),
      h("span", { class: "menu__tpl", text: r.broken ? "unreadable" : templateName(r.template) }),
      r.title ? h("span", { class: "menu__meta", text: r.title }) : null,
    ))));
}

async function open(id) {
  await flushSave();
  let data;
  try {
    data = await api(`/api/resumes/${encodeURIComponent(id)}`);
  } catch (err) {
    toast(err.message, { kind: "error" });
    return false;
  }
  S.id = id;
  S.data = normalize(data);
  S.snapshot = JSON.stringify(S.data);
  S.past = [];
  S.future = [];
  updateHistoryButtons();
  savePref("last", id);
  history.replaceState(null, "", `${location.pathname}#${id}`); // not bare "#…": the web page has a <base>
  document.title = `${currentLabel()} · resume maker`;
  $("#current-name").textContent = currentLabel();
  $("#paper-wrap").dataset.loading = "true";
  buildForm();
  syncDesign();
  setStatus("Saved");
  schedulePreview(0);
  refreshList();
  return true;
}

function openMenu() {
  $("#menu").hidden = false;
  $("#switcher").setAttribute("aria-expanded", "true");
  $("#menu .menu__item[aria-current='true']")?.focus();
}
function closeMenu() {
  $("#menu").hidden = true;
  $("#switcher").setAttribute("aria-expanded", "false");
}

// One dialog names things: a new resume, a copy, or a rename.
function askName({ title, lede, submit, value = "", showStart = false }) {
  const dlg = $("#name-dlg");
  $("#name-dlg-title").textContent = title;
  $("#name-dlg-lede").textContent = lede;
  $("#name-submit").textContent = submit;
  $("#start-from").hidden = !showStart;
  $("#copy-of").textContent = currentLabel();
  const input = $("#name-input");
  input.value = value;
  dlg.returnValue = "";
  dlg.showModal();
  input.select();
  return new Promise((resolve) => {
    dlg.addEventListener("close", () => {
      if (dlg.returnValue !== "ok" || !input.value.trim()) return resolve(null);
      resolve({ name: input.value.trim(), start: $("#name-form").start.value });
    }, { once: true });
  });
}

const ACTIONS = {
  async new() {
    const r = await askName({
      title: "New resume", submit: "Create", showStart: true,
      lede: "Make one per kind of role you apply for, so each can lead with what that job wants.",
    });
    if (!r) return;
    await flushSave();
    const made = await api("/api/resumes", { method: "POST", body: { name: r.name, source: r.start === "copy" ? S.id : null } });
    await open(made.id);
    toast(`Created ${made.label}`);
  },
  async duplicate() {
    const r = await askName({ title: `Duplicate ${currentLabel()}`, submit: "Duplicate", value: `${currentLabel()} copy`, lede: "The copy starts identical, design included." });
    if (!r) return;
    await flushSave();
    const made = await api("/api/resumes", { method: "POST", body: { name: r.name, source: S.id } });
    await open(made.id);
    toast(`Duplicated as ${made.label}`);
  },
  async rename() {
    const r = await askName({ title: `Rename ${currentLabel()}`, submit: "Rename", value: currentLabel(), lede: "This renames the file in data/ and its exported PDF." });
    if (!r) return;
    await flushSave();
    const renamed = await api(`/api/resumes/${S.id}/rename`, { method: "POST", body: { name: r.name } });
    S.id = renamed.id;
    history.replaceState(null, "", `${location.pathname}#${renamed.id}`);
    savePref("last", renamed.id);
    await refreshList();
    toast(`Renamed to ${renamed.label}`);
  },
  async delete() {
    if (S.list.length <= 1) return toast("This is your only resume. Make another before deleting it.", { kind: "error" });
    const dlg = $("#delete-dlg");
    $("#delete-name").textContent = currentLabel();
    dlg.returnValue = "";
    dlg.showModal();
    await new Promise((r) => dlg.addEventListener("close", r, { once: true }));
    if (dlg.returnValue !== "ok") return;
    await flushSave();
    const label = currentLabel();
    const { filed } = await api(`/api/resumes/${S.id}`, { method: "DELETE" });
    S.list = await api("/api/resumes");
    await open(S.list[0].id);
    toast(`Deleted ${label}`, {
      action: "Undo",
      onAction: async () => {
        const back = await api(`/api/trash/${encodeURIComponent(filed)}/restore`, { method: "POST" });
        await open(back.id);
        toast(`Restored ${back.label}`);
      },
    });
  },
};

// ------------------------------------------------------------ export

// In a browser there's no Edge to print with, so the resume opens in its own
// tab and prints itself there (web/local-api.js printPage): the phone's own
// print window then saves it as a PDF, real text and all. The tab has to open
// right here, in the click, or the browser blocks it as a pop-up.
async function printPdf() {
  const tab = window.open("", "_blank");
  if (!tab) {
    toast("Your browser blocked the page to print. Allow pop-ups for this site, then try again.", { kind: "error" });
    return;
  }
  try {
    await flushSave();
    const res = await api("/api/print", { method: "POST", body: { data: cleaned(S.data), scale: S.scale }, raw: true });
    const url = URL.createObjectURL(await res.blob());
    tab.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    const limit = Number(S.data.design.max_pages) || 0;
    if (limit && S.pages > limit) {
      toast(`It's ${plural(S.pages, "page")} even at ${Math.round(S.scale * 100)}%, so trim a few bullets to fit ${limit}.`, { kind: "error" });
    }
  } catch (err) {
    tab.close();
    toast(`Couldn't make the PDF: ${err.message}`, { kind: "error" });
  }
}

async function exportPdf() {
  if (WEB) return printPdf();
  const btn = $("#export");
  if (btn.disabled) return;
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  $("span", btn).textContent = "Printing…";
  try {
    await flushSave();
    const desktop = inDesktopApp();
    const res = await api("/api/export", {
      method: "POST",
      body: { id: S.id, data: cleaned(S.data), scale: S.scale, keep_copy: !desktop },
      raw: true,
    });
    const blob = await res.blob();
    const pages = Number(res.headers.get("X-Pages"));
    const scale = Number(res.headers.get("X-Scale"));
    const savedAs = res.headers.get("X-Saved-As") || "";
    const pi = S.data.personal_info;
    const person = [pi.first_name, pi.last_name].filter(Boolean).join(" ");
    const filename = person ? `${person} Resume.pdf` : `${S.id}.pdf`;

    const limit = Number(S.data.design.max_pages) || 0;
    const tooLong = limit && pages > limit
      ? ` It's ${plural(pages, "page")} even at ${Math.round(scale * 100)}%, so trim a few bullets to fit ${limit}.`
      : "";

    if (desktop) {
      const saved = await window.pywebview.api.save_file(filename, await blobToBase64(blob));
      if (saved.error) throw new Error(saved.error);
      if (!saved.saved) return; // cancelled the Save dialog
      toast(`Saved ${saved.name}.${tooLong}`, {
        kind: tooLong ? "error" : "",
        action: "Show in folder",
        onAction: () => window.pywebview.api.reveal(saved.path),
      });
      return;
    }

    const a = h("a", { href: URL.createObjectURL(blob), download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);

    const file = savedAs.split(/[\\/]/).pop();
    if (tooLong) {
      toast(`Downloaded.${tooLong}`, { kind: "error" });
    } else {
      toast(`Downloaded, and saved as output/${file}`, {
        action: "Show in folder",
        onAction: () => api(`/api/reveal?name=${encodeURIComponent(file)}`, { method: "POST" }),
      });
    }
  } catch (err) {
    toast(`Couldn't make the PDF: ${err.message}`, { kind: "error" });
  } finally {
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    $("span", btn).textContent = EXPORT_LABEL();
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// ------------------------------------------------------------ version

async function showVersion() {
  try {
    const { version } = await api("/api/health");
    if (version) $("#version").textContent = `v${version}`;
  } catch { /* the label just stays empty */ }
}

// ------------------------------------------------------------ toast

let toastTimer = 0;
function toast(text, { action, onAction, kind = "" } = {}) {
  const el = $("#toast");
  $("#toast-text").textContent = text;
  el.dataset.kind = kind;
  const btn = $("#toast-action");
  btn.hidden = !action;
  btn.textContent = action || "";
  btn.onclick = () => { el.hidden = true; onAction?.(); };
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, action ? 8000 : 4500);
}

// ------------------------------------------------------------ wiring

function wire() {
  for (const tab of $$(".tabs [role=tab]")) {
    tab.addEventListener("click", () => {
      for (const t of $$(".tabs [role=tab]")) t.setAttribute("aria-selected", String(t === tab));
      $("#panel-content").hidden = tab.dataset.tab !== "content";
      $("#panel-design").hidden = tab.dataset.tab !== "design";
      $(".editor__scroll").scrollTop = 0;
      if (tab.dataset.tab === "design") scheduleThumbs(0);
      savePref("tab", tab.dataset.tab);
    });
  }

  for (const b of $$(".view-toggle [role=tab]")) {
    b.addEventListener("click", () => {
      for (const x of $$(".view-toggle [role=tab]")) x.setAttribute("aria-selected", String(x === b));
      $(".work").dataset.view = b.dataset.view;
      if (b.dataset.view === "preview") layoutPaper();
    });
  }

  $("#undo").addEventListener("click", undo);
  $("#redo").addEventListener("click", redo);
  $("#export").addEventListener("click", exportPdf);

  $("#switcher").addEventListener("click", () => ($("#menu").hidden ? openMenu() : closeMenu()));
  document.addEventListener("click", (e) => {
    if (!$("#menu").hidden && !e.target.closest(".switcher")) closeMenu();
  });
  for (const b of $$(".menu__action")) {
    b.addEventListener("click", async () => {
      closeMenu();
      try { await ACTIONS[b.dataset.action](); } catch (err) { toast(err.message, { kind: "error" }); }
    });
  }
  for (const b of $$("dialog [data-close]")) b.addEventListener("click", () => b.closest("dialog").close());

  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const typing = e.target.closest?.("input, textarea");
    if (e.key === "Escape" && !$("#menu").hidden) { closeMenu(); $("#switcher").focus(); }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); saveNow(); }
    // In a text box, Ctrl+Z undoes your typing there; elsewhere it undoes edits.
    if (mod && !typing && e.key.toLowerCase() === "z") { e.preventDefault(); (e.shiftKey ? redo : undo)(); }
    if (mod && !typing && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
  });

  new ResizeObserver(() => layoutPaper()).observe($("#desk"));

  // #resume_backend_cloud in the address bar opens that resume.
  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && id !== S.id && S.list.some((r) => r.id === id)) open(id);
  });

  // Closing the tab mid-pause shouldn't lose the last few keystrokes.
  window.addEventListener("pagehide", () => {
    if (!saveTimer) return;
    if (WEB) { saveNow(); return; } // IndexedDB finishes a write the page started
    fetch(`/api/resumes/${S.id}`, {
      method: "PUT", keepalive: true,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(cleaned(S.data)),
    });
  });
}

async function boot() {
  wire();
  showVersion();
  S.meta = await api("/api/templates");
  buildDesign();
  S.list = await api("/api/resumes");
  const wanted = decodeURIComponent(location.hash.slice(1)) || loadPref("last", "resume");
  const first = S.list.find((r) => r.id === wanted) || S.list[0];
  if (!first) {
    const made = await api("/api/resumes", { method: "POST", body: { name: "resume" } });
    S.list = [made];
    await open(made.id);
  } else {
    await open(first.id);
  }
  if (loadPref("tab", "content") === "design") $("#tab-design").click();
}

boot().catch((err) => toast(`Couldn't start: ${err.message}`, { kind: "error" }));
