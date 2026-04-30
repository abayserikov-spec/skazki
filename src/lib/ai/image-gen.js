// ═══════════════════════════════════════════════════════════
// IMAGE GENERATION — Gemini NB2
// Portraits, book pages, scene composition
//
// OPTIMIZATIONS (v2):
//   1. Portraits at 512×512 (was 1024×1024) — invisible in UI, saves 3-5s
//   2. Style ref dropped when portraits exist — saves 2-3s on page 2+
//   3. References compressed to 512px JPEG before upload — saves 2-4s
//   4. Timing logs on every gemini call — see [IMG-GEN] in console
// ═══════════════════════════════════════════════════════════

import { renderTextRef, getTextColor } from "./text-render.js";
import { compressForRef, compressRefs } from "./image-utils.js";

// ─── STYLE SYSTEM ───
export const STYLE_ANCHORS = {
  book: `Warm watercolor children's book illustration on cream textured paper. Thin pencil outlines visible underneath transparent watercolor washes. Soft muted palette: ochre, burnt sienna, sage green, dusty blue, warm grey. Visible paper grain showing through thin paint layers. Gentle imperfect hand-drawn quality. Similar to Oliver Jeffers and Benji Davies picture book style.`,
  anime: `Anime-style children's book illustration. Vibrant saturated colors, expressive characters with large eyes, dynamic poses. Studio Ghibli warmth with cinematic golden-hour lighting. Clean linework with soft cel-shading.`,
  realistic: `Photorealistic children's book illustration. Cinematic composition with depth of field, detailed textures, warm natural lighting. Characters with realistic proportions and soft expressions. Professional quality.`,
};

export const STYLE_REF_INSTRUCTION = `Replicate ONLY the art style, color palette, and rendering technique from the style reference images. Characters must have simple small dot eyes and minimal facial features. Do NOT copy or include any characters, animals, or creatures from the reference images — only match their visual style.`;

// ─── SPREAD (two-page) text zone instructions ───
// The image is a horizontal book spread (3:2). The center vertical strip is the
// book's gutter (binding) — keep it visually calm so nothing important is bisected.
// Text on a spread is rendered as TWO blocks: one on the left half, one on the right half.
const SPREAD_ZONE_INSTRUCTIONS = {
  "split-bottom": "This is a TWO-PAGE BOOK SPREAD. The text reference image shows TWO text blocks side by side — the LEFT block belongs in the BOTTOM-LEFT area of the spread (left page), the RIGHT block belongs in the BOTTOM-RIGHT area (right page). Keep the BOTTOM strip of both halves as simple, calm ground/surface so the text reads clearly. Place main visual action in the TOP HALF of the spread, flowing naturally across both pages.",
  "split-top": "This is a TWO-PAGE BOOK SPREAD. The text reference image shows TWO text blocks side by side — the LEFT block belongs in the TOP-LEFT area, the RIGHT block in the TOP-RIGHT area. Keep the TOP strip of both halves as clean sky/background. Place main visual action in the BOTTOM HALF of the spread.",
  "split-overlay-bottom": "This is a TWO-PAGE BOOK SPREAD. Create a FULL scene flowing across both pages. The text reference shows TWO text blocks — the LEFT block is overlaid on the BOTTOM-LEFT, the RIGHT block on the BOTTOM-RIGHT. Ensure the background behind both text blocks is dark/simple enough for clear readability.",
  "left-page": "This is a TWO-PAGE BOOK SPREAD. The text reference image is a single block that MUST appear on the LEFT HALF of the spread (left page) in the bottom area. The RIGHT HALF (right page) has NO text — just the continuation of the illustration. Place main visual action on the right page.",
  "right-page": "This is a TWO-PAGE BOOK SPREAD. The text reference image is a single block that MUST appear on the RIGHT HALF of the spread (right page) in the bottom area. The LEFT HALF has NO text — just the illustration. Place main visual action on the left page.",
};

const SPREAD_COMPOSITION_RULES = `CRITICAL SPREAD COMPOSITION: This is a TWO-PAGE BOOK SPREAD that will be split down the middle by the book's binding. Keep the CENTRAL VERTICAL STRIP (roughly 8% width on each side of the exact center) free of faces, key character details, and important text — these elements MUST be positioned clearly on the LEFT or RIGHT half, not crossing the center. The illustration should feel like one continuous scene that flows naturally across both pages, with the binding in the middle adding nothing critical.`;

const TEXT_ZONE_INSTRUCTIONS = {
  "top-left": "Leave the TOP-LEFT area of the image as simple, clean background (sky, wall, open space) — no busy detail there. Place main action in BOTTOM-RIGHT. The text reference image shows text that MUST appear in the top-left area, reproduced EXACTLY with the same font style.",
  "top-right": "Leave the TOP-RIGHT area as clean background. Place main action in BOTTOM-LEFT. The text reference shows text that MUST appear in the top-right, reproduced EXACTLY.",
  "top-center": "Leave the TOP area as clean background across the full width. Place main action in the BOTTOM half. Text from reference MUST appear centered at the top, reproduced EXACTLY.",
  "bottom-left": "Leave the BOTTOM-LEFT area as simple ground/surface. Place main action in TOP-RIGHT. Text from reference MUST appear in the bottom-left, reproduced EXACTLY.",
  "bottom-right": "Leave the BOTTOM-RIGHT area as simple ground/surface. Place main action in TOP-LEFT. Text from reference MUST appear in the bottom-right, reproduced EXACTLY.",
  "bottom-center": "Leave the BOTTOM area as simple ground or cream strip. Place main action in the TOP half. Text from reference MUST appear centered at the bottom, reproduced EXACTLY.",
  "center": "Leave the CENTER of the image as a calm area. Place visual elements around the edges. Text from reference MUST appear in the center, reproduced EXACTLY.",
  "overlay-top": "Create a FULL scene. Text from reference MUST appear overlaid in the TOP area. Ensure the background behind text is dark/simple enough for the text to be clearly readable.",
  "overlay-bottom": "Create a FULL scene. Text from reference MUST appear overlaid in the BOTTOM area. Ensure the background behind text is dark/simple enough for the text to be clearly readable.",
};

// ─── CORE GEMINI CALL ───
// Retries on 5xx / network errors. Each individual attempt has its own AbortController
// timed to 55s — we kill the request just before Vercel's 60s function timeout
// to free the client to retry instead of getting a 504 from the proxy.
//
// Backoff schedule: 0ms, 1500ms, 4000ms (total worst case ~3 min, but most retries
// succeed on attempt 2 because Gemini queue clears fast).
const RETRY_DELAYS_MS = [0, 1500, 4000];
const PER_ATTEMPT_TIMEOUT_MS = 55_000;

function isRetryable(status) {
  // 5xx server errors and 429 (rate limit) are retryable. Everything else (4xx) is not.
  return status >= 500 || status === 429;
}

