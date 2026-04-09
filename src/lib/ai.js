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
    : "Children book illustration, soft gouache painting.";
  var prompt = styleHint + " " + charDesc + ". Full body, relaxed pose, plain cream background. Front view. No text.";
  try {
    var res = await fetchWithRetry("/api/replicate/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Prefer: "wait=60" },
      body: JSON.stringify({ input: { prompt: prompt, go_fast: true, num_outputs: 1, aspect_ratio: "2:3", output_format: "png", output_quality: 90, num_inference_steps: 4 } }),
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
  const styleAnchor = STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book;

  const matchPhrase = reinforced
    ? 'MUST be ' + identityTag + '. EXACTLY as reference'
    : 'Same character as reference image';

  const ill = illustration || {};
  const action = ill.character_action || '';
  const env = (ill.environment || '').split(',')[0].trim();
  const items = (ill.character_items || []).slice(0, 2).join(', ');

  const parts = [styleAnchor];
  parts.push(identityTag + '. ' + matchPhrase + '.');
  if (action) parts.push(action + '.');
  if (items) parts.push('Holding ' + items + '.');
  if (env) parts.push(env + '.');
  if (companionDesc) parts.push('With ' + companionDesc.split('.')[0] + '.');
  parts.push('No text.');

  return parts.join(' ').slice(0, 350);
}

// ═══════════════════════════════════════
// PHASE 1: SCENE GENERATION via Kontext Fast
// Always uses portrait as img_cond_path
// ═══════════════════════════════════════

export async function genNextImage(token, scene, charDesc, portraitUrl, mood, artStyleKey, opts = {}) {
  if (!token || !portraitUrl) return null;
  if (!portraitUrl.startsWith("http")) {
    console.error("genNextImage: invalid portraitUrl:", portraitUrl);
    return null;
  }

  const { illustration, identityTag, companionDesc, reinforced } = opts;

  let prompt;
  if (illustration && identityTag) {
    prompt = buildScenePrompt(illustration, identityTag, charDesc, artStyleKey, companionDesc, reinforced);
  } else {
    // Legacy fallback
    const shortStyle = artStyleKey === "anime" ? "Anime children's illustration."
      : artStyleKey === "realistic" ? "Realistic children's book illustration."
      : "Watercolor children's book illustration, soft washes, paper texture visible.";
    const shortScene = (scene || "").split(/[.!]/).slice(0, 2).join(". ").trim().slice(0, 200);
    const negWords = /frown|tear|cry|sad|scared|afraid|angry|worried|lonely|upset|nervous|anxious|hurt|pain|lost|confused|guilt|shame/i;
    const antiSmile = negWords.test(scene) ? " Character is NOT smiling, NOT happy." : "";
    prompt = `${shortStyle} ${shortScene}.${antiSmile} Same character from reference image. No text.`;
  }

  try {
    const res = await fetchWithRetry("/api/replicate/v1/models/prunaai/flux-kontext-fast/predictions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({ input: { prompt, img_cond_path: portraitUrl, aspect_ratio: "16:9", output_format: "png", safety_tolerance: 6 } }),
    });
    const resp = await res.json();
    if (resp.detail || resp.error) console.error("Kontext Fast error:", JSON.stringify(resp));
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Kontext Fast error:", err); return null; }
}

// ═══════════════════════════════════════
// PHASE 1+2: STORY GENERATION (Sonnet)
// Art Director + Visual Rhythm + Identity Tags
// Phase 2: Quality check piggyback
// ═══════════════════════════════════════

export async function genPage(ctx, apiKey) {
  const {
    name, age, theme, history, choice, charDesc, backstory,
    lang: storyLang, identityTag,
    prevIllustrationUrl, prevScene,
  } = ctx;

  const pn = history.length + 1;
  const isEnd = pn >= TOTAL_PAGES;

  const hist = history.map((h, i) =>
    "P" + (i + 1) + ": " + h.text +
    (h.sceneSummary ? " [location: " + h.sceneSummary + "]" : "") +
    (h.actionSummary ? " [action: " + h.actionSummary + "]" : "") +
    (h.choice ? " [chose: " + h.choice.label + "/" + h.choice.value + "]" : "")
  ).join("\n");

  const charBlock = charDesc
    ? `\n- The main characters have been established: ${charDesc}. Keep ALL characters visually consistent.
- NEW MAIN CHARACTER: If an important new character JOINS the group, return "newMainCharacter" with their detailed visual description. Only for recurring characters.`
    : `\n- FIRST PAGE: Return these character fields:
  "characterDesc": detailed visual description of MAIN CHARACTER + companions. Include species/type, hair/fur color, eye color, clothing, accessories, body build, distinctive features.
  "identityTag": comma-separated list of EXACTLY 4 most visually distinctive features that NEVER change. Format: "[species/type], [primary color], [key clothing], [unique accessory]". Example: "red fox cub, green eyes, blue scarf, brown satchel"`;

  const charDescJson = !charDesc ? ',"characterDesc":"...","identityTag":"species, color, clothing, accessory"' : "";

  const positiveValues = ["generosity","empathy","courage","curiosity","kindness","honesty","patience","teamwork"];
  const negativeValues = ["selfishness","cowardice","cruelty","greed","laziness","dishonesty","aggression","indifference"];

  let endingInstruction = "";
  if (isEnd) {
    const choiceValues = history.filter(h => h.choice).map(h => h.choice.value || "custom");
    const negCount = choiceValues.filter(v => negativeValues.includes(v)).length;
    const posCount = choiceValues.filter(v => positiveValues.includes(v)).length;
    if (negCount > posCount) endingInstruction = "LAST PAGE — SAD ENDING. Consequences of bad choices. Character feels regret. No happy twist.";
    else if (negCount === posCount && negCount > 0) endingInstruction = "LAST PAGE — MIXED ENDING. Partly works out, something lost. Bittersweet but hopeful.";
    else endingInstruction = "LAST PAGE — HAPPY ENDING. Good choices paid off! Warm ending with gentle moral.";
  }

  const choicesOrEnd = isEnd
    ? '"isEnd":true,"ending":"good|mixed|sad"'
    : '"choices":[{"label":"...","emoji":"...","value":"generosity|empathy|courage|curiosity|kindness|honesty|patience|teamwork|selfishness|cowardice|cruelty|greed|laziness|dishonesty|aggression|indifference"}]';
  const choicesInstruction = isEnd ? endingInstruction
    : "Give 2-3 choices. Include at least one POSITIVE and one NEGATIVE/TEMPTING choice. Negative should feel tempting. Natural consequences, not preachy.";

  const backstoryBlock = backstory ? `\n- STORY PREMISE: ${backstory}. Build around this.` : "";
  const langInstr = storyLang === "en" ? "Write story text in ENGLISH." : "Write story text in RUSSIAN.";

  const prevScenes = history.map((h, i) => { const p = [h.sceneSummary, h.actionSummary].filter(Boolean).join(", "); return p ? `P${i+1}: ${p}` : ""; }).filter(Boolean);
  const diversityInstr = history.length > 0
    ? `\n- LOCATION DIVERSITY: Previous: [${prevScenes.join("; ") || history.map(h => h.mood).filter(Boolean).join(", ")}]. MUST be COMPLETELY DIFFERENT place.\n- ACTION DIVERSITY: Character must do something PHYSICALLY DIFFERENT from all previous pages.`
    : "\n- Start with a vivid, unique setting.";

  const copyrightInstr = "\n- COPYRIGHT: Create ORIGINAL characters inspired by any mentioned movie/game characters. New name, same abilities.";

  const cameraAngle = CAMERA_CYCLE[(pn - 1) % CAMERA_CYCLE.length];
  const prevCamera = pn > 1 ? CAMERA_CYCLE[(pn - 2) % CAMERA_CYCLE.length] : null;

  const illustrationInstr = `
- ILLUSTRATION (you are the ART DIRECTOR): Return "illustration" object:
  { "composition": "framing description", "camera": "angle/perspective", "character_action": "PHYSICAL verb + body position", "character_items": ["ALL objects from child's choice"], "environment": "2-3 vivid setting details", "lighting": "specific light source + quality", "color_palette": "dominant colors + accent" }
  Camera for THIS page: ${cameraAngle}${prevCamera ? ` Previous was: ${prevCamera} — must be DIFFERENT.` : ""}
  - Alternate WARM/COOL palette, INDOOR/OUTDOOR between pages
  - character_action starts with PHYSICAL VERB (runs, climbs, reaches, hides, leaps)
  - character_items MUST include ALL objects/weapons/tools from child's choice — NEVER omit
  - Show emotion through BODY LANGUAGE, not abstract words`;

  let qualityCheckInstr = "";
  if (prevIllustrationUrl && identityTag) {
    qualityCheckInstr = `\n- QUALITY CHECK the attached image: return "prevIllustrationCheck":{"character_match":1-10,"scene_match":1-10,"notes":"brief"} where character_match rates if character matches "${identityTag}"`;
  }

  const sys = `You are a master storyteller AND art director for illustrated children's stories. ${langInstr} Story with consequences — choices shape the outcome.
Rules:
- Child: ${name}, age ${age}${charBlock}${backstoryBlock}
- Page ${pn}/${TOTAL_PAGES}. 2-3 vivid sentences, age-appropriate.${diversityInstr}${copyrightInstr}
- TONE: Match premise. Realistic premise = grounded. Fantasy premise = magical.
- ${choicesInstruction}
- Negative choice consequences on NEXT page. Positive = warm rewards.${illustrationInstr}${qualityCheckInstr}
- "mood": forest|ocean|space|castle|magic|city|school|sports|home

Respond ONLY valid JSON:
{"text":"...","mood":"...","illustration":{...},"sceneSummary":"2-4 words","actionSummary":"2-4 words"${charDescJson},${choicesOrEnd},"title":"chapter title in ${storyLang === "en" ? "English" : "Russian"}","sfx":"ambient 5-10 words","tts_text":"text for TTS"${prevIllustrationUrl ? ',"prevIllustrationCheck":{...}' : ""}}`;

  const textMsg = history.length === 0
    ? `Create a new story for ${name}. Premise: ${backstory || "a surprise creative adventure"}. Exciting opening!`
    : `${hist}\n\nChild chose: "${choice?.label || ""}" (${choice?.value || "custom"}). Continue. Show consequences.`;

  let userContent;
  if (prevIllustrationUrl && identityTag) {
    userContent = [
      { type: "image", source: { type: "url", url: prevIllustrationUrl } },
      { type: "text", text: textMsg },
    ];
  } else {
    userContent = textMsg;
  }

  const headers = { "Content-Type": "application/json", "anthropic-version": "2023-06-01" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers,
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: sys, messages: [{ role: "user", content: userContent }] }),
  });

  const data = await res.json();
  if (data.error) {
    console.error("Sonnet API error:", data.error);
    throw new Error(data.error.message || "Sonnet API error");
  }

  const txt = data.content?.map(b => (b.type === "text" ? b.text : "")).join("") || "";

  // Safe JSON parse
  let parsed;
  try {
    parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("JSON parse error. Raw:", txt.slice(0, 500));
    const jsonMatch = txt.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); }
      catch { throw new Error("Failed to parse Sonnet JSON"); }
    } else {
      throw new Error("No JSON in Sonnet response");
    }
  }

  // Backward compat: old scene → illustration object
  if (!parsed.illustration && parsed.scene) {
    parsed.illustration = {
      composition: CAMERA_CYCLE[(pn - 1) % CAMERA_CYCLE.length],
      camera: CAMERA_CYCLE[(pn - 1) % CAMERA_CYCLE.length],
      character_action: parsed.scene,
      character_items: [],
      environment: parsed.scene,
      lighting: "natural light",
      color_palette: "warm tones",
    };
  }
  // Generate legacy scene from illustration
  if (parsed.illustration && !parsed.scene) {
    const ill = parsed.illustration;
    parsed.scene = [ill.character_action, ill.environment].filter(Boolean).join(". ").slice(0, 200);
  }

  return parsed;
}
