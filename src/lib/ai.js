import { TOTAL_PAGES } from "./constants.js";

// ═══════════════════════════════════════════════════════════
// ANYTURN — AI Module v9
// Images: Google Gemini Nano Banana 2 (gemini-3.1-flash-image-preview)
// Story:  Anthropic Claude Sonnet
// ═══════════════════════════════════════════════════════════

// ─── STYLE SYSTEM ───
// Style anchors for text prompts (used when no style reference image)
const STYLE_ANCHORS = {
  book: `Warm watercolor children's book illustration on cream textured paper. Thin pencil outlines visible underneath transparent watercolor washes. Soft muted palette: ochre, burnt sienna, sage green, dusty blue, warm grey. Visible paper grain showing through thin paint layers. Gentle imperfect hand-drawn quality. Similar to Oliver Jeffers and Benji Davies picture book style.`,
  anime: `Anime-style children's book illustration. Vibrant saturated colors, expressive characters with large eyes, dynamic poses. Studio Ghibli warmth with cinematic golden-hour lighting. Clean linework with soft cel-shading.`,
  realistic: `Photorealistic children's book illustration. Cinematic composition with depth of field, detailed textures, warm natural lighting. Characters with realistic proportions and soft expressions. Professional quality.`,
};

// Style instruction when reference image IS provided
const STYLE_REF_INSTRUCTION = `Replicate ONLY the art style, color palette, and rendering technique from the reference images. Characters must have simple small dot eyes and minimal facial features. Do NOT copy or include any characters, animals, or creatures from the reference images — only match their visual style. The generated image must look like it belongs in the same book as the references in terms of art style only.`;

// ═══════════════════════════════════════════════════════════
// GEMINI NB2 — Core image generation
// Single model for: portraits, scenes, character editing
// No polling needed — returns result in one request
// ═══════════════════════════════════════════════════════════

