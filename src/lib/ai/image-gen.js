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
async function geminiGenerate(prompt, referenceImages = [], aspectRatio = "3:4", label = "unknown") {
  const refs = referenceImages.filter(Boolean);
  const payloadKb = Math.round(
    (prompt.length + refs.reduce((sum, r) => sum + (r?.length || 0), 0)) / 1024
  );
  console.log(`[IMG-GEN] ${label} start refs=${refs.length} payload~${payloadKb}kb`);
  const t0 = performance.now();

  const body = { prompt, referenceImages: refs, aspectRatio, imageSize: "1K" };
  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[IMG-GEN] ${label} HTTP ${res.status} after ${(performance.now() - t0).toFixed(0)}ms`);
      return null;
    }
    const data = await res.json();
    if (data.error) {
      console.error(`[IMG-GEN] ${label} error:`, data.error);
      return null;
    }
    console.log(`[IMG-GEN] ${label} done in ${(performance.now() - t0).toFixed(0)}ms`);
    if (data.imageBase64) return `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`;
    return null;
  } catch (e) {
    console.error(`[IMG-GEN] ${label} exception:`, e);
    return null;
  }
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
