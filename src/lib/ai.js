import { TOTAL_PAGES, ART_STYLES } from "./constants.js";

// ── STYLE CONSTANTS (dynamic based on artStyle) ──
function getStyleForMood(mood, artStyleKey) {
  const styles = ART_STYLES[artStyleKey] || ART_STYLES.book;
  return ["city","school","sports","home"].includes(mood) ? styles.realistic : styles.fantasy;
}

// ── Replicate: poll until done ──
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
    const res = await fetch(pollUrl, { headers: { "Authorization": `Bearer ${token}` } });
    const p = await res.json();
    if (p.status === "succeeded") {
      const out = p.output;
      return typeof out === "string" ? out : Array.isArray(out) ? out[0] : out;
    }
    if (p.status === "failed") { console.error("Replicate failed:", p.error); return null; }
  }
  return null;
}

// ── PAGE 1 FALLBACK: Flux 2 Pro ──
export async function genFirstImage(token, scene, charDesc, mood, artStyleKey) {
  if (!token) return null;
  const style = getStyleForMood(mood, artStyleKey);
  const prompt = `${style}. ${scene}. The main character is ${charDesc}. Show ALL characters described in the scene with distinct appearances. Dynamic poses and clear interaction between characters. No text, words, letters, or writing anywhere in the image.`;
  try {
    const res = await fetch("/api/replicate/v1/models/black-forest-labs/flux-2-pro/predictions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({ input: { prompt, aspect_ratio: "16:9", output_format: "webp", output_quality: 90, safety_tolerance: 5 } })
    });
    const resp = await res.json();
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Flux 2 Pro error:", err); return null; }
}

// ── CHARACTER PORTRAIT: lucataco/flux-watercolor LoRA ──
export async function genCharPortrait(token, charDesc, scene, artStyleKey) {
  if (!token) return null;
  const prompt = artStyleKey === "anime"
    ? `Anime style children's book character. ${charDesc}. Full body, plain beige background. No text.`
    : `TOK watercolor painting of a children's book character. ${charDesc}. Full body standing on plain cream background. Soft watercolor washes, visible paper texture, warm gentle colors. No text.`;
  try {
    const res = await fetch("/api/replicate/v1/predictions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({
        version: "846d1eb3e225eb0e1008e7b113741fa48948283f9bb1ce09e5fbbfef18b10e2c",
        input: { prompt, num_outputs: 1, aspect_ratio: "2:3", output_format: "png", output_quality: 90, num_inference_steps: 28 }
      })
    });
    const resp = await res.json();
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Portrait error:", err); return null; }
}

// ── Rate limit retry ──
async function fetchWithRetry(url, opts, maxRetries = 3) {
  let res = await fetch(url, opts);
  for (let i = 0; i < maxRetries && res.status === 429; i++) {
    const data = await res.json();
    const wait = (data.retry_after || 5) * 1000 + 1000;
    await new Promise(r => setTimeout(r, wait));
    res = await fetch(url, opts);
  }
  return res;
}

// ── PAGES 2+: Kontext Fast ──
export async function genNextImage(token, scene, charDesc, portraitUrl, mood, artStyleKey) {
  if (!token || !portraitUrl) return null;
  const shortStyle = artStyleKey === "anime" ? "Anime children's illustration."
    : artStyleKey === "realistic" ? "Realistic children's book illustration."
    : "Watercolor children's book illustration, soft washes, paper texture visible.";
  const shortScene = scene.split(/[.!]/).slice(0, 2).join(". ").trim().slice(0, 200);
  const negWords = /frown|tear|cry|sad|scared|afraid|angry|worried|lonely|upset|nervous|anxious|hurt|pain|lost|confused|guilt|shame/i;
  const antiSmile = negWords.test(scene) ? " Character is NOT smiling, NOT happy." : "";
  const prompt = `${shortStyle} ${shortScene}.${antiSmile} Same character from reference image. No text.`;
  try {
    const res = await fetchWithRetry("/api/replicate/v1/models/prunaai/flux-kontext-fast/predictions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({ input: { prompt, img_cond_path: portraitUrl, aspect_ratio: "16:9", output_format: "png", safety_tolerance: 6 } })
    });
    const resp = await res.json();
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Kontext Fast error:", err); return null; }
}

