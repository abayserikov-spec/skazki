import { TOTAL_PAGES } from "./constants.js";

// ═══════════════════════════════════════════════════════════
// ANYTURN — AI Module v10
// Images: Google Gemini NB2 (gemini-3.1-flash-image-preview)
//         Text rendered with Sassoon Primary, embedded in illustration
// Story:  Anthropic Claude Sonnet
// ═══════════════════════════════════════════════════════════

// ─── STYLE SYSTEM ───
const STYLE_ANCHORS = {
  book: `Warm watercolor children's book illustration on cream textured paper. Thin pencil outlines visible underneath transparent watercolor washes. Soft muted palette: ochre, burnt sienna, sage green, dusty blue, warm grey. Visible paper grain showing through thin paint layers. Gentle imperfect hand-drawn quality. Similar to Oliver Jeffers and Benji Davies picture book style.`,
  anime: `Anime-style children's book illustration. Vibrant saturated colors, expressive characters with large eyes, dynamic poses. Studio Ghibli warmth with cinematic golden-hour lighting. Clean linework with soft cel-shading.`,
  realistic: `Photorealistic children's book illustration. Cinematic composition with depth of field, detailed textures, warm natural lighting. Characters with realistic proportions and soft expressions. Professional quality.`,
};

const STYLE_REF_INSTRUCTION = `Replicate ONLY the art style, color palette, and rendering technique from the style reference images. Characters must have simple small dot eyes and minimal facial features. Do NOT copy or include any characters, animals, or creatures from the reference images — only match their visual style.`;

// ─── TEXT ZONE → COMPOSITION INSTRUCTION ───
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

// ═══════════════════════════════════════════════════════════
// TEXT RENDERING — Server-side Sassoon Primary
// ═══════════════════════════════════════════════════════════

async function renderTextRef(text, opts = {}) {
  const { color = "#2C1810", bgColor = null, fontSize = 44, maxWidth = 600 } = opts;
  try {
    // Load Sassoon Primary font (cached after first load)
    if (!renderTextRef._fontLoaded) {
      try {
        const font = new FontFace("Sassoon Primary", "url(/fonts/sassoon-primary.otf)");
        await font.load();
        document.fonts.add(font);
        renderTextRef._fontLoaded = true;
      } catch (e) {
        console.warn("Sassoon font load failed, using fallback:", e);
        renderTextRef._fontLoaded = true; // Don't retry
      }
    }

    const fontFamily = document.fonts.check(`${fontSize}px "Sassoon Primary"`)
      ? '"Sassoon Primary"'
      : '"Nunito", sans-serif';

    const padding = fontSize;
    const lineSpacing = fontSize * 0.35;

    // Word-wrap text using offscreen canvas
    const measure = document.createElement("canvas").getContext("2d");
    measure.font = `${fontSize}px ${fontFamily}`;

    const words = text.split(" ");
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (measure.measureText(testLine).width > maxWidth - padding * 2 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Render
    const lineHeight = fontSize + lineSpacing;
    const canvasWidth = maxWidth;
    const canvasHeight = Math.ceil(lines.length * lineHeight + padding * 2);

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + i * lineHeight);
    });

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Text render failed:", err);
    return null;
  }
}
renderTextRef._fontLoaded = false;

function getTextColor(intensity, textZone) {
  if (textZone?.startsWith("overlay")) return "#FFFFFF";
  if (intensity >= 70) return "#FFFFFF";
  return "#2C1810";
}

// ═══════════════════════════════════════════════════════════
// GEMINI NB2 — Core image generation
// ═══════════════════════════════════════════════════════════

async function geminiGenerate(prompt, referenceImages = [], aspectRatio = "3:4") {
  const body = { prompt, referenceImages: referenceImages.filter(Boolean), aspectRatio, imageSize: "1K" };
  const res = await fetch("/api/gemini", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) { console.error("Gemini NB2 error:", data.error); return null; }
  if (data.imageBase64) return `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`;
  return null;
}

// ═══════════════════════════════════════════════════════════
// CHARACTER PORTRAITS
// ═══════════════════════════════════════════════════════════