async function geminiGenerate(prompt, referenceImages = [], aspectRatio = "3:4", label = "unknown") {
  const refs = referenceImages.filter(Boolean);
  const payloadKb = Math.round(
    (prompt.length + refs.reduce((sum, r) => sum + (r?.length || 0), 0)) / 1024
  );
  console.log(`[IMG-GEN] ${label} start refs=${refs.length} payload~${payloadKb}kb`);
  const t0 = performance.now();

  const body = { prompt, referenceImages: refs, aspectRatio, imageSize: "1K" };

  // Read selected model from localStorage (set by Settings panel).
  // Falls back to server env/default if not present.
  const headers = { "Content-Type": "application/json" };
  try {
    const selectedModel = typeof window !== "undefined" ? window.localStorage?.getItem("geminiModel") : null;
    if (selectedModel) headers["x-gemini-model"] = selectedModel;
  } catch {}

  const bodyStr = JSON.stringify(body);
  let lastError = null;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS_MS[attempt];
      console.log(`[IMG-GEN] ${label} retry ${attempt} after ${delay}ms (last: ${lastError})`);
      await new Promise(r => setTimeout(r, delay));
    }

    const tAttempt = performance.now();
    const ctrl = new AbortController();
    const abortTimer = setTimeout(() => ctrl.abort(), PER_ATTEMPT_TIMEOUT_MS);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers,
        body: bodyStr,
        signal: ctrl.signal,
      });
      clearTimeout(abortTimer);

      if (!res.ok) {
        const elapsed = (performance.now() - tAttempt).toFixed(0);
        lastError = `HTTP ${res.status}`;
        console.warn(`[IMG-GEN] ${label} attempt ${attempt + 1} HTTP ${res.status} after ${elapsed}ms`);
        if (!isRetryable(res.status)) {
          console.error(`[IMG-GEN] ${label} non-retryable status, giving up`);
          return null;
        }
        continue; // retry
      }

      const data = await res.json();
      if (data.error) {
        lastError = `api-error: ${data.error}`;
        console.warn(`[IMG-GEN] ${label} attempt ${attempt + 1} api error:`, data.error);
        // API-level error in 200 response — usually means model rejected; don't retry blindly
        if (attempt === RETRY_DELAYS_MS.length - 1) return null;
        continue;
      }
      const presetInfo = data.presetUsed ? ` preset=${data.presetUsed}` : "";
      const totalMs = (performance.now() - t0).toFixed(0);
      const attemptMs = (performance.now() - tAttempt).toFixed(0);
      console.log(`[IMG-GEN] ${label} done in ${totalMs}ms (attempt ${attempt + 1}, took ${attemptMs}ms)${presetInfo}`);
      if (data.imageBase64) return `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`;
      lastError = "empty-response";
      console.warn(`[IMG-GEN] ${label} attempt ${attempt + 1} empty image response`);
      continue;
    } catch (e) {
      clearTimeout(abortTimer);
      const elapsed = (performance.now() - tAttempt).toFixed(0);
      lastError = e.name === "AbortError" ? "client-timeout-55s" : (e.message || "fetch-error");
      console.warn(`[IMG-GEN] ${label} attempt ${attempt + 1} exception after ${elapsed}ms:`, lastError);
      // network errors and timeouts are retryable
      continue;
    }
  }

  console.error(`[IMG-GEN] ${label} FAILED after ${RETRY_DELAYS_MS.length} attempts in ${(performance.now() - t0).toFixed(0)}ms (last: ${lastError})`);
  return null;
}

// ─── CHARACTER PORTRAITS ───
// Optimization: output at 512×512 via "512" imageSize hint, not 1K.
// Portraits are only ever displayed as 120×140 thumbnails and used as
// refs for Gemini, which downsamples them internally anyway.
export async function genCharPortrait(charDesc, scene, artStyleKey, opts = {}) {
  const styleRef = opts.styleRefUrl ? await compressForRef(opts.styleRefUrl, { maxSize: 512 }) : null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);
  const prompt = [
    styleText,
    `Full body portrait of ${charDesc}.`,
    `Relaxed neutral pose, slight three-quarter turn, arms slightly away from body.`,
    `Plain simple background. Clear separation between character and background.`,
    `Clean image without any text, words, or writing.`,
  ].join(" ");
  const refs = hasRef ? [styleRef] : [];
  try { return await geminiGenerate(prompt, refs, "1:1", "portrait"); }
  catch (err) { console.error("Portrait generation error:", err); return null; }
}

export async function genNewCharPortrait(newCharDesc, artStyleKey, opts = {}) {
  const styleRef = opts.styleRefUrl ? await compressForRef(opts.styleRefUrl, { maxSize: 512 }) : null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);
  const prompt = [
    styleText,
    `Full body portrait of a NEW character: ${newCharDesc}.`,
    `Relaxed neutral pose, slight three-quarter turn.`,
    `Plain simple background.`,
    `Clean image without any text or writing.`,
  ].join(" ");
  const refs = hasRef ? [styleRef] : [];
  try { return await geminiGenerate(prompt, refs, "1:1", "new-portrait"); }
  catch (err) { console.error("New character portrait error:", err); return null; }
}

