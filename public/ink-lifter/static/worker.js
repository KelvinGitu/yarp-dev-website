/* Does the heavy lifting off the page's thread, so the window stays
   responsive while a batch of 12-megapixel photos goes through.

   In: { id, bitmap, settings }. The bitmap is the photo as opened, and
   stays with the page (it's copied, not transferred), so changing a setting
   reprocesses from the original.
   Out: { id, ok, before, after, width, height, lifted } with both bitmaps
   cropped to the same box, or { id, ok: false, error }. */

import { inkBox, liftInkData, recolorData } from "./ink.js";

// Working size. Big enough for a crisp signature from a full-page photo,
// small enough that a batch doesn't eat the machine's memory. The page can
// ask for less (settings.maxSide): the browser version does on phones.
const MAX_SIDE = 4096;

self.onmessage = async ({ data: { id, bitmap, settings } }) => {
  try {
    const out = await run(bitmap, settings);
    self.postMessage({ id, ok: true, ...out }, [out.before, out.after].filter(Boolean));
  } catch (err) {
    self.postMessage({ id, ok: false, error: err?.message || String(err) });
  }
};

async function run(bitmap, s) {
  // Rotate and shrink in one draw.
  const turned = s.rotate % 180 !== 0;
  const k = Math.min(1, (s.maxSide || MAX_SIDE) / Math.max(bitmap.width, bitmap.height));
  const bw = Math.round(bitmap.width * k);
  const bh = Math.round(bitmap.height * k);
  const w = turned ? bh : bw;
  const h = turned ? bw : bh;
  const work = new OffscreenCanvas(w, h);
  const ctx = work.getContext("2d", { willReadFrequently: true });
  ctx.translate(w / 2, h / 2);
  ctx.rotate((s.rotate * Math.PI) / 180);
  ctx.drawImage(bitmap, -bw / 2, -bh / 2, bw, bh);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const original = ctx.getImageData(0, 0, w, h);
  const image = new ImageData(new Uint8ClampedArray(original.data), w, h);
  const opts = { start: s.start, solid: s.solid, cell: s.cell, specks: s.specks, recolor: s.recolor, force: s.force };
  const lifted = liftInkData(image, opts);
  // Already transparent: nothing to lift, but the ink colour still applies.
  if (!lifted && s.recolor) recolorData(image, s.recolor);

  const box = inkBox(image);
  if (!box) return { empty: true, lifted };

  const pad = s.margin;
  const cw = box.w + pad * 2;
  const ch = box.h + pad * 2;
  // Output size caps the longest side of the finished image; never enlarges.
  const scale = s.size ? Math.min(1, s.size / Math.max(cw, ch)) : 1;
  const ow = Math.max(1, Math.round(cw * scale));
  const oh = Math.max(1, Math.round(ch * scale));

  const crop = async (pixels, fillPaper) => {
    const full = new OffscreenCanvas(w, h);
    full.getContext("2d").putImageData(pixels, 0, 0);
    const out = new OffscreenCanvas(ow, oh);
    const octx = out.getContext("2d");
    octx.imageSmoothingQuality = "high";
    if (fillPaper) {
      // The margin around the photo's crop: extend the paper, not a hole.
      octx.fillStyle = "#fff";
      octx.fillRect(0, 0, ow, oh);
    }
    octx.drawImage(full, box.x - pad, box.y - pad, cw, ch, 0, 0, ow, oh);
    return out.transferToImageBitmap();
  };

  return {
    before: await crop(original, true),
    after: await crop(image, false),
    width: ow,
    height: oh,
    lifted,
  };
}
