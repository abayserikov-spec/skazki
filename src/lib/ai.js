import { TOTAL_PAGES, ART_STYLES } from "./constants.js";

// ═══════════════════════════════════════════════════════════
// ANYTURN — AI Module v7
// Portrait: Replicate Schnell + LoRA
// Scenes: fal.ai Kontext Dev + LoRA (style consistency!)
// ═══════════════════════════════════════════════════════════

const STYLE_TRIGGER = "Children's book illustration";

const STYLE_ANCHORS = {
  book: `ANYTURN style illustration. Warm watercolor on cream textured paper, thin ink outlines, soft muted palette, visible brushstrokes, hand-drawn charm.`,
  anime: `Anime-style children's book illustration. Vibrant colors, expressive characters with large eyes. Studio Ghibli warmth, cinematic lighting.`,
  realistic: `Photorealistic children's book illustration. Cinematic composition, detailed textures, warm natural lighting. Professional quality.`,
};

// ═══════════════════════════════════════
// FAL.AI CONFIG
// ═══════════════════════════════════════
const ANYTURN_LORA_URL = "https://huggingface.co/abaydsd/anyturn-lora/resolve/main/anyturn-lora.safetensors";

async function urlToBase64DataUri(url) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) { console.error("base64 convert failed:", e); return url; }
}

async function falGenImage(falKey, prompt, imageUrl) {
  // fal.ai cannot fetch external URLs — convert to base64 data URI
  const imgData = imageUrl.startsWith("data:") ? imageUrl : await urlToBase64DataUri(imageUrl);
  const res = await fetchWithRetry("https://queue.fal.run/fal-ai/flux-kontext-lora", {
    method: "POST",
    headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      image_url: imgData,
      loras: [{ path: ANYTURN_LORA_URL, scale: 1.4 }],
      num_inference_steps: 28,
      guidance_scale: 2.5,
      output_format: "png",
    }),
  });
  const data = await res.json();

  // fal.ai queue: if we get request_id, poll for result
  if (data.request_id) {
    const reqId = data.request_id;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux-kontext-lora/requests/${reqId}/status`, {
          headers: { Authorization: `Key ${falKey}` },
        });
        const status = await statusRes.json();
        if (status.status === "COMPLETED") {
          const resultRes = await fetch(`https://queue.fal.run/fal-ai/flux-kontext-lora/requests/${reqId}`, {
            headers: { Authorization: `Key ${falKey}` },
          });
          const result = await resultRes.json();
          return result?.images?.[0]?.url || null;
        }
        if (status.status === "FAILED") { console.error("fal.ai failed:", status); return null; }
      } catch (e) { console.error("fal.ai poll error:", e); }
    }
    return null;
  }

  // Sync response
  return data?.images?.[0]?.url || null;
}

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
// CHARACTER PORTRAIT via Flux Schnell
// Generates group portrait with ALL characters
// ═══════════════════════════════════════

export async function genCharPortrait(token, charDesc, scene, artStyleKey, opts = {}) {
  if (!token) return null;
  const prompt = "ANYTURN style illustration. " + charDesc + ". Full body, relaxed pose, plain cream background. Front view. No text.";
  try {
    const res = await fetchWithRetry("/api/replicate/v1/predictions", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Prefer: "wait=60" },
      body: JSON.stringify({
        version: "8f80adfcba13a43b5cfd2ed6fc8915ca6edd66a5839aca37dcf0fde10f0e6523",
        input: { prompt: prompt, num_outputs: 1, aspect_ratio: "16:9", output_format: "png", output_quality: 90 }
      }),
    });
    const resp = await res.json();
    if (resp.detail || resp.error) console.error("Portrait (ANYTURN LoRA) error:", JSON.stringify(resp));
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Portrait error:", err); return null; }
}

