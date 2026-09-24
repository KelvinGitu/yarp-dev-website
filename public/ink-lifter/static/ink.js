/* Lifting ink off a photographed page. Pure functions over RGBA pixels, so
   they run the same in the page and in the worker (worker.js).

   This began as pdfsign's signature upload (pdfsign/static/ink.js); with the
   default options it produces exactly what pdfsign does. */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const luma = (px, i) => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];

export const DEFAULTS = Object.freeze({
  // Darker than `start` of the local paper starts to count as ink; darker
  // than `solid` is solid ink. In between, the ink is partly see-through.
  start: 0.88,
  solid: 0.52,
  // Paper brightness is measured per `cell` pixels. Smaller cells follow
  // sharper shadows; bigger ones are steadier under thick strokes.
  cell: 32,
  // Erase dust and flecks away from the main ink.
  specks: true,
  // Repaint all the ink in this colour ("#rrggbb"), or keep its own.
  recolor: "",
  // Process images that already have transparency, rather than leaving them.
  force: false,
});

// True when an image already has a transparent background: a scan someone
// cleaned up, or a PNG exported from another app. Lifting it again would
// only eat into the edges.
export function hasTransparency(px) {
  let clear = 0;
  for (let i = 3; i < px.length; i += 16) if (px[i] < 250) clear++;
  return clear > px.length / 16 * 0.05;
}

// Lift the ink off a photo of paper, in place.
//
// A phone photo's "white" is rarely white: it's grey under a desk lamp and
// darker in the corner your hand shadowed. So instead of one threshold, this
// measures how bright the paper is in each patch of the image and judges
// every pixel against the paper around it. Ink keeps its colour, un-blended
// from the paper tone so the edges don't look washed out, or is repainted in
// `recolor` when given.
//
// `image` is anything shaped like ImageData: { data, width, height }.
// Returns false (and leaves it alone) for images that already have a
// transparent background, unless `force`.
export function liftInkData(image, options = {}) {
  const { start: START, solid, cell: CELL, specks, recolor, force } = { ...DEFAULTS, ...options };
  // Keep a usable ramp between the two, whatever the sliders say.
  const SOLID = Math.min(solid, START - 0.04);
  const { width: w, height: h } = image;
  const px = image.data;

  if (!force && hasTransparency(px)) return false;

  // Paper level per cell: a bright percentile, so the ink in a cell doesn't
  // drag it down. Then take the brightest of each cell's neighbours, in case
  // a thick stroke filled a whole cell, and soften the steps between cells.
  const gw = Math.ceil(w / CELL);
  const gh = Math.ceil(h / CELL);
  const cells = new Float32Array(gw * gh);
  const sample = [];
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      sample.length = 0;
      const x1 = Math.min(w, (gx + 1) * CELL);
      const y1 = Math.min(h, (gy + 1) * CELL);
      for (let y = gy * CELL; y < y1; y += 2) {
        for (let x = gx * CELL; x < x1; x += 2) sample.push(luma(px, (y * w + x) * 4));
      }
      sample.sort((a, b) => a - b);
      cells[gy * gw + gx] = sample[Math.floor(sample.length * 0.85)] ?? 255;
    }
  }
  const neighbourhood = (grid, pick) => {
    const out = new Float32Array(grid.length);
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        let acc = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const x = gx + dx;
            const y = gy + dy;
            if (x < 0 || y < 0 || x >= gw || y >= gh) continue;
            const v = grid[y * gw + x];
            if (pick === "max") acc = Math.max(acc, v);
            else acc += v;
            n++;
          }
        }
        out[gy * gw + gx] = pick === "max" ? acc : acc / n;
      }
    }
    return out;
  };
  const paper = neighbourhood(neighbourhood(cells, "max"), "mean");

  // Bilinear lookup of the paper level at any pixel.
  const paperAt = (x, y) => {
    const fx = clamp(x / CELL - 0.5, 0, gw - 1);
    const fy = clamp(y / CELL - 0.5, 0, gh - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(gw - 1, x0 + 1);
    const y1 = Math.min(gh - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const top = paper[y0 * gw + x0] * (1 - tx) + paper[y0 * gw + x1] * tx;
    const bottom = paper[y1 * gw + x0] * (1 - tx) + paper[y1 * gw + x1] * tx;
    return Math.max(24, top * (1 - ty) + bottom * ty);
  };

  const tint = recolor && [1, 3, 5].map((i) => parseInt(recolor.slice(i, i + 2), 16));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const p = paperAt(x, y);
      const a = clamp((START - luma(px, i) / p) / (START - SOLID), 0, 1);
      if (a === 0) {
        px[i + 3] = 0;
        continue;
      }
      for (let c = 0; c < 3; c++) {
        px[i + c] = tint ? tint[c] : clamp((px[i + c] - p * (1 - a)) / a, 0, 255);
      }
      px[i + 3] = Math.round(px[i + 3] * a);
    }
  }
  if (specks) dropSpecks(px, w, h);
  return true;
}