export async function genCharPortrait(charDesc, scene, artStyleKey, opts = {}) {
  const styleRef = opts.styleRefUrl || null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);
  const prompt = [styleText, `Full body portrait of ${charDesc}.`, `Relaxed neutral pose, slight three-quarter turn, arms slightly away from body.`, `Plain simple background. Clear separation between character and background.`, `Clean image without any text, words, or writing.`].join(" ");
  const refs = hasRef ? [styleRef] : [];
  try { return await geminiGenerate(prompt, refs, "1:1"); }
  catch (err) { console.error("Portrait generation error:", err); return null; }
}

export async function genNewCharPortrait(newCharDesc, artStyleKey, opts = {}) {
  const styleRef = opts.styleRefUrl || null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);
  const prompt = [styleText, `Full body portrait of a NEW character: ${newCharDesc}.`, `Relaxed neutral pose, slight three-quarter turn.`, `Plain simple background.`, `Clean image without any text or writing.`].join(" ");
  const refs = hasRef ? [styleRef] : [];
  try { return await geminiGenerate(prompt, refs, "1:1"); }
  catch (err) { console.error("New character portrait error:", err); return null; }
}

// ═══════════════════════════════════════════════════════════
// BOOK PAGE GENERATION — Full page with text embedded
// Creates a complete book page: illustration + text as one image
// ═══════════════════════════════════════════════════════════

export async function genBookPage(scene, charDesc, portraitUrls, artStyleKey, pageText, textZone, intensity, opts = {}) {
  const portraits = Array.isArray(portraitUrls) ? portraitUrls : (portraitUrls ? [portraitUrls] : []);
  const styleRef = opts.styleRefUrl || null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);

  const textColor = getTextColor(intensity, textZone);
  const bgColor = (intensity < 50 && !textZone?.startsWith("overlay")) ? "#FFFFF8" : null;
  const textRefBase64 = await renderTextRef(pageText, { color: textColor, bgColor, fontSize: 40, maxWidth: 550 });

  const zoneInstruction = TEXT_ZONE_INSTRUCTIONS[textZone] || TEXT_ZONE_INSTRUCTIONS["bottom-center"];
  const charInstruction = portraits.length > 0
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

  const refs = [];
  if (textRefBase64) refs.push(textRefBase64);
  if (styleRef) refs.push(styleRef);
  portraits.forEach(p => { if (p) refs.push(p); });

  try { return await geminiGenerate(prompt, refs, "3:4"); }
  catch (err) { console.error("Book page generation error:", err); return null; }
}

export async function genFirstBookPage(scene, charDesc, artStyleKey, pageText, textZone, intensity, opts = {}) {
  const styleRef = opts.styleRefUrl || null;
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

  try { return await geminiGenerate(prompt, refs, "3:4"); }
  catch (err) { console.error("First book page error:", err); return null; }
}

// Legacy exports for backward compatibility
export async function genNextImage(scene, charDesc, portraitUrls, mood, artStyleKey, opts = {}) {
  const portraits = Array.isArray(portraitUrls) ? portraitUrls : (portraitUrls ? [portraitUrls] : []);
  const styleRef = opts.styleRefUrl || null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);
  const charInstruction = portraits.length > 0 ? `Keep ALL characters from reference images with identical appearance.` : (charDesc ? `The character: ${charDesc}.` : "");
  const prompt = [styleText, `Scene: ${scene}`, charInstruction, `Create a completely NEW scene. Clean image without any text.`].join(" ");
  const refs = [];
  if (styleRef) refs.push(styleRef);
  portraits.forEach(p => { if (p) refs.push(p); });
  try { return await geminiGenerate(prompt, refs, "3:4"); }
  catch (err) { console.error("Scene generation error:", err); return null; }
}

export async function genFirstImage(scene, charDesc, mood, artStyleKey, opts = {}) {
  const styleRef = opts.styleRefUrl || null;
  const hasRef = !!styleRef;
  const styleText = hasRef ? STYLE_REF_INSTRUCTION : (STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book);
  const prompt = [styleText, scene, `The main character is ${charDesc}.`, `Clean image without any text.`].join(" ");
  const refs = hasRef ? [styleRef] : [];
  try { return await geminiGenerate(prompt, refs, "3:4"); }
  catch (err) { console.error("First image error:", err); return null; }
}

