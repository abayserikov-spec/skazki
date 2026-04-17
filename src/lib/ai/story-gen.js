// ═══════════════════════════════════════════════════════════
// STORY GENERATION — Claude Sonnet
// Age-adaptive text, values, branching narratives
// ═══════════════════════════════════════════════════════════

import { TOTAL_PAGES, CLAUDE_MODEL } from "../constants.js";

const CAMERA_SEQUENCE = ["Wide establishing shot", "Medium shot", "Close-up", "Bird's eye view", "Low angle looking up", "Over-the-shoulder"];

// ─── AGE-ADAPTIVE WRITING STYLE ───
function getAgeWritingStyle(age) {
  const ageNum = parseInt(age) || 6;
  if (ageNum <= 4) {
    return `AGE ${ageNum} WRITING RULES:
- Write 1-2 SHORT sentences per page (max 15 words each).
- Use ONLY simple everyday words a 3-4 year old knows.
- Add sound effects and onomatopoeia (Splash! Whoosh! Roar!).
- Strong emotions: "very very happy", "so so scared".
- Simple repetition for rhythm: "He ran and ran and ran."
- No complex sentences. No subordinate clauses. No metaphors.
- Choices must be VERY simple: 2 choices max, 3-5 words each.
- TTS text should be extra expressive with pauses.`;
  } else if (ageNum <= 5) {
    return `AGE ${ageNum} WRITING RULES:
- Write 1-2 sentences per page (max 20 words each).
- Simple vocabulary — words a 5 year old uses daily.
- Sound effects welcome (Crack! Whoooosh!).
- Short dialogue OK: "Help me!" said the fox.
- Emotions named directly: "felt brave", "got worried".
- No metaphors, no idioms, no abstract concepts.
- Choices: 2-3 options, 4-6 words each, very concrete actions.`;
  } else if (ageNum <= 7) {
    return `AGE ${ageNum} WRITING RULES:
- Write 2-3 sentences per page.
- Richer vocabulary OK but explain unusual words through context.
- Simple cause-and-effect: "Because he shared, they became friends."
- Dialogue encouraged — brings characters to life.
- Can hint at emotions without naming: "Her paws trembled."
- Simple similes OK: "fast as the wind".
- Choices: 2-3 options, can include emotional nuance.`;
  } else {
    return `AGE ${ageNum} WRITING RULES:
- Write 3-4 sentences per page. Richer descriptions and inner thoughts.
- Advanced vocabulary welcome — trust the reader.
- Metaphors, humor, wordplay, irony all OK.
- Internal monologue: "Maybe this wasn't such a great idea after all."
- Show-don't-tell emotions through body language and environment.
- Moral complexity: not everything is black and white.
- Choices: 2-3 options with real trade-offs and consequences.`;
  }
}

// ─── MAIN STORY PAGE GENERATION ───
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

  const ageWritingStyle = getAgeWritingStyle(age);

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
- Page ${pn}/${TOTAL_PAGES}.${copyrightInstr}
- ${choicesInstruction}
- If negative choice → show consequences. If positive → show rewards.

${ageWritingStyle}

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
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1500, system: sys, messages: [{ role: "user", content: textMsg }] }),
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