// Add new character to existing portrait via fal.ai Kontext Dev + LoRA
export async function addCharToPortrait(token, existingPortraitUrl, newCharDesc, artStyleKey, opts = {}) {
  if (!existingPortraitUrl) return null;

  const falKey = opts.falKey;
  if (!falKey) {
    console.error("addCharToPortrait: no fal.ai key provided");
    return null;
  }

  const prompt = `ANYTURN style illustration. Add a new character standing next to the existing characters: ${newCharDesc}. Keep ALL existing characters EXACTLY as they are — same face, clothing, proportions. The new character should match the same art style. Warm watercolor on cream textured paper, thin ink outlines. All characters visible, plain background. No text.`;

  try {
    return await falGenImage(falKey, prompt, existingPortraitUrl);
  } catch (err) { console.error("Add char (fal.ai) error:", err); return null; }
}

// ═══════════════════════════════════════
// FALLBACK — Flux Schnell (if portrait fails)
// ═══════════════════════════════════════

export async function genFirstImage(token, scene, charDesc, mood, artStyleKey) {
  if (!token) return null;
  const style = STYLE_ANCHORS[artStyleKey] || STYLE_ANCHORS.book;
  const prompt = `${style}. ${scene}. The main character is ${charDesc}. Show ALL characters described in the scene with distinct appearances. Dynamic poses and clear interaction between characters. No text, words, letters, or writing anywhere in the image.`;
  try {
    const res = await fetch("/api/replicate/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({ input: { prompt, go_fast: true, num_outputs: 1, aspect_ratio: "16:9", output_format: "png", output_quality: 90, num_inference_steps: 4 } }),
    });
    const resp = await res.json();
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Flux Schnell error:", err); return null; }
}

// ═══════════════════════════════════════
// SCENE GENERATION via fal.ai Kontext Dev + LoRA
// Uses portrait as reference + anyturn-style LoRA for consistency
// ═══════════════════════════════════════

export async function genNextImage(token, scene, charDesc, portraitUrl, mood, artStyleKey, opts = {}) {
  if (!token || !portraitUrl) return null;
  const prompt = "ANYTURN style. Same characters as reference. " + scene + ". No text.";
  try {
    const res = await fetchWithRetry("/api/replicate/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({ input: { prompt, input_image: portraitUrl, aspect_ratio: "16:9", output_format: "png", safety_tolerance: 6 } }),
    });
    const resp = await res.json();
    if (resp.detail || resp.error) console.error("Kontext Pro error:", JSON.stringify(resp));
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Kontext Pro error:", err); return null; }
}

// ═══════════════════════════════════════
// STORY GENERATION (Sonnet)
// Old-style rich scene descriptions
// ═══════════════════════════════════════

export async function genPage(ctx, apiKey) {
  const {
    name, age, theme, history, choice, charDesc, backstory,
    lang: storyLang, identityTag,
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
    ? "\n- The main characters have been established: " + charDesc + ". Keep ALL characters visually consistent.\n- NEW MAIN CHARACTER: If an important new character JOINS the party/group (a new friend, companion, rival who will stay in the story), return a \"newMainCharacter\" field with their detailed English visual description. Only for IMPORTANT recurring characters, not random NPCs or background people."
    : '\n- FIRST PAGE: You MUST also return a "characterDesc" field with detailed English visual descriptions of the MAIN CHARACTER and any other key characters who will appear throughout the story. Describe each character separately. Example: "Main: a small red fox cub with bright green eyes, wearing a blue scarf and brown leather satchel, fluffy tail with white tip. Friend: a tall grey wolf pup with amber eyes, wearing a green vest and carrying a wooden staff". Include: species/type, hair/fur color, eye color, clothing, accessories, body build, distinctive features for EACH character.';

  const charDescJson = !charDesc ? ',"characterDesc":"...detailed english visual description of main character AND other key characters..."' : '';

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
    ? `\n- LOCATION: Vary locations naturally with the story. Staying in the same area for 2-3 pages is fine.\n- ACTION: Character should do something relevant to the story. Vary poses naturally.`
    : "\n- Start with a vivid, unique setting.";

  const copyrightInstr = "\n- COPYRIGHT CHARACTERS: If the child mentions a character from movies/cartoons/comics/games (Spider-Man, Elsa, Batman, etc.), create an ORIGINAL character INSPIRED by them as a REAL LIVING CHARACTER in the story — with real superpowers, real actions, real dialogue. Do NOT reduce them to a drawing, poster, toy, or picture. The inspired character must be a FULL PARTICIPANT in the story. Give them a new name, keep their iconic abilities and personality. Examples: Spider-Man → Arachnid (a boy with spider powers who shoots webs and climbs walls), Elsa → Ice Princess Aurora (a princess who controls ice and snow), Batman → Dark Guardian (a masked hero who fights crime at night). For visuals in the scene field, describe the character with SPECIFIC visual details that make them recognizable — exact costume colors, mask shape, cape style, weapon type. The reader should IMMEDIATELY recognize who inspired this character from the illustration alone.";

  const sys = `You are a master storyteller creating interactive stories for children. ${langInstr} This is a STORY WITH CONSEQUENCES — the child's choices DIRECTLY shape the outcome.
Rules:
- Child: ${name}, age ${age}${charBlock}${backstoryBlock}
- Page ${pn}/${TOTAL_PAGES}. Write 2-3 vivid sentences in simple, engaging language appropriate for the child's age.${diversityInstr}${copyrightInstr}
- TONE MATCHING: Determine the tone from the premise. If the premise is realistic (sports, school, friendship, everyday life) — keep it grounded and realistic. NO magic, NO supernatural creatures unless the premise explicitly involves fantasy.
- ${choicesInstruction}
- CRITICAL: If the child previously made a negative choice, show realistic consequences in the NEXT page. Don't immediately fix bad choices.
- If the child made a positive choice, show warm rewards — new friendships, discovered treasures, growing trust.
- Include a "scene" field: a CINEMATIC English description for illustration. CRITICAL RULES FOR SCENE:
  1. UNIQUE POSES: Each character MUST have a DIFFERENT body pose and position than the previous page. If a character was standing with arms crossed before, now they should be sitting, leaning, pointing, walking, or gesturing. NEVER repeat the same pose twice.
  (1) Include ALL characters mentioned in the text
  (2) Show CHARACTER INTERACTION — body language between characters
  (3) Describe what each character is ACTIVELY DOING (never just standing)
  (4) Include EXPRESSIONS on each character face
  (5) Rich UNIQUE ENVIRONMENT details — DIFFERENT from all previous pages
  (6) CAMERA ANGLE — vary between wide shot, medium shot, close-up, bird's eye, low angle
  (7) For REALISTIC stories: describe real-world settings accurately. For FANTASY: magical environments.
  (8) IMPORTANT: Make each scene visually DISTINCT. Different colors, lighting, time of day, weather.
  (9) CHARACTER POSES MUST VARY DRAMATICALLY: running, climbing, hiding, falling, reaching up, crouching, swimming, flying, dancing, fighting, hugging. NEVER the same pose twice.
  (10) COMPOSITION VARIETY: Vary character size in frame — sometimes tiny in vast landscape, sometimes dramatic close-up, sometimes seen from behind.
- "mood": forest|ocean|space|castle|magic|city|school|sports|home

Respond ONLY valid JSON:
{"text":"...","mood":"...","scene":"...cinematic english scene description, 40-80 words, all characters, expressions, environment, camera angle...","sceneSummary":"2-4 words","actionSummary":"2-4 words"${charDescJson},${choicesOrEnd},"title":"chapter title in ${storyLang === "en" ? "English" : "Russian"}","sfx":"ambient 5-10 words","tts_text":"text for TTS"}`;

  const textMsg = history.length === 0
    ? `Create a new story for ${name}. Premise: ${backstory || "a surprise creative adventure"}. Exciting opening!`
    : `${hist}\n\nChild chose: "${choice?.label || ""}" (${choice?.value || "custom"}). Continue. Show consequences.`;

  const headers = { "Content-Type": "application/json", "anthropic-version": "2023-06-01" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers,
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: sys, messages: [{ role: "user", content: textMsg }] }),
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

  return parsed;
}