export async function addCharToPortrait(existingPortraitUrl, newCharDesc, artStyleKey, opts = {}) {
  return genNewCharPortrait(newCharDesc, artStyleKey, opts);
}

// ═══════════════════════════════════════════════════════════
// STORY GENERATION — Claude Sonnet
// Now returns textZone and intensity for layout system
// ═══════════════════════════════════════════════════════════

const CAMERA_SEQUENCE = ["Wide establishing shot", "Medium shot", "Close-up", "Bird's eye view", "Low angle looking up", "Over-the-shoulder"];

export async function genPage(ctx) {
  const { name, age, theme, history, choice, charDesc, backstory, lang: storyLang, identityTag, previousArc } = ctx;
  const pn = history.length + 1;
  const isEnd = pn >= TOTAL_PAGES;

  const hist = history.map((h, i) =>
    "P" + (i + 1) + ": " + h.text +
    (h.sceneSummary ? " [location: " + h.sceneSummary + "]" : "") +
    (h.actionSummary ? " [action: " + h.actionSummary + "]" : "") +
    (h.cameraAngle ? " [camera: " + h.cameraAngle + "]" : "") +
    (h.choice ? " [chose: " + h.choice.label + "/" + h.choice.value + "]" : "")
  ).join("\n");

  const usedAngles = history.map(h => h.cameraAngle).filter(Boolean);
  const availableAngles = CAMERA_SEQUENCE.filter(a => !usedAngles.includes(a));
  const suggestedAngle = availableAngles.length > 0 ? availableAngles[0] : CAMERA_SEQUENCE[pn % CAMERA_SEQUENCE.length];

  const charBlock = charDesc
    ? "\n- The main characters have been established: " + charDesc + ". Keep ALL characters visually consistent.\n- NEW CHARACTER RULE: If ANY new character appears who INTERACTS with the main character, return a \"newMainCharacter\" field with their detailed English visual description for a SOLO portrait AND a \"newCharacterName\" field with the character's name. Include: species/type, age, hair/fur color, eye color, clothing, accessories, body build, distinctive features."
    : '\n- FIRST PAGE: You MUST return a "characterDesc" field with detailed English visual descriptions for individual portraits. Format: "Main: a small red fox cub with bright green eyes, wearing a blue scarf" Include: species/type, fur/hair color, eye color, clothing, accessories. If multiple characters, separate with " | ".\n- FIRST PAGE: Also return a "characterName" field with the character\'s name.';

  const charDescJson = !charDesc ? ',"characterDesc":"...","characterName":"..."' : '';

  const positiveValues = ["generosity","empathy","courage","curiosity","kindness","honesty","patience","teamwork"];
  const negativeValues = ["selfishness","cowardice","cruelty","greed","laziness","dishonesty","aggression","indifference"];

  let endingInstruction = "";
  if (isEnd) {
    const choiceValues = history.filter(h => h.choice).map(h => h.choice.value || "custom");
    const negCount = choiceValues.filter(v => negativeValues.includes(v)).length;
    const posCount = choiceValues.filter(v => positiveValues.includes(v)).length;
    if (negCount > posCount) endingInstruction = "LAST PAGE — SAD ENDING. Consequences of bad choices. Character feels regret.";
    else if (negCount === posCount && negCount > 0) endingInstruction = "LAST PAGE — MIXED ENDING. Partly works out, bittersweet.";
    else endingInstruction = "LAST PAGE — HAPPY ENDING. Good choices paid off! Warm ending.";
  }

  const choicesOrEnd = isEnd ? '"isEnd":true,"ending":"good|mixed|sad"' : '"choices":[{"label":"...","emoji":"...","value":"generosity|empathy|courage|curiosity|kindness|honesty|patience|teamwork|selfishness|cowardice|cruelty|greed|laziness|dishonesty|aggression|indifference"}]';
  const choicesInstruction = isEnd ? endingInstruction : "Give 2-3 choices. Include at least one POSITIVE and one NEGATIVE/TEMPTING choice. Negative should feel tempting. Natural consequences, not preachy.";

  const backstoryBlock = backstory ? `\n- STORY PREMISE: ${backstory}. Build around this.` : "";
  const arcBlock = previousArc?.length > 0 ? `\n- CHARACTER HISTORY: ${previousArc.join(" → ")}. Reference past events naturally.` : "";
  const langInstr = storyLang === "en" ? "Write story text in ENGLISH." : "Write story text in RUSSIAN.";
  const copyrightInstr = "\n- COPYRIGHT: If child mentions a movie/cartoon character, create an ORIGINAL character INSPIRED by them. New name, keep abilities. Use 'outfit', 'clothes', 'attire' not 'costume', 'suit', 'uniform'.";

  const sceneInstructions = `
- "scene": CINEMATIC English description for illustration (40-80 words).
- "cameraAngle": shot type used.
- "textZone": where story text appears on page. Options: top-left, top-right, top-center, bottom-left, bottom-right, bottom-center, overlay-top, overlay-bottom.
- "intensity": emotional intensity 0-100.

TEXT ZONE RULES — Think like a picture book director:
- Text is rendered in Sassoon Primary font and embedded INTO the illustration.
- Choose textZone where there's NEGATIVE SPACE (sky, ground, empty wall, calm water).
- DRAMATIC (intensity 70+): overlay-top or overlay-bottom.
- QUIET (intensity < 30): top-center or bottom-center.
- STANDARD: top-left/right, bottom-left/right based on where character is NOT.
- PAGE 1: intensity >= 70, textZone = "top-left" or "overlay-top".
- LAST PAGE: textZone = "bottom-center".
- BEFORE CHOICE: intensity <= 40.

SCENE FORMAT:
1. CAMERA: "${suggestedAngle}". NEVER repeat previous page's angle.
2. CHARACTER ACTION: body-movement verbs (leaping, crouching, reaching, climbing).
3. ENVIRONMENT reflecting emotion (warm light = happy, shadows = tense, mist = mysterious).
4. NEGATIVE SPACE: describe WHERE in scene is calm/empty for text.

FORBIDDEN: Characters just "standing", same angle as previous page, "costume"/"suit"/"uniform".`;

  const sys = `You are a master storyteller creating interactive stories for children. ${langInstr} STORY WITH CONSEQUENCES — choices shape the outcome.
Rules:
- Child: ${name}, age ${age}${charBlock}${backstoryBlock}${arcBlock}
- Page ${pn}/${TOTAL_PAGES}. Write 2-3 vivid sentences.${copyrightInstr}
- ${choicesInstruction}
- If negative choice → show consequences. If positive → show rewards.
${sceneInstructions}
- "mood": forest|ocean|space|castle|magic|city|school|sports|home
${isEnd ? '- LAST PAGE: Include "storySummary" (15-25 words English).' : ""}
Respond ONLY valid JSON:
{"text":"...","mood":"...","scene":"...40-80 words with negative space description...","cameraAngle":"...","textZone":"...","intensity":0-100,"sceneSummary":"2-4 words","actionSummary":"2-4 words"${charDescJson},${choicesOrEnd},"title":"...","sfx":"ambient 5-10 words","tts_text":"text for TTS"${isEnd ? ',"storySummary":"..."' : ""}}`;

  const textMsg = history.length === 0
    ? `Create a new story for ${name}. Premise: ${backstory || "a surprise creative adventure"}. Exciting opening!`
    : `${hist}\n\nChild chose: "${choice?.label || ""}" (${choice?.value || "custom"}). Continue. Show consequences.`;

  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: sys, messages: [{ role: "user", content: textMsg }] }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Sonnet API error");

  const txt = data.content?.map(b => (b.type === "text" ? b.text : "")).join("") || "";
  let parsed;
  try {
    parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
  } catch (e) {
    const jsonMatch = txt.match(/\{[\s\S]*\}/);
    if (jsonMatch) { try { parsed = JSON.parse(jsonMatch[0]); } catch { throw new Error("Failed to parse Sonnet JSON"); } }
    else throw new Error("No JSON in Sonnet response");
  }

  if (!parsed.textZone) parsed.textZone = pn === 1 ? "top-left" : "bottom-center";
  if (!parsed.intensity) parsed.intensity = pn === 1 ? 75 : 50;

  return parsed;
}