// Repaint the ink of an already transparent image, keeping its alpha.
export function recolorData(image, recolor) {
  const tint = [1, 3, 5].map((i) => parseInt(recolor.slice(i, i + 2), 16));
  const px = image.data;
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    px[i] = tint[0];
    px[i + 1] = tint[1];
    px[i + 2] = tint[2];
  }
}

// The box around everything inked, or null when nothing is.
export function inkBox(image, threshold = 8) {
  const { width, height, data } = image;
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > threshold) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

// Paper has dust and flecks that read as ink. Find each separate blob of
// ink; the big ones are the signature. Small blobs close to it are kept (the
// dot on an i, a full stop), and small blobs out on their own are erased,
// so they don't stretch the crop.
function dropSpecks(px, w, h) {
  const label = new Int32Array(w * h);
  const blobs = [];
  const stack = new Int32Array(w * h);

  for (let start = 0; start < w * h; start++) {
    if (label[start] || px[start * 4 + 3] < 32) continue;
    const blob = { id: blobs.length + 1, area: 0, x0: w, y0: h, x1: 0, y1: 0 };
    blobs.push(blob);
    let top = 0;
    stack[top++] = start;
    label[start] = blob.id;
    while (top) {
      const p = stack[--top];
      const x = p % w;
      const y = (p - x) / w;
      blob.area++;
      if (x < blob.x0) blob.x0 = x;
      if (x > blob.x1) blob.x1 = x;
      if (y < blob.y0) blob.y0 = y;
      if (y > blob.y1) blob.y1 = y;
      // 8-connected, so a thin diagonal stroke stays one blob.
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (label[q] || px[q * 4 + 3] < 32) continue;
          label[q] = blob.id;
          stack[top++] = q;
        }
      }
    }
  }
  if (!blobs.length) return;

  // Not Math.max(...areas): a speckled full-page photo has more blobs than
  // a spread can pass as arguments.
  let largest = 0;
  for (const b of blobs) if (b.area > largest) largest = b.area;
  const main = blobs.filter((b) => b.area >= largest * 0.02);
  const box = { x0: w, y0: h, x1: 0, y1: 0 };
  for (const b of main) {
    if (b.x0 < box.x0) box.x0 = b.x0;
    if (b.y0 < box.y0) box.y0 = b.y0;
    if (b.x1 > box.x1) box.x1 = b.x1;
    if (b.y1 > box.y1) box.y1 = b.y1;
  }
  const margin = 0.08 * Math.max(box.x1 - box.x0, box.y1 - box.y0);
  const near = (b) => b.x1 >= box.x0 - margin && b.x0 <= box.x1 + margin
    && b.y1 >= box.y0 - margin && b.y0 <= box.y1 + margin;
  const drop = new Uint8Array(blobs.length + 1);
  for (const b of blobs) if (b.area < largest * 0.02 && !near(b)) drop[b.id] = 1;

  for (let p = 0; p < w * h; p++) {
    if (drop[label[p]]) px[p * 4 + 3] = 0;
    // Faint haze below the blob threshold, far from the ink, goes too.
    else if (!label[p] && px[p * 4 + 3]) {
      const x = p % w;
      const y = (p - x) / w;
      if (x < box.x0 - margin || x > box.x1 + margin || y < box.y0 - margin || y > box.y1 + margin) px[p * 4 + 3] = 0;
    }
  }
}
