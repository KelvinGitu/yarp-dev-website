/* The browser version's app/render.py: a resume's JSON in, the template's
   HTML out, from the very same template files (templates/, rendered with
   Nunjucks, the JavaScript port of Jinja).

   context() is render.context() ported line for line, down to Python's idea
   of what counts as empty. The catalogue it reads (templates, fonts, section
   kinds, page sizes...) isn't copied here: web/build.py writes it out of
   render.py into catalog.json. web/parity_test.py renders every template
   both ways and fails if the two disagree, so change them together.

   Printing isn't here: in a browser the page prints itself (app.js). */

// ---------------------------------------------------------------- Python's rules

// What Python's `if x:` treats as false.
const truthy = (v) =>
  !(v === undefined || v === null || v === false || v === 0 || v === "" ||
    (Array.isArray(v) && !v.length) || (v.constructor === Object && !Object.keys(v).length));

// str(v), for the values JSON can hold.
const pyStr = (v) => (v === null || v === undefined ? "None" : v === true ? "True" : v === false ? "False" : String(v));

// int(v) as design_of uses it: NaN where Python would raise.
function pyInt(v) {
  if (typeof v === "boolean") return Number(v);
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : NaN;
  if (typeof v === "string" && /^\s*[-+]?\d+\s*$/.test(v)) return parseInt(v, 10);
  return NaN;
}

const isDict = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const get = (obj, key, fallback) => (isDict(obj) && key in obj ? obj[key] : fallback);

// ---------------------------------------------------------------- helpers