// ── AI: Story Generation (Sonnet) ──
export async function genPage(ctx, apiKey) {
  const { name, age, theme, history, choice, charDesc, backstory, lang: storyLang } = ctx;
  const pn = history.length + 1, isEnd = pn >= TOTAL_PAGES;
  const hist = history.map((h,i) => "P" + (i+1) + ": " + h.text + (h.sceneSummary ? " [location: " + h.sceneSummary + "]" : "") + (h.actionSummary ? " [action: " + h.actionSummary + "]" : "") + (h.choice ? " [chose: " + h.choice.label + "/" + h.choice.value + "]" : "")).join("\n");

  const charBlock = charDesc
    ? "\n- The main characters have been established: " + charDesc + ". Keep ALL characters visually consistent.\n- NEW MAIN CHARACTER: If an important new character JOINS the party/group (a new friend, companion, rival who will stay in the story), return a \"newMainCharacter\" field with their detailed English visual description. Only for IMPORTANT recurring characters, not random NPCs or background people."
    : '\n- FIRST PAGE: You MUST also return a "characterDesc" field with detailed English visual descriptions of the MAIN CHARACTER and any other key characters who will appear throughout the story. Describe each character separately. Example: "Main: a small red fox cub with bright green eyes, wearing a blue scarf and brown leather satchel, fluffy tail with white tip. Friend: a tall grey wolf pup with amber eyes, wearing a green vest and carrying a wooden staff". Include: species/type, hair/fur color, eye color, clothing, accessories, body build, distinctive features for EACH character.';

  const charDescJson = !charDesc ? ',"characterDesc":"...detailed english visual description of main character AND other key characters..."' : '';

  const positiveValues = ["generosity","empathy","courage","curiosity","kindness","honesty","patience","teamwork"];
  const negativeValues = ["selfishness","cowardice","cruelty","greed","laziness","dishonesty","aggression","indifference"];

  let endingInstruction;
  if (isEnd) {
    const choiceValues = history.filter(h => h.choice).map(h => h.choice.value || "custom");
    const negCount = choiceValues.filter(v => negativeValues.includes(v)).length;
    const posCount = choiceValues.filter(v => positiveValues.includes(v)).length;
    if (negCount > posCount) {
      endingInstruction = "LAST PAGE — SAD/CONSEQUENCES ENDING. The character's selfish/cruel/cowardly choices led to a sad outcome. Friends left, trust was broken, or an opportunity was lost forever. Write a bittersweet ending that clearly shows the CONSEQUENCES of bad choices. The character should feel regret and understand what they lost. Do NOT rescue them with a happy twist. The moral should be clear: our choices shape our world. End with a reflective tone — the character learned a hard lesson.";
    } else if (negCount === posCount && negCount > 0) {
      endingInstruction = "LAST PAGE — MIXED ENDING. The character made both good and bad choices. Write an ending where things partly work out but something is lost due to the bad choices. The character reflects on what could have been different. Bittersweet but hopeful.";
    } else {
      endingInstruction = "LAST PAGE — HAPPY ENDING. The character's kind/brave/generous choices paid off! Write a warm, satisfying ending where friendships are strengthened and the world is better because of the character's good heart. Include a gentle, uplifting moral.";
    }
  }

  const choicesOrEnd = isEnd ? '"isEnd":true,"ending":"good|mixed|sad"' : '"choices":[{"label":"...","emoji":"...","value":"one of: generosity|empathy|courage|curiosity|kindness|honesty|patience|teamwork|selfishness|cowardice|cruelty|greed|laziness|dishonesty|aggression|indifference"}]';
  const choicesInstruction = isEnd ? endingInstruction : "Give 2-3 choices. IMPORTANT: Always include at least one POSITIVE choice (generosity, empathy, courage, kindness, curiosity, honesty, patience, teamwork) AND at least one NEGATIVE/TEMPTING choice (selfishness, cowardice, cruelty, greed, laziness, dishonesty, aggression, indifference). The negative choice should feel tempting or easy — like taking a shortcut, keeping something for yourself, running away, being mean, or ignoring someone in need. Make consequences feel natural, not preachy.";
  const backstoryBlock = backstory ? "\n- STORY PREMISE: " + backstory + ". This is the core situation. Build the story around this premise." : "";
  const langInstr = storyLang === "en" ? "Write the story text in ENGLISH." : "Write the story text in RUSSIAN.";
  const prevScenes = history.map((h,i) => {
    const parts = [h.sceneSummary, h.actionSummary].filter(Boolean).join(", ");
    return parts ? `P${i+1}: ${parts}` : "";
  }).filter(Boolean);
  const prevLocations = history.map(h => h.mood || "").filter(Boolean).join(", ");
  const prevScenesList = prevScenes.length > 0 ? prevScenes.join("; ") : "";
  const diversityInstr = history.length > 0 ? `\n- LOCATION DIVERSITY (CRITICAL): Previous scenes were: [${prevScenesList || prevLocations}]. You MUST move the story to a COMPLETELY DIFFERENT PHYSICAL PLACE.\n- ACTION DIVERSITY (CRITICAL): The character must be doing something PHYSICALLY DIFFERENT from all previous pages.` : "\n- Start with a vivid, unique setting.";
  const copyrightInstr = "\n- COPYRIGHT CHARACTERS: If the child mentions a character from movies/cartoons/comics/games, create an ORIGINAL character INSPIRED by them as a REAL LIVING CHARACTER in the story — with real superpowers, real actions, real dialogue. Give them a new name, keep their iconic abilities and personality.";

  const sys = "You are a master storyteller creating interactive stories for children. " + langInstr + " This is a STORY WITH CONSEQUENCES — the child's choices DIRECTLY shape the outcome.\nRules:\n- Child: " + name + ", age " + age + charBlock + backstoryBlock + "\n- Page " + pn + "/" + TOTAL_PAGES + ". Write 2-3 vivid sentences in simple, engaging language appropriate for the child's age." + diversityInstr + copyrightInstr + "\n- TONE MATCHING: Determine the tone from the premise. If the premise is realistic — keep it grounded and realistic. Only add fantasy elements if the premise calls for them.\n- " + choicesInstruction + "\n- CRITICAL: If the child previously made a negative choice, show realistic consequences in the NEXT page. If positive, show warm rewards.\n" + '- Include a "scene" field: SHORT English description for illustration (MAX 2 sentences, under 40 words). Describe FACIAL EXPRESSION physically.\n- Include a "mood" field: forest|ocean|space|castle|magic|city|school|sports|home\n\nRespond ONLY with JSON:\n{"text":"...","mood":"...","scene":"...","sceneSummary":"2-4 word location","actionSummary":"2-4 word action"' + charDescJson + "," + choicesOrEnd + ',"title":"short chapter title in ' + (storyLang === "en" ? "English" : "Russian") + '","sfx":"ambient sound description 5-10 words","tts_text":"story text enhanced for TTS"}';

  const msg = history.length === 0
    ? "Create a new story for " + name + ". Premise: " + (backstory || "a surprise creative adventure") + ". Start with an exciting opening!"
    : hist + "\n\nChild chose: \"" + (choice?.label || "") + "\" (" + (choice?.value || "custom") + "). Continue the story. Show natural consequences of this choice.";

  const headers = { "Content-Type": "application/json", "anthropic-version": "2023-06-01" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers,
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, system: sys, messages: [{ role: "user", content: msg }] })
  });
  const data = await res.json();
  const txt = data.content?.map(b => b.type === "text" ? b.text : "").join("") || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}