// ─── BOOK PAGES (text embedded in illustration) ───
// Optimization: when portraits exist, we skip styleRef entirely —
// portraits + STYLE_ANCHOR text prompt already lock the style.
// This saves ~2-3s per page from dropping one reference image.
export async function genBookPage(scene, charDesc, portraitUrls, artStyleKey, pageText, textZone, intensity, opts = {}) {
  const portraits = Array.isArray(portraitUrls) ? portraitUrls : (portraitUrls ? [portraitUrls] : []);
  const hasPortraits = portraits.length > 0;

  // SKIP styleRef when we have portraits (they carry the style)
  const shouldUseStyleRef = !hasPortraits && !!opts.styleRefUrl;
  const styleRef = shouldUseStyleRef ? await compressForRef(opts.styleRefUrl, { maxSize: 512 }) : null;
  const styleText = shouldUseStyleRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);

  const textColor = getTextColor(intensity, textZone);
  const bgColor = (intensity < 50 && !textZone?.startsWith("overlay")) ? "#FFFFF8" : null;
  const textRefBase64 = await renderTextRef(pageText, { color: textColor, bgColor, fontSize: 40, maxWidth: 550 });

  const zoneInstruction = TEXT_ZONE_INSTRUCTIONS[textZone] || TEXT_ZONE_INSTRUCTIONS["bottom-center"];
  const charInstruction = hasPortraits
    ? `Keep ALL characters from portrait reference images with identical appearance — same face, same colors, same clothing, same proportions.`
    : (charDesc ? `The character: ${charDesc}.` : "");

  const prompt = [
    styleText,
    `Create a FULL PAGE children's book illustration — this is a complete book page with text integrated.`,
    `Scene: ${scene}`,
    charInstruction,
    zoneInstruction,
    `The text must be reproduced EXACTLY as shown in the text reference image — same words, same font style, same color. Do NOT change, add, or remove any words.`,
    `Create a completely NEW scene based on the description. Do NOT reuse backgrounds from reference images.`,
    `The final image should look like a scanned page from a real published children's picture book.`,
    `Do NOT add any text other than what is in the text reference image.`,
  ].join(" ");

  // Compress portraits in parallel before shipping them to the proxy
  const compressedPortraits = await compressRefs(portraits, { maxSize: 512 });

  const refs = [];
  if (textRefBase64) refs.push(textRefBase64);
  if (styleRef) refs.push(styleRef);
  compressedPortraits.forEach(p => { if (p) refs.push(p); });

  try { return await geminiGenerate(prompt, refs, "3:4", "book-page"); }
  catch (err) { console.error("Book page generation error:", err); return null; }
}

export async function genFirstBookPage(scene, charDesc, artStyleKey, pageText, textZone, intensity, opts = {}) {
  const styleRef = opts.styleRefUrl ? await compressForRef(opts.styleRefUrl, { maxSize: 512 }) : null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);

  const textColor = getTextColor(intensity, textZone);
  const bgColor = (intensity < 50 && !textZone?.startsWith("overlay")) ? "#FFFFF8" : null;
  const textRefBase64 = await renderTextRef(pageText, { color: textColor, bgColor, fontSize: 40, maxWidth: 550 });

  const zoneInstruction = TEXT_ZONE_INSTRUCTIONS[textZone] || TEXT_ZONE_INSTRUCTIONS["top-left"];
  const prompt = [
    styleText,
    `Create a FULL PAGE children's book illustration — opening page of a new story.`,
    `Scene: ${scene}`,
    `The main character is ${charDesc}. Show them with distinct, memorable appearance.`,
    zoneInstruction,
    `The text must be reproduced EXACTLY as shown in the text reference image. Same words, same font, same color.`,
    `This should look like the first page of a real published children's picture book.`,
    `Do NOT add any text other than what is in the text reference image.`,
  ].join(" ");

  const refs = [];
  if (textRefBase64) refs.push(textRefBase64);
  if (styleRef) refs.push(styleRef);

  try { return await geminiGenerate(prompt, refs, "3:4", "first-book-page"); }
  catch (err) { console.error("First book page error:", err); return null; }
}

// ═══════════════════════════════════════════════════════════
// SPREAD GENERATION — one image covers TWO pages (3:2 aspect)
// The spread is split by the flipbook component into left/right
// halves via object-position. Gemini gets explicit instructions
// to keep the central gutter clean and to place text on the
// correct half of the canvas.
// ═══════════════════════════════════════════════════════════

// Build a side-by-side text reference: left block + right block (with a gap
// representing the gutter). Returns a single base64 PNG ~1100×220 wide.
async function renderSpreadTextRef(leftText, rightText, opts = {}) {
  const { color = "#2C1810", bgColor = null, fontSize = 40 } = opts;
  // Render two single-side text refs and stitch them onto one canvas with a gap.
  const halfW = 540;
  const leftRef = await renderTextRef(leftText || "", { color, bgColor, fontSize, maxWidth: halfW });
  const rightRef = await renderTextRef(rightText || "", { color, bgColor, fontSize, maxWidth: halfW });
  if (!leftRef && !rightRef) return null;

  // If only one side has text, just return that side as a normal ref.
  if (!leftText) return rightRef;
  if (!rightText) return leftRef;

  // Stitch on a canvas: [leftRef][gutter][rightRef]
  const loadImg = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
  try {
    const [imgL, imgR] = await Promise.all([loadImg(leftRef), loadImg(rightRef)]);
    const gutter = 80;
    const W = imgL.width + gutter + imgR.width;
    const H = Math.max(imgL.height, imgR.height);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.drawImage(imgL, 0, (H - imgL.height) / 2);
    ctx.drawImage(imgR, imgL.width + gutter, (H - imgR.height) / 2);
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("[IMG-GEN] spread text ref stitch failed, falling back to left only:", e);
    return leftRef;
  }
}

