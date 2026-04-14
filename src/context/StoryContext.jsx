import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { TOTAL_PAGES, VALS } from "../lib/constants.js";
import { genPage, genFirstImage, genCharPortrait, genNextImage, genNewCharPortrait } from "../lib/ai.js";
import { supabase } from "../lib/supabase.js";
import {
  createBook, savePage, finalizeBook, saveBookValues,
  createCharacter, updateCharacterAfterStory, addCompanionLink,
} from "../lib/db.js";
import { uploadIllustration, uploadPortrait } from "../lib/storage-cloud.js";
import ST from "../lib/storage.js";
import { useApp } from "./AppContext.jsx";

const StoryContext = createContext(null);

export function useStory() {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error("useStory must be used within StoryProvider");
  return ctx;
}

export function StoryProvider({ children }) {
  const app = useApp();
  const {
    activeChild, artStyle, lang, L,
    sessions, setSessions, setView, selectedChars, setSelectedChars,
    characters, setCharacters, refreshLibrary, refreshCharacters,
  } = app;

  const elVoiceId = "EXAVITQu4vr4xnSDxMaL";

  // ── Story state ──
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
  const [customInput, setCustomInput] = useState("");
  const [textDone, setTextDone] = useState(false);
  const [charDesc, setCharDesc] = useState(null);
  const [identityTag, setIdentityTag] = useState(null);
  const [companionDesc, setCompanionDesc] = useState(null);
  const [refImgUrl, setRefImgUrl] = useState(null);
  const [portraitUrls, setPortraitUrls] = useState([]);
  const [portraitRegenDone, setPortraitRegenDone] = useState(false);
  const [backstory, setBackstory] = useState("");
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);

  // ── Supabase ──
  const [bookId, setBookId] = useState(null);

  // ── TTS ──
  const [speaking, setSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsVoice, setTtsVoice] = useState(null);
  const audioRef = useRef(null);
  const ttsCacheRef = useRef(new Map());

  // ── SFX ──
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const sfxRef = useRef(null);
  const sfxCacheRef = useRef(new Map());

  // ── Book ──
  const bookRef = useRef(null);
  const prevPageCountRef = useRef(0);
  const pendingCharRef = useRef(null);

  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Timer ──
  useEffect(() => {
    if (app.view === "session" && t0) {
      timerRef.current = setInterval(() => setTimer(Math.floor((Date.now() - t0) / 1000)), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [app.view, t0]);

  // ── TTS voice init ──
  useEffect(() => {
    const pick = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      const ru = voices.filter(v => v.lang.startsWith("ru"));
      const best = ru.find(v => /milena|alena|yandex/i.test(v.name)) || ru[0];
      if (best) setTtsVoice(best);
    };
    pick();
    window.speechSynthesis?.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", pick);
  }, []);

  // ── Text done trigger ──
  useEffect(() => {
    if (!curPage?.text) return;
    const d = setTimeout(() => setTextDone(true), 1500);
    return () => clearTimeout(d);
  }, [curPage?.text]);

  // ── TTS ──
  const speakText = useCallback(async (text) => {
    if (!text) return;
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(true);
    try {
      const cacheKey = elVoiceId + ":" + text;
      let url = ttsCacheRef.current.get(cacheKey);
      if (!url) {
        const res = await fetch(`/api/elevenlabs/v1/text-to-speech/${elVoiceId}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, model_id: "eleven_flash_v2_5", voice_settings: { stability: 0.55, similarity_boost: 0.7, style: 0.3 } })
        });
        if (!res.ok) throw new Error(res.status);
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        ttsCacheRef.current.set(cacheKey, url);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      audio.play();
    } catch { setSpeaking(false); }
  }, [elVoiceId]);

  const stopSpeak = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  }, []);

  useEffect(() => { if (textDone && ttsEnabled && curPage?.text) speakText(curPage.tts_text || curPage.text); }, [textDone, ttsEnabled]);
  useEffect(() => { stopSpeak(); }, [curPage]);

  // ── Style refs ──
  const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
  const STYLE_REFS = [
    ORIGIN + "/style-refs/ref-01-interior.png",
    ORIGIN + "/style-refs/ref-02-forest.png",
    ORIGIN + "/style-refs/ref-03-group.png",
    ORIGIN + "/style-refs/ref-04-owl.png",
    ORIGIN + "/style-refs/ref-05-hedgehog.png",
    ORIGIN + "/style-refs/ref-06-fox.png",
  ];
  const getStyleRef = (mood) => {
    const map = { home: 0, school: 0, forest: 1, city: 1, ocean: 1, sports: 1, magic: 4, castle: 4, space: 4 };
    return STYLE_REFS[map[mood] ?? 1];
  };

  // ── Image generation ──
  useEffect(() => {
    if (!curPage?.scene && !curPage?.illustration) return;
    setCurImg(null);
    setImgLoading(true);
    const mood = curPage.mood || "forest";
    const isFirst = portraitUrls.length === 0 && !refImgUrl;
    const styleRefUrl = getStyleRef(mood);
    const imgOpts = { styleRefUrl };

    if (isFirst) {
      (async () => {
        try {
          const charParts = charDesc ? charDesc.split(/\s*\|\s*/).filter(Boolean) : [];
          const generatedPortraits = [];
          if (charParts.length > 0) {
            for (const partDesc of charParts) {
              const portrait = await genCharPortrait(partDesc, curPage.scene, artStyle, imgOpts);
              if (portrait) generatedPortraits.push(portrait);
            }
          }
          if (generatedPortraits.length > 0) {
            setRefImgUrl(generatedPortraits[0]);
            setPortraitUrls(generatedPortraits);
            const sceneUrl = await genNextImage(curPage.scene, charDesc || "the main character", generatedPortraits, mood, artStyle, imgOpts);
            setCurImg(sceneUrl);
          } else {
            const sceneUrl = await genFirstImage(curPage.scene, charDesc || "a friendly character", mood, artStyle, imgOpts);
            setCurImg(sceneUrl);
            if (sceneUrl) { setRefImgUrl(sceneUrl); setPortraitUrls([sceneUrl]); }
          }
          setImgLoading(false);
        } catch { setImgLoading(false); }
      })();
    } else {
      (async () => {
        try {
          const refs = portraitUrls.length > 0 ? portraitUrls : refImgUrl;
          const url = await genNextImage(curPage.scene, charDesc || "the main character", refs, mood, artStyle, imgOpts);
          setCurImg(url);
          setImgLoading(false);
        } catch { setImgLoading(false); }
      })();
    }
  }, [curPage?.scene, curPage?.illustration]);

  // ── Retroactive image fix ──
  useEffect(() => {
    if (curImg && !curPage && pages.length > 0) {
      const last = pages[pages.length - 1];
      if (last && !last.imgUrl) setPages(p => { const u = [...p]; u[u.length - 1] = { ...u[u.length - 1], imgUrl: curImg }; return u; });
    }
  }, [curImg, curPage, pages.length]);

  // ── Retroactive portrait upload ──
  useEffect(() => {
    const char = pendingCharRef.current || (selectedChars.length === 1 ? selectedChars[0] : null);
    if (!char?.id || !supabase || portraitUrls.length === 0) return;
    if (char.portrait_url) return;
    const portrait = portraitUrls[0];
    if (!portrait) return;
    pendingCharRef.current = null;
    (async () => {
      const permUrl = await uploadPortrait(portrait, activeChild?.id || "unknown", char.id);
      if (permUrl) {
        supabase.from("characters").update({ portrait_url: permUrl }).eq("id", char.id);
        setSelectedChars(prev => prev.map(c => c.id === char.id ? { ...c, portrait_url: permUrl } : c));
        setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, portrait_url: permUrl } : c));
      }
    })();
  }, [selectedChars, portraitUrls]);

  // ── Auto-flip book ──
  const allPagesLen = curPage ? pages.length + 1 : pages.length;
  useEffect(() => {
    if (app.view !== "session") return;
    if (allPagesLen > prevPageCountRef.current && allPagesLen > 1 && bookRef.current) {
      const target = allPagesLen - 1;
      const spreadPage = target % 2 === 0 ? target : target - 1;
      setTimeout(() => { try { bookRef.current?.flip(spreadPage); } catch {} }, 300);
    }
    prevPageCountRef.current = allPagesLen;
  }, [allPagesLen, app.view]);

  // ── Generate presets ──
  const generatePresets = useCallback(async (childName, childAge, chars) => {
    setPresetsLoading(true);
    const hasChars = chars && chars.length > 0;
    const charCtx = hasChars
      ? (lang === "en"
        ? ` The main characters are: ${chars.map(c => `${c.name} (${c.description})`).join("; ")}. All premises must feature THESE characters together in new adventures.`
        : ` Главные герои: ${chars.map(c => `${c.name} (${c.description})`).join("; ")}. Все завязки должны быть про ЭТИХ персонажей вместе в новых приключениях.`)
      : "";
    const nameRule = hasChars
      ? (lang === "en"
        ? ` ALWAYS use the character names (${chars.map(c => c.name).join(", ")}) in every premise. Do NOT use the child's name.`
        : ` ОБЯЗАТЕЛЬНО используй имена персонажей (${chars.map(c => c.name).join(", ")}) в каждой завязке. НЕ используй имя ребёнка.`)
      : (lang === "en"
        ? " Each premise describes a FICTIONAL CHARACTER (not the reader) in an interesting situation. Do NOT use the child's name."
        : " Каждая завязка описывает ВЫМЫШЛЕННОГО ПЕРСОНАЖА (не ребёнка-читателя) в интересной ситуации. НЕ используй имя ребёнка.");
    const prompt = lang === "en"
      ? `Create 6 short story premises for illustrated children's storybooks (reader age ${childAge}).${charCtx}${nameRule} Mix: 2 realistic adventures, 2 fantasy quests, 2 unusual/funny scenarios. Each 1 sentence, 10-18 words. Example: "A tiny dragon who is afraid of fire tries to pass the dragon school exam". Respond ONLY JSON: [{"text":"..."}]`
      : `Придумай 6 коротких завязок для иллюстрированных детских сказок (возраст читателя ${childAge} лет).${charCtx}${nameRule} Микс: 2 реалистичных приключения, 2 фэнтези, 2 необычных/смешных. Каждая — 1 предложение, 10-18 слов. Пример: "Маленький дракон, который боится огня, пытается сдать экзамен в школе драконов". Ответь ТОЛЬКО JSON: [{"text":"..."}]`;
    try {
      const r = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, messages: [{ role: "user", content: prompt }] })
      });
      const data = await r.json();
      const txt = data?.content?.[0]?.text || "";
      const arr = JSON.parse(txt.replace(/```json|```/g, "").trim());
      if (Array.isArray(arr) && arr.length > 0) setPresets(arr);
    } catch (e) { console.error("Presets error:", e); }
    setPresetsLoading(false);
  }, [lang]);

  // ── Start session ──
  const startSession = useCallback(async (child, premise) => {
    const storyTheme = { id: "custom", name: (premise || "").slice(0, 30) + (premise?.length > 30 ? "…" : ""), prompt: premise || "surprise creative story" };
    setTheme(storyTheme); setPages([]); setCurPage(null); setCurImg(null);
    setPicks([]); setSel(null); setT0(Date.now()); setTimer(0); setError(null); setTextDone(false);
    setCustomInput(""); setIdentityTag(null); setCompanionDesc(null); setPortraitRegenDone(false);
    pendingCharRef.current = null;
    ttsCacheRef.current.forEach(url => URL.revokeObjectURL(url)); ttsCacheRef.current.clear();
    sfxCacheRef.current.forEach(url => URL.revokeObjectURL(url)); sfxCacheRef.current.clear();

    const reuse = selectedChars.length > 0 ? selectedChars : null;
    if (reuse) {
      const combinedDesc = reuse.map(c => c.description).join(" | ");
      const portraits = reuse.map(c => c.portrait_url).filter(Boolean);
      setCharDesc(combinedDesc);
      setRefImgUrl(portraits[0] || null);
      setPortraitUrls(portraits);
    } else {
      setCharDesc(null); setRefImgUrl(null); setPortraitUrls([]);
    }

    setView("session"); setLoading(true);

    if (supabase) {
      const book = await createBook({
        childId: child.id, characterId: reuse?.[0]?.id || null,
        premise: premise || "surprise creative story", artStyle, lang,
      });
      if (book) setBookId(book.id);
    }

    try {
      const r = await genPage({
        name: child.name, age: child.age,
        theme: premise || "surprise creative story",
        history: [], choice: null,
        charDesc: reuse ? reuse.map(c => c.description).join(" | ") : null,
        backstory: premise || "", lang, identityTag: null,
        previousArc: reuse ? reuse.flatMap(c => c.story_arc || []) : null,
      });

      if (r.characterDesc && !reuse) setCharDesc(r.characterDesc);
      if (r.identityTag) setIdentityTag(r.identityTag);

      if (r.characterDesc && !reuse && supabase && child.id) {
        const charName = r.characterName || r.title || (premise || "Hero").slice(0, 30);
        createCharacter({
          childId: child.id, name: charName,
          description: r.characterDesc, portraitUrl: null, artStyle,
        }).then(c => {
          if (c) { setSelectedChars([c]); pendingCharRef.current = c; }
        });
      }

      setCurPage(r); setLoading(false);
    } catch { setError(lang === "ru" ? "Ошибка. Попробуйте ещё." : "Error. Try again."); setLoading(false); }
  }, [artStyle, lang, selectedChars, setView, setSelectedChars]);

  // ── Pick choice ──
  const pickChoice = useCallback(async (ch) => {
    if (loading || sel) return;
    setSel(ch.label); setTextDone(false); setCustomInput("");
    setPicks(p => [...p, { label: ch.label, value: ch.value || "custom", page: pages.length + 1 }]);
    setTimeout(async () => {
      const pageData = { ...curPage, imgUrl: curImg, choice: ch, illustration: curPage.illustration };
      const up = [...pages, pageData];
      setPages(up); setCurPage(null); setCurImg(null); setSel(null); setLoading(true);

      if (supabase && bookId) {
        (async () => {
          let permanentImgUrl = pageData.imgUrl;
          if (permanentImgUrl) permanentImgUrl = await uploadIllustration(permanentImgUrl, bookId, up.length);
          await savePage(bookId, {
            pageNumber: up.length, title: pageData.title, text: pageData.text,
            ttsText: pageData.tts_text, scene: pageData.scene,
            sceneSummary: pageData.sceneSummary, actionSummary: pageData.actionSummary,
            mood: pageData.mood, imageUrl: permanentImgUrl, sfx: pageData.sfx,
            choiceLabel: ch.label, choiceValue: ch.value || "custom", isEnd: false,
          });
        })();
      }

      try {
        const r = await genPage({
          name: activeChild.name, age: activeChild.age, theme: theme.prompt,
          history: up.map(p => ({ text: p.text, choice: p.choice, mood: p.mood, sceneSummary: p.sceneSummary, actionSummary: p.actionSummary, illustration: p.illustration })),
          choice: ch, charDesc, lang, identityTag,
          previousArc: selectedChars.length > 0 ? selectedChars.flatMap(c => c.story_arc || []) : null,
          prevIllustrationUrl: curImg || null, prevScene: curPage?.scene || null,
        });

        if (r.newMainCharacter) {
          const updDesc = charDesc + ". Also present: " + r.newMainCharacter;
          setCharDesc(updDesc);
          const styleRefUrl = getStyleRef(curPage?.mood || "forest");
          const newPortrait = await genNewCharPortrait(r.newMainCharacter, artStyle, { styleRefUrl });
          if (newPortrait) {
            setPortraitUrls(prev => [...prev, newPortrait]);
            if (supabase && activeChild?.id) {
              const charName = r.newMainCharacter.split(",")[0].slice(0, 30);
              const tempId = Date.now().toString();
              const permPortraitUrl = await uploadPortrait(newPortrait, activeChild.id, tempId);
              const currentCompanionIds = selectedChars.map(sc => sc.id);
              const newChar = await createCharacter({
                childId: activeChild.id, name: charName,
                description: r.newMainCharacter, portraitUrl: permPortraitUrl,
                artStyle, companionIds: currentCompanionIds,
              });
              if (newChar) {
                for (const sc of selectedChars) { addCompanionLink(sc.id, newChar.id); }
              }
            }
          }
        }
        setCurPage(r); setLoading(false);
      } catch { setError(lang === "ru" ? "Ошибка." : "Error."); setLoading(false); }
    }, 600);
  }, [loading, sel, curPage, curImg, pages, bookId, activeChild, theme, charDesc, lang, identityTag, selectedChars, artStyle]);

  const submitCustom = useCallback(() => {
    if (!customInput.trim() || loading || sel) return;
    pickChoice({ label: customInput.trim(), value: "custom" });
  }, [customInput, loading, sel, pickChoice]);

  // ── Finish session ──
  const finishSession = useCallback(async () => {
    stopSpeak();
    clearInterval(timerRef.current);
    const allPages = [...pages, { ...curPage, imgUrl: curImg }];
    const s = { id: Date.now().toString(), child: activeChild, theme, pages: allPages, picks, duration: Math.floor((Date.now() - t0) / 1000), date: Date.now(), charDesc, backstory };
    const upd = [s, ...sessions];
    setSessions(upd);
    await ST.set("sessions", upd);

    if (supabase && bookId) {
      const lastPage = allPages[allPages.length - 1];
      if (lastPage) {
        let permanentImgUrl = lastPage.imgUrl;
        if (permanentImgUrl) permanentImgUrl = await uploadIllustration(permanentImgUrl, bookId, allPages.length);
        await savePage(bookId, {
          pageNumber: allPages.length, title: lastPage.title, text: lastPage.text,
          ttsText: lastPage.tts_text, scene: lastPage.scene,
          sceneSummary: lastPage.sceneSummary, actionSummary: lastPage.actionSummary,
          mood: lastPage.mood, imageUrl: permanentImgUrl, sfx: lastPage.sfx,
          choiceLabel: null, choiceValue: null, isEnd: lastPage.isEnd || true,
        });
      }

      const posVals = ["generosity", "empathy", "courage", "curiosity", "kindness", "honesty", "patience", "teamwork"];
      const negVals = ["selfishness", "cowardice", "cruelty", "greed", "laziness", "dishonesty", "aggression", "indifference"];
      const posCount = picks.filter(p => posVals.includes(p.value)).length;
      const negCount = picks.filter(p => negVals.includes(p.value)).length;
      const endingType = negCount > posCount ? "sad" : negCount === posCount && negCount > 0 ? "mixed" : "good";

      await finalizeBook(bookId, {
        title: theme?.name || allPages[0]?.title || "Story",
        endingType, durationSeconds: Math.floor((Date.now() - t0) / 1000), pageCount: allPages.length,
      });

      const vs = {};
      picks.forEach(p => { if (p.value && p.value !== "custom") vs[p.value] = (vs[p.value] || 0) + 1; });
      await saveBookValues(bookId, vs);

      await refreshLibrary();

      if (selectedChars.length > 0) {
        const choiceMap = {};
        picks.forEach(p => { if (p.value && p.value !== "custom") choiceMap[p.value] = (choiceMap[p.value] || 0) + 1; });
        const lastPageData = allPages[allPages.length - 1];
        const arcEntry = lastPageData?.storySummary || lastPageData?.title || null;
        for (const sc of selectedChars) { await updateCharacterAfterStory(sc.id, choiceMap, arcEntry); }
        await refreshCharacters();
      }
    }

    setView("report");
  }, [stopSpeak, pages, curPage, curImg, activeChild, theme, picks, t0, sessions, charDesc, backstory, bookId, selectedChars, refreshLibrary, refreshCharacters, setView, setSessions]);

  // ── Values helper ──
  const getVals = useCallback(() => {
    const vs = {};
    picks.forEach(p => { if (p.value && p.value !== "custom") vs[p.value] = (vs[p.value] || 0) + 1; });
    const tot = picks.length || 1;
    return Object.entries(VALS).map(([k, v]) => ({ k, ...v, count: vs[k] || 0, pct: Math.round(((vs[k] || 0) / tot) * 100) })).filter(v => v.count > 0).sort((a, b) => b.count - a.count);
  }, [picks]);

  const value = {
    // Story state
    theme, pages, curPage, curImg, imgLoading, loading, picks, sel, t0, error,
    timer, customInput, setCustomInput, textDone, charDesc, backstory, setBackstory,
    presets, presetsLoading, bookId,
    // TTS
    speaking, ttsEnabled, setTtsEnabled, speakText, stopSpeak,
    // Book ref
    bookRef, allPagesLen,
    // Actions
    generatePresets, startSession, pickChoice, submitCustom, finishSession, getVals,
    fmtT,
    // Setters needed by session view
    setError, setLoading, setCurPage,
  };

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}
