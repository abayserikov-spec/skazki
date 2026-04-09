import { TOTAL_PAGES, ART_STYLES } from "./constants.js";

// ═══════════════════════════════════════════════════════════
// SKAZKA VMESTE — AI Module v3
// Phase 1: 3-block prompts, art director Sonnet, identity tags
// Phase 2: Quality check via Sonnet piggyback
// Phase 3: Custom LoRA support (SKAZKA style)
// ═══════════════════════════════════════════════════════════

// ── CONFIG ──
// Phase 3: Change this to your trained LoRA path when ready
// e.g. "your-username/skazka-style" or keep as childbook
const STYLE_LORA = "alvdansen/frosting_lane_flux";
const STYLE_TRIGGER = "frstingln illustration";

// ── STYLE ANCHORS for 3-block prompts (Phase 1) ──
const STYLE_ANCHORS = {
  book: `Children's book illustration ${STYLE_TRIGGER}. Warm gouache and watercolor on textured cream paper, soft edges, visible brushstrokes, paint bleeding at edges. Muted earthy palette.`,
  anime: `Anime-style children's book illustration. Vibrant colors, expressive characters with large eyes. Studio Ghibli warmth, cinematic lighting.`,
  realistic: `Photorealistic children's book illustration. Cinematic composition, detailed textures, warm natural lighting. Professional quality.`,
};

// ── CAMERA ANGLES for visual rhythm (Phase 1) ──
const CAMERA_CYCLE = [
  "wide establishing shot from slightly above, character small in the frame showing the full environment",
  "medium shot at eye level, character fills the center third, background partially visible",
  "close-up on character's face and hands, shallow depth of field, blurred background",
  "shot from behind the character, looking outward at what they see ahead",
  "bird's-eye overhead view looking straight down, character and surroundings visible below",
  "low angle looking up at the character, making them appear bold and heroic",
];

// ═══════════════════════════════════════
// REPLICATE UTILITIES
// ═══════════════════════════════════════

export async function pollPrediction(token, prediction) {
  if (!prediction || prediction.error) {
    console.error("Replicate API error:", prediction?.error || prediction?.detail || "empty response");
    return null;
  }
  if (prediction.status === "succeeded" && prediction.output) {
    const out = prediction.output;
    return typeof out === "string" ? out : Array.isArray(out) ? out[0] : out;
  }
  if (prediction.status === "failed") {
    console.error("Replicate failed:", prediction.error);
    return null;
  }
  if (!prediction.id) {
    console.error("No prediction id, cannot poll. Response:", prediction);
    return null;
  }
  const pollUrl = `/api/replicate/v1/predictions/${prediction.id}`;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1500));
    try {
      const res = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } });
      const p = await res.json();
      if (p.status === "succeeded") {
        const out = p.output;
        return typeof out === "string" ? out : Array.isArray(out) ? out[0] : out;
      }
      if (p.status === "failed") { console.error("Replicate failed:", p.error); return null; }
    } catch (e) { console.error("Poll error:", e); }
  }
  return null;
}

async function fetchWithRetry(url, opts, maxRetries = 3) {
  let res = await fetch(url, opts);
  for (let i = 0; i < maxRetries && res.status === 429; i++) {
    let wait = 5000;
    try { const d = await res.json(); wait = (d.retry_after || 5) * 1000 + 1000; } catch {}
    await new Promise(r => setTimeout(r, wait));
    res = await fetch(url, opts);
  }
  return res;
}

// ═══════════════════════════════════════
// PHASE 1+3: CHARACTER PORTRAIT via childbook LoRA
// Replaces flux-watercolor → flux-childbook-illustration
// via prunaai/flux-dev-lora ($0.01, 1.3s)
// Phase 3: swap STYLE_LORA to custom trained LoRA
// ═══════════════════════════════════════

export async function genCharPortrait(token, charDesc, scene, artStyleKey) {
  if (!token) return null;
  var styleHint = artStyleKey === "anime"
    ? "Anime style children book character."
    : "Children book illustration, soft gouache painting. Character reference sheet showing ALL characters together.";
  var prompt = styleHint + " " + charDesc + ". Full body, ALL characters standing together in a row on plain beige background. Clear distinct appearances. No text.";
  try {
    var res = await fetchWithRetry("/api/replicate/v1/models/black-forest-labs/flux-2-pro/predictions", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Prefer: "wait=60" },
      body: JSON.stringify({ input: { prompt: prompt, aspect_ratio: "16:9", output_format: "webp", output_quality: 90, safety_tolerance: 5 } }),
    });
    var resp = await res.json();
    if (resp.detail || resp.error) console.error("Portrait (schnell) error:", JSON.stringify(resp));
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Portrait error:", err); return null; }
}

// ═══════════════════════════════════════
// FALLBACK — Flux 2 Pro (if portrait fails)
// ═══════════════════════════════════════

export async function genFirstImage(token, scene, charDesc, mood, artStyleKey) {
  if (!token) return null;
  const style = STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book;
  const prompt = `${style}. ${scene}. The main character is ${charDesc}. Show ALL characters with distinct appearances. Dynamic poses and clear interaction. No text, words, letters.`;
  try {
    const res = await fetch("/api/replicate/v1/models/black-forest-labs/flux-2-pro/predictions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({ input: { prompt, aspect_ratio: "16:9", output_format: "webp", output_quality: 90, safety_tolerance: 5 } }),
    });
    const resp = await res.json();
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Flux 2 Pro error:", err); return null; }
}

// ═══════════════════════════════════════
// PHASE 1: 3-BLOCK PROMPT BUILDER
// STYLE (frozen) + IDENTITY (frozen) + SCENE (unique)
// ═══════════════════════════════════════

function buildScenePrompt(illustration, identityTag, charDesc, artStyleKey, companionDesc, reinforced) {
  var styleAnchor = STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book;
  var matchPhrase = reinforced
    ? "MUST be " + identityTag + ". EXACTLY as reference"
    : "Same character as reference image";
  var ill = illustration || {};
  var scene = ill.scene || [ill.character_action, ill.environment].filter(Boolean).join(". ");
  var items = (ill.character_items || []).join(", ");
  var prompt = styleAnchor + " " + identityTag + ". " + matchPhrase + ". " + scene + ".";
  if (items) prompt += " Character holds: " + items + ".";
  if (companionDesc) prompt += " Also in scene: " + companionDesc.split(".")[0] + ".";
  prompt += " No text.";
  return prompt;
}