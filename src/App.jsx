import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════════════════
   СКАЗКА ВМЕСТЕ — Platform v3
   Тёплая палитра «Вечернее чтение»
   Auth → Dashboard → Session → Report
   
   v3: Flux 2 Pro (Replicate) иллюстрации с character consistency,
       свободный ответ, typewriter, прогресс, пересказ
   ══════════════════════════════════════════════════════════ */

// ── STORAGE ──
const ST = {
  async get(k){try{const v=localStorage.getItem("skazka_"+k);return v?JSON.parse(v):null}catch{return null}},
  async set(k,v){try{localStorage.setItem("skazka_"+k,JSON.stringify(v))}catch{}},
  async del(k){try{localStorage.removeItem("skazka_"+k)}catch{}},
};

// ── PALETTE ──
const FN = { d: "'Cormorant Garamond', Georgia, serif", b: "'Outfit', system-ui, sans-serif" };
const LIGHT = {
  bg:"#FAF5EC", bg2:"#F3EBE0", bg3:"#EFE6D8",
  tx:"#2A1F14", tx2:"#4A3F34", tx3:"#7A6E60",
  accent:"#D4845A", accentSoft:"#E8A67E", accentBg:"#FCEEE4",
  sage:"#7A9E7E", sageSoft:"#A3C2A6", sageBg:"#EBF2EC",
  gold:"#C49A5C", blush:"#DBBAA8", blushBg:"#F5EAE2",
  gb:"rgba(42,31,20,.07)", gl:"rgba(42,31,20,.025)", gl2:"rgba(42,31,20,.04)",
  card:"linear-gradient(160deg,#FFFFFF,#FDFCFA,#FAF5EC)",
  shadow:"0 12px 40px rgba(42,31,20,.08)",
  storyTx:"#3A2F24", ph:"#B0A898", selBg:"rgba(212,132,90,.1)",
};
const DARK = {
  bg:"#1A1510", bg2:"#221C15", bg3:"#2A231A",
  tx:"#F5EDE0", tx2:"#C4B9A8", tx3:"#8A7E6E",
  accent:"#D4845A", accentSoft:"#E8A67E", accentBg:"rgba(212,132,90,.1)",
  sage:"#7A9E7E", sageSoft:"#6B8E72", sageBg:"rgba(122,158,126,.1)",
  gold:"#C49A5C", blush:"#DBBAA8", blushBg:"rgba(219,186,168,.08)",
  gb:"rgba(245,237,224,.08)", gl:"rgba(245,237,224,.03)", gl2:"rgba(245,237,224,.05)",
  card:"linear-gradient(160deg,#221C15,#1E1812,#1A1510)",
  shadow:"0 16px 50px rgba(0,0,0,.35)",
  storyTx:"#E0D8CA", ph:"#665E52", selBg:"rgba(212,132,90,.12)",
};

// ── STORY CONFIG ──
const TOTAL_PAGES = 6;

// ── i18n ──
const I18N = {
  ru: {
    interactiveStories: "Интерактивные сказки",
    skazka: "Сказка", vmeste: "Вместе",
    aiCreates: "ИИ создаёт уникальную сказку.", readTogether: "Вы читаете вместе с ребёнком.",
    yourName: "Ваше имя", email: "Email", login: "Войти →",
    back: "← Назад", dashboard: "Dashboard", hello: "Привет",
    children: "Дети", addChild: "+ Добавить", childName: "Имя ребёнка", years: "лет",
    addChildPlaceholder: "Добавьте ребёнка, чтобы начать",
    newSession: "Новая сессия", forWhom: "Для кого?", createStory: "Создать историю →",
    history: "📚 История", min: "мин", pages: "стр.",
    storyFor: "История для", whatAbout: "О чём будет история? Выберите идею или придумайте свою",
    storyIdeas: "✨ Идеи для истории", more: "🔄 Ещё", generating: "Генерируем идеи…",
    noIdeas: "Не удалось загрузить. Нажмите 🔄", needKey: "Нужен API ключ для генерации идей",
    writeYourOwn: "✏️ Или напишите свою",
    premisePlaceholder: "Например: Мальчик хочет выиграть школьный чемпионат по шахматам...",
    anyGenre: "Реалистичная, фэнтези, фантастика — что угодно.",
    startStory: "Начать историю →", clear: "Очистить",
    artStyle: "🎨 Стиль иллюстраций",
    styleBook: "Книжная иллюстрация", styleBookDesc: "Тёплая акварель, как в детских книгах",
    styleAnime: "Аниме", styleAnimeDesc: "Яркий стиль как Ghibli / Shinkai",
    styleRealistic: "Реалистичный", styleRealisticDesc: "Фотореалистичный стиль",
    settings: "⚙️ Настройки", done: "Готово", logout: "Выйти",
    creatingStory: "Создаём сказку", continuing: "Продолжение…",
    end: "✨ Конец", viewReport: "Смотреть отчёт →",
    orCustom: "или придумайте свой вариант:", heroAction: "Что хочет сделать герой?..",
    speak: "Озвучить", stop: "Стоп", auto: "авто", sounds: "звуки", quiet: "тихо",
    sessionReport: "Отчёт сессии", journey: "Путешествие", choices: "выборов",
    choicesOf: "💎 Выборы", fullStory: "📜 Сказка целиком", decisionPath: "🧭 Путь выборов",
    newSessionBtn: "Новая сессия →", dashboardBtn: "Дашборд",
    disclaimer: "🛡️ Все истории создаются ИИ с фильтрацией контента по возрасту. Контент безопасен для детей, но рекомендуется присутствие родителя.",
    disclaimerEn: "🛡️ All stories are AI-generated with age-appropriate content filtering. Content is safe for children, but parental supervision is recommended.",
    finish: "Завершить", page: "стр.", of: "из",
    parentPremise: "Предыстория от родителя", discussionQ: "💡 Вопрос для звонка",
    ending: { good: "Счастливый конец ✨", mixed: "Неоднозначный финал ⚖️", sad: "Грустный конец 💔" },
  },
  en: {
    interactiveStories: "Interactive Fairy Tales",
    skazka: "Story", vmeste: "Together",
    aiCreates: "AI creates a unique story.", readTogether: "Read it together with your child.",
    yourName: "Your name", email: "Email", login: "Enter →",
    back: "← Back", dashboard: "Dashboard", hello: "Hello",
    children: "Children", addChild: "+ Add", childName: "Child's name", years: "years old",
    addChildPlaceholder: "Add a child to begin",
    newSession: "New Session", forWhom: "For whom?", createStory: "Create Story →",
    history: "📚 History", min: "min", pages: "p.",
    storyFor: "Story for", whatAbout: "What will the story be about? Choose an idea or write your own",
    storyIdeas: "✨ Story Ideas", more: "🔄 More", generating: "Generating ideas…",
    noIdeas: "Failed to load. Press 🔄", needKey: "API key needed for ideas",
    writeYourOwn: "✏️ Or write your own",
    premisePlaceholder: "E.g.: A boy wants to win the school chess tournament but his rival is his best friend...",
    anyGenre: "Realistic, fantasy, sci-fi — anything goes.",
    startStory: "Start Story →", clear: "Clear",
    artStyle: "🎨 Illustration Style",
    styleBook: "Book Illustration", styleBookDesc: "Warm watercolor, like children's books",
    styleAnime: "Anime", styleAnimeDesc: "Bright Ghibli / Shinkai style",
    styleRealistic: "Realistic", styleRealisticDesc: "Photorealistic style",
    settings: "⚙️ Settings", done: "Done", logout: "Log out",
    creatingStory: "Creating story", continuing: "Continuing…",
    end: "✨ The End", viewReport: "View Report →",
    orCustom: "or write your own action:", heroAction: "What does the hero want to do?..",
    speak: "Listen", stop: "Stop", auto: "auto", sounds: "sounds", quiet: "quiet",
    sessionReport: "Session Report", journey: "Journey of", choices: "choices",
    choicesOf: "💎 Choices by", fullStory: "📜 Full Story", decisionPath: "🧭 Decision Path",
    newSessionBtn: "New Session →", dashboardBtn: "Dashboard",
    disclaimer: "🛡️ All stories are AI-generated with age-appropriate content filtering. Content is safe for children, but parental supervision is recommended.",
    disclaimerEn: "🛡️ All stories are AI-generated with age-appropriate content filtering. Content is safe for children, but parental supervision is recommended.",
    finish: "Finish", page: "p.", of: "of",
    parentPremise: "Parent's premise", discussionQ: "💡 Discussion question",
    ending: { good: "Happy ending ✨", mixed: "Mixed ending ⚖️", sad: "Sad ending 💔" },
  }
};

// ── ART STYLES ──
const ART_STYLES = {
  book: {
    fantasy: "Children's book illustration, warm watercolor style with hand-painted texture and visible soft brushstrokes. Rich detailed environment. Soft golden lighting, fairy-tale atmosphere, gentle pastel colors. Professional illustration quality like a printed storybook",
    realistic: "Children's book illustration, warm watercolor with hand-painted texture. Rich detailed real-world environment. Soft natural lighting, gentle earth tones. Professional storybook quality"
  },
  anime: {
    fantasy: "Anime-inspired digital illustration, vibrant colors, expressive characters with large eyes. Style like Studio Ghibli or Makoto Shinkai. Cinematic lighting, magical atmosphere. Professional animation quality",
    realistic: "Anime-inspired semi-realistic illustration, similar to Makoto Shinkai. Rich real-world environment, warm natural lighting. Expressive character faces. Professional quality"
  },
  realistic: {
    fantasy: "Photorealistic fantasy illustration, cinematic lighting and composition. Detailed magical environment with realistic textures. Characters with realistic proportions and expressions. High quality digital art",
    realistic: "Photorealistic illustration, cinematic composition with depth of field. Detailed real-world environment. Natural lighting with warm tones. Characters with realistic proportions. High quality"
  }
};
const VALS = {
  // Positive
  generosity:  { n:"Щедрость",      e:"💛", c:"#D4845A", pos: true },
  empathy:     { n:"Сочувствие",    e:"💜", c:"#9B7CB8", pos: true },
  courage:     { n:"Смелость",      e:"🦁", c:"#C47B7B", pos: true },
  curiosity:   { n:"Любопытство",   e:"🔍", c:"#7A9E7E", pos: true },
  kindness:    { n:"Доброта",       e:"🤗", c:"#C49A5C", pos: true },
  honesty:     { n:"Честность",     e:"⭐", c:"#8BA88E", pos: true },
  patience:    { n:"Терпение",      e:"🕊️", c:"#6B9DAB", pos: true },
  teamwork:    { n:"Дружба",        e:"🤝", c:"#7B8EC4", pos: true },
  // Negative
  selfishness: { n:"Жадность",      e:"🫣", c:"#8B4C4C", pos: false },
  cowardice:   { n:"Трусость",      e:"😰", c:"#7B6B5C", pos: false },
  cruelty:     { n:"Жестокость",    e:"💔", c:"#6B3A3A", pos: false },
  greed:       { n:"Алчность",      e:"🪙", c:"#8B7B3C", pos: false },
  laziness:    { n:"Лень",          e:"😴", c:"#6B6B6B", pos: false },
  dishonesty:  { n:"Обман",         e:"🎭", c:"#5C4C6B", pos: false },
  aggression:  { n:"Агрессия",      e:"😠", c:"#8B3C3C", pos: false },
  indifference:{ n:"Равнодушие",    e:"🧊", c:"#5C6B7B", pos: false },
};

// ── AI: Story Generation (Sonnet) ──
async function genPage(ctx, apiKey) {
  const { name, age, theme, history, choice, charDesc, backstory, lang: storyLang } = ctx;
  const pn = history.length + 1, isEnd = pn >= TOTAL_PAGES;
  const hist = history.map((h,i) => "P" + (i+1) + ": " + h.text + (h.sceneSummary ? " [location: " + h.sceneSummary + "]" : "") + (h.actionSummary ? " [action: " + h.actionSummary + "]" : "") + (h.choice ? " [chose: " + h.choice.label + "/" + h.choice.value + "]" : "")).join("\n");
  
  const charBlock = charDesc
    ? "\n- The main characters have been established: " + charDesc + ". Keep ALL characters visually consistent.\n- NEW MAIN CHARACTER: If an important new character JOINS the party/group (a new friend, companion, rival who will stay in the story), return a \"newMainCharacter\" field with their detailed English visual description. Only for IMPORTANT recurring characters, not random NPCs or background people."
    : '\n- FIRST PAGE: You MUST also return a "characterDesc" field with detailed English visual descriptions of the MAIN CHARACTER and any other key characters who will appear throughout the story. Describe each character separately. Example: "Main: a small red fox cub with bright green eyes, wearing a blue scarf and brown leather satchel, fluffy tail with white tip. Friend: a tall grey wolf pup with amber eyes, wearing a green vest and carrying a wooden staff". Include: species/type, hair/fur color, eye color, clothing, accessories, body build, distinctive features for EACH character.';

  const charDescJson = !charDesc ? ',"characterDesc":"...detailed english visual description of main character AND other key characters..."' : '';
  
  // Analyze moral path from history
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
  const prevLocations = history.map(h => h.mood || "").filter(Boolean).join(", ");
  const prevScenes = history.map((h,i) => {
    const parts = [h.sceneSummary, h.actionSummary].filter(Boolean).join(", ");
    return parts ? `P${i+1}: ${parts}` : "";
  }).filter(Boolean);
  const prevScenesList = prevScenes.length > 0 ? prevScenes.map((s,i) => `P${i+1}: ${s}`).join("; ") : "";
  const diversityInstr = history.length > 0 ? `\n- LOCATION DIVERSITY (CRITICAL): Previous scenes were: [${prevScenesList || prevLocations}]. You MUST move the story to a COMPLETELY DIFFERENT PHYSICAL PLACE. NOT the same building from a different angle. NOT the same street at a different time. A BRAND NEW LOCATION the reader has never seen. Examples of GOOD changes: bedroom→park, school→forest, city street→mountain, shop→river, arena→home kitchen. If the story has been near the same place for 2+ pages, MOVE AWAY entirely.\n- ACTION DIVERSITY (CRITICAL): The character must be doing something PHYSICALLY DIFFERENT from all previous pages. If they were standing still → make them run. If they were inside a vehicle → take them out on foot. If they were alone → surround them with new characters. If they were looking at something → make them actively DO something with their hands. NEVER have the character in the same pose or activity as any previous page. Each page should feel like a completely new moment.` : "\n- Start with a vivid, unique setting.";
  const copyrightInstr = "\n- COPYRIGHT CHARACTERS: If the child mentions a character from movies/cartoons/comics/games (Spider-Man, Elsa, Batman, etc.), create an ORIGINAL character INSPIRED by them as a REAL LIVING CHARACTER in the story — with real superpowers, real actions, real dialogue. Do NOT reduce them to a drawing, poster, toy, or picture. The inspired character must be a FULL PARTICIPANT in the story. Give them a new name, keep their iconic abilities and personality. Examples: Spider-Man → Арахнид/Arachnid (a boy with spider powers who shoots webs and climbs walls), Elsa → Ледяная Принцесса Аврора (a princess who controls ice and snow), Batman → Тёмный Страж (a masked hero who fights crime at night). Add a fun comment like 'В нашем мире этого героя зовут по-другому!' For visuals, describe the character through colors, costume design, and powers WITHOUT using brand names.";

  const sys = "You are a master storyteller creating interactive stories for children. " + langInstr + " This is a STORY WITH CONSEQUENCES — the child's choices DIRECTLY shape the outcome.\nRules:\n- Child: " + name + ", age " + age + charBlock + backstoryBlock + "\n- Page " + pn + "/" + TOTAL_PAGES + ". Write 2-3 vivid sentences in simple, engaging language appropriate for the child's age." + diversityInstr + copyrightInstr + "\n- TONE MATCHING: Determine the tone from the premise. If the premise is realistic (sports, school, friendship, everyday life) — keep it grounded and realistic. NO magic, NO supernatural creatures, NO portals unless the premise explicitly involves fantasy or magic. A story about esports = real esports. A story about school = real school. Only add fantasy elements if the premise calls for them.\n- " + choicesInstruction + "\n- CRITICAL: If the child previously made a negative choice, show realistic consequences in the NEXT page — trust eroding, friends being hurt, opportunities closing. Don't immediately fix bad choices. Let the child feel the weight.\n- If the child made a positive choice, show warm rewards — new friendships, discovered treasures, growing trust.\n" + '- Include a "scene" field: a CINEMATIC English description for illustration. CRITICAL RULES FOR SCENE:\n  (1) Include ALL characters mentioned in the text\n  (2) Show CHARACTER INTERACTION — body language between characters\n  (3) Describe what each character is ACTIVELY DOING (never just standing)\n  (4) Include EXPRESSIONS on each character face\n  (5) Rich UNIQUE ENVIRONMENT details — DIFFERENT from all previous pages\n  (6) CAMERA ANGLE — vary between wide shot, medium shot, close-up, bird\'s eye, low angle\n  (7) For REALISTIC stories: describe real-world settings accurately. For FANTASY: magical environments.\n  (8) IMPORTANT: Make each scene visually DISTINCT. Different colors, lighting, time of day, weather.\n  (9) CHARACTER POSES MUST VARY DRAMATICALLY: The main character must be doing a DIFFERENT PHYSICAL ACTION every page. NEVER repeat the same pose. Examples: running, climbing, hiding behind something, falling, reaching up high, crouching low, swimming, flying, sitting on something unusual, hanging upside down, dancing, fighting, hugging someone, pointing at something far away. The character should NOT always be standing or sitting in the same way.\n  (10) COMPOSITION VARIETY: Vary the character size in frame — sometimes tiny in a vast landscape, sometimes a dramatic close-up of their face, sometimes seen from behind. Do NOT always center the character at medium distance.\n- Include a "mood" field. Choose the BEST fit — MUST be different from previous pages if possible:\n  "forest" = nature/wilderness, "ocean" = water/sea, "space" = sci-fi/cosmos, "castle" = medieval/royalty, "magic" = general fantasy\n  "city" = urban/streets, "school" = classroom/campus, "sports" = competition/games/esports, "home" = domestic/indoor\n\nRespond ONLY with JSON (no markdown):\n{"text":"...","mood":"forest|ocean|space|castle|magic|city|school|sports|home","scene":"...cinematic english scene...","sceneSummary":"2-4 word summary of the PHYSICAL LOCATION, e.g. dark forest clearing, cozy bedroom, busy market square, mountain cave","actionSummary":"2-4 word summary of what the MAIN CHARACTER IS PHYSICALLY DOING, e.g. running through crowd, climbing a tree, hiding under table, swimming across river"' + charDescJson + "," + choicesOrEnd + ',"title":"short chapter title in ' + (storyLang === "en" ? "English" : "Russian") + '","sfx":"short English description of ambient sound for this scene, 5-10 words","tts_text":"same story text but ENHANCED for text-to-speech engine. Add <break time=\\"0.5s\\"/> for short pauses, <break time=\\"1.0s\\"/> for dramatic pauses. Use ellipsis for hesitation. Use dashes for rhythm. Add emotional stage directions. Make it sound like a living audiobook performance."}';
  
  const msg = history.length === 0
    ? "Create a new story for " + name + ". Premise: " + (backstory || "a surprise creative adventure") + ". IMPORTANT: Match the tone to the premise — if realistic, stay realistic. If fantasy, be magical. Start with an exciting opening that presents the character in a situation where choices will matter!"
    : hist + "\n\nChild chose: \"" + (choice?.label || "") + "\" (" + (choice?.value || "custom") + "). Continue the story. Show natural consequences of this choice.";
  
  const headers = { "Content-Type": "application/json", "anthropic-version": "2023-06-01" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, system: sys, messages: [{ role: "user", content: msg }] })
  });
  const data = await res.json();
  const txt = data.content?.map(b => b.type === "text" ? b.text : "").join("") || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}

// ── STYLE CONSTANTS (dynamic based on artStyle) ──
function getStyleForMood(mood, artStyleKey) {
  const styles = ART_STYLES[artStyleKey] || ART_STYLES.book;
  return ["city","school","sports","home"].includes(mood) ? styles.realistic : styles.fantasy;
}

// ── Replicate: poll until done ──
async function pollPrediction(token, prediction) {
  console.log("Replicate full response:", JSON.stringify(prediction));
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
    console.log("Poll", i, "status:", p.status);
    if (p.status === "succeeded") {
      const out = p.output;
      return typeof out === "string" ? out : Array.isArray(out) ? out[0] : out;
    }
    if (p.status === "failed") { console.error("Replicate failed:", p.error); return null; }
  }
  return null;
}

// ── PAGE 1: Flux 2 Pro (text-to-image, high quality character creation) ──
async function genFirstImage(token, scene, charDesc, mood, artStyleKey) {
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
    console.log("Flux 2 Pro HTTP status:", res.status, "response:", resp.status || resp.error || resp.detail);
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Flux 2 Pro error:", err); return null; }
}

// ── CHARACTER PORTRAIT: clean reference with ALL characters on neutral background ──
async function genCharPortrait(token, charDesc, scene, artStyleKey) {
  if (!token) return null;
  const style = (ART_STYLES[artStyleKey] || ART_STYLES.book).fantasy;
  const prompt = `${style}. Character reference sheet, full body shot showing all characters clearly. Main character: ${charDesc}. Show ALL characters from this scene standing together in a row: ${scene}. Every character must be fully visible with clear distinct appearance. All characters face the viewer with natural relaxed poses on a plain simple light beige background. No scenery, no environment, no objects — ONLY the characters. Sharp clear details on each character's face, hair, clothing. Each character must look distinctly different from others. No text.`;
  try {
    const res = await fetch("/api/replicate/v1/models/black-forest-labs/flux-2-pro/predictions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({ input: { prompt, aspect_ratio: "16:9", output_format: "webp", output_quality: 90, safety_tolerance: 5 } })
    });
    const resp = await res.json();
    console.log("Portrait generation:", resp.status || resp.error);
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Portrait error:", err); return null; }
}

// ── PAGES 2-6: Kontext Pro (image-to-image, character consistency) ──
async function genNextImage(token, scene, charDesc, portraitUrl, mood, artStyleKey) {
  if (!token || !portraitUrl) return null;
  const style = getStyleForMood(mood, artStyleKey);
  const prompt = `${style}. Create a completely NEW illustration for this scene: ${scene}. The main character from the reference portrait (${charDesc}) must appear with IDENTICAL visual identity — same face shape, hair, clothing colors and design. BUT the character's POSE, EXPRESSION, and BODY LANGUAGE must match the NEW scene — NOT the neutral portrait pose. Show vivid emotion: if scared, show wide eyes and hunched shoulders; if happy, show a big grin and open arms; if running, show dynamic motion blur. The character should feel ALIVE and ACTIVE in each scene. Add any other characters described with distinct appearances. Rich detailed NEW environment completely different from the reference. No text in image.`;
  try {
    const res = await fetch("/api/replicate/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait=60" },
      body: JSON.stringify({ input: { prompt, input_image: portraitUrl, aspect_ratio: "16:9", output_format: "png", safety_tolerance: 5 } })
    });
    const resp = await res.json();
    console.log("Kontext Pro response:", resp.status, resp.id || resp.error);
    return await pollPrediction(token, resp);
  } catch (err) { console.error("Kontext Pro error:", err); return null; }
}

// ── TYPEWRITER COMPONENT ──
function Typewriter({ text, speed = 30, onDone, style }) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    setShown(0); setDone(false);
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i >= text.length) { clearInterval(iv); setDone(true); onDone?.(); }
      setShown(i);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  const skip = () => { setShown(text?.length || 0); setDone(true); onDone?.(); };
  return (
    <div style={{ position: "relative", cursor: done ? "default" : "pointer" }} onClick={!done ? skip : undefined}>
      <span style={style}>{text?.slice(0, shown)}</span>
      {!done && <span style={{ ...style, opacity: 0 }}>{text?.slice(shown)}</span>}
      {!done && <span style={{ display: "inline-block", width: 2, height: "1em", background: style?.color || "#D4845A", marginLeft: 2, animation: "blink 1s step-end infinite", verticalAlign: "text-bottom" }} />}
    </div>
  );
}

// ── ILLUSTRATION COMPONENT ──
function SceneIllustration({ imgUrl, mood, loading: isLoading, isFirst, style: st }) {
  const COLORS = { forest:"#2A3D2A", ocean:"#1E3A4A", space:"#1A1530", castle:"#3A2840", magic:"#2A2040" };
  const EMOJI = { forest:"🌲", ocean:"🌊", space:"🌌", castle:"🏰", magic:"✨" };
  
  // Particle configs per mood
  const PARTICLES = {
    forest: { chars: ["✦","🍃","✧"], count: 12, color: "rgba(180,220,130,.6)" },
    ocean:  { chars: ["✦","💧","○"], count: 10, color: "rgba(120,200,255,.5)" },
    space:  { chars: ["✦","⭐","✧","·"], count: 18, color: "rgba(255,255,200,.7)" },
    castle: { chars: ["✦","✧","❋"], count: 10, color: "rgba(255,200,150,.5)" },
    magic:  { chars: ["✦","✧","⚝","❋"], count: 14, color: "rgba(200,170,255,.6)" },
    city:   { chars: ["✧","·","○"], count: 6, color: "rgba(255,220,150,.3)" },
    school: { chars: ["✧","·"], count: 5, color: "rgba(255,230,180,.25)" },
    sports: { chars: ["✧","·","⚡"], count: 7, color: "rgba(255,200,100,.35)" },
    home:   { chars: ["✧","·"], count: 5, color: "rgba(255,220,170,.25)" },
  };
  const pc = PARTICLES[mood] || PARTICLES.forest;
  
  // Generate stable particles with useMemo
  const particles = useMemo(() => Array.from({ length: pc.count }, (_, i) => ({
    char: pc.chars[i % pc.chars.length],
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: .4 + Math.random() * .6,
    dur: 3 + Math.random() * 5,
    delay: Math.random() * 4,
    drift: -20 + Math.random() * 40,
  })), [mood]);
  
  if (imgUrl) {
    return (
      <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:16, overflow:"hidden", position:"relative", ...st }}>
        <img src={imgUrl} alt="Иллюстрация" style={{ width:"110%", height:"110%", objectFit:"cover", display:"block", position:"absolute", top:"-5%", left:"-5%", animation:"kenburns 18s ease-in-out infinite alternate" }} />
        {/* Vignette overlay */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.2) 100%)", pointerEvents:"none" }}/>
        {/* Floating particles */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {particles.map((p, i) => (
            <div key={i} style={{ position:"absolute", left:`${p.left}%`, top:`${p.top}%`, fontSize:`${p.size}rem`, opacity:0, color: pc.color, filter:"blur(.3px)", animation:`particle ${p.dur}s ${p.delay}s ease-in-out infinite`, "--drift":`${p.drift}px` }}>{p.char}</div>
          ))}
        </div>
        {/* Soft glow at bottom */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"30%", background:"linear-gradient(transparent, rgba(0,0,0,.15))", pointerEvents:"none" }}/>
      </div>
    );
  }
  
  return (
    <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:16, overflow:"hidden", background:`linear-gradient(180deg, ${COLORS[mood]||COLORS.forest}, ${COLORS[mood]||COLORS.forest}cc)`, display:"flex", alignItems:"center", justifyContent:"center", ...st }}>
      <div style={{ textAlign:"center" }}>
        {isLoading ? <>
          <div style={{ width:32, height:32, border:"2.5px solid rgba(255,255,255,.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 10px" }}/>
          <div style={{ fontSize:".65rem", color:"rgba(255,255,255,.7)", fontFamily:"'Outfit',sans-serif", letterSpacing:".08em" }}>{isFirst ? "Flux 2 Pro создаёт персонажа…" : "Kontext Pro рисует сцену…"}</div>
        </> : <>
          <div style={{ fontSize:"2.5rem", marginBottom:4, opacity:.5 }}>{EMOJI[mood]||"🌲"}</div>
          <div style={{ fontSize:".6rem", color:"rgba(255,255,255,.5)", fontFamily:"'Outfit',sans-serif", letterSpacing:".1em" }}>Нет API ключа Replicate</div>
        </>}
      </div>
    </div>
  );
}

// ── PROGRESS DOTS ──
function PageProgress({ current, total, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i + 1 === current ? 24 : 8, height: 8, borderRadius: 8,
          background: i + 1 < current ? t.sage : i + 1 === current ? t.accent : t.gb,
          transition: "all .5s cubic-bezier(.22,1,.36,1)",
          position: "relative", overflow: "hidden"
        }}>
          {i + 1 === current && <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: `linear-gradient(90deg, ${t.accent}, ${t.accentSoft})` }} />}
        </div>
      ))}
      <span style={{ fontSize: ".6rem", color: t.tx3, marginLeft: 4, fontFamily: FN.b, fontWeight: 400 }}>{current}/{total}</span>
    </div>
  );
}

// ── SHARED COMPONENTS ──
function AB({ c, p, d = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const tm = setTimeout(() => setW(p), 200 + d); return () => clearTimeout(tm) }, [p, d]);
  return <div style={{ height: "100%", borderRadius: 99, width: `${w}%`, background: c, transition: "width 1.4s cubic-bezier(.22,1,.36,1)" }} />;
}

function ThemeSwitch({ dark, onToggle }) {
  return <button onClick={onToggle} style={{ width: 48, height: 26, borderRadius: 26, padding: 2, border: "none", cursor: "pointer", background: dark ? "rgba(245,237,224,.1)" : "rgba(42,31,20,.06)", position: "relative", transition: "background .4s", flexShrink: 0 }}>
    <div style={{ width: 22, height: 22, borderRadius: "50%", transition: "transform .4s cubic-bezier(.22,1,.36,1),background .4s", transform: dark ? "translateX(0)" : "translateX(22px)", background: dark ? "#2A231A" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, boxShadow: dark ? "none" : "0 1px 4px rgba(42,31,20,.12)" }}>{dark ? "🌙" : "☀️"}</div>
  </button>;
}

function LangSwitch({ lang, onToggle, t }) {
  return <button onClick={onToggle} style={{ padding: "4px 10px", borderRadius: 14, border: `1px solid ${t.gb}`, background: t.gl2, cursor: "pointer", fontSize: ".7rem", fontWeight: 600, color: t.tx3, fontFamily: "'Outfit', sans-serif", transition: "all .3s", flexShrink: 0 }}>{lang === "ru" ? "EN" : "RU"}</button>;
}

