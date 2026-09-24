/* Shared by the desktop signature pad and the phone signing page: the pen,
   cropping a signature to its ink, and lifting ink off a photographed page. */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Ink that behaves like a pen: fast strokes thin out, slow ones pool. A
// stylus uses its real pressure instead. `scale` is backing pixels per CSS
// pixel, so the result prints crisply.
export function attachPen(canvas, { color, scale = 3, maxWidth = 3.4, minWidth = 1.1 }) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let inked = false;
  let last = null;
  let lastMid = null;
  let lastW = 0;

  const point = (e) => {
    const box = canvas.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top, t: e.timeStamp, p: e.pressure };
  };

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    last = point(e);
    lastMid = last;
    lastW = (maxWidth + minWidth) / 2;
    // A tap leaves a dot, like touching a nib to paper.
    ctx.fillStyle = color();
    ctx.beginPath();
    ctx.arc(last.x, last.y, lastW / 2, 0, Math.PI * 2);
    ctx.fill();
    inked = true;
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!last) return;
    const events = e.getCoalescedEvents?.() || [e];
    ctx.strokeStyle = color();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const ev of events) {
      const p = point(ev);
      const dist = Math.hypot(p.x - last.x, p.y - last.y);
      if (dist < 0.8) continue;
      let target;
      if (ev.pointerType === "pen" && p.p > 0) {
        target = minWidth + (maxWidth - minWidth) * clamp(p.p * 1.3, 0, 1);
      } else {
        const speed = dist / Math.max(1, p.t - last.t);
        target = clamp(maxWidth - speed * 1.1, minWidth, maxWidth);
      }
      const w = lastW * 0.65 + target * 0.35;
      const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(lastMid.x, lastMid.y);
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
      ctx.stroke();
      last = p;
      lastMid = mid;
      lastW = w;
    }
  });

  const end = () => {
    // Finish the tail the curve stopped short of.
    if (last && lastMid) {
      ctx.lineWidth = lastW;
      ctx.beginPath();
      ctx.moveTo(lastMid.x, lastMid.y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
    last = null;
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  return {
    // Match the backing store to the canvas's current size. Clears it,
    // unless `keep`: then what's drawn stays put at its old size, e.g. when
    // a phone is turned mid-signature.
    reset({ keep = false } = {}) {
      const box = canvas.getBoundingClientRect();
      if (!box.width) return;
      let old = null;
      if (keep && inked) {
        old = document.createElement("canvas");
        old.width = canvas.width;
        old.height = canvas.height;
        old.getContext("2d").drawImage(canvas, 0, 0);
      }
      canvas.width = Math.round(box.width * scale);
      canvas.height = Math.round(box.height * scale);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (old) ctx.drawImage(old, 0, 0);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      inked = Boolean(old);
    },
    hasInk: () => inked,
  };
}

// Crop a canvas to its inked pixels. Returns null when it's blank.
export function trimCanvas(src, pad = 6) {
  const { width, height } = src;
  const data = src.getContext("2d").getImageData(0, 0, width, height).data;
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  const w = right - left + 1;
  const h = bottom - top + 1;
  const out = document.createElement("canvas");
  out.width = w + pad * 2;
  out.height = h + pad * 2;
  out.getContext("2d").drawImage(src, left, top, w, h, pad, pad, w, h);
  return out;
}

const luma = (px, i) => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];

// Lift the ink off a photo of a signature on paper.
//
// A phone photo's "white" is rarely white: it's grey under a desk lamp and
// darker in the corner your hand shadowed. So instead of one threshold, this
// measures how bright the paper is in each patch of the image and judges
// every pixel against the paper around it. Ink keeps its colour, un-blended
// from the paper tone so the edges don't look washed out, or is repainted in
// `recolor` when given.
//
// Returns false (and leaves the canvas alone) for images that already have a
// transparent background.
export function liftInk(canvas, { recolor } = {}) {
  const { width: w, height: h } = canvas;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const image = ctx.getImageData(0, 0, w, h);
  const px = image.data;

  let clear = 0;
  for (let i = 3; i < px.length; i += 16) if (px[i] < 250) clear++;
  if (clear > px.length / 16 * 0.05) return false;

  // Paper level per cell: a bright percentile, so the ink in a cell doesn't
  // drag it down. Then take the brightest of each cell's neighbours, in case
  // a thick stroke filled a whole cell, and soften the steps between cells.
  const CELL = 32;
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
  // Darker than 88% of the local paper starts to count as ink; darker than
  // 52% is solid ink.
  const START = 0.88;
  const SOLID = 0.52;

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
  dropSpecks(px, w, h);
  ctx.putImageData(image, 0, 0);
  return true;
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

  const largest = Math.max(...blobs.map((b) => b.area));
  const main = blobs.filter((b) => b.area >= largest * 0.02);
  const box = {
    x0: Math.min(...main.map((b) => b.x0)),
    y0: Math.min(...main.map((b) => b.y0)),
    x1: Math.max(...main.map((b) => b.x1)),
    y1: Math.max(...main.map((b) => b.y1)),
  };
  const margin = 0.08 * Math.max(box.x1 - box.x0, box.y1 - box.y0);
  const near = (b) => b.x1 >= box.x0 - margin && b.x0 <= box.x1 + margin
    && b.y1 >= box.y0 - margin && b.y0 <= box.y1 + margin;
  const drop = new Uint8Array(blobs.length + 1);
  for (const b of blobs) if (b.area < largest * 0.02 && !near(b)) drop[b.id] = 1;

  for (let p = 0; p < w * h; p++) {
    if (drop[label[p]]) px[p * 4 + 3] = 0;
    // Faint haze below the blob threshold, far from the signature, goes too.
    else if (!label[p] && px[p * 4 + 3]) {
      const x = p % w;
      const y = (p - x) / w;
      if (x < box.x0 - margin || x > box.x1 + margin || y < box.y0 - margin || y > box.y1 + margin) px[p * 4 + 3] = 0;
    }
  }
}