// Split page text into two halves for a spread. Tries to split on sentence
// boundaries near the midpoint; falls back to word-boundary midpoint.
function splitTextForSpread(text) {
  const t = (text || "").trim();
  if (!t) return ["", ""];

  // Sentence-aware split
  const sentences = t.match(/[^.!?…]+[.!?…]+|\S[^.!?…]*$/g) || [t];
  if (sentences.length >= 2) {
    const totalLen = t.length;
    let leftLen = 0;
    let splitIdx = 0;
    for (let i = 0; i < sentences.length; i++) {
      leftLen += sentences[i].length;
      if (leftLen >= totalLen / 2) {
        splitIdx = i + 1;
        break;
      }
    }
    splitIdx = Math.max(1, Math.min(splitIdx, sentences.length - 1));
    const left = sentences.slice(0, splitIdx).join("").trim();
    const right = sentences.slice(splitIdx).join("").trim();
    if (left && right) return [left, right];
  }

  // Word-aware fallback
  const words = t.split(/\s+/);
  if (words.length < 2) return [t, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

// Decide which spread layout to use based on the original single-page textZone.
// Most cases collapse to "split-bottom" — the most natural picture-book layout.
function spreadZoneFromPageZone(textZone) {
  if (!textZone) return "split-bottom";
  if (textZone.startsWith("top")) return "split-top";
  if (textZone.startsWith("overlay")) return "split-overlay-bottom";
  if (textZone === "center") return "split-bottom";
  return "split-bottom";
}

export async function genBookSpread(scene, charDesc, portraitUrls, artStyleKey, pageText, textZone, intensity, opts = {}) {
  const portraits = Array.isArray(portraitUrls) ? portraitUrls : (portraitUrls ? [portraitUrls] : []);
  const hasPortraits = portraits.length > 0;

  const shouldUseStyleRef = !hasPortraits && !!opts.styleRefUrl;
  const styleRef = shouldUseStyleRef ? await compressForRef(opts.styleRefUrl, { maxSize: 512 }) : null;
  const styleText = shouldUseStyleRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);

  const [leftText, rightText] = splitTextForSpread(pageText);
  const spreadZone = spreadZoneFromPageZone(textZone);
  const textColor = getTextColor(intensity, textZone);
  const bgColor = (intensity < 50 && !textZone?.startsWith("overlay")) ? "#FFFFF8" : null;
  const textRefBase64 = await renderSpreadTextRef(leftText, rightText, { color: textColor, bgColor, fontSize: 40 });

  const zoneInstruction = SPREAD_ZONE_INSTRUCTIONS[spreadZone] || SPREAD_ZONE_INSTRUCTIONS["split-bottom"];
  const charInstruction = hasPortraits
    ? `Keep ALL characters from portrait reference images with identical appearance — same face, same colors, same clothing, same proportions.`
    : (charDesc ? `The character: ${charDesc}.` : "");

  const prompt = [
    styleText,
    `Create a TWO-PAGE BOOK SPREAD children's book illustration — a single horizontal image that spans across two facing pages of a picture book.`,
    SPREAD_COMPOSITION_RULES,
    `Scene: ${scene}`,
    charInstruction,
    zoneInstruction,
    `The text from the text reference image must be reproduced EXACTLY — same words, same font style, same color. The reference shows two text blocks side by side: place the LEFT block on the LEFT half of the spread and the RIGHT block on the RIGHT half of the spread, matching the reference layout. Do NOT change, add, or remove any words.`,
    `Create a completely NEW scene based on the description. Do NOT reuse backgrounds from reference images.`,
    `The final image should look like a real two-page spread from a published children's picture book — wide horizontal composition, single continuous illustration.`,
    `Do NOT add any text other than what is in the text reference image.`,
  ].join(" ");

  const compressedPortraits = await compressRefs(portraits, { maxSize: 512 });
  const refs = [];
  if (textRefBase64) refs.push(textRefBase64);
  if (styleRef) refs.push(styleRef);
  compressedPortraits.forEach(p => { if (p) refs.push(p); });

  try { return await geminiGenerate(prompt, refs, "3:2", "book-spread"); }
  catch (err) { console.error("Book spread generation error:", err); return null; }
}

export async function genFirstBookSpread(scene, charDesc, artStyleKey, pageText, textZone, intensity, opts = {}) {
  const styleRef = opts.styleRefUrl ? await compressForRef(opts.styleRefUrl, { maxSize: 512 }) : null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);

  const [leftText, rightText] = splitTextForSpread(pageText);
  const spreadZone = spreadZoneFromPageZone(textZone);
  const textColor = getTextColor(intensity, textZone);
  const bgColor = (intensity < 50 && !textZone?.startsWith("overlay")) ? "#FFFFF8" : null;
  const textRefBase64 = await renderSpreadTextRef(leftText, rightText, { color: textColor, bgColor, fontSize: 40 });

  const zoneInstruction = SPREAD_ZONE_INSTRUCTIONS[spreadZone] || SPREAD_ZONE_INSTRUCTIONS["split-bottom"];
  const prompt = [
    styleText,
    `Create a TWO-PAGE BOOK SPREAD children's book illustration — opening spread of a new story, spanning two facing pages.`,
    SPREAD_COMPOSITION_RULES,
    `Scene: ${scene}`,
    `The main character is ${charDesc}. Show them with distinct, memorable appearance.`,
    zoneInstruction,
    `Reproduce the text reference EXACTLY — same words, same font, same color. Place LEFT text block on the LEFT half, RIGHT text block on the RIGHT half.`,
    `This should look like the opening two-page spread of a real published children's picture book.`,
    `Do NOT add any text other than what is in the text reference image.`,
  ].join(" ");

  const refs = [];
  if (textRefBase64) refs.push(textRefBase64);
  if (styleRef) refs.push(styleRef);

  try { return await geminiGenerate(prompt, refs, "3:2", "first-book-spread"); }
  catch (err) { console.error("First book spread error:", err); return null; }
}