async function geminiGenerate(prompt, referenceImages = [], aspectRatio = "16:9") {
  const body = {
    prompt,
    referenceImages: referenceImages.filter(Boolean),
    aspectRatio,
    imageSize: "1K",
  };

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.error) {
    console.error("Gemini NB2 error:", data.error);
    return null;
  }

  if (data.imageBase64) {
    return `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// CHARACTER PORTRAIT — Individual portrait generation
// Creates a single character on plain background
// Used for: new characters, character library
// ═══════════════════════════════════════════════════════════

export async function genCharPortrait(charDesc, scene, artStyleKey, opts = {}) {

  const styleRef = opts.styleRefUrl || null;
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

  try {
    return await geminiGenerate(prompt, refs, "1:1");
  } catch (err) {
    console.error("Portrait generation error:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// NEW CHARACTER PORTRAIT — Mid-story character generation
// When Sonnet detects a new important character
// ═══════════════════════════════════════════════════════════

export async function genNewCharPortrait(newCharDesc, artStyleKey, opts = {}) {

  const styleRef = opts.styleRefUrl || null;
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

  try {
    return await geminiGenerate(prompt, refs, "1:1");
  } catch (err) {
    console.error("New character portrait error:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// SCENE GENERATION — Place characters in illustrated scene
// Uses: style reference + character portrait(s) + scene text
// Core function called for every story page
// ═══════════════════════════════════════════════════════════

export async function genNextImage(scene, charDesc, portraitUrls, mood, artStyleKey, opts = {}) {

  // portraitUrls can be a string (single) or array (multiple characters)
  const portraits = Array.isArray(portraitUrls) ? portraitUrls : (portraitUrls ? [portraitUrls] : []);
  const styleRef = opts.styleRefUrl || null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);

  const charCount = portraits.length;
  const charInstruction = charCount > 0
    ? `Keep ALL characters from reference images with identical appearance — same face, same colors, same clothing, same proportions. Do not alter any character's design.`
    : (charDesc ? `The character: ${charDesc}.` : "");

  const prompt = [
    styleText,
    `Place the character${charCount > 1 ? "s" : ""} in this scene:`,
    scene,
    charInstruction,
    `Create a completely NEW scene and background based on the description above. Do NOT reuse or copy any backgrounds, environments, or scene elements from the reference images — only copy the characters' appearance.`,
    `Clean image without any text, words, or writing.`,
  ].join(" ");

  // Build reference array: style ref first, then portraits
  const refs = [];
  if (styleRef) refs.push(styleRef);
  portraits.forEach(p => { if (p) refs.push(p); });

  try {
    return await geminiGenerate(prompt, refs, "16:9");
  } catch (err) {
    console.error("Scene generation error:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// FIRST IMAGE FALLBACK — Scene without portrait reference
// Used when no portrait has been generated yet
// ═══════════════════════════════════════════════════════════

export async function genFirstImage(scene, charDesc, mood, artStyleKey, opts = {}) {

  const styleRef = opts.styleRefUrl || null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);

  const prompt = [
    styleText,
    scene,
    `The main character is ${charDesc}.`,
    `Show ALL characters described with distinct appearances.`,
    `Clean image without any text, words, or writing.`,
  ].join(" ");

  const refs = hasRef ? [styleRef] : [];

  try {
    return await geminiGenerate(prompt, refs, "16:9");
  } catch (err) {
    console.error("First image error:", err);
    return null;
  }
}

// Legacy export for backward compatibility with App.jsx
export async function addCharToPortrait(existingPortraitUrl, newCharDesc, artStyleKey, opts = {}) {
  return genNewCharPortrait(newCharDesc, artStyleKey, opts);
}

// ═══════════════════════════════════════════════════════════
// STORY GENERATION — Claude Sonnet
// Enhanced with research-backed scene description prompting
// ═══════════════════════════════════════════════════════════

// Camera angle sequence for visual variety
const CAMERA_SEQUENCE = [
  "Wide establishing shot",
  "Medium shot",
  "Close-up",
  "Bird's eye view",
  "Low angle looking up",
  "Over-the-shoulder",
];

export async function genPage(ctx) {
  const {
    name, age, theme, history, choice, charDesc, backstory,
    lang: storyLang, identityTag, previousArc,
  } = ctx;

  const pn = history.length + 1;
  const isEnd = pn >= TOTAL_PAGES;

  const hist = history.map((h, i) =>
    "P" + (i + 1) + ": " + h.text +
    (h.sceneSummary ? " [location: " + h.sceneSummary + "]" : "") +
    (h.actionSummary ? " [action: " + h.actionSummary + "]" : "") +
    (h.cameraAngle ? " [camera: " + h.cameraAngle + "]" : "") +
    (h.choice ? " [chose: " + h.choice.label + "/" + h.choice.value + "]" : "")
  ).join("\n");

  // Track previous camera angles to avoid repeats
  const usedAngles = history.map(h => h.cameraAngle).filter(Boolean);
  const availableAngles = CAMERA_SEQUENCE.filter(a => !usedAngles.includes(a));
  const suggestedAngle = availableAngles.length > 0
    ? availableAngles[0]
    : CAMERA_SEQUENCE[pn % CAMERA_SEQUENCE.length];

  const charBlock = charDesc
    ? "\n- The main characters have been established: " + charDesc + ". Keep ALL characters visually consistent.\n- NEW CHARACTER RULE: If ANY new character appears who INTERACTS with the main character (talks to them, helps them, blocks them, gives something, fights them — any direct interaction), return a \"newMainCharacter\" field with their detailed English visual description for a SOLO portrait AND a \"newCharacterName\" field with the character's name as it appears in the story (e.g. \"Лис\" or \"Old Owl\"). This includes: shopkeepers, fishermen, guards, teachers, old ladies, animals, magical creatures — ANYONE the hero interacts with. Describe ONLY the new character. Include: species/type, age, hair/fur color, eye color, clothing, accessories, body build, distinctive features. Do NOT skip this for 'minor' characters — if they appear in the scene and interact, they need a portrait."
    : '\n- FIRST PAGE: You MUST return a "characterDesc" field with detailed English visual descriptions for individual portraits. Describe EACH character SEPARATELY for solo portrait generation. Format: "Main: a small red fox cub with bright green eyes, wearing a blue scarf and brown leather satchel, fluffy tail with white tip" Include: species/type, fur/hair color, eye color, clothing, accessories, body build, distinctive features. If multiple characters, separate with " | " delimiter.\n- FIRST PAGE: You MUST also return a "characterName" field with the character\'s name as it appears in the story (e.g. "Rusty" or "Лисёнок Рыжик"). If multiple characters, separate with " | " delimiter.';

  const charDescJson = !charDesc ? ',"characterDesc":"...detailed english visual description of EACH character separated by | ...","characterName":"...character name as in story..."' : '';

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
  const arcBlock = previousArc && previousArc.length > 0
    ? `\n- CHARACTER HISTORY (previous adventures): ${previousArc.join(" → ")}. Reference past events naturally — the character remembers and has grown from these experiences. Don't retell old stories, but build on them.`
    : "";
  const langInstr = storyLang === "en" ? "Write story text in ENGLISH." : "Write story text in RUSSIAN.";

  const copyrightInstr = "\n- COPYRIGHT CHARACTERS: If the child mentions a character from movies/cartoons/comics/games, create an ORIGINAL character INSPIRED by them. Give them a new name, keep iconic abilities. Describe with SPECIFIC visual details in the scene field. Use 'outfit', 'clothes', 'attire' instead of 'costume', 'suit', 'uniform'. Never use original character names in the scene field.";

  // ── ENHANCED SCENE DESCRIPTION INSTRUCTIONS ──
  // Based on prompting research for NB2 + children's book illustration
  const sceneInstructions = `
- Include a "scene" field: a CINEMATIC English description for illustration (40-80 words).
- Also include "cameraAngle" field with the shot type used.

SCENE DESCRIPTION FORMAT — write in this EXACT order:
1. CAMERA ANGLE: Start with "${suggestedAngle}" for this page. Return the angle in the "cameraAngle" field.
   Available angles: Wide establishing shot, Medium shot, Close-up, Bird's eye view, Low angle looking up, Over-the-shoulder.
   NEVER repeat the same angle as the previous page.

2. CHARACTER ACTION: What each character is PHYSICALLY DOING — use specific body-movement verbs:
   leaping, crouching, reaching, climbing, crawling, carrying, pulling, pushing, balancing, tumbling.
   Express emotions through WHOLE BODY posture, not just facial expressions:
   - Joy: jumping with arms raised, spinning, running with big smile
   - Fear: crouching low, hiding behind object, ears flat, tail tucked
   - Courage: standing tall with chin up, marching forward, fists clenched
   - Sadness: sitting hugging knees, head down, shoulders slumped
   - Curiosity: leaning forward, reaching toward, peeking around corner

3. MOTION INDICATORS: Make the scene feel ALIVE with implied movement:
   - Trailing scarves/capes/tails in the wind
   - Dust, leaves, snow disturbed by movement
   - Objects mid-air (splashing water, falling petals, thrown ball)
   - Hair/fur ruffled by speed or wind

4. CHARACTER INTERACTION (if multiple characters):
   - Physical contact: "paw resting on shoulder", "carrying on back"
   - Eye contact: "looking directly at each other", "both staring at the crystal"
   - Spatial: "back-to-back", "one in foreground one behind"

5. ENVIRONMENT reflecting EMOTIONAL TONE:
   - Happy: warm golden light, vibrant colors, open spaces, flowers
   - Tense: cool blue tones, long shadows, enclosed spaces, bare branches
   - Mysterious: purple/green palette, mist, glowing elements, deep forest
   - Cozy: warm indoor lighting, earth tones, firelight, small spaces
   - Brave: dramatic dawn/sunset, vast landscapes, red/gold accents

6. COMPOSITION using rule of thirds:
   - Vary character size dramatically: tiny in vast landscape OR filling the frame
   - Character on LEFT facing RIGHT = moving forward
   - Character on RIGHT facing LEFT = reflection/pause
   - Include FOREGROUND elements (leaves, rocks) for depth
   - Include BACKGROUND elements (sky, mountains, buildings) for scale

FORBIDDEN in scene descriptions:
- Characters "standing" or just "looking at" something
- Same camera angle as previous page
- Character centered in frame every time
- Generic backgrounds without specific details
- Words like "costume", "suit", "uniform" (use "outfit", "clothes", "attire")`;

  const sys = `You are a master storyteller creating interactive stories for children. ${langInstr} This is a STORY WITH CONSEQUENCES — the child's choices DIRECTLY shape the outcome.
Rules:
- Child: ${name}, age ${age}${charBlock}${backstoryBlock}${arcBlock}
- Page ${pn}/${TOTAL_PAGES}. Write 2-3 vivid sentences in simple, engaging language appropriate for the child's age.${copyrightInstr}
- TONE MATCHING: Determine the tone from the premise. If the premise is realistic — keep it grounded. NO magic unless the premise involves fantasy.
- ${choicesInstruction}
- CRITICAL: If the child previously made a negative choice, show realistic consequences in the NEXT page.
- If the child made a positive choice, show warm rewards.
${sceneInstructions}
- "mood": forest|ocean|space|castle|magic|city|school|sports|home
${isEnd ? '- LAST PAGE: Include "storySummary" — a single English sentence (15-25 words) summarizing what happened to the main character in this story and how they changed. This is for the character\'s memory across stories.' : ""}
Respond ONLY valid JSON:
{"text":"...","mood":"...","scene":"...cinematic english scene description, 40-80 words...","cameraAngle":"...shot type used...","sceneSummary":"2-4 words","actionSummary":"2-4 words"${charDescJson},${choicesOrEnd},"title":"chapter title in ${storyLang === "en" ? "English" : "Russian"}","sfx":"ambient 5-10 words","tts_text":"text for TTS"${isEnd ? ',"storySummary":"...english summary of this story for character memory..."' : ""}}`;

  const textMsg = history.length === 0
    ? `Create a new story for ${name}. Premise: ${backstory || "a surprise creative adventure"}. Exciting opening!`
    : `${hist}\n\nChild chose: "${choice?.label || ""}" (${choice?.value || "custom"}). Continue. Show consequences.`;

  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: sys, messages: [{ role: "user", content: textMsg }] }),
  });

  const data = await res.json();
  if (data.error) {
    console.error("Sonnet API error:", data.error);
    throw new Error(data.error.message || "Sonnet API error");
  }

  const txt = data.content?.map(b => (b.type === "text" ? b.text : "")).join("") || "";

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

  return parsed;
}
