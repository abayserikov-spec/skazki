// ═══════════════════════════════════════════════════════════
// IMAGE UTILS — browser-side compression before sending to Gemini
//
// Purpose: portraits and style refs don't need full 1024×1024.
// For Gemini reference input, 512×512 JPEG at 0.85 quality is plenty
// and cuts payload ~10× vs raw PNG.
// ═══════════════════════════════════════════════════════════

/**
 * Downscale and JPEG-compress an image (data URL or http URL) for use
 * as a reference image in Gemini calls.
 *
 * @param {string} src - data: URL or http(s): URL
 * @param {object} opts
 * @param {number} opts.maxSize - max width/height in pixels (default 512)
 * @param {number} opts.quality - JPEG quality 0..1 (default 0.85)
 * @returns {Promise<string>} data:image/jpeg;base64,... URL
 */
export async function compressForRef(src, opts = {}) {
  const { maxSize = 512, quality = 0.85 } = opts;
  if (!src) return null;

  const t0 = performance.now();
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Image load failed"));
      // Safety timeout — if image hangs, fall back to original
      setTimeout(() => reject(new Error("Image load timeout")), 8000);
    });

    const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    const result = canvas.toDataURL("image/jpeg", quality);
    const origKb = Math.round(src.length / 1024);
    const newKb = Math.round(result.length / 1024);
    console.log(`[COMPRESS] ${img.width}×${img.height} → ${w}×${h} | ${origKb}kb → ${newKb}kb | ${(performance.now() - t0).toFixed(0)}ms`);
    return result;
  } catch (e) {
    console.warn("[COMPRESS] failed, using original:", e.message);
    return src;
  }
}

/**
 * Compress multiple refs in parallel.
 */
export async function compressRefs(sources, opts = {}) {
  return Promise.all(sources.filter(Boolean).map(s => compressForRef(s, opts)));
}