export const shortlink = (url) => pyStr(url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");

/** Drop blank strings from a list; the editor leaves them while you type. */
const clean = (items) => (truthy(items) ? items : []).map((i) => pyStr(i).trim()).filter(Boolean);

export function createRenderer({ nunjucks, catalog, templates, fontBase }) {
  const C = catalog;
  const SECTIONS = C.SECTIONS;
  const env = new nunjucks.Environment(
    {
      getSource(name) {
        if (!(name in templates)) throw new Error(`template not found: ${name}`);
        return { src: templates[name], path: name, noCache: false };
      },
    },
    { autoescape: true, trimBlocks: true, lstripBlocks: true },
  );
  env.addFilter("shortlink", shortlink);

  function designOf(data) {
    const d = { ...C.DEFAULT_DESIGN, ...(truthy(get(data, "design")) ? data.design : {}) };
    if (!(d.template in C.TEMPLATES)) d.template = C.DEFAULT_DESIGN.template;
    if (!(d.density in C.DENSITY)) d.density = C.DEFAULT_DESIGN.density;
    if (typeof d.accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(d.accent)) d.accent = "";
    const pages = pyInt(d.max_pages);
    d.max_pages = Number.isNaN(pages) ? 1 : Math.max(0, Math.min(3, pages));
    return d;
  }

  function pageSizeOf(data) {
    const size = pyStr(get(data, "page_size", "letter")).toLowerCase();
    return size in C.PAGE_SIZES ? size : "letter";
  }

  function fontCss(template) {
    const rules = [];
    for (const key of C.TEMPLATES[template].fonts) {
      for (const [family, stem, weight, style] of C.FONTS[key]) {
        const name = `${stem}-latin-${weight}-${style}.woff2`;
        rules.push(
          `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};` +
          `font-display:block;src:url(${fontBase}${name}) format('woff2');}`,
        );
      }
    }
    return rules.join("\n");
  }

  function contacts(pi) {
    const out = [];
    if (truthy(get(pi, "phone"))) out.push({ kind: "phone", text: pi.phone, href: "tel:" + pyStr(pi.phone).replace(/[^\d+]/g, "") });
    if (truthy(get(pi, "email"))) out.push({ kind: "email", text: pi.email, href: "mailto:" + pyStr(pi.email) });
    if (truthy(get(pi, "location"))) out.push({ kind: "location", text: pi.location, href: "" });
    for (const [kind, fallback] of [["linkedin", "LinkedIn"], ["github", "GitHub"], ["portfolio", "Portfolio"]]) {
      const url = get(pi, `${kind}_url`);
      if (truthy(url)) {
        const label = get(pi, `${kind}_label`);
        out.push({ kind, text: truthy(label) ? label : fallback, href: url });
      }
    }
    const links = get(pi, "links");
    for (const link of truthy(links) ? links : []) {
      const url = pyStr(truthy(get(link, "url")) ? link.url : "").trim();
      const text = pyStr(truthy(get(link, "label")) ? link.label : "").trim() || shortlink(url);
      if (url) {
        const host = url.replace(/^https?:\/\//, "").toLowerCase();
        const kind = ["linkedin", "github"].find((k) => host.split("/")[0].includes(k)) || "portfolio";
        out.push({ kind, text, href: url });
      }
    }
    return out;
  }

  /** The added sections that have something in them, by id, in order, tidied up. */
  function extras(data) {
    const out = new Map();
    const secs = get(data, "extra_sections");
    for (const sec of truthy(secs) ? secs : []) {
      const sid = get(sec, "id");
      const kind = get(sec, "kind");
      if (!truthy(sid) || SECTIONS.includes(sid) || !(kind in C.SECTION_KINDS)) continue;
      const preset = C.SECTION_KINDS[kind];
      const layout = kind === "custom" && C.LAYOUTS.includes(get(sec, "layout")) ? sec.layout : preset.layout;
      const row = {
        id: sid,
        kind,
        layout,
        title: pyStr(truthy(get(sec, "title")) ? sec.title : "").trim() || preset.title,
        compact: C.COMPACT_KINDS.includes(kind) || layout !== "entries",
      };
      const items = get(sec, "items");
      if (layout === "entries") {
        row.items = (truthy(items) ? items : [])
          .filter((e) => isDict(e) && (truthy(get(e, "title")) || truthy(get(e, "subtitle"))))
          .map((e) => ({ ...e, highlights: clean(get(e, "highlights")) }));
      } else if (layout === "list") {
        row.items = clean(items);
      } else {
        row.text = pyStr(truthy(get(sec, "text")) ? sec.text : "").trim();
      }
      if (truthy(row.items) || truthy(row.text)) out.set(sid, row);
    }
    return out;
  }

  function context(data, template = null, scale = 1.0) {
    const design = designOf(data);
    if (template in C.TEMPLATES) design.template = template;
    const tpl = C.TEMPLATES[design.template];
    const size = pageSizeOf(data);

    const titles = { ...C.DEFAULT_TITLES };
    if (truthy(get(data, "skills_title"))) titles.skills = data.skills_title;
    const own = get(data, "section_titles");
    for (const [k, v] of Object.entries(truthy(own) ? own : {})) if (k in C.DEFAULT_TITLES && truthy(v)) titles[k] = v;

    const extra = extras(data);
    for (const [sid, sec] of extra) titles[sid] = sec.title;
    const order = get(data, "section_order", SECTIONS).filter((s) => SECTIONS.includes(s) || extra.has(s));
    // What a two-column template puts in its narrow column.
    const sideSections = ["skills", "education", ...[...extra].filter(([, sec]) => sec.compact).map(([sid]) => sid)];

    const listOf = (key) => (truthy(get(data, key)) ? data[key] : []);
    const entries = (key, fields) => {
      const rows = [];
      for (const e of listOf(key)) {
        const row = { ...e, highlights: clean(get(e, "highlights")) };
        if (isDict(e) && "tech_stack" in e) row.tech_stack = clean(e.tech_stack);
        if (fields.some((f) => truthy(row[f]))) rows.push(row);
      }
      return rows;
    };

    const pi = truthy(get(data, "personal_info")) ? data.personal_info : {};
    const first = get(pi, "first_name", "");
    const last = get(pi, "last_name", "");
    return {
      pi,
      full_name: [first, last].filter(truthy).join(" ").trim(),
      initials: ((truthy(first) ? pyStr(first) : "").slice(0, 1) + (truthy(last) ? pyStr(last) : "").slice(0, 1)).toUpperCase(),
      contacts: contacts(pi),
      summary: pyStr(truthy(get(data, "summary")) ? data.summary : "").trim(),
      experience: entries("experience", ["job_title", "company"]),
      projects: entries("projects", ["name", "role"]),
      education: listOf("education")
        .filter((e) => truthy(get(e, "degree")) || truthy(get(e, "institution")))
        .map((e) => ({ ...e, highlights: clean(get(e, "highlights")) })),
      skill_groups: listOf("skill_groups")
        .filter((g) => truthy(get(g, "label")) || clean(get(g, "items")).length)
        .map((g) => ({ label: get(g, "label", ""), items: clean(get(g, "items")) })),
      skills: clean(get(data, "skills")),
      languages: listOf("languages").filter((l) => truthy(get(l, "name"))),
      extras: Object.fromEntries(extra),
      titles,
      order,
      side_sections: sideSections,
      design,
      template: { id: design.template, ...tpl },
      accent: design.accent || tpl.accent,
      base_pt: C.DENSITY[design.density],
      scale: Math.round(scale * 1000) / 1000,
      page_size: size,
      page: C.PAGE_SIZES[size],
      font_css: fontCss(design.template),
    };
  }

  function renderHtml(data, template = null, scale = 1.0) {
    const ctx = context(data, template, scale);
    return env.render(`${ctx.template.id}.html`, ctx);
  }

  return { context, renderHtml, designOf, pageSizeOf };
}