// ══════════════════════════════════
// MAIN APP
// ══════════════════════════════════
export default function App() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("loading");
  const [user, setUser] = useState(null);
  const [repToken, setRepToken] = useState("");
  const [antKey, setAntKey] = useState("");
  const [elKey, setElKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [lang, setLang] = useState("ru");
  const [artStyle, setArtStyle] = useState("book");
  const [sessions, setSessions] = useState([]);
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [theme, setTheme] = useState(null);
  const [pages, setPages] = useState([]);
  const [curPage, setCurPage] = useState(null);
  const [curImg, setCurImg] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picks, setPicks] = useState([]);
  const [sel, setSel] = useState(null);
  const [t0, setT0] = useState(null);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [newChild, setNewChild] = useState("");
  const [newAge, setNewAge] = useState("5");
  const [showAdd, setShowAdd] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [textDone, setTextDone] = useState(false);
  const storyScrollRef = useRef(null);
  const audioRef = useRef(null);
  
  // Character consistency state
  const [charDesc, setCharDesc] = useState(null);
  const [refImgUrl, setRefImgUrl] = useState(null);
  
  // Backstory / custom premise
  const [backstory, setBackstory] = useState("");
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  
  // TTS
  const [speaking, setSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsVoice, setTtsVoice] = useState(null);
  
  // SFX
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const sfxRef = useRef(null);
  const [sfxLoading, setSfxLoading] = useState(false);
  const sfxCacheRef = useRef(new Map());
  
  // Voice picker
  const [elVoiceId, setElVoiceId] = useState("EXAVITQu4vr4xnSDxMaL"); // Sarah default
  const [elVoiceName, setElVoiceName] = useState("Sarah");
  const [elVoices, setElVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicePreview, setVoicePreview] = useState(null);
  const ttsCacheRef = useRef(new Map()); // text -> blobUrl

  const t = dark ? DARK : LIGHT;
  const L = I18N[lang] || I18N.ru;
  const toggleTheme = async () => { const next = !dark; setDark(next); await ST.set("dark", next) };
  const toggleLang = async () => { const next = lang === "ru" ? "en" : "ru"; setLang(next); await ST.set("lang", next) };
  const fmtT = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  // Init
  useEffect(() => { (async () => {
    const u = await ST.get("user");
    const dk = await ST.get("dark");
    const rt = await ST.get("repToken");
    const ak = await ST.get("antKey");
    const ek = await ST.get("elKey");
    if (dk !== null) setDark(dk);
    if (rt) setRepToken(rt);
    if (ak) setAntKey(ak);
    if (ek) setElKey(ek);
    const savedLang = await ST.get("lang"); if (savedLang) setLang(savedLang);
    const savedStyle = await ST.get("artStyle"); if (savedStyle) setArtStyle(savedStyle);
    const vid = await ST.get("elVoiceId"); if (vid) setElVoiceId(vid);
    const vname = await ST.get("elVoiceName"); if (vname) setElVoiceName(vname);
    if (u) { setUser(u); setSessions(await ST.get("sessions")||[]); setChildren(await ST.get("children")||[]); setView("dashboard") }
    else setView("auth");
  })() }, []);

  // Timer
  useEffect(() => { if (view === "session" && t0) { timerRef.current = setInterval(() => setTimer(Math.floor((Date.now()-t0)/1000)), 1000); return () => clearInterval(timerRef.current) } return () => {} }, [view, t0]);

  // TTS — find best Russian voice on load
  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      const ru = voices.filter(v => v.lang.startsWith("ru"));
      // Prefer female voice with "милена", "алёна", "Yandex", or just first Russian
      const best = ru.find(v => /milena|alena|алёна|милена|yandex/i.test(v.name)) || ru.find(v => /female|Google/i.test(v.name)) || ru[0];
      if (best) setTtsVoice(best);
    };
    pickVoice();
    window.speechSynthesis?.addEventListener("voiceschanged", pickVoice);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", pickVoice);
  }, []);

  // TTS — load preference
  useEffect(() => { (async () => {
    const v = await ST.get("ttsEnabled"); if (v) setTtsEnabled(v);
    const s = await ST.get("sfxEnabled"); if (s !== null) setSfxEnabled(s);
  })() }, []);

  const speakText = useCallback(async (text) => {
    if (!text) return;
    // Stop any current playback
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    
    // ElevenLabs if key available
    if (elKey) {
      setSpeaking(true);
      try {
        const cacheKey = elVoiceId + ":" + text;
        let url = ttsCacheRef.current.get(cacheKey);
        
        if (!url) {
          const voiceId = elVoiceId || "EXAVITQu4vr4xnSDxMaL";
          const res = await fetch(`/api/elevenlabs/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: { "xi-api-key": elKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              model_id: "eleven_flash_v2_5",
              voice_settings: { stability: 0.55, similarity_boost: 0.7, style: 0.3 }
            })
          });
          if (!res.ok) throw new Error("ElevenLabs " + res.status);
          const blob = await res.blob();
          url = URL.createObjectURL(blob);
          ttsCacheRef.current.set(cacheKey, url);
        }
        
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setSpeaking(false); audioRef.current = null; };
        audio.onerror = () => { setSpeaking(false); audioRef.current = null; };
        audio.play();
        return;
      } catch (e) {
        console.error("ElevenLabs TTS error:", e);
        setSpeaking(false);
      }
    }
    
    // Fallback: Web Speech API
    if (!window.speechSynthesis) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ru-RU";
    utt.rate = 0.88;
    utt.pitch = 1.05;
    if (ttsVoice) utt.voice = ttsVoice;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [ttsVoice, elKey, elVoiceId]);

  const stopSpeak = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  }, []);

  // SFX — generate and play ambient sound
  const playSfx = useCallback(async (sfxPrompt) => {
    if (!elKey || !sfxPrompt || !sfxEnabled) return;
    if (sfxRef.current) { sfxRef.current.pause(); sfxRef.current = null; }
    setSfxLoading(true);
    try {
      let url = sfxCacheRef.current.get(sfxPrompt);
      
      if (!url) {
        const res = await fetch("/api/elevenlabs/v1/sound-generation", {
          method: "POST",
          headers: { "xi-api-key": elKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            text: sfxPrompt + ", ambient background, loopable",
            duration_seconds: 10,
            prompt_influence: 0.5
          })
        });
        if (!res.ok) throw new Error("SFX " + res.status);
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        sfxCacheRef.current.set(sfxPrompt, url);
      }
      
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0;
      sfxRef.current = audio;
      audio.play();
      let vol = 0;
      const fadeIn = setInterval(() => { vol = Math.min(vol + 0.02, 0.2); audio.volume = vol; if (vol >= 0.2) clearInterval(fadeIn); }, 50);
      setSfxLoading(false);
    } catch (e) {
      console.error("SFX error:", e);
      setSfxLoading(false);
    }
  }, [elKey, sfxEnabled]);

  const stopSfx = useCallback(() => {
    if (!sfxRef.current) return;
    // Fade out
    const audio = sfxRef.current;
    let vol = audio.volume;
    const fadeOut = setInterval(() => {
      vol = Math.max(vol - 0.02, 0);
      audio.volume = vol;
      if (vol <= 0) { clearInterval(fadeOut); audio.pause(); URL.revokeObjectURL(audio.src); sfxRef.current = null; }
    }, 50);
  }, []);

  // Auto-play SFX when page arrives
  useEffect(() => {
    if (curPage?.sfx && elKey && sfxEnabled) playSfx(curPage.sfx);
    return () => {}; // cleanup handled by stopSfx
  }, [curPage?.sfx]);

  // Auto-speak when typewriter finishes & TTS enabled
  useEffect(() => {
    if (textDone && ttsEnabled && curPage?.text) speakText(curPage.tts_text || curPage.text);
  }, [textDone, ttsEnabled]);

  // Stop speech on page change (SFX handled separately to allow crossfade)
  useEffect(() => { stopSpeak(); stopSfx(); }, [curPage]);

  // Auto-scroll
  useEffect(() => { if (curPage && storyScrollRef.current) { storyScrollRef.current.scrollTo({ top: 0, behavior: "smooth" }) } }, [curPage]);

  // Generate illustration when page arrives (dual model)
  useEffect(() => {
    if (!curPage?.scene) return;
    setCurImg(null);
    if (!repToken) return;
    setImgLoading(true);
    
    const pageMood = curPage.mood || "forest";
    const isFirstPage = !refImgUrl; // no portrait reference = first page
    
    if (isFirstPage) {
      // Page 1: generate scene + portrait in parallel
      const scenePromise = genFirstImage(repToken, curPage.scene, charDesc || "a friendly character", pageMood, artStyle);
      const portraitPromise = charDesc ? genCharPortrait(repToken, charDesc, curPage.scene, artStyle) : Promise.resolve(null);
      
      Promise.all([scenePromise, portraitPromise]).then(([sceneUrl, portraitUrl]) => {
        setCurImg(sceneUrl);
        if (portraitUrl) setRefImgUrl(portraitUrl); // save clean portrait as permanent reference
        else if (sceneUrl) setRefImgUrl(sceneUrl); // fallback to scene if portrait failed
        setImgLoading(false);
      }).catch(() => setImgLoading(false));
    } else {
      // Pages 2+: use clean portrait as reference, generates completely new scene
      genNextImage(repToken, curPage.scene, charDesc || "the main character", refImgUrl, pageMood, artStyle)
        .then(url => { setCurImg(url); setImgLoading(false); })
        .catch(() => setImgLoading(false));
    }
  }, [curPage?.scene]);

  // Save Replicate token
  const saveRepToken = async (val) => { setRepToken(val); await ST.set("repToken", val); };
  const saveAntKey = async (val) => { setAntKey(val); await ST.set("antKey", val); };
  const saveElKey = async (val) => { setElKey(val); await ST.set("elKey", val); };
  
  // Voice management
  const fetchVoices = async () => {
    if (!elKey) return;
    setVoicesLoading(true);
    try {
      const res = await fetch("/api/elevenlabs/v1/voices?page_size=100", {
        headers: { "xi-api-key": elKey }
      });
      const data = await res.json();
      const voices = (data.voices || []).map(v => ({
        id: v.voice_id,
        name: v.name,
        category: v.category || "",
        labels: v.labels || {},
        preview: v.preview_url
      }));
      setElVoices(voices);
    } catch (e) { console.error("Fetch voices error:", e); }
    setVoicesLoading(false);
  };

  const selectVoice = async (id, name) => {
    setElVoiceId(id); setElVoiceName(name);
    await ST.set("elVoiceId", id); await ST.set("elVoiceName", name);
    // Clear TTS cache when voice changes
    ttsCacheRef.current.forEach(url => URL.revokeObjectURL(url));
    ttsCacheRef.current.clear();
  };

  const previewVoice = async (voiceId) => {
    if (voicePreview) { voicePreview.pause(); setVoicePreview(null); }
    try {
      const res = await fetch(`/api/elevenlabs/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: { "xi-api-key": elKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Жил-был маленький герой, который мечтал о большом приключении. И однажды его мечта сбылась!",
          model_id: "eleven_flash_v2_5",
          voice_settings: { stability: 0.55, similarity_boost: 0.7, style: 0.3 }
        })
      });
      if (!res.ok) throw new Error(res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setVoicePreview(null); };
      setVoicePreview(audio);
      audio.play();
    } catch (e) { console.error("Preview error:", e); }
  };

  // Actions
  const register = async () => { if (!authName.trim() || !authEmail.trim()) return; const u = { name: authName.trim(), email: authEmail.trim() }; await ST.set("user", u); setUser(u); setView("dashboard") };
  const addChild = async () => { if (!newChild.trim()) return; const ch = { id: Date.now().toString(), name: newChild.trim(), age: newAge }; const upd = [...children, ch]; setChildren(upd); await ST.set("children", upd); setNewChild(""); setShowAdd(false) };

  // Generate fresh story ideas
  const generatePresets = async (childName, childAge) => {
    if (!antKey) return;
    setPresetsLoading(true);
    const promptRu = `Придумай 6 коротких завязок для интерактивных историй для ребёнка ${childName} (${childAge} лет). Микс: 2 реалистичных (спорт, школа, дружба, хобби), 2 фэнтези (магия, говорящие животные), 2 необычных (фантастика, приключения). Каждая — 1 предложение, 10-18 слов. Начинай с "Герой" или с действия. Разнообразь! Ответь ТОЛЬКО JSON массивом: [{"emoji":"...","text":"..."}]`;
    const promptEn = `Create 6 short story premises for interactive stories for a child named ${childName} (${childAge} years old). Mix: 2 realistic (sports, school, friendship), 2 fantasy (magic, talking animals), 2 unusual (sci-fi, adventure). Each — 1 sentence, 10-18 words. Start with "The hero" or an action. Be diverse! Respond ONLY with JSON array: [{"emoji":"...","text":"..."}]`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": antKey, "content-type": "application/json", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 600,
          messages: [{ role: "user", content: lang === "en" ? promptEn : promptRu }]
        })
      });
      const data = await r.json();
      const txt = data?.content?.[0]?.text || "";
      const clean = txt.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(clean);
      if (Array.isArray(arr) && arr.length > 0) setPresets(arr);
    } catch (e) { console.error("Presets gen error:", e); }
    setPresetsLoading(false);
  };

  const startSession = async (child, premise) => {
    const storyTheme = { id: "custom", emoji: "📖", name: (premise || "").slice(0, 30) + (premise?.length > 30 ? "…" : ""), prompt: premise || "surprise creative story" };
    setActiveChild(child); setTheme(storyTheme); setPages([]); setCurPage(null); setCurImg(null);
    setPicks([]); setSel(null); setT0(Date.now()); setTimer(0); setError(null); setTextDone(false);
    setCustomInput(""); setCharDesc(null); setRefImgUrl(null);
    ttsCacheRef.current.forEach(url => URL.revokeObjectURL(url));
    ttsCacheRef.current.clear();
    sfxCacheRef.current.forEach(url => URL.revokeObjectURL(url));
    sfxCacheRef.current.clear();
    setView("session"); setLoading(true);
    if (!antKey) { setError("Нужен Anthropic API ключ! Откройте ⚙️ Настройки."); setLoading(false); return; }
    try {
      const r = await genPage({ name: child.name, age: child.age, theme: premise || "surprise creative story", history: [], choice: null, charDesc: null, backstory: premise || "", lang }, antKey);
      if (r.characterDesc) setCharDesc(r.characterDesc);
      setCurPage(r); setLoading(false);
    } catch { setError("Ошибка. Попробуйте ещё."); setLoading(false); }
  };

  const pickChoice = async (ch) => {
    if (loading || sel) return;
    setSel(ch.label); setTextDone(false); setCustomInput("");
    setPicks(p => [...p, { label: ch.label, emoji: ch.emoji || "✏️", value: ch.value || "custom", page: pages.length + 1 }]);
    setTimeout(async () => {
      const up = [...pages, { ...curPage, imgUrl: curImg, choice: ch }];
      setPages(up); setCurPage(null); setCurImg(null); setSel(null); setLoading(true);
      try {
        const r = await genPage({ name: activeChild.name, age: activeChild.age, theme: theme.prompt, history: up.map(p => ({ text: p.text, choice: p.choice, mood: p.mood, sceneSummary: p.sceneSummary, actionSummary: p.actionSummary })), choice: ch, charDesc, lang }, antKey);
        // If a new main character joined, update charDesc and regenerate portrait
        if (r.newMainCharacter) {
          const updatedDesc = charDesc + ". New companion: " + r.newMainCharacter;
          setCharDesc(updatedDesc);
          // Regenerate group portrait in background with updated characters
          if (repToken) {
            genCharPortrait(repToken, updatedDesc, r.scene, artStyle).then(url => {
              if (url) setRefImgUrl(url);
            });
          }
        }
        setCurPage(r); setLoading(false);
      } catch { setError("Ошибка."); setLoading(false); }
    }, 800);
  };

  const submitCustom = () => {
    if (!customInput.trim() || loading || sel) return;
    pickChoice({ label: customInput.trim(), emoji: "✏️", value: "custom" });
  };

  const finishSession = async () => {
    stopSpeak();
    stopSfx();
    clearInterval(timerRef.current);
    const allPages = [...pages, { ...curPage, imgUrl: curImg }];
    const s = { id: Date.now().toString(), child: activeChild, theme, pages: allPages, picks, duration: Math.floor((Date.now()-t0)/1000), date: Date.now(), charDesc, backstory };
    const upd = [s, ...sessions]; setSessions(upd); await ST.set("sessions", upd); setView("report");
  };

  const getVals = () => { const vs = {}; picks.forEach(p => { if (p.value && p.value !== "custom") vs[p.value] = (vs[p.value]||0)+1 }); const tot = picks.length || 1; return Object.entries(VALS).map(([k,v]) => ({ k, ...v, count: vs[k]||0, pct: Math.round(((vs[k]||0)/tot)*100) })).filter(v => v.count > 0).sort((a,b) => b.count - a.count) };

  // Shared styles
  const inp = { width: "100%", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${t.gb}`, background: dark ? t.bg2 : "#fff", color: t.tx, fontSize: ".95rem", fontFamily: FN.b, outline: "none", transition: "border-color .3s" };
  const onF = e => { e.target.style.borderColor = `${t.accent}60` };
  const onB = e => { e.target.style.borderColor = t.gb };
  const PBtn = ({ children: ch, onClick, disabled, style: s }) =>
    <button onClick={onClick} disabled={disabled} style={{ padding: "14px 32px", borderRadius: 50, fontFamily: FN.b, fontSize: ".9rem", fontWeight: 600, border: "none", cursor: disabled ? "default" : "pointer", background: t.accent, color: "#fff", boxShadow: "0 6px 24px rgba(212,132,90,.22)", opacity: disabled ? .4 : 1, transition: "all .3s", letterSpacing: ".02em", ...s }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-2px)" }}
      onMouseOut={e => { e.currentTarget.style.transform = "" }}>{ch}</button>;
  const Label = ({ children: ch, center }) =>
    <div style={{ fontFamily: FN.b, fontSize: ".58rem", fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: t.accent, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, justifyContent: center ? "center" : "flex-start" }}>
      <span style={{ width: 20, height: 1.5, background: t.accent, borderRadius: 2, display: "inline-block" }}/>{ch}
    </div>;

  const CSS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,700&family=Outfit:wght@200;300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{overflow-x:hidden;-webkit-font-smoothing:antialiased}::selection{background:rgba(212,132,90,.15)}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fu{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}@keyframes si{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,132,90,.3)}70%{box-shadow:0 0 0 14px rgba(212,132,90,0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes kenburns{0%{transform:scale(1) translate(0,0)}33%{transform:scale(1.08) translate(-1.5%,-1%)}66%{transform:scale(1.05) translate(1%,-2%)}100%{transform:scale(1.1) translate(-0.5%,1%)}}@keyframes particle{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.8}50%{opacity:.6;transform:translate(var(--drift),-30px) scale(1)}85%{opacity:.3}100%{opacity:0;transform:translate(calc(var(--drift) * 1.5),-60px) scale(.4)}}`;

  // ═══ SETTINGS PANEL ═══
  const SettingsPanel = () => (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(42,31,20,.4)", backdropFilter:"blur(8px)" }} onClick={() => setShowSettings(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: dark ? t.bg2 : "#fff", borderRadius: 24, padding: "32px 28px", maxWidth: 420, width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(42,31,20,.2)", animation: "fu .3s ease-out" }}>
        <h3 style={{ fontFamily: FN.d, fontSize: "1.3rem", fontWeight: 600, marginBottom: 6, color: t.tx }}>⚙️ Настройки</h3>
        <p style={{ fontSize: ".75rem", color: t.tx3, marginBottom: 20, fontWeight: 300, lineHeight: 1.6 }}>Сказки — Anthropic, иллюстрации — Replicate, озвучка — ElevenLabs</p>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: ".68rem", fontWeight: 500, color: t.tx2, marginBottom: 6, display: "block", letterSpacing: ".04em" }}>Anthropic API Key (для генерации сказок)</label>
          <input
            value={antKey}
            onChange={e => saveAntKey(e.target.value.trim())}
            placeholder="sk-ant-..."
            type="password"
            style={{ ...inp, fontFamily: "monospace", fontSize: ".82rem" }}
            onFocus={onF} onBlur={onB}
          />
          <p style={{ fontSize: ".62rem", color: t.tx3, marginTop: 6, lineHeight: 1.5, fontWeight: 300 }}>
            Получить на <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" style={{ color: t.accent, textDecoration: "underline" }}>console.anthropic.com</a>
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: ".68rem", fontWeight: 500, color: t.tx2, marginBottom: 6, display: "block", letterSpacing: ".04em" }}>Replicate API Token</label>
          <input
            value={repToken}
            onChange={e => saveRepToken(e.target.value.trim())}
            placeholder="r8_..."
            type="password"
            style={{ ...inp, fontFamily: "monospace", fontSize: ".82rem" }}
            onFocus={onF} onBlur={onB}
          />
          <p style={{ fontSize: ".62rem", color: t.tx3, marginTop: 6, lineHeight: 1.5, fontWeight: 300 }}>
            Получить на <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener" style={{ color: t.accent, textDecoration: "underline" }}>replicate.com/account/api-tokens</a>
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: ".68rem", fontWeight: 500, color: t.tx2, marginBottom: 6, display: "block", letterSpacing: ".04em" }}>ElevenLabs API Key (озвучка)</label>
          <input
            value={elKey}
            onChange={e => saveElKey(e.target.value.trim())}
            placeholder="sk_..."
            type="password"
            style={{ ...inp, fontFamily: "monospace", fontSize: ".82rem" }}
            onFocus={onF} onBlur={onB}
          />
          <p style={{ fontSize: ".62rem", color: t.tx3, marginTop: 6, lineHeight: 1.5, fontWeight: 300 }}>
            Получить на <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener" style={{ color: t.accent, textDecoration: "underline" }}>elevenlabs.io</a> · Без ключа — голос браузера
          </p>
        </div>

        {/* Voice Picker */}
        {elKey && <div style={{ marginBottom: 16, animation: "fu .3s ease-out" }}>
          <label style={{ fontSize: ".68rem", fontWeight: 500, color: t.tx2, marginBottom: 6, display: "block", letterSpacing: ".04em" }}>Голос для озвучки</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 14, border: `1.5px solid ${t.gb}`, background: dark ? t.bg2 : "#fff", fontSize: ".82rem", fontFamily: FN.b, color: t.tx }}>
              🎙️ {elVoiceName}
            </div>
            <button onClick={fetchVoices} disabled={voicesLoading} style={{ padding: "10px 14px", borderRadius: 14, border: `1.5px solid ${t.gb}`, background: t.accentBg, fontFamily: FN.b, fontSize: ".72rem", fontWeight: 500, color: t.accent, cursor: voicesLoading ? "default" : "pointer", whiteSpace: "nowrap" }}>
              {voicesLoading ? "⏳" : "Выбрать голос"}
            </button>
          </div>
          {elVoices.length > 0 && <div style={{ maxHeight: 200, overflowY: "auto", border: `1px solid ${t.gb}`, borderRadius: 14, background: dark ? t.bg2 : "#fff" }}>
            {elVoices.map(v => (
              <div key={v.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
                borderBottom: `1px solid ${t.gb}08`,
                background: v.id === elVoiceId ? t.accentBg : "transparent",
                cursor: "pointer", transition: "background .2s"
              }}
                onClick={() => selectVoice(v.id, v.name)}
                onMouseOver={e => { if (v.id !== elVoiceId) e.currentTarget.style.background = t.blushBg }}
                onMouseOut={e => { if (v.id !== elVoiceId) e.currentTarget.style.background = "transparent" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".78rem", fontWeight: v.id === elVoiceId ? 600 : 400, color: t.tx }}>{v.name} {v.id === elVoiceId && "✓"}</div>
                  <div style={{ fontSize: ".6rem", color: t.tx3 }}>{v.category}{v.labels?.accent ? " · " + v.labels.accent : ""}{v.labels?.gender ? " · " + v.labels.gender : ""}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); if (voicePreview) { voicePreview.pause(); setVoicePreview(null); } else { previewVoice(v.id); } }} style={{
                  padding: "4px 10px", borderRadius: 12, border: `1px solid ${t.gb}`, background: "transparent",
                  fontSize: ".64rem", fontFamily: FN.b, color: t.accent, cursor: "pointer", flexShrink: 0
                }}>
                  {voicePreview ? "⏹" : "▶"}
                </button>
              </div>
            ))}
          </div>}
          <p style={{ fontSize: ".58rem", color: t.tx3, marginTop: 6, fontWeight: 300 }}>
            Совет: добавьте русские голоса в <a href="https://elevenlabs.io/app/voice-library" target="_blank" rel="noopener" style={{ color: t.accent, textDecoration: "underline" }}>Voice Library</a> → они появятся здесь
          </p>
        </div>}

        <div style={{ padding: "12px 14px", borderRadius: 14, background: (antKey && repToken) ? t.sageBg : t.blushBg, border: `1px solid ${(antKey && repToken) ? t.sage + "30" : t.blush + "30"}`, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: antKey ? t.sage : t.blush }}/>
            <span style={{ fontSize: ".72rem", fontWeight: 500, color: antKey ? t.sage : t.tx3 }}>
              {antKey ? "Sonnet подключён — сказки работают" : "Нужен Anthropic ключ для сказок"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: repToken ? t.sage : t.blush }}/>
            <span style={{ fontSize: ".72rem", fontWeight: 500, color: repToken ? t.sage : t.tx3 }}>
              {repToken ? "Flux 2 Pro + Kontext Pro подключены" : "Без Replicate ключа — иллюстрации отключены"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: elKey ? t.sage : t.accent }}/>
            <span style={{ fontSize: ".72rem", fontWeight: 500, color: elKey ? t.sage : t.tx3 }}>
              {elKey ? `ElevenLabs — ${elVoiceName}` : "Озвучка — голос браузера (бесплатно)"}
            </span>
          </div>
          {repToken && <p style={{ fontSize: ".6rem", color: t.tx3, marginTop: 6, fontWeight: 300 }}>Стр.1: Flux 2 Pro (~$0.05) · Стр.2-6: Kontext Pro (~$0.04){elKey ? " · Голос: ~$0.01/стр · Звуки: ~$0.01/стр" : ""}</p>}
        </div>

        <button onClick={() => setShowSettings(false)} style={{ width: "100%", padding: "12px", borderRadius: 50, background: t.accent, color: "#fff", border: "none", fontFamily: FN.b, fontWeight: 600, fontSize: ".85rem", cursor: "pointer" }}>Готово</button>
      </div>
    </div>
  );

  // ═══ LOADING ═══
  if (view === "loading") return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{CSS}</style>
      <div style={{ fontSize: "2rem" }}>📖</div>
      <div style={{ width: 36, height: 36, border: `2.5px solid ${t.accent}25`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin .8s linear infinite" }}/>
    </div>
  );

  // ═══ AUTH ═══
  if (view === "auth") return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FN.b, position: "relative", overflow: "hidden", transition: "background .5s" }}>
      <style>{CSS}</style>
      <div style={{ position: "absolute", top: "10%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${t.accentBg}, transparent 60%)`, filter: "blur(80px)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${t.sageBg}, transparent 60%)`, filter: "blur(60px)", pointerEvents: "none" }}/>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "40px 28px", maxWidth: 420, width: "100%" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" style={{ background: t.gl2, border: `1px solid ${t.gb}`, padding: "7px 14px", borderRadius: 20, fontSize: ".7rem", fontWeight: 400, color: t.tx3, fontFamily: FN.b, textDecoration: "none" }}>{L.back}</a>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <LangSwitch lang={lang} onToggle={toggleLang} t={t}/>
            <ThemeSwitch dark={dark} onToggle={toggleTheme}/>
          </div>
        </div>
        <div style={{ animation: "fu .7s ease-out", marginBottom: 44, paddingTop: 20 }}>
          <Label center>{L.interactiveStories}</Label>
          <h1 style={{ fontFamily: FN.d, fontSize: "clamp(2.8rem,9vw,4rem)", fontWeight: 300, lineHeight: 1, letterSpacing: "-.02em", marginBottom: 14 }}>
            <span style={{ color: t.tx }}>{L.skazka}</span><br/>
            <em style={{ color: t.accent, fontWeight: 400 }}>{L.vmeste}</em>
          </h1>
          <p style={{ color: t.tx3, fontFamily: FN.b, fontSize: ".9rem", maxWidth: 300, margin: "0 auto", lineHeight: 1.65, fontWeight: 300 }}>{L.aiCreates}<br/>{L.readTogether}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fu .7s .1s ease-out both" }}>
          <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder={L.yourName} style={inp} onFocus={onF} onBlur={onB}/>
          <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder={L.email} type="email" style={inp} onFocus={onF} onBlur={onB} onKeyDown={e => e.key === "Enter" && register()}/>
        </div>
        <div style={{ marginTop: 18, animation: "fu .7s .2s ease-out both" }}>
          <PBtn onClick={register} disabled={!authName.trim() || !authEmail.trim()} style={{ width: "100%" }}>{L.login}</PBtn>
        </div>
        <div style={{ marginTop: 20, padding: "10px 14px", borderRadius: 14, background: t.sageBg, border: `1px solid ${t.sage}20`, fontSize: ".65rem", color: t.sage, lineHeight: 1.5, fontWeight: 300 }}>{L.disclaimer}</div>
      </div>
    </div>
  );

  // ═══ DASHBOARD ═══
  if (view === "dashboard") return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: FN.b, position: "relative", overflow: "hidden", transition: "background .5s" }}>
      <style>{CSS}</style>
      {showSettings && <SettingsPanel />}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 620, margin: "0 auto", padding: "36px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 44, animation: "fu .5s ease-out" }}>
          <div>
            <Label>Dashboard</Label>
            <h1 style={{ fontFamily: FN.d, fontSize: "clamp(1.6rem,5vw,2.4rem)", fontWeight: 300, letterSpacing: "-.02em", lineHeight: 1.1, color: t.tx }}>
              Привет, <em style={{ color: t.accent, fontWeight: 400, fontStyle: "italic" }}>{user?.name}</em>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setShowSettings(true)} style={{ background: t.gl2, border: `1px solid ${t.gb}`, cursor: "pointer", padding: "7px 12px", borderRadius: 20, fontSize: ".8rem", color: t.tx3, position: "relative" }}>
              ⚙️
              {(!repToken || !antKey) && <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#C47B7B", border: `2px solid ${t.bg}` }}/>}
            </button>
            <button onClick={async () => { await ST.del("user"); window.location.href = "/" }} style={{ background: t.gl2, border: `1px solid ${t.gb}`, cursor: "pointer", padding: "7px 14px", borderRadius: 20, fontSize: ".7rem", fontWeight: 400, color: t.tx3, fontFamily: FN.b }}>{L.logout}</button>
            <LangSwitch lang={lang} onToggle={toggleLang} t={t}/>
            <ThemeSwitch dark={dark} onToggle={toggleTheme}/>
          </div>
        </div>

        {/* API key prompt */}
        {(!antKey || !repToken) && <div onClick={() => setShowSettings(true)} style={{ background: t.accentBg, border: `1px solid ${t.accent}25`, borderRadius: 16, padding: "14px 18px", marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, animation: "fu .5s ease-out", transition: "transform .3s" }}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = ""}>
          <span style={{ fontSize: "1.3rem" }}>🎨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: ".82rem", fontWeight: 600, color: t.tx, marginBottom: 2 }}>Подключите Flux 2 Pro</div>
            <div style={{ fontSize: ".68rem", color: t.tx3, fontWeight: 300 }}>Добавьте API-ключ Replicate для генерации иллюстраций</div>
          </div>
          <span style={{ color: t.accent, fontSize: ".75rem", fontWeight: 600 }}>→</span>
        </div>}

        {/* Children */}
        <div style={{ background: dark ? t.gl : "#fff", border: `1px solid ${t.gb}`, borderRadius: 20, padding: "24px 22px", marginBottom: 16, boxShadow: t.shadow, animation: "fu .5s .05s ease-out both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontFamily: FN.d, fontSize: "1.15rem", fontWeight: 600, color: t.tx }}>{L.children}</h3>
            <button onClick={() => setShowAdd(!showAdd)} style={{ background: t.accentBg, border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: 20, fontSize: ".73rem", fontWeight: 500, color: t.accent, fontFamily: FN.b }}>+ Добавить</button>
          </div>
          {showAdd && <div style={{ display: "flex", gap: 8, marginBottom: 12, animation: "fu .25s ease-out" }}>
            <input value={newChild} onChange={e => setNewChild(e.target.value)} placeholder={L.childName} style={{ ...inp, flex: 1, padding: "11px 14px" }} onFocus={onF} onBlur={onB}/>
            <select value={newAge} onChange={e => setNewAge(e.target.value)} style={{ padding: "11px", borderRadius: 14, border: `1.5px solid ${t.gb}`, background: dark ? t.bg2 : "#fff", color: t.tx, fontFamily: FN.b, fontSize: ".85rem" }}>
              {[3,4,5,6,7,8,9,10].map(a => <option key={a} value={a}>{a} лет</option>)}
            </select>
            <button onClick={addChild} style={{ padding: "11px 18px", borderRadius: 14, background: t.accent, color: "#fff", border: "none", fontWeight: 600, fontFamily: FN.b, fontSize: ".88rem", cursor: "pointer" }}>✓</button>
          </div>}
          {children.length === 0
            ? <p style={{ fontSize: ".83rem", color: t.tx3, textAlign: "center", padding: 14, fontWeight: 300 }}>{L.addChildPlaceholder}</p>
            : <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {children.map(ch => <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", background: t.blushBg, borderRadius: 14, border: `1px solid ${t.gb}` }}>
                  <span style={{ fontSize: "1rem" }}>👶</span>
                  <div><div style={{ fontSize: ".83rem", fontWeight: 600, color: t.tx }}>{ch.name}</div><div style={{ fontSize: ".64rem", color: t.tx3, fontWeight: 300 }}>{ch.age} лет</div></div>
                </div>)}
              </div>}
        </div>

        {/* New Session */}
        {children.length > 0 && <div style={{ background: dark ? t.gl : "#fff", border: `1px solid ${t.gb}`, borderRadius: 20, padding: "24px 22px", marginBottom: 16, boxShadow: t.shadow, animation: "fu .5s .1s ease-out both" }}>
          <h3 style={{ fontFamily: FN.d, fontSize: "1.15rem", fontWeight: 600, marginBottom: 16, color: t.tx }}>{L.newSession}</h3>
          <p style={{ fontSize: ".8rem", color: t.tx3, marginBottom: 8, fontWeight: 300 }}>{L.forWhom}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {children.map(ch => <button key={ch.id} onClick={() => setActiveChild(activeChild?.id === ch.id ? null : ch)} style={{ padding: "9px 18px", borderRadius: 50, fontFamily: FN.b, fontSize: ".83rem", fontWeight: 500, cursor: "pointer", background: activeChild?.id === ch.id ? t.accentBg : (dark ? t.gl2 : "#fff"), border: `1.5px solid ${activeChild?.id === ch.id ? t.accent : t.gb}`, color: t.tx, transition: "all .3s" }}>{ch.name}</button>)}
          </div>
          {activeChild && <div style={{ animation: "fu .3s ease-out" }}>
            <PBtn onClick={() => { setBackstory(""); setPresets([]); setView("setup"); generatePresets(activeChild.name, activeChild.age); }} style={{ width: "100%" }}>{L.createStory}</PBtn>
          </div>}
        </div>}

        {/* History */}
        {sessions.length > 0 && <div style={{ background: dark ? t.gl : "#fff", border: `1px solid ${t.gb}`, borderRadius: 20, padding: "24px 22px", boxShadow: t.shadow, animation: "fu .5s .15s ease-out both" }}>
          <h3 style={{ fontFamily: FN.d, fontSize: "1.15rem", fontWeight: 600, marginBottom: 16, color: t.tx }}>{L.history}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.slice(0, 8).map((s, i) => <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: t.blushBg, borderRadius: 14, border: `1px solid ${t.gb}`, animation: `si .35s ${i*.05}s ease-out both` }}>
              <span style={{ fontSize: "1.1rem" }}>{s.theme?.emoji || "📖"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ".83rem", fontWeight: 600, color: t.tx }}>{s.theme?.name} — {s.child?.name}</div>
                <div style={{ fontSize: ".66rem", color: t.tx3, fontWeight: 300 }}>{new Date(s.date).toLocaleDateString("ru")} · {Math.ceil(s.duration/60)} мин · {s.pages?.length || 0} стр.</div>
              </div>
            </div>)}
          </div>
        </div>}
      </div>
    </div>
  );

  // ═══ SETUP (backstory/premise) ═══
  if (view === "setup") {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, fontFamily: FN.b, position: "relative", overflow: "hidden", transition: "background .5s" }}>
        <style>{CSS}</style>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "36px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button onClick={() => setView("dashboard")} style={{ background: t.gl2, border: "1px solid " + t.gb, padding: "7px 14px", borderRadius: 20, fontSize: ".7rem", fontWeight: 400, color: t.tx3, fontFamily: FN.b, cursor: "pointer" }}>{L.back}</button>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}><LangSwitch lang={lang} onToggle={toggleLang} t={t}/><ThemeSwitch dark={dark} onToggle={toggleTheme}/></div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 28, animation: "fu .5s ease-out" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📖</div>
            <h2 style={{ fontFamily: FN.d, fontSize: "clamp(1.4rem,4vw,1.9rem)", fontWeight: 300, letterSpacing: "-.02em", color: t.tx, marginBottom: 6 }}>
              {L.storyFor} <em style={{ color: t.accent, fontWeight: 400, fontStyle: "italic" }}>{activeChild?.name}</em>
            </h2>
            <p style={{ color: t.tx3, fontSize: ".82rem", fontWeight: 300 }}>{L.whatAbout}</p>
          </div>

          {/* AI-generated presets */}
          <div style={{ background: dark ? t.gl : "#fff", border: "1px solid " + t.gb, borderRadius: 20, padding: "20px 18px", marginBottom: 14, boxShadow: t.shadow, animation: "fu .5s .05s ease-out both" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontFamily: FN.d, fontSize: ".95rem", fontWeight: 600, color: t.tx, fontStyle: "italic" }}>✨ Идеи для истории</h3>
              <button onClick={() => { setPresets([]); generatePresets(activeChild.name, activeChild.age); }} disabled={presetsLoading} style={{ background: t.accentBg, border: "none", padding: "5px 12px", borderRadius: 16, fontSize: ".68rem", fontWeight: 500, color: t.accent, fontFamily: FN.b, cursor: presetsLoading ? "default" : "pointer", opacity: presetsLoading ? .5 : 1 }}>🔄 Ещё</button>
            </div>
            {presetsLoading && presets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ width: 24, height: 24, border: "2px solid " + t.gb, borderTopColor: t.accent, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 10px" }}/>
                <p style={{ fontSize: ".78rem", color: t.tx3, fontWeight: 300 }}>Генерируем идеи…</p>
              </div>
            ) : presets.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {presets.map((p, i) => (
                  <button key={i} onClick={() => setBackstory(p.text)} style={{
                    padding: "11px 14px", borderRadius: 14, border: "1.5px solid " + (backstory === p.text ? t.accent : t.gb),
                    background: backstory === p.text ? t.accentBg : (dark ? t.gl2 : "#fff"),
                    fontFamily: FN.b, fontSize: ".82rem", fontWeight: 500, color: t.tx, textAlign: "left",
                    cursor: "pointer", transition: "all .3s", display: "flex", alignItems: "center", gap: 10,
                    animation: "si .3s " + (i * .04) + "s ease-out both"
                  }}
                    onMouseOver={e => { if (backstory !== p.text) { e.currentTarget.style.borderColor = t.accent + "50" } }}
                    onMouseOut={e => { if (backstory !== p.text) { e.currentTarget.style.borderColor = t.gb } }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{p.emoji}</span>
                    <span>{p.text}</span>
                    {backstory === p.text && <span style={{ color: t.accent, fontWeight: 700, marginLeft: "auto", flexShrink: 0 }}>✓</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: ".78rem", color: t.tx3, textAlign: "center", padding: "12px 0", fontWeight: 300 }}>
                {antKey ? "Не удалось загрузить. Нажмите 🔄" : "Нужен API ключ для генерации идей"}
              </p>
            )}
          </div>

          {/* Custom backstory textarea */}
          <div style={{ background: dark ? t.gl : "#fff", border: "1px solid " + t.gb, borderRadius: 20, padding: "20px 18px", marginBottom: 20, boxShadow: t.shadow, animation: "fu .5s .1s ease-out both" }}>
            <h3 style={{ fontFamily: FN.d, fontSize: ".95rem", fontWeight: 600, marginBottom: 10, color: t.tx, fontStyle: "italic" }}>✏️ Или напишите свою</h3>
            <textarea
              value={backstory}
              onChange={e => setBackstory(e.target.value)}
              placeholder={"Например: Мальчик хочет выиграть школьный чемпионат по шахматам, но его главный соперник — лучший друг..."}
              rows={3}
              style={{ ...inp, resize: "vertical", minHeight: 72, lineHeight: 1.6 }}
              onFocus={onF} onBlur={onB}
            />
            <p style={{ fontSize: ".62rem", color: t.tx3, marginTop: 6, fontWeight: 300 }}>Реалистичная, фэнтези, фантастика — что угодно.</p>
          </div>

          {/* Art Style Picker */}
          <div style={{ background: dark ? t.gl : "#fff", border: "1px solid " + t.gb, borderRadius: 20, padding: "20px 18px", marginBottom: 20, boxShadow: t.shadow, animation: "fu .5s .12s ease-out both" }}>
            <h3 style={{ fontFamily: FN.d, fontSize: ".95rem", fontWeight: 600, marginBottom: 10, color: t.tx, fontStyle: "italic" }}>{L.artStyle}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[["book", L.styleBook, L.styleBookDesc, "📖"], ["anime", L.styleAnime, L.styleAnimeDesc, "🎨"], ["realistic", L.styleRealistic, L.styleRealisticDesc, "📷"]].map(([key, name, desc, emoji]) => (
                <button key={key} onClick={async () => { setArtStyle(key); await ST.set("artStyle", key); }} style={{
                  padding: "12px 8px", borderRadius: 14, border: `1.5px solid ${artStyle === key ? t.accent : t.gb}`,
                  background: artStyle === key ? t.accentBg : (dark ? t.gl2 : "#fff"),
                  cursor: "pointer", textAlign: "center", transition: "all .2s", fontFamily: FN.b
                }}>
                  <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontSize: ".78rem", fontWeight: 600, color: t.tx }}>{name}</div>
                  <div style={{ fontSize: ".58rem", color: t.tx3, fontWeight: 300 }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fu .5s .15s ease-out both" }}>
            <PBtn onClick={() => startSession(activeChild, backstory)} disabled={!backstory.trim()} style={{ width: "100%", opacity: backstory.trim() ? 1 : .5 }}>
              {L.startStory}
            </PBtn>
            {backstory && <button onClick={() => { setBackstory(""); }} style={{ padding: "10px", border: "none", background: "transparent", color: t.tx3, fontSize: ".78rem", fontFamily: FN.b, cursor: "pointer", fontWeight: 400 }}>{L.clear}</button>}
          </div>
        </div>
      </div>
    );
  }


  // ═══ SESSION ═══
  if (view === "session") return (
    <div style={{ height: "100vh", background: t.bg, fontFamily: FN.b, display: "flex", flexDirection: "column", overflow: "hidden", transition: "background .5s" }}>
      <style>{CSS}</style>
      {showSettings && <SettingsPanel />}
      {/* Top bar */}
      <div style={{ padding: "9px 16px", background: dark ? "rgba(26,21,16,.94)" : "rgba(250,245,236,.94)", borderBottom: `1px solid ${t.gb}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: ".88rem" }}>{theme?.emoji}</span>
          <span style={{ fontFamily: FN.d, fontSize: ".9rem", fontWeight: 600, color: t.tx2, fontStyle: "italic" }}>{activeChild?.name}</span>
          <div style={{ width: 1, height: 14, background: t.gb, margin: "0 4px" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.sage, boxShadow: `0 0 6px ${t.sage}44` }}/>
            <span style={{ fontSize: ".73rem", fontWeight: 500, color: t.tx3, fontFamily: "monospace" }}>{fmtT(timer)}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PageProgress current={pages.length + 1} total={TOTAL_PAGES} t={t} />
          <ThemeSwitch dark={dark} onToggle={toggleTheme}/>
          <button onClick={() => { if (curPage) finishSession(); else setView("dashboard") }} style={{ background: t.accentBg, border: `1px solid ${t.accent}25`, color: t.accent, fontSize: ".76rem", fontWeight: 600, padding: "6px 14px", borderRadius: 20, fontFamily: FN.b, cursor: "pointer" }}>{L.finish}</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT — Story */}
        <div ref={storyScrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", position: "relative" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px", position: "relative", zIndex: 1 }}>
            <div style={{ width: "100%", maxWidth: 520 }}>
              <div style={{ background: t.card, borderRadius: 20, border: `1px solid ${t.gb}`, position: "relative", overflow: "hidden", boxShadow: t.shadow }}>
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg,transparent,${t.accent}25,transparent)` }}/>
                <div style={{ padding: "20px 22px 18px" }}>
                  {loading ? <div style={{ textAlign: "center", padding: "46px 18px", animation: "fu .4s" }}>
                    <div style={{ width: 30, height: 30, border: `2px solid ${t.gb}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 14px" }}/>
                    <p style={{ fontSize: ".88rem", color: t.tx3, fontWeight: 300 }}>{pages.length === 0 ? `${L.creatingStory} ${activeChild?.name}…` : L.continuing}</p>
                    {error && <div style={{ marginTop: 10, padding: "9px 12px", background: "rgba(196,123,123,.08)", borderRadius: 12, border: "1px solid rgba(196,123,123,.2)", fontSize: ".78rem", color: "#C47B7B" }}>
                      {error}
                      <button onClick={() => { setError(null); setLoading(true); genPage({ name: activeChild.name, age: activeChild.age, theme: theme.prompt, history: pages.map(p => ({ text: p.text, choice: p.choice, mood: p.mood, sceneSummary: p.sceneSummary, actionSummary: p.actionSummary })), choice: picks[picks.length-1] || null, charDesc, lang }, antKey).then(r => { setCurPage(r); setLoading(false) }).catch(() => { setError("Повтор ошибки."); setLoading(false) }) }} style={{ display: "block", margin: "8px auto 0", padding: "5px 16px", borderRadius: 16, background: t.accent, color: "#fff", border: "none", fontSize: ".76rem", fontFamily: FN.b, fontWeight: 600, cursor: "pointer" }}>Повтор</button>
                    </div>}
                  </div> : curPage ? <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontFamily: FN.d, fontSize: ".88rem", fontWeight: 600, color: t.accent, fontStyle: "italic" }}>{curPage.title || "✦"}</span>
                      <span style={{ fontSize: ".63rem", color: t.tx3, background: t.blushBg, padding: "3px 9px", borderRadius: 10, fontWeight: 500 }}>стр. {pages.length + 1} из {TOTAL_PAGES}</span>
                    </div>

                    {/* Illustration */}
                    <div style={{ marginBottom: 16, border: `1px solid ${t.gb}`, borderRadius: 16, overflow: "hidden", position: "relative" }}>
                      <SceneIllustration imgUrl={curImg} mood={curPage.mood || "forest"} loading={imgLoading} isFirst={pages.length === 0} />
                    </div>

                    {/* Story text — typewriter */}
                    <div style={{ marginBottom: 18, textAlign: "center", padding: "0 4px" }}>
                      <Typewriter
                        text={curPage.text}
                        speed={35}
                        onDone={() => setTextDone(true)}
                        style={{ fontFamily: FN.d, fontSize: "clamp(.92rem,2.2vw,1.08rem)", lineHeight: 2, color: t.storyTx, fontStyle: "italic", fontWeight: 400 }}
                      />
                    </div>

                    {/* TTS & SFX controls */}
                    <div style={{ textAlign: "center", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => { if (speaking) stopSpeak(); else speakText(curPage.tts_text || curPage.text); }} style={{
                        background: speaking ? t.accent : t.blushBg, border: `1px solid ${speaking ? t.accent : t.gb}`,
                        padding: "7px 16px", borderRadius: 20, fontSize: ".74rem", fontWeight: 500, fontFamily: FN.b,
                        color: speaking ? "#fff" : t.tx2, cursor: "pointer", transition: "all .3s",
                        display: "flex", alignItems: "center", gap: 6,
                        animation: speaking ? "pulse 2s ease-in-out infinite" : "none"
                      }}>
                        <span style={{ fontSize: ".9rem" }}>{speaking ? "⏹" : "🔊"}</span>
                        {speaking ? L.stop : L.speak}
                      </button>
                      <button onClick={async () => { const next = !ttsEnabled; setTtsEnabled(next); await ST.set("ttsEnabled", next); }} style={{
                        background: ttsEnabled ? t.sageBg : t.blushBg, border: `1px solid ${ttsEnabled ? t.sage + "30" : t.gb}`,
                        padding: "7px 12px", borderRadius: 20, fontSize: ".64rem", fontWeight: 400, fontFamily: FN.b,
                        color: ttsEnabled ? t.sage : t.tx3, cursor: "pointer", transition: "all .3s"
                      }}>
                        {ttsEnabled ? "✓ авто" : "авто"}
                      </button>
                      {elKey && <button onClick={async () => { const next = !sfxEnabled; setSfxEnabled(next); await ST.set("sfxEnabled", next); if (!next) stopSfx(); else if (curPage?.sfx) playSfx(curPage.sfx); }} style={{
                        background: sfxEnabled ? t.sageBg : t.blushBg, border: `1px solid ${sfxEnabled ? t.sage + "30" : t.gb}`,
                        padding: "7px 12px", borderRadius: 20, fontSize: ".64rem", fontWeight: 400, fontFamily: FN.b,
                        color: sfxEnabled ? t.sage : t.tx3, cursor: "pointer", transition: "all .3s",
                        display: "flex", alignItems: "center", gap: 4
                      }}>
                        {sfxLoading ? "⏳" : sfxEnabled ? "🎵" : "🔇"} {sfxEnabled ? "звуки" : "тихо"}
                      </button>}
                      <span style={{ fontSize: ".58rem", color: t.tx3, fontWeight: 300 }}>{elKey ? elVoiceName : "браузер"}</span>
                    </div>

                    {/* End / Choices / Custom */}
                    {curPage.isEnd ? <div style={{ textAlign: "center", animation: "fu .5s ease-out" }}>
                      <p style={{ fontFamily: FN.d, fontSize: "1rem", color: t.accent, fontWeight: 600, fontStyle: "italic", marginBottom: 12 }}>{L.end}</p>
                      <PBtn onClick={finishSession}>{L.viewReport}</PBtn>
                    </div> : textDone && <>
                      {curPage.choices?.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
                        {curPage.choices.map((ch, i) => <button key={i} onClick={() => pickChoice(ch)} disabled={!!sel || loading} style={{
                          background: sel === ch.label ? t.selBg : (dark ? t.gl2 : "#fff"),
                          border: `1.5px solid ${sel === ch.label ? t.accent : t.gb}`,
                          borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
                          fontSize: ".84rem", fontWeight: 500, fontFamily: FN.b, color: t.tx, textAlign: "left",
                          cursor: sel ? "default" : "pointer", transition: "all .3s",
                          animation: `si .3s ${i * .06}s ease-out both`,
                          boxShadow: sel === ch.label ? `0 0 0 3px ${t.accent}10` : "0 2px 8px rgba(42,31,20,.04)"
                        }}
                          onMouseOver={e => { if (!sel) { e.currentTarget.style.borderColor = `${t.accent}50`; e.currentTarget.style.transform = "translateX(4px)" } }}
                          onMouseOut={e => { if (!sel) { e.currentTarget.style.borderColor = t.gb; e.currentTarget.style.transform = "" } }}>
                          <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{ch.emoji}</span>
                          <span style={{ flex: 1 }}>{ch.label}</span>
                          {sel === ch.label && <span style={{ color: t.accent, fontWeight: 700 }}>✓</span>}
                        </button>)}
                      </div>}
                      {!sel && <div style={{ animation: "fu .3s .15s ease-out both" }}>
                        <div style={{ fontSize: ".64rem", color: t.tx3, textAlign: "center", marginBottom: 6, fontWeight: 400 }}>{L.orCustom}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submitCustom()} placeholder={L.heroAction} style={{ ...inp, flex: 1, padding: "11px 14px", fontSize: ".84rem" }} onFocus={onF} onBlur={onB}/>
                          <button onClick={submitCustom} disabled={!customInput.trim()} style={{ padding: "11px 18px", borderRadius: 14, background: customInput.trim() ? t.accent : t.gl2, color: customInput.trim() ? "#fff" : t.tx3, border: "none", fontWeight: 600, fontFamily: FN.b, fontSize: ".84rem", cursor: customInput.trim() ? "pointer" : "default", transition: "all .3s" }}>→</button>
                        </div>
                      </div>}
                    </>}
                  </div> : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Video Placeholder */}
        <div style={{ width: "min(32%,260px)", background: dark ? t.bg2 : t.bg3, display: "flex", flexDirection: "column", borderLeft: `1px solid ${t.gb}`, flexShrink: 0 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
            <div>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: t.blushBg, border: `2px dashed ${t.blush}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 16px" }}>📹</div>
              <p style={{ fontFamily: FN.d, fontSize: "1rem", fontWeight: 600, color: t.tx, marginBottom: 8, fontStyle: "italic" }}>Видеозвонок</p>
              <p style={{ fontSize: ".73rem", color: t.tx3, lineHeight: 1.5, maxWidth: 180, margin: "0 auto", fontWeight: 300 }}>Поделитесь экраном через Zoom, FaceTime или WhatsApp</p>
              <div style={{ marginTop: 16, padding: "10px 18px", borderRadius: 12, background: t.accentBg, border: `1px solid ${t.accent}20`, fontSize: ".68rem", color: t.accent, fontWeight: 500 }}>🔗 В полной версии — встроенный звонок</div>
            </div>
          </div>
          <div style={{ padding: "12px 10px", display: "flex", gap: 8, justifyContent: "center", borderTop: `1px solid ${t.gb}`, background: dark ? "rgba(0,0,0,.2)" : "rgba(42,31,20,.02)" }}>
            {["🎙️","📷","🔇"].map((icon, i) => <div key={i} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${t.gb}`, background: t.blushBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem", opacity: .4 }}>{icon}</div>)}
            <button onClick={() => { if (curPage) finishSession(); else setView("dashboard") }} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#C47B7B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem", cursor: "pointer", color: "#fff" }}>📞</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ═══ REPORT ═══
  if (view === "report") {
    const vals = getVals();
    const dur = t0 ? Math.ceil((Date.now()-t0)/60000) : 0;
    const topVal = vals[0];
    const allPages = [...pages, curPage].filter(Boolean);
    
    // Determine ending type
    const posCount = vals.filter(v => VALS[v.k]?.pos).reduce((s,v) => s+v.count, 0);
    const negCount = vals.filter(v => !VALS[v.k]?.pos).reduce((s,v) => s+v.count, 0);
    const endType = negCount > posCount ? "sad" : negCount === posCount && negCount > 0 ? "mixed" : "good";
    const endLabel = endType === "sad" ? "😢 Грустный конец" : endType === "mixed" ? "🌗 Смешанный финал" : "🌟 Счастливый конец";
    const endColor = endType === "sad" ? "#8B4C4C" : endType === "mixed" ? "#8B7B3C" : t.sage;
    
    const qs = {
      generosity: "проявил(а) щедрость. Спросите: «Поделишься, если мало?»",
      empathy: "проявил(а) сочувствие! «Что сделаешь, увидев грустного?»",
      courage: "выбрал(а) смелость! «Что помогает, когда страшно?»",
      curiosity: "проявил(а) любопытство. «Что хочешь исследовать?»",
      kindness: "выбрал(а) доброту. «Кому ты помог(ла)?»",
      honesty: "выбрал(а) честность. «Почему важно говорить правду?»",
      patience: "проявил(а) терпение. «Было ли трудно ждать?»",
      teamwork: "выбрал(а) дружбу. «Что лучше: один или с друзьями?»",
      selfishness: "выбрал(а) жадность. Спросите: «Что потерял герой из-за жадности?»",
      cowardice: "выбрал(а) трусость. «Бывает страшно — но что бы ты изменил?»",
      cruelty: "поступил(а) жестоко. «Как думаешь, что почувствовал другой?»",
      greed: "выбрал(а) алчность. «Стоило ли это того?»",
      laziness: "выбрал(а) лень. «Что было бы, если бы постарался?»",
      dishonesty: "выбрал(а) обман. «Что случится, когда правда выйдет наружу?»",
      aggression: "проявил(а) агрессию. «Можно ли решить иначе?»",
      indifference: "проявил(а) равнодушие. «Что бы ты чувствовал на месте того, кого проигнорировали?»",
    };
    return (
      <div style={{ minHeight: "100vh", background: t.bg, fontFamily: FN.b, position: "relative", overflow: "hidden", transition: "background .5s" }}>
        <style>{CSS}</style>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "36px 16px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><ThemeSwitch dark={dark} onToggle={toggleTheme}/></div>

          <div style={{ textAlign: "center", marginBottom: 36, animation: "fu .5s ease-out" }}>
            <Label center>{L.sessionReport}</Label>
            <h2 style={{ fontFamily: FN.d, fontSize: "clamp(1.6rem,5vw,2.2rem)", fontWeight: 300, letterSpacing: "-.02em", marginBottom: 8, color: t.tx }}>
              {L.journey} <em style={{ color: t.accent, fontStyle: "italic", fontWeight: 400 }}>{activeChild?.name}</em>
            </h2>
            <p style={{ color: t.tx3, fontSize: ".83rem", fontWeight: 300 }}>{theme?.emoji} {theme?.name} · {dur} {L.min} · {picks.length} {L.choices} · {allPages.length} {L.pages}</p>
            <div style={{ display: "inline-block", marginTop: 10, padding: "5px 14px", borderRadius: 20, background: endColor + "15", border: "1px solid " + endColor + "30", fontSize: ".78rem", fontWeight: 600, color: endColor }}>{endLabel}</div>
          </div>

          {/* Values */}
          {vals.length > 0 && <div style={{ background: dark ? t.gl : "#fff", border: `1px solid ${t.gb}`, borderRadius: 20, padding: "24px 22px", marginBottom: 16, boxShadow: t.shadow, animation: "fu .5s .1s ease-out both" }}>
            <h3 style={{ fontFamily: FN.d, fontSize: "1.1rem", fontWeight: 600, marginBottom: 18, color: t.tx, fontStyle: "italic" }}>{L.choicesOf} {activeChild?.name}</h3>
            {vals.map((v, i) => <div key={v.k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, animation: `si .4s ${i*.1}s ease-out both` }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", background: `${v.c}12`, border: `1px solid ${v.c}22`, flexShrink: 0 }}>{v.e}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: ".82rem", fontWeight: 600, color: t.tx }}>{v.n} <span style={{ fontSize: ".6rem", fontWeight: 400, color: VALS[v.k]?.pos ? t.sage : "#8B4C4C" }}>{VALS[v.k]?.pos ? "✓" : "✗"}</span></span>
                  <span style={{ fontSize: ".78rem", fontWeight: 700, color: v.c }}>{v.pct}%</span>
                </div>
                <div style={{ height: 5, background: `${v.c}0D`, borderRadius: 5, overflow: "hidden" }}><AB c={v.c} p={v.pct} d={i * 180}/></div>
              </div>
            </div>)}
          </div>}

          {/* Discussion question */}
          <div style={{ background: t.accentBg, border: `1px solid ${t.accent}18`, borderRadius: 18, padding: "22px 20px", marginBottom: 16, animation: "fu .5s .2s ease-out both" }}>
            <div style={{ fontSize: ".58rem", textTransform: "uppercase", letterSpacing: ".18em", fontWeight: 500, color: t.accent, marginBottom: 8 }}>{L.discussionQ}</div>
            <p style={{ fontFamily: FN.d, fontSize: ".95rem", fontStyle: "italic", lineHeight: 1.65, color: t.tx2, fontWeight: 400 }}>{activeChild?.name} {qs[topVal?.k] || "Что запомнилось из сказки?"}</p>
          </div>

          {/* Full story recap */}
          <div style={{ background: dark ? t.gl : "#fff", border: `1px solid ${t.gb}`, borderRadius: 20, padding: "24px 22px", marginBottom: 16, boxShadow: t.shadow, animation: "fu .5s .25s ease-out both" }}>
            <h3 style={{ fontFamily: FN.d, fontSize: "1.1rem", fontWeight: 600, marginBottom: 18, color: t.tx, fontStyle: "italic" }}>{L.fullStory}</h3>
            {backstory && <div style={{ marginBottom: 16, padding: "12px 14px", background: t.accentBg, borderRadius: 14, border: "1px solid " + t.accent + "18" }}>
              <div style={{ fontSize: ".6rem", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 500, color: t.accent, marginBottom: 4 }}>{L.parentPremise}</div>
              <p style={{ fontFamily: FN.d, fontSize: ".82rem", fontStyle: "italic", lineHeight: 1.6, color: t.tx2, fontWeight: 400 }}>{backstory}</p>
            </div>}
            {allPages.map((pg, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: i < allPages.length - 1 ? 16 : 0, borderBottom: i < allPages.length - 1 ? `1px solid ${t.gb}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".6rem", fontWeight: 700, color: t.accent, flexShrink: 0 }}>{i+1}</div>
                  <span style={{ fontFamily: FN.d, fontSize: ".82rem", fontWeight: 600, color: t.accent, fontStyle: "italic" }}>{pg?.title || `Глава ${i+1}`}</span>
                </div>
                {pg?.imgUrl && <div style={{ marginBottom: 8, borderRadius: 12, overflow: "hidden", border: `1px solid ${t.gb}`, maxHeight: 200 }}>
                  <img src={pg.imgUrl} alt="" style={{ width: "100%", display: "block", objectFit: "cover" }}/>
                </div>}
                <p style={{ fontFamily: FN.d, fontSize: ".85rem", fontStyle: "italic", lineHeight: 1.8, color: t.tx2, fontWeight: 400 }}>{pg?.text}</p>
                {pg?.choice && (() => { const isPos = VALS[pg.choice.value]?.pos !== false; return <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: isPos ? t.sageBg : "rgba(139,76,76,.08)", fontSize: ".68rem", color: isPos ? t.sage : "#8B4C4C", fontWeight: 500 }}>
                  <span>{pg.choice.emoji}</span> {pg.choice.label}
                </div>; })()}
              </div>
            ))}
          </div>

          {/* Decision path */}
          {picks.length > 0 && <div style={{ background: dark ? t.gl : "#fff", border: `1px solid ${t.gb}`, borderRadius: 20, padding: "24px 22px", marginBottom: 16, boxShadow: t.shadow, animation: "fu .5s .3s ease-out both" }}>
            <h3 style={{ fontFamily: FN.d, fontSize: "1rem", fontWeight: 600, marginBottom: 12, color: t.tx, fontStyle: "italic" }}>{L.decisionPath}</h3>
            {picks.map((p, i) => {
              const vl = p.value === "custom" ? { n: "Свой ответ", c: "#8A7E6E" } : (VALS[p.value] || { n: p.value, c: "#888" });
              return <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", background: t.blushBg, borderRadius: 14, border: `1px solid ${t.gb}`, marginBottom: 5, animation: `si .3s ${i*.06}s ease-out both` }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${vl.c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".63rem", fontWeight: 700, color: vl.c, flexShrink: 0 }}>{i+1}</div>
                <span style={{ fontSize: ".95rem" }}>{p.emoji}</span>
                <span style={{ flex: 1, fontSize: ".78rem", fontWeight: 600, color: t.tx }}>{p.label}</span>
                <span style={{ fontSize: ".58rem", fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: `${vl.c}0D`, color: vl.c, border: `1px solid ${vl.c}18` }}>{vl.n}</span>
              </div>;
            })}
          </div>}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", animation: "fu .5s .4s ease-out both" }}>
            <PBtn onClick={() => setView("dashboard")}>{L.newSessionBtn}</PBtn>
            <button onClick={() => setView("dashboard")} style={{ padding: "14px 28px", borderRadius: 50, fontFamily: FN.b, fontSize: ".9rem", fontWeight: 500, border: `1.5px solid ${t.gb}`, cursor: "pointer", background: "transparent", color: t.tx3, letterSpacing: ".02em" }}>{L.dashboardBtn}</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