// ─── LEGACY (backward compatibility) ───
export async function genNextImage(scene, charDesc, portraitUrls, mood, artStyleKey, opts = {}) {
  const portraits = Array.isArray(portraitUrls) ? portraitUrls : (portraitUrls ? [portraitUrls] : []);
  const hasPortraits = portraits.length > 0;
  const shouldUseStyleRef = !hasPortraits && !!opts.styleRefUrl;
  const styleRef = shouldUseStyleRef ? await compressForRef(opts.styleRefUrl, { maxSize: 512 }) : null;
  const styleText = shouldUseStyleRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);
  const charInstruction = hasPortraits ? `Keep ALL characters from reference images with identical appearance.` : (charDesc ? `The character: ${charDesc}.` : "");
  const prompt = [styleText, `Scene: ${scene}`, charInstruction, `Create a completely NEW scene. Clean image without any text.`].join(" ");
  const compressedPortraits = await compressRefs(portraits, { maxSize: 512 });
  const refs = [];
  if (styleRef) refs.push(styleRef);
  compressedPortraits.forEach(p => { if (p) refs.push(p); });
  try { return await geminiGenerate(prompt, refs, "3:4", "next-image"); }
  catch (err) { console.error("Scene generation error:", err); return null; }
}

export async function genFirstImage(scene, charDesc, mood, artStyleKey, opts = {}) {
  const styleRef = opts.styleRefUrl ? await compressForRef(opts.styleRefUrl, { maxSize: 512 }) : null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);
  const prompt = [styleText, scene, `The main character is ${charDesc}.`, `Clean image without any text.`].join(" ");
  const refs = hasRef ? [styleRef] : [];
  try { return await geminiGenerate(prompt, refs, "3:4", "first-image"); }
  catch (err) { console.error("First image error:", err); return null; }
}

export async function addCharToPortrait(existingPortraitUrl, newCharDesc, artStyleKey, opts = {}) {
  return genNewCharPortrait(newCharDesc, artStyleKey, opts);
}
