import { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from "react";
import { motion, useMotionValue, useAnimationFrame, useTransform, AnimatePresence } from "motion/react";
import { ReactFlipBook } from "@vuvandinh203/react-flipbook";
import {
  Settings, LogOut, Plus, Check, User, BookOpen, Clock,
  ChevronRight, ChevronLeft, Volume2, VolumeX, Music, Sparkles, Palette,
  Play, ArrowLeft, ArrowRight, Loader2, Globe, PenLine, Wand2,
  BookMarked, Star, Heart, Shield, Swords, TreePine, Rocket,
  GraduationCap, RefreshCw, X, Eye, Lightbulb, TrendingUp,
  TrendingDown, Award, MessageCircle, Send, Image, Mic, MicOff,
  BookImage, Brush, Camera, Pencil, CircleDot, BarChart3, Users, Trash2
} from "lucide-react";

import ST from "./lib/storage.js";
import { TOTAL_PAGES, VALS, ART_STYLES, I18N } from "./lib/constants.js";
import { genPage, genFirstImage, genCharPortrait, genNextImage, genNewCharPortrait } from "./lib/ai.js";
import { supabase } from "./lib/supabase.js";
import {
  ensureUser, getChildren as dbGetChildren, addChild as dbAddChild,
  createBook, savePage, finalizeBook, saveBookValues,
  getAllBooks, getBookWithPages, deleteBook,
  createCharacter, getCharacters, updateCharacterAfterStory, deleteCharacter,
} from "./lib/db.js";
import { uploadIllustration, uploadPortrait } from "./lib/storage-cloud.js";
import BlurText from "./components/reactbits/BlurText.jsx";
import GradientText from "./components/reactbits/GradientText.jsx";
import ShinyText from "./components/reactbits/ShinyText.jsx";

/* ══════════════════════════════════════════════════════════
   СКАЗКА ВМЕСТЕ — Full Redesign v4
   Clean light theme · No emojis · Lucide icons · React Bits
   ══════════════════════════════════════════════════════════ */

// ─── DESIGN TOKENS ───
const T = {
  bg: "#F8F7FC", bgCard: "#FFFFFF", bgHover: "#F3F1FA",
  bgAccent: "#EEEAFC", bgMuted: "#F5F3FB",
  tx: "#1E1B2E", tx2: "#4A4560", tx3: "#8E86A8", txWhite: "#FFFFFF",
  accent: "#6C63FF", accentSoft: "#9B8AFF", accentBg: "#F0EDFF",
  coral: "#FF6B8A", coralBg: "#FFF0F3",
  teal: "#2EC4A0", tealBg: "#E8FBF5",
  amber: "#F5A623", amberBg: "#FFF8EC",
  border: "rgba(30,27,46,0.06)", borderMed: "rgba(30,27,46,0.10)",
  borderFocus: "rgba(108,99,255,0.3)",
  shadowSm: "0 1px 3px rgba(30,27,46,0.04),0 1px 2px rgba(30,27,46,0.02)",
  shadowMd: "0 4px 16px rgba(30,27,46,0.06),0 1px 3px rgba(30,27,46,0.04)",
  shadowLg: "0 8px 32px rgba(108,99,255,0.08),0 2px 8px rgba(30,27,46,0.04)",
  r: 12, r2: 18, r3: 24, rF: 9999,
  display: "'Fraunces', Georgia, serif",
  body: "'Nunito', system-ui, sans-serif",
  story: "'Literata', Georgia, serif",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Nunito:wght@400;500;600;700;800&family=Literata:ital,wght@0,400;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::selection{background:rgba(108,99,255,0.12)}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes kenburns{0%{transform:scale(1) translate(0,0)}50%{transform:scale(1.06) translate(-1%,-1%)}100%{transform:scale(1.03) translate(0.5%,0.5%)}}
.skazka-input{width:100%;padding:13px 16px;border-radius:${T.r2}px;border:1.5px solid ${T.border};background:${T.bgCard};font-family:${T.body};font-size:15px;font-weight:500;color:${T.tx};outline:none;transition:border-color .25s,box-shadow .25s}
.skazka-input::placeholder{color:${T.tx3};font-weight:400}
.skazka-input:focus{border-color:${T.accent};box-shadow:0 0 0 3px ${T.borderFocus}}
.skazka-card{background:${T.bgCard};border-radius:${T.r3}px;border:1px solid ${T.border};box-shadow:${T.shadowSm};padding:24px;transition:box-shadow .3s}
.stf__parent{background:transparent !important}
`;

// ─── SHARED UI ───
function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: T.tx3, fontFamily: T.body, marginBottom: 16 }}>{children}</div>;
}

function PillBtn({ children, onClick, variant = "primary", disabled, style: st }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 28px", borderRadius: T.rF, fontFamily: T.body, fontWeight: 700, fontSize: 15, border: "none", cursor: disabled ? "default" : "pointer", transition: "all .3s cubic-bezier(.22,1,.36,1)", opacity: disabled ? 0.45 : 1, letterSpacing: "0.01em" };
  const v = {
    primary: { background: `linear-gradient(135deg,${T.accent},${T.accentSoft})`, color: "#fff", boxShadow: "0 4px 20px rgba(108,99,255,.2)" },
    coral: { background: `linear-gradient(135deg,${T.coral},#FF8FA3)`, color: "#fff", boxShadow: "0 4px 20px rgba(255,107,138,.2)" },
    ghost: { background: T.accentBg, color: T.accent, border: "1.5px solid rgba(108,99,255,.1)", padding: "10px 20px", fontSize: 13 },
    subtle: { background: "transparent", color: T.tx3, border: `1.5px solid ${T.border}`, padding: "10px 18px", fontSize: 13 },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...v[variant], ...st }} onMouseOver={e => { if (!disabled && variant === "primary") e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseOut={e => { e.currentTarget.style.transform = ""; }}>{children}</button>;
}

function Avatar({ name, size = 36, gradient }) {
  const letter = (name || "?")[0].toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: size * 0.35, background: gradient || `linear-gradient(135deg,${T.accent},${T.accentSoft})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: T.body, fontWeight: 800, fontSize: size * 0.4, flexShrink: 0 }}>{letter}</div>;
}

function IconCircle({ icon: Icon, size = 44, bg, color }) {
  return <div style={{ width: size, height: size, borderRadius: size * 0.32, background: bg || T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={size * 0.45} color={color || T.accent} strokeWidth={2} /></div>;
}

function AnimIn({ children, delay = 0, y = 16, style: st }) {
  return <motion.div initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} style={st}>{children}</motion.div>;
}

function ValueIcon({ valKey, size = 16 }) {
  const isPos = VALS[valKey]?.pos !== false;
  return isPos ? <TrendingUp size={size} color={T.teal} /> : <TrendingDown size={size} color={T.coral} />;
}

// ─── PROGRESS DOTS ───
function ProgressBar({ current, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i + 1 === current ? 24 : 8, height: 6, borderRadius: 6,
          background: i + 1 < current ? T.teal : i + 1 === current ? `linear-gradient(90deg,${T.accent},${T.accentSoft})` : T.border,
          transition: "all .5s cubic-bezier(.22,1,.36,1)",
        }} />
      ))}
      <span style={{ fontSize: 11, color: T.tx3, marginLeft: 4, fontFamily: T.body, fontWeight: 700 }}>{current}/{total}</span>
    </div>
  );
}

// ─── ANIMATED BAR ───
function AnimBar({ color, pct, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const tm = setTimeout(() => setW(pct), 200 + delay); return () => clearTimeout(tm); }, [pct, delay]);
  return <div style={{ height: 8, borderRadius: 8, background: T.border, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 8, width: `${w}%`, background: color, transition: "width 1.2s cubic-bezier(.22,1,.36,1)" }} /></div>;
}

// ─── BOOK PAGE (forwardRef for react-flipbook) ───
const BookPage = forwardRef(({ page, pageNum, isCurrent, isBlurred, curImg, imgLoading, lang }, ref) => {
  const BOOK_FONT = "'Literata', Georgia, serif";
  const LAYOUTS = ["img-top", "text-img-text", "img-big", "text-top", "img-top", "img-big"];
  const layout = LAYOUTS[(pageNum - 1) % LAYOUTS.length];
  const side = pageNum % 2 === 1 ? "left" : "right";
  const imgUrl = isCurrent ? (curImg || page?.imgUrl) : page?.imgUrl;
  const isImgLoading = isCurrent && imgLoading && !imgUrl;

  const splitText = (text) => {
    if (!text) return ["", ""];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length < 2) return [text, ""];
    const mid = Math.ceil(sentences.length / 2);
    return [sentences.slice(0, mid).join("").trim(), sentences.slice(mid).join("").trim()];
  };

  const autoFontSize = (text) => {
    if (!text) return 13;
    const len = text.length;
    if (len < 80) return 16;
    if (len < 140) return 14;
    if (len < 200) return 13;
    if (len < 280) return 12;
    return 11;
  };

  const ImgBlock = ({ big }) => (
    <div style={{
      width: "100%", margin: "0 auto", height: big ? 180 : 155,
      position: "relative", flexShrink: 0, overflow: "visible",
    }}>
      {isImgLoading ? (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
          <Loader2 size={14} color={T.tx3} style={{ animation: "spin .8s linear infinite" }} />
        </div>
      ) : imgUrl ? (
        <img src={imgUrl} alt="" style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          borderRadius: 6,
        }} loading="lazy"/>
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.15 }}>
          <Image size={14} color={T.tx3} />
        </div>
      )}
    </div>
  );

  const TextBlock = ({ text }) => (
    <div style={{ overflow: "hidden", padding: "2px 6px", flex: "1 1 auto", minHeight: 20 }}>
      <p style={{ fontSize: autoFontSize(text), lineHeight: 1.45, color: T.tx, fontFamily: BOOK_FONT, fontWeight: 400, margin: 0, textIndent: "0.8em" }}>{text}</p>
    </div>
  );

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", background: "#fff", position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
      {side === "left" && <div style={{ position: "absolute", top: 0, right: 0, width: 15, height: "100%", background: "linear-gradient(to left, rgba(0,0,0,0.03), transparent)", pointerEvents: "none", zIndex: 2 }}/>}
      {side === "right" && <div style={{ position: "absolute", top: 0, left: 0, width: 15, height: "100%", background: "linear-gradient(to right, rgba(0,0,0,0.04), transparent)", pointerEvents: "none", zIndex: 2 }}/>}
      {page ? (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 1, padding: "8px 10px 4px", gap: 3, overflow: "hidden", boxSizing: "border-box" }}>
          <div style={{ textAlign: "center", marginBottom: 1 }}><span style={{ fontSize: 11, color: T.tx3, fontWeight: 500, fontFamily: BOOK_FONT, fontStyle: "italic" }}>{page.title || ''}</span></div>
          {layout === "img-top" && <><ImgBlock/><TextBlock text={page.text}/></>}
          {layout === "text-top" && <><TextBlock text={page.text}/><ImgBlock/></>}
          {layout === "img-big" && <><ImgBlock big/><TextBlock text={page.text}/></>}
          {layout === "text-img-text" && (() => { const [t1, t2] = splitText(page.text); return <><TextBlock text={t1}/><ImgBlock/><TextBlock text={t2}/></>; })()}
          <div style={{ textAlign: side === "left" ? "left" : "right", fontSize: 9, color: T.tx3, padding: "0 8px", fontFamily: BOOK_FONT }}>{pageNum}</div>
        </div>
      ) : isBlurred ? (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", opacity: .3 }}><BookOpen size={28} style={{ opacity: .4, marginBottom: 8, color: T.tx3 }}/><div style={{ fontSize: 11, color: T.tx3, fontFamily: BOOK_FONT, fontStyle: "italic" }}>{lang === "ru" ? "Следующая страница..." : "Next page..."}</div></div>
        </div>
      ) : (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BookOpen size={22} color={T.tx3} style={{ opacity: .15 }}/>
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("loading");
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("ru");
  const [artStyle, setArtStyle] = useState("book");
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [newChild, setNewChild] = useState("");
  const [newAge, setNewAge] = useState("5");
  const [geminiKey, setGeminiKey] = useState("");
  const [antKey, setAntKey] = useState("");
  const [elKey, setElKey] = useState("");
  
  // Story state
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
  const [identityTag, setIdentityTag] = useState(null);       // Phase 1: frozen 4-marker identity
  const [companionDesc, setCompanionDesc] = useState(null);    // Phase 1: secondary character text-only
  const [refImgUrl, setRefImgUrl] = useState(null);
  const [portraitUrls, setPortraitUrls] = useState([]); // array of all character portraits
  const [portraitRegenDone, setPortraitRegenDone] = useState(false);            // main portrait URL (NEVER overwritten after set)
  const [backstory, setBackstory] = useState("");
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  
  // Supabase state
  const [dbUser, setDbUser] = useState(null);
  const [bookId, setBookId] = useState(null);      // current session's book ID in Supabase
  const [library, setLibrary] = useState([]);       // saved books for library view
  const [readingBook, setReadingBook] = useState(null); // book being read from library
  const [characters, setCharacters] = useState([]); // saved characters for reuse (SKZ-5)
  const [selectedChar, setSelectedChar] = useState(null); // character picked for new story
  
  // TTS state
  const [speaking, setSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsVoice, setTtsVoice] = useState(null);
  const audioRef = useRef(null);
  const [elVoiceId, setElVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
  const [elVoiceName, setElVoiceName] = useState("Sarah");
  const ttsCacheRef = useRef(new Map());
  
  // SFX
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const sfxRef = useRef(null);
  const sfxCacheRef = useRef(new Map());
  
  // Book
  const bookRef = useRef(null);
  const prevPageCountRef = useRef(0);
  const pendingCharRef = useRef(null); // tracks newly created character for portrait upload

  const L = I18N[lang] || I18N.ru;
  const fmtT = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  // ── Init ──
  useEffect(() => { (async () => {
    const u = await ST.get("user");
    const rt = await ST.get("geminiKey");
    const ak = await ST.get("antKey");
    const ek = await ST.get("elKey");
    const sl = await ST.get("lang");
    const ss = await ST.get("artStyle");
    if (rt) setGeminiKey(rt);
    if (ak) setAntKey(ak);
    if (ek) setElKey(ek);
    if (sl) setLang(sl);
    if (ss) setArtStyle(ss);
    if (u) {
      setUser(u);
      setSessions(await ST.get("sessions") || []);
      setChildren(await ST.get("children") || []);
      setView("dashboard");
      // Sync with Supabase
      if (supabase) {
        const dbU = await ensureUser(u.email, u.name);
        if (dbU) {
          setDbUser(dbU);
          const kids = await dbGetChildren(dbU.id);
          if (kids.length > 0) setChildren(kids);
          const books = await getAllBooks(dbU.id);
          setLibrary(books);
        }
      }
    }
    else setView("auth");
  })(); }, []);

  // ── Timer ──
  useEffect(() => { if (view === "session" && t0) { timerRef.current = setInterval(() => setTimer(Math.floor((Date.now()-t0)/1000)), 1000); return () => clearInterval(timerRef.current); } }, [view, t0]);

  // ── Load characters when child selected (SKZ-5) ──
  useEffect(() => {
    if (activeChild?.id && supabase) {
      getCharacters(activeChild.id).then(chars => setCharacters(chars || []));
    } else {
      setCharacters([]);
    }
    setSelectedChar(null);
  }, [activeChild?.id]);

  // ── TTS voice ──
  useEffect(() => {
    const pick = () => { const voices = window.speechSynthesis?.getVoices() || []; const ru = voices.filter(v => v.lang.startsWith("ru")); const best = ru.find(v => /milena|alena|yandex/i.test(v.name)) || ru[0]; if (best) setTtsVoice(best); };
    pick(); window.speechSynthesis?.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", pick);
  }, []);

  // ── Text done trigger ──
  useEffect(() => { if (!curPage?.text) return; const d = setTimeout(() => setTextDone(true), 1500); return () => clearTimeout(d); }, [curPage?.text]);

  // ── Auto-speak ──
  const speakText = useCallback(async (text) => {
    if (!text) return;
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (elKey) {
      setSpeaking(true);
      try {
        const cacheKey = elVoiceId + ":" + text;
        let url = ttsCacheRef.current.get(cacheKey);
        if (!url) {
          const res = await fetch(`/api/elevenlabs/v1/text-to-speech/${elVoiceId}`, {
            method: "POST", headers: { "xi-api-key": elKey, "Content-Type": "application/json" },
            body: JSON.stringify({ text, model_id: "eleven_flash_v2_5", voice_settings: { stability: 0.55, similarity_boost: 0.7, style: 0.3 } })
          });
          if (!res.ok) throw new Error(res.status);
          const blob = await res.blob(); url = URL.createObjectURL(blob);
          ttsCacheRef.current.set(cacheKey, url);
        }
        const audio = new Audio(url); audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        audio.play();
      } catch { setSpeaking(false); }
      return;
    }
    if (!window.speechSynthesis) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ru-RU"; utt.rate = 0.88; utt.pitch = 1.05;
    if (ttsVoice) utt.voice = ttsVoice;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [ttsVoice, elKey, elVoiceId]);

  const stopSpeak = useCallback(() => { window.speechSynthesis?.cancel(); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setSpeaking(false); }, []);
  useEffect(() => { if (textDone && ttsEnabled && curPage?.text) speakText(curPage.tts_text || curPage.text); }, [textDone, ttsEnabled]);
  useEffect(() => { stopSpeak(); }, [curPage]);

  // ── Illustration generation (NB2 — Nano Banana 2 via Gemini API) ──
  // Style reference images hosted in public/style-refs/
  const ORIGIN = window.location.origin;
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

  useEffect(() => {
    if (!curPage?.scene && !curPage?.illustration) return;
    setCurImg(null);
    if (!geminiKey) return;
    setImgLoading(true);
    const mood = curPage.mood || "forest";
    const isFirst = portraitUrls.length === 0 && !refImgUrl;
    const styleRefUrl = getStyleRef(mood);

    const imgOpts = { styleRefUrl };

    if (isFirst) {
      (async () => {
        try {
          // Parse multi-character descriptions separated by " | "
          const charParts = charDesc ? charDesc.split(/\s*\|\s*/).filter(Boolean) : [];
          const generatedPortraits = [];

          if (charParts.length > 0) {
            // Generate individual portrait for each character
            for (const partDesc of charParts) {
              const portrait = await genCharPortrait(geminiKey, partDesc, curPage.scene, artStyle, imgOpts);
              if (portrait) generatedPortraits.push(portrait);
            }
          }

          if (generatedPortraits.length > 0) {
            // Set first portrait as refImgUrl (legacy compat) and all as portraitUrls
            setRefImgUrl(generatedPortraits[0]);
            setPortraitUrls(generatedPortraits);

            // Generate scene with ALL portraits
            const sceneUrl = await genNextImage(geminiKey, curPage.scene, charDesc || "the main character", generatedPortraits, mood, artStyle, imgOpts);
            setCurImg(sceneUrl);
          } else {
            const sceneUrl = await genFirstImage(geminiKey, curPage.scene, charDesc || "a friendly character", mood, artStyle, imgOpts);
            setCurImg(sceneUrl);
            if (sceneUrl) {
              setRefImgUrl(sceneUrl);
              setPortraitUrls([sceneUrl]);
            }
          }
          setImgLoading(false);
        } catch { setImgLoading(false); }
      })();
    } else {
      (async () => {
        try {
          // Pass full portraitUrls array (falls back to refImgUrl for single-char compat)
          const refs = portraitUrls.length > 0 ? portraitUrls : refImgUrl;
          const url = await genNextImage(geminiKey, curPage.scene, charDesc || "the main character", refs, mood, artStyle, imgOpts);
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
      if (last && !last.imgUrl) setPages(p => { const u = [...p]; u[u.length-1] = { ...u[u.length-1], imgUrl: curImg }; return u; });
    }
  }, [curImg, curPage, pages.length]);

  // ── Retroactive portrait upload to character record ──
  // Handles race condition: createCharacter resolves after portrait already generated
  useEffect(() => {
    const char = pendingCharRef.current || selectedChar;
    if (!char?.id || !supabase || portraitUrls.length === 0) return;
    if (char.portrait_url) return; // already has portrait
    const portrait = portraitUrls[0];
    if (!portrait) return;
    pendingCharRef.current = null;
    (async () => {
      const permUrl = await uploadPortrait(portrait, activeChild?.id || "unknown", char.id);
      if (permUrl) {
        supabase.from("characters").update({ portrait_url: permUrl }).eq("id", char.id);
        // Update local state so gallery shows portrait immediately
        setSelectedChar(prev => prev?.id === char.id ? { ...prev, portrait_url: permUrl } : prev);
        setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, portrait_url: permUrl } : c));
      }
    })();
  }, [selectedChar, portraitUrls]);

  // ── Auto-flip book to latest spread ──
  const allPagesLen = curPage ? pages.length + 1 : pages.length;
  useEffect(() => {
    if (view !== "session") return;
    if (allPagesLen > prevPageCountRef.current && allPagesLen > 1 && bookRef.current) {
      const target = allPagesLen - 1;
      const spreadPage = target % 2 === 0 ? target : target - 1;
      setTimeout(() => { try { bookRef.current?.flip(spreadPage); } catch {} }, 300);
    }
    prevPageCountRef.current = allPagesLen;
  }, [allPagesLen, view]);

  // ── Save helpers ──
  const saveGeminiKey = async v => { setGeminiKey(v); await ST.set("geminiKey", v); };
  const saveAntKey = async v => { setAntKey(v); await ST.set("antKey", v); };
  const saveElKey = async v => { setElKey(v); await ST.set("elKey", v); };
  const toggleLang = async () => { const n = lang === "ru" ? "en" : "ru"; setLang(n); await ST.set("lang", n); };
  const register = async () => {
    if (!authName.trim() || !authEmail.trim()) return;
    const u = { name: authName.trim(), email: authEmail.trim() };
    await ST.set("user", u); setUser(u);
    if (supabase) {
      const dbU = await ensureUser(u.email, u.name);
      if (dbU) { setDbUser(dbU); }
    }
    setView("dashboard");
  };
  const addChildFn = async () => {
    if (!newChild.trim()) return;
    let ch;
    if (supabase && dbUser) {
      ch = await dbAddChild(dbUser.id, newChild.trim(), parseInt(newAge));
    }
    if (!ch) ch = { id: Date.now().toString(), name: newChild.trim(), age: newAge };
    const upd = [...children, ch];
    setChildren(upd); await ST.set("children", upd);
    setNewChild(""); setShowAdd(false);
  };

  // ── Generate presets ──
  const generatePresets = async (childName, childAge, character) => {
    if (!antKey) return;
    setPresetsLoading(true);
    const charCtx = character
      ? (lang === "en"
        ? ` The main character is: ${character.name} (${character.description}). All premises must feature THIS character in new adventures.`
        : ` Главный герой: ${character.name} (${character.description}). Все завязки должны быть про ЭТОГО персонажа в новых приключениях.`)
      : "";
    const prompt = lang === "en"
      ? `Create 6 short story premises for illustrated children's storybooks (reader age ${childAge}).${charCtx}${!character ? " Each premise describes a FICTIONAL CHARACTER (not the reader) in an interesting situation." : ""} Mix: 2 realistic adventures, 2 fantasy quests, 2 unusual/funny scenarios. Each 1 sentence, 10-18 words. Do NOT use the child's name. Example: "A tiny dragon who is afraid of fire tries to pass the dragon school exam". Respond ONLY JSON: [{"text":"..."}]`
      : `Придумай 6 коротких завязок для иллюстрированных детских сказок (возраст читателя ${childAge} лет).${charCtx}${!character ? " Каждая завязка описывает ВЫМЫШЛЕННОГО ПЕРСОНАЖА (не ребёнка-читателя) в интересной ситуации." : ""} Микс: 2 реалистичных приключения, 2 фэнтези, 2 необычных/смешных. Каждая — 1 предложение, 10-18 слов. НЕ используй имя ребёнка. Пример: "Маленький дракон, который боится огня, пытается сдать экзамен в школе драконов". Ответь ТОЛЬКО JSON: [{"text":"..."}]`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": antKey, "content-type": "application/json", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, messages: [{ role: "user", content: prompt }] })
      });
      const data = await r.json();
      const txt = data?.content?.[0]?.text || "";
      const arr = JSON.parse(txt.replace(/```json|```/g, "").trim());
      if (Array.isArray(arr) && arr.length > 0) setPresets(arr);
    } catch (e) { console.error("Presets error:", e); }
    setPresetsLoading(false);
  };

  // ── Start session ──
  const startSession = async (child, premise) => {
    const storyTheme = { id: "custom", name: (premise || "").slice(0, 30) + (premise?.length > 30 ? "…" : ""), prompt: premise || "surprise creative story" };
    setActiveChild(child); setTheme(storyTheme); setPages([]); setCurPage(null); setCurImg(null);
    setPicks([]); setSel(null); setT0(Date.now()); setTimer(0); setError(null); setTextDone(false);
    setCustomInput(""); setIdentityTag(null); setCompanionDesc(null); setPortraitRegenDone(false);
    pendingCharRef.current = null;
    ttsCacheRef.current.forEach(url => URL.revokeObjectURL(url)); ttsCacheRef.current.clear();
    sfxCacheRef.current.forEach(url => URL.revokeObjectURL(url)); sfxCacheRef.current.clear();

    // SKZ-5: If reusing a saved character, restore charDesc + portrait
    const reuse = selectedChar;
    if (reuse) {
      setCharDesc(reuse.description);
      setRefImgUrl(reuse.portrait_url);
      setPortraitUrls(reuse.portrait_url ? [reuse.portrait_url] : []);
    } else {
      setCharDesc(null);
      setRefImgUrl(null);
      setPortraitUrls([]);
    }

    setView("session"); setLoading(true);

    // Create book in Supabase
    if (supabase) {
      const book = await createBook({
        childId: child.id,
        characterId: reuse?.id || null,
        premise: premise || "surprise creative story",
        artStyle,
        lang,
      });
      if (book) setBookId(book.id);
    }

    if (!antKey) { setError(lang === "ru" ? "Нужен Anthropic API ключ! Откройте настройки." : "Need Anthropic API key! Open settings."); setLoading(false); return; }
    try {
      const r = await genPage({
        name: child.name, age: child.age,
        theme: premise || "surprise creative story",
        history: [], choice: null,
        charDesc: reuse?.description || null,
        backstory: premise || "", lang, identityTag: null,
      }, antKey);

      if (r.characterDesc && !reuse) setCharDesc(r.characterDesc);
      if (r.identityTag) setIdentityTag(r.identityTag);

      // SKZ-5: Save new character to Supabase (async, don't block)
      if (r.characterDesc && !reuse && supabase && child.id) {
        const charName = r.title || (premise || "Hero").slice(0, 30);
        createCharacter({
          childId: child.id,
          name: charName,
          description: r.characterDesc,
          portraitUrl: null, // portrait uploaded retroactively via pendingCharRef
          artStyle,
        }).then(c => {
          if (c) {
            setSelectedChar(c);
            pendingCharRef.current = c;
          }
        });
      }

      setCurPage(r); setLoading(false);
    } catch { setError(lang === "ru" ? "Ошибка. Попробуйте ещё." : "Error. Try again."); setLoading(false); }
  };

  // ── Pick choice ──
  const pickChoice = async (ch) => {
    if (loading || sel) return;
    setSel(ch.label); setTextDone(false); setCustomInput("");
    setPicks(p => [...p, { label: ch.label, value: ch.value || "custom", page: pages.length + 1 }]);
    setTimeout(async () => {
      const pageData = { ...curPage, imgUrl: curImg, choice: ch, illustration: curPage.illustration };
      const up = [...pages, pageData];
      setPages(up); setCurPage(null); setCurImg(null); setSel(null); setLoading(true);

      // Save page to Supabase (async, don't block UI)
      if (supabase && bookId) {
        (async () => {
          let permanentImgUrl = pageData.imgUrl;
          if (permanentImgUrl) {
            permanentImgUrl = await uploadIllustration(permanentImgUrl, bookId, up.length);
          }
          await savePage(bookId, {
            pageNumber: up.length,
            title: pageData.title,
            text: pageData.text,
            ttsText: pageData.tts_text,
            scene: pageData.scene,
            sceneSummary: pageData.sceneSummary,
            actionSummary: pageData.actionSummary,
            mood: pageData.mood,
            imageUrl: permanentImgUrl,
            sfx: pageData.sfx,
            choiceLabel: ch.label,
            choiceValue: ch.value || "custom",
            isEnd: false,
          });
        })();
      }

      try {
        const r = await genPage({
          name: activeChild.name, age: activeChild.age, theme: theme.prompt,
          history: up.map(p => ({ text: p.text, choice: p.choice, mood: p.mood, sceneSummary: p.sceneSummary, actionSummary: p.actionSummary, illustration: p.illustration })),
          choice: ch, charDesc, lang, identityTag,
          // Phase 2: pass previous illustration for quality check
          prevIllustrationUrl: curImg || null,
          prevScene: curPage?.scene || null,
        }, antKey);
        if (r.newMainCharacter && geminiKey) {
          // Update charDesc immediately so scene prompt includes new character
          const updDesc = charDesc + ". Also present: " + r.newMainCharacter;
          setCharDesc(updDesc);

          // Generate portrait in background — don't block page display
          const styleRefUrl = getStyleRef(curPage?.mood || "forest");
          (async () => {
            const newPortrait = await genNewCharPortrait(geminiKey, r.newMainCharacter, artStyle, { styleRefUrl });
            if (newPortrait) {
              // Add to portraitUrls so future scenes include this character
              setPortraitUrls(prev => [...prev, newPortrait]);

              // Save to library
              if (supabase && activeChild?.id) {
                const charName = r.newMainCharacter.split(",")[0].slice(0, 30);
                const tempId = Date.now().toString();
                const permPortraitUrl = await uploadPortrait(newPortrait, activeChild.id, tempId);
                createCharacter({
                  childId: activeChild.id,
                  name: charName,
                  description: r.newMainCharacter,
                  portraitUrl: permPortraitUrl,
                  artStyle,
                });
              }
            }
          })();
        }
        setCurPage(r); setLoading(false);
      } catch { setError(lang === "ru" ? "Ошибка." : "Error."); setLoading(false); }
    }, 600);
  };

  const submitCustom = () => { if (!customInput.trim() || loading || sel) return; pickChoice({ label: customInput.trim(), value: "custom" }); };

  // ── Finish session ──
  const finishSession = async () => {
    stopSpeak();
    clearInterval(timerRef.current);
    const allPages = [...pages, { ...curPage, imgUrl: curImg }];
    const s = { id: Date.now().toString(), child: activeChild, theme, pages: allPages, picks, duration: Math.floor((Date.now() - t0) / 1000), date: Date.now(), charDesc, backstory };
    const upd = [s, ...sessions]; setSessions(upd); await ST.set("sessions", upd);

    // Finalize in Supabase
    if (supabase && bookId) {
      // Save last page (the ending page)
      const lastPage = allPages[allPages.length - 1];
      if (lastPage) {
        let permanentImgUrl = lastPage.imgUrl;
        if (permanentImgUrl) {
          permanentImgUrl = await uploadIllustration(permanentImgUrl, bookId, allPages.length);
        }
        await savePage(bookId, {
          pageNumber: allPages.length,
          title: lastPage.title,
          text: lastPage.text,
          ttsText: lastPage.tts_text,
          scene: lastPage.scene,
          sceneSummary: lastPage.sceneSummary,
          actionSummary: lastPage.actionSummary,
          mood: lastPage.mood,
          imageUrl: permanentImgUrl,
          sfx: lastPage.sfx,
          choiceLabel: null,
          choiceValue: null,
          isEnd: lastPage.isEnd || true,
        });
      }

      // Compute ending type
      const posVals = ["generosity","empathy","courage","curiosity","kindness","honesty","patience","teamwork"];
      const negVals = ["selfishness","cowardice","cruelty","greed","laziness","dishonesty","aggression","indifference"];
      const posCount = picks.filter(p => posVals.includes(p.value)).length;
      const negCount = picks.filter(p => negVals.includes(p.value)).length;
      const endingType = negCount > posCount ? "sad" : negCount === posCount && negCount > 0 ? "mixed" : "good";

      await finalizeBook(bookId, {
        title: theme?.name || allPages[0]?.title || "Story",
        endingType,
        durationSeconds: Math.floor((Date.now() - t0) / 1000),
        pageCount: allPages.length,
      });

      // Save values
      const vs = {};
      picks.forEach(p => { if (p.value && p.value !== "custom") vs[p.value] = (vs[p.value] || 0) + 1; });
      await saveBookValues(bookId, vs);

      // Refresh library
      if (dbUser) {
        const books = await getAllBooks(dbUser.id);
        setLibrary(books);
      }

      // SKZ-5: Update character stats after story
      if (selectedChar?.id) {
        const choiceMap = {};
        picks.forEach(p => { if (p.value && p.value !== "custom") choiceMap[p.value] = (choiceMap[p.value] || 0) + 1; });
        await updateCharacterAfterStory(selectedChar.id, choiceMap);
        // Refresh characters list
        if (activeChild?.id) {
          const chars = await getCharacters(activeChild.id);
          setCharacters(chars || []);
        }
      }
    }

    setView("report");
  };

  const getVals = () => {
    const vs = {}; picks.forEach(p => { if (p.value && p.value !== "custom") vs[p.value] = (vs[p.value] || 0) + 1; });
    const tot = picks.length || 1;
    return Object.entries(VALS).map(([k, v]) => ({ k, ...v, count: vs[k] || 0, pct: Math.round(((vs[k] || 0) / tot) * 100) })).filter(v => v.count > 0).sort((a, b) => b.count - a.count);
  };

  // ═══════════════════════════════════
  // SETTINGS PANEL
  // ═══════════════════════════════════
  const SettingsPanel = () => (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(30,27,46,0.3)", backdropFilter: "blur(6px)" }} onClick={() => setShowSettings(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: T.bgCard, borderRadius: T.r3, padding: "32px 28px", maxWidth: 420, width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: T.shadowLg }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.tx }}>{L.settings}</h3>
          <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} color={T.tx3} /></button>
        </div>

        {[
          { label: "Anthropic API Key", value: antKey, set: saveAntKey, placeholder: "sk-ant-...", hint: "console.anthropic.com", url: "https://console.anthropic.com/settings/keys" },
          { label: "Gemini API Key", value: geminiKey, set: saveGeminiKey, placeholder: "AIza...", hint: "aistudio.google.com", url: "https://aistudio.google.com/apikey" },
          { label: "ElevenLabs API Key", value: elKey, set: saveElKey, placeholder: "sk_...", hint: "elevenlabs.io", url: "https://elevenlabs.io/app/settings/api-keys" },
        ].map(({ label, value, set, placeholder, hint, url }) => (
          <div key={label} style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.tx2, marginBottom: 6, display: "block" }}>{label}</label>
            <input
              className="skazka-input"
              value={value}
              onChange={e => set(e.target.value.trim())}
              placeholder={placeholder}
              type="password"
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <p style={{ fontSize: 11, color: T.tx3, marginTop: 4 }}>
              <a href={url} target="_blank" rel="noopener" style={{ color: T.accent }}>{hint}</a>
            </p>
          </div>
        ))}

        {/* Status indicators */}
        <div style={{ padding: 16, borderRadius: T.r2, background: T.bgMuted, marginBottom: 20 }}>
          {[
            { ok: !!antKey, on: "Sonnet connected", off: "Need Anthropic key" },
            { ok: !!geminiKey, on: "Nano Banana 2 connected", off: "Need Gemini key for illustrations" },
            { ok: !!elKey, on: `ElevenLabs — ${elVoiceName}`, off: "Using browser voice (free)" },
          ].map(({ ok, on, off }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ok ? T.teal : T.coral, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: ok ? T.teal : T.tx3 }}>{ok ? on : off}</span>
            </div>
          ))}
        </div>

        <PillBtn onClick={() => setShowSettings(false)} style={{ width: "100%" }}>{L.done}</PillBtn>
      </motion.div>
    </div>
  );

  // ═══════════════════════════════════
  // LIBRARY — Read a saved book (SKZ-9)
  // ═══════════════════════════════════
  if (view === "reading" && readingBook) {
    const rb = readingBook;
    const rbPages = rb.pages || [];
    const rbVals = (rb.values || []).map(v => {
      const vi = VALS[v.value_key] || {};
      const total = rb.values.reduce((s, x) => s + x.count, 0) || 1;
      return { k: v.value_key, ...vi, count: v.count, pct: Math.round((v.count / total) * 100) };
    }).sort((a, b) => b.count - a.count);

    const endColors = { good: T.teal, mixed: T.amber, sad: T.coral };
    const endBgs = { good: T.tealBg, mixed: T.amberBg, sad: T.coralBg };

    return (
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "28px 20px" }}>
          {/* Header */}
          <AnimIn>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <PillBtn variant="subtle" onClick={() => { setReadingBook(null); setView("library"); }} style={{ padding: "8px 16px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
              <span style={{ fontFamily: T.display, fontSize: 16, fontWeight: 600, color: T.tx, flex: 1 }}>{rb.title}</span>
              {rb.ending_type && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 12, background: endBgs[rb.ending_type], color: endColors[rb.ending_type], fontSize: 11, fontWeight: 700 }}>
                  {rb.ending_type === "good" ? <Star size={12} /> : rb.ending_type === "mixed" ? <CircleDot size={12} /> : <Heart size={12} />}
                  {L.ending[rb.ending_type]}
                </span>
              )}
            </div>
          </AnimIn>

          {/* Book info */}
          <AnimIn delay={0.05}>
            <div className="skazka-card" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
              {rb.cover_image_url && (
                <div style={{ width: 80, height: 80, borderRadius: T.r2, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}` }}>
                  <img src={rb.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginBottom: 4 }}>{rb.child?.name}, {rb.child?.age} {L.years}</div>
                {rb.premise && <p style={{ fontSize: 12, color: T.tx3, lineHeight: 1.5 }}>{rb.premise}</p>}
                <div style={{ fontSize: 11, color: T.tx3, marginTop: 4 }}>
                  {rbPages.length} {L.pages} · {rb.duration_seconds ? Math.ceil(rb.duration_seconds / 60) : "?"} {L.min} · {new Date(rb.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </AnimIn>

          {/* Pages */}
          {rbPages.map((pg, i) => (
            <AnimIn key={pg.id} delay={0.08 + i * 0.04}>
              <div className="skazka-card" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.accent, flexShrink: 0 }}>{i + 1}</div>
                  {pg.title && <span style={{ fontFamily: T.display, fontSize: 13, fontWeight: 600, color: T.accent, fontStyle: "italic" }}>{pg.title}</span>}
                </div>
                {pg.image_url && (
                  <div style={{ marginBottom: 10, borderRadius: T.r2, overflow: "hidden", border: `1px solid ${T.border}`, maxHeight: 220 }}>
                    <img src={pg.image_url} alt="" style={{ width: "100%", display: "block", objectFit: "cover" }} loading="lazy" />
                  </div>
                )}
                <p style={{ fontFamily: T.story, fontSize: 15, fontStyle: "italic", lineHeight: 1.8, color: T.tx2 }}>{pg.text}</p>
                {pg.choice_label && (() => {
                  const isPos = VALS[pg.choice_value]?.pos !== false;
                  return (
                    <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 10, background: isPos ? T.tealBg : T.coralBg, fontSize: 12, color: isPos ? T.teal : T.coral, fontWeight: 600 }}>
                      {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {pg.choice_label}
                    </div>
                  );
                })()}
              </div>
            </AnimIn>
          ))}

          {/* Values summary */}
          {rbVals.length > 0 && (
            <AnimIn delay={0.15}>
              <div className="skazka-card" style={{ marginBottom: 16 }}>
                <SectionLabel>{L.choicesOf} {rb.child?.name}</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {rbVals.map((v, i) => {
                    const isPos = VALS[v.k]?.pos;
                    return (
                      <div key={v.k}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isPos ? <TrendingUp size={13} color={T.teal} /> : <TrendingDown size={13} color={T.coral} />}
                            <span style={{ fontWeight: 700, fontSize: 13, color: T.tx }}>{lang === "ru" ? v.n : (v.nEn || v.k)}</span>
                          </div>
                          <span style={{ fontWeight: 800, fontSize: 13, color: v.c }}>{v.pct}%</span>
                        </div>
                        <AnimBar color={`linear-gradient(90deg,${v.c},${v.c}88)`} pct={v.pct} delay={i * 100} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimIn>
          )}

          {/* Actions */}
          <AnimIn delay={0.2}>
            <div style={{ display: "flex", gap: 10 }}>
              <PillBtn variant="ghost" onClick={() => { setReadingBook(null); setView("library"); }} style={{ flex: 1 }}><ArrowLeft size={14} />{lang === "ru" ? "Библиотека" : "Library"}</PillBtn>
              <PillBtn variant="coral" onClick={() => setView("dashboard")} style={{ flex: 1 }}><Sparkles size={16} />{L.newSessionBtn}</PillBtn>
            </div>
          </AnimIn>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════
  // CHARACTER GALLERY — Browse all saved characters
  // ═══════════════════════════════════
  if (view === "characters") return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
        <AnimIn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <PillBtn variant="subtle" onClick={() => setView("dashboard")} style={{ padding: "8px 16px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
            <h2 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.tx }}>{lang === "ru" ? "Персонажи" : "Characters"}</h2>
            <div style={{ width: 80 }} />
          </div>
        </AnimIn>

        {characters.length === 0 ? (
          <AnimIn delay={0.1}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Users size={48} color={T.tx3} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 15, color: T.tx3, marginBottom: 4 }}>{lang === "ru" ? "Пока нет персонажей" : "No characters yet"}</p>
              <p style={{ fontSize: 12, color: T.tx3 }}>{lang === "ru" ? "Персонажи появятся после первой истории" : "Characters appear after your first story"}</p>
            </div>
          </AnimIn>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {characters.map((c, i) => (
              <AnimIn key={c.id} delay={0.05 + i * 0.03}>
                <div
                  className="skazka-card"
                  style={{ padding: 0, overflow: "hidden" }}
                >
                  {/* Portrait */}
                  <div style={{ display: "flex", gap: 0 }}>
                    <div style={{ width: 120, minHeight: 140, background: T.bgMuted, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      {c.portrait_url ? (
                        <img src={c.portrait_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Avatar name={c.name} size={56} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}>
                      <div>
                        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17, color: T.tx, marginBottom: 6, lineHeight: 1.2 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: T.tx2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {c.description}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.tx3 }}>
                            <BookOpen size={12} />
                            <span>{c.stories_count || 0} {lang === "ru" ? "историй" : "stories"}</span>
                          </div>
                          {c.art_style && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.tx3 }}>
                              <Palette size={12} />
                              <span>{c.art_style}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => {
                              setSelectedChar(c);
                              setView("dashboard");
                            }}
                            style={{ padding: "6px 12px", borderRadius: T.rF, background: T.accentBg, color: T.accent, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: T.body, display: "flex", alignItems: "center", gap: 4, transition: "all .2s" }}
                            onMouseOver={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = "#fff"; }}
                            onMouseOut={e => { e.currentTarget.style.background = T.accentBg; e.currentTarget.style.color = T.accent; }}
                          >
                            <Play size={10} />{lang === "ru" ? "Играть" : "Play"}
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(lang === "ru" ? `Удалить "${c.name}"?` : `Delete "${c.name}"?`)) {
                                await deleteCharacter(c.id);
                                setCharacters(prev => prev.filter(ch => ch.id !== c.id));
                                if (selectedChar?.id === c.id) setSelectedChar(null);
                              }
                            }}
                            style={{ padding: "6px 8px", borderRadius: T.rF, background: "transparent", color: T.tx3, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", transition: "all .2s" }}
                            onMouseOver={e => { e.currentTarget.style.background = T.coralBg; e.currentTarget.style.color = T.coral; e.currentTarget.style.borderColor = T.coral; }}
                            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.tx3; e.currentTarget.style.borderColor = T.border; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════
  // LIBRARY — Grid of saved books (SKZ-9)
  // ═══════════════════════════════════
  if (view === "library") return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
        <AnimIn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <PillBtn variant="subtle" onClick={() => setView("dashboard")} style={{ padding: "8px 16px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
            <h2 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.tx }}>{lang === "ru" ? "Библиотека" : "Library"}</h2>
            <div style={{ width: 80 }} />
          </div>
        </AnimIn>

        {library.length === 0 ? (
          <AnimIn delay={0.1}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <BookMarked size={48} color={T.tx3} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 15, color: T.tx3, marginBottom: 4 }}>{lang === "ru" ? "Здесь пока пусто" : "Nothing here yet"}</p>
              <p style={{ fontSize: 12, color: T.tx3 }}>{lang === "ru" ? "Завершённые истории появятся здесь" : "Completed stories will appear here"}</p>
            </div>
          </AnimIn>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {library.map((book, i) => {
              const endColors = { good: T.teal, mixed: T.amber, sad: T.coral };
              const endBgs = { good: T.tealBg, mixed: T.amberBg, sad: T.coralBg };
              return (
                <AnimIn key={book.id} delay={0.05 + i * 0.03}>
                  <div
                    onClick={async () => {
                      const full = await getBookWithPages(book.id);
                      if (full) { setReadingBook(full); setView("reading"); }
                    }}
                    className="skazka-card"
                    style={{ padding: 0, cursor: "pointer", overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}
                    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadowMd; }}
                    onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = T.shadowSm; }}
                  >
                    {/* Cover image */}
                    <div style={{ width: "100%", height: 140, background: T.bgMuted, position: "relative", overflow: "hidden" }}>
                      {book.cover_image_url ? (
                        <img src={book.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <BookOpen size={28} color={T.tx3} style={{ opacity: 0.2 }} />
                        </div>
                      )}
                      {book.ending_type && (
                        <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 8px", borderRadius: 8, background: endBgs[book.ending_type], fontSize: 10, fontWeight: 700, color: endColors[book.ending_type] }}>
                          {L.ending[book.ending_type]}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.tx, marginBottom: 3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                      <div style={{ fontSize: 11, color: T.tx3 }}>
                        {book.child?.name} · {book.page_count || 0} {L.pages}
                      </div>
                      <div style={{ fontSize: 10, color: T.tx3, marginTop: 2 }}>
                        {new Date(book.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </AnimIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════
  // LOADING
  // ═══════════════════════════════════
  if (view === "loading") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <Loader2 size={24} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  // ═══════════════════════════════════
  // AUTH
  // ═══════════════════════════════════
  if (view === "auth") return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(108,99,255,0.06),transparent 70%)", top: -100, right: -80, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,107,138,0.05),transparent 70%)", bottom: -60, left: -60, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto", padding: "72px 24px 48px", textAlign: "center" }}>
        <AnimIn delay={0.1}><IconCircle icon={BookOpen} size={64} bg={`linear-gradient(135deg,${T.accent},${T.accentSoft})`} color="#fff" /></AnimIn>
        <AnimIn delay={0.2} style={{ marginTop: 24, marginBottom: 6 }}>
          <h1 style={{ fontFamily: T.display, fontWeight: 600, fontSize: 38, lineHeight: 1.1 }}>
            <GradientText colors={["#6C63FF", "#FF6B8A", "#6C63FF"]}>{L.skazka}</GradientText>
          </h1>
        </AnimIn>
        <AnimIn delay={0.3}>
          <h1 style={{ fontFamily: T.display, fontStyle: "italic", fontWeight: 400, fontSize: 38, color: T.tx, lineHeight: 1.1 }}>{L.vmeste}</h1>
        </AnimIn>
        <AnimIn delay={0.4} style={{ marginTop: 16, marginBottom: 40 }}>
          <BlurText text={`${L.aiCreates} ${L.readTogether}`} delay={60} animateBy="words" direction="top" stepDuration={0.3}
            className="" />
        </AnimIn>
        <AnimIn delay={0.5}>
          <div className="skazka-card" style={{ padding: 28, textAlign: "left" }}>
            <input className="skazka-input" value={authName} onChange={e => setAuthName(e.target.value)} placeholder={L.yourName} style={{ marginBottom: 12 }} />
            <input className="skazka-input" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder={L.email} style={{ marginBottom: 20 }} onKeyDown={e => e.key === "Enter" && register()} />
            <PillBtn onClick={register} style={{ width: "100%" }}><Sparkles size={16} />{L.login}</PillBtn>
          </div>
        </AnimIn>
        <AnimIn delay={0.7} style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ display: "flex" }}>
            {["#FFD1DC","#C4B8FF","#A0D8EF"].map((c, i) => <Avatar key={i} name={["А","М","К"][i]} size={26} gradient={`linear-gradient(135deg,${c},${c}dd)`} />)}
          </div>
          <ShinyText text={lang === "ru" ? "230+ семей уже создают сказки" : "230+ families creating stories"} speed={4} color={T.tx3} shineColor={T.accent} />
        </AnimIn>
        <AnimIn delay={0.8} style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Shield size={12} color={T.tx3} />
            <p style={{ fontSize: 11, color: T.tx3, lineHeight: 1.6 }}>{L.disclaimer}</p>
          </div>
        </AnimIn>
      </div>
    </div>
  );

  // ═══════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════
  if (view === "dashboard") return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>
      {showSettings && <SettingsPanel />}
      <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(108,99,255,0.05),transparent 65%)", top: -80, right: -60, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 540, margin: "0 auto", padding: "32px 20px" }}>
        <AnimIn>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 13, color: T.tx3, marginBottom: 4, fontWeight: 500 }}>{lang === "ru" ? "Добрый вечер" : "Good evening"}</p>
              <h1 style={{ fontFamily: T.display, fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
                <span style={{ color: T.tx2 }}>{L.hello}, </span>
                <GradientText colors={["#6C63FF","#9B8AFF","#6C63FF"]} animationSpeed={8}>{user?.name}</GradientText>
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <PillBtn variant="subtle" onClick={toggleLang} style={{ padding: "8px 12px", borderRadius: T.r }}><Globe size={14} /><span style={{ fontSize: 12 }}>{lang === "ru" ? "EN" : "RU"}</span></PillBtn>
              <PillBtn variant="subtle" onClick={() => setShowSettings(true)} style={{ padding: "8px 12px", borderRadius: T.r, position: "relative" }}>
                <Settings size={14} />
                {(!geminiKey || !antKey) && <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: T.coral, border: `2px solid ${T.bg}` }} />}
              </PillBtn>
            </div>
          </div>
        </AnimIn>

        {/* API prompt */}
        {(!antKey || !geminiKey) && <AnimIn delay={0.05}>
          <div onClick={() => setShowSettings(true)} className="skazka-card" style={{ padding: "16px 20px", marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, background: T.amberBg, border: "1px solid rgba(245,166,35,0.12)" }}>
            <IconCircle icon={Palette} size={38} bg="rgba(245,166,35,0.1)" color={T.amber} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: T.tx, marginBottom: 2 }}>{lang === "ru" ? "Подключите иллюстрации" : "Connect illustrations"}</div><div style={{ fontSize: 11, color: T.tx3 }}>{lang === "ru" ? "Добавьте API-ключи в настройках" : "Add API keys in settings"}</div></div>
            <ChevronRight size={16} color={T.amber} />
          </div>
        </AnimIn>}

        {/* Children */}
        <AnimIn delay={0.08}>
          <div className="skazka-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <SectionLabel>{L.children}</SectionLabel>
              <PillBtn variant="ghost" onClick={() => setShowAdd(!showAdd)} style={{ padding: "6px 14px", borderRadius: T.r, fontSize: 12 }}><Plus size={12} />{L.addChild}</PillBtn>
            </div>
            {showAdd && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input className="skazka-input" value={newChild} onChange={e => setNewChild(e.target.value)} placeholder={L.childName} style={{ flex: 1, padding: "11px 14px" }} />
              <select value={newAge} onChange={e => setNewAge(e.target.value)} style={{ padding: 11, borderRadius: T.r2, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.tx, fontFamily: T.body, fontSize: 14 }}>
                {[3,4,5,6,7,8,9,10].map(a => <option key={a} value={a}>{a} {L.years}</option>)}
              </select>
              <PillBtn onClick={addChildFn} style={{ padding: "11px 16px", borderRadius: T.r2 }}><Check size={16} /></PillBtn>
            </motion.div>}
            {children.length === 0 ? <p style={{ fontSize: 13, color: T.tx3, textAlign: "center", padding: 20 }}>{L.addChildPlaceholder}</p> : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {children.map(ch => (
                  <div key={ch.id} onClick={() => setActiveChild(activeChild?.id === ch.id ? null : ch)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 16, cursor: "pointer", transition: "all .25s", background: activeChild?.id === ch.id ? T.accentBg : T.bgMuted, border: `2px solid ${activeChild?.id === ch.id ? T.accent : "transparent"}` }}>
                    <Avatar name={ch.name} size={34} gradient={activeChild?.id === ch.id ? `linear-gradient(135deg,${T.accent},${T.accentSoft})` : `linear-gradient(135deg,${T.accentBg},${T.accentSoft}40)`} />
                    <div><div style={{ fontWeight: 700, fontSize: 14, color: T.tx }}>{ch.name}</div><div style={{ fontSize: 11, color: T.tx3 }}>{ch.age} {L.years}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimIn>

        {/* SKZ-5: Saved characters for reuse */}
        {activeChild && characters.length > 0 && <AnimIn delay={0.10}>
          <div className="skazka-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SectionLabel>{lang === "ru" ? "Герои" : "Characters"}</SectionLabel>
              <span style={{ fontSize: 11, color: T.tx3 }}>{lang === "ru" ? "выберите для продолжения" : "pick to continue"}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {/* "New character" option */}
              <div
                onClick={() => setSelectedChar(null)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 14, cursor: "pointer", transition: "all .25s", background: !selectedChar ? T.accentBg : T.bgMuted, border: `2px solid ${!selectedChar ? T.accent : "transparent"}` }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={16} color={T.accent} />
                </div>
                <div><div style={{ fontWeight: 600, fontSize: 13, color: T.tx }}>{lang === "ru" ? "Новый герой" : "New character"}</div></div>
              </div>
              {characters.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedChar(selectedChar?.id === c.id ? null : c)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 14, cursor: "pointer", transition: "all .25s", background: selectedChar?.id === c.id ? T.tealBg : T.bgMuted, border: `2px solid ${selectedChar?.id === c.id ? T.teal : "transparent"}` }}
                >
                  {c.portrait_url ? (
                    <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                      <img src={c.portrait_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <Avatar name={c.name} size={36} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.tx }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.tx3 }}>{c.stories_count || 0} {lang === "ru" ? "историй" : "stories"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimIn>}

        {/* New Session CTA */}
        {children.length > 0 && <AnimIn delay={0.12}>
          <div onClick={activeChild ? () => { setBackstory(""); setPresets([]); setView("setup"); generatePresets(activeChild.name, activeChild.age, selectedChar); } : undefined}
            className="skazka-card" style={{ marginBottom: 16, cursor: activeChild ? "pointer" : "default", background: activeChild ? `linear-gradient(135deg,${T.accent},#7B68EE,${T.accentSoft})` : T.bgCard, border: "none", padding: "26px 24px", opacity: activeChild ? 1 : 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: activeChild ? "rgba(255,255,255,0.18)" : T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wand2 size={20} color={activeChild ? "#fff" : T.accent} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: activeChild ? "#fff" : T.tx }}>{L.newSession}</h3>
                <p style={{ fontSize: 12, color: activeChild ? "rgba(255,255,255,0.7)" : T.tx3 }}>{activeChild ? (lang === "ru" ? `Создать историю для ${activeChild.name}` : `Create story for ${activeChild.name}`) : L.forWhom}</p>
              </div>
            </div>
          </div>
        </AnimIn>}

        {/* Library (Supabase) */}
        {library.length > 0 && <AnimIn delay={0.16}>
          <div onClick={() => setView("library")} className="skazka-card" style={{ marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "18px 20px" }}>
            <IconCircle icon={BookMarked} size={44} bg={T.tealBg} color={T.teal} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.tx, marginBottom: 2 }}>{lang === "ru" ? "Библиотека" : "Library"}</div>
              <div style={{ fontSize: 12, color: T.tx3 }}>{library.length} {library.length === 1 ? (lang === "ru" ? "история" : "story") : (lang === "ru" ? (library.length < 5 ? "истории" : "историй") : "stories")}</div>
            </div>
            <div style={{ display: "flex", gap: -8 }}>
              {library.slice(0, 3).map((b, i) => (
                b.cover_image_url ? (
                  <div key={b.id} style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", border: `2px solid ${T.bg}`, marginLeft: i > 0 ? -8 : 0 }}>
                    <img src={b.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : null
              ))}
            </div>
            <ChevronRight size={16} color={T.teal} />
          </div>
        </AnimIn>}

        {/* Characters Gallery */}
        {activeChild && characters.length > 0 && <AnimIn delay={0.17}>
          <div onClick={() => setView("characters")} className="skazka-card" style={{ marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "18px 20px" }}>
            <IconCircle icon={Users} size={44} bg={T.accentBg} color={T.accent} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.tx, marginBottom: 2 }}>{lang === "ru" ? "Персонажи" : "Characters"}</div>
              <div style={{ fontSize: 12, color: T.tx3 }}>{characters.length} {characters.length === 1 ? (lang === "ru" ? "герой" : "character") : (lang === "ru" ? (characters.length < 5 ? "героя" : "героев") : "characters")}</div>
            </div>
            <div style={{ display: "flex", gap: -8 }}>
              {characters.slice(0, 4).map((c, i) => (
                c.portrait_url ? (
                  <div key={c.id} style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: `2px solid ${T.bg}`, marginLeft: i > 0 ? -6 : 0 }}>
                    <img src={c.portrait_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <Avatar key={c.id} name={c.name} size={32} />
                )
              ))}
            </div>
            <ChevronRight size={16} color={T.accent} />
          </div>
        </AnimIn>}

        {/* History (localStorage fallback — shown if no Supabase library) */}
        {library.length === 0 && sessions.length > 0 && <AnimIn delay={0.18}><div className="skazka-card">
          <SectionLabel>{L.history}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessions.slice(0, 8).map((s, i) => (
              <div key={s.id || i} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: T.r2, background: T.bgMuted, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                <IconCircle icon={BookMarked} size={44} bg={T.tealBg} color={T.teal} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: T.tx, marginBottom: 2 }}>{s.theme?.name || "Story"}</div><div style={{ fontSize: 11, color: T.tx3 }}>{s.child?.name} · {Math.ceil((s.duration || 0) / 60)} {L.min} · {s.pages?.length || 0} {L.pages}</div></div>
                <ChevronRight size={16} color={T.tx3} />
              </div>
            ))}
          </div>
        </div></AnimIn>}

        <AnimIn delay={0.22}>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <PillBtn variant="subtle" onClick={async () => { await ST.del("user"); window.location.href = "/"; }} style={{ fontSize: 12, gap: 6, color: T.tx3 }}><LogOut size={12} />{L.logout}</PillBtn>
          </div>
        </AnimIn>
      </div>
    </div>
  );

  // ═══════════════════════════════════
  // SETUP
  // ═══════════════════════════════════
  if (view === "setup") return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "28px 20px" }}>
        <AnimIn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <PillBtn variant="subtle" onClick={() => setView("dashboard")} style={{ padding: "8px 16px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
            <span style={{ fontSize: 13, color: T.tx3 }}>{L.storyFor} <strong style={{ color: T.accent }}>{activeChild?.name}</strong></span>
          </div>
        </AnimIn>

        <AnimIn delay={0.05} style={{ textAlign: "center", marginBottom: 28 }}>
          <IconCircle icon={BookOpen} size={56} />
          <h2 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, marginTop: 12, marginBottom: 6 }}>{L.whatAbout}</h2>
        </AnimIn>

        {/* Presets */}
        <AnimIn delay={0.1}>
          <div className="skazka-card" style={{ marginBottom: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <SectionLabel style={{ margin: 0 }}>{L.storyIdeas}</SectionLabel>
              <PillBtn variant="ghost" onClick={() => { setPresets([]); generatePresets(activeChild.name, activeChild.age, selectedChar); }} disabled={presetsLoading} style={{ padding: "6px 14px", borderRadius: T.r, fontSize: 11 }}><RefreshCw size={12} />{L.more}</PillBtn>
            </div>
            {presetsLoading && presets.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24 }}><Loader2 size={20} color={T.accent} style={{ animation: "spin .8s linear infinite" }} /><p style={{ fontSize: 12, color: T.tx3, marginTop: 8 }}>{L.generating}</p></div>
            ) : presets.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {presets.map((p, i) => (
                  <div key={i} onClick={() => setBackstory(p.text)} style={{ padding: "14px 16px", borderRadius: 16, border: `2px solid ${backstory === p.text ? T.accent : T.border}`, background: backstory === p.text ? T.accentBg : T.bgCard, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all .25s", fontSize: 14, fontWeight: 600, color: T.tx }}>
                    <Sparkles size={16} color={backstory === p.text ? T.accent : T.tx3} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{p.text}</span>
                    {backstory === p.text && <Check size={16} color={T.accent} />}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: T.tx3, textAlign: "center", padding: 12 }}>{antKey ? L.noIdeas : L.needKey}</p>
            )}
          </div>
        </AnimIn>

        {/* Custom premise */}
        <AnimIn delay={0.15}>
          <div className="skazka-card" style={{ marginBottom: 14, padding: 20 }}>
            <SectionLabel>{L.writeYourOwn}</SectionLabel>
            <textarea className="skazka-input" value={backstory} onChange={e => setBackstory(e.target.value)} placeholder={L.premisePlaceholder} rows={3} style={{ resize: "vertical", minHeight: 72, lineHeight: 1.6 }} />
            <p style={{ fontSize: 11, color: T.tx3, marginTop: 6 }}>{L.anyGenre}</p>
          </div>
        </AnimIn>

        {/* Art style */}
        <AnimIn delay={0.18}>
          <div className="skazka-card" style={{ marginBottom: 20, padding: 20 }}>
            <SectionLabel>{L.artStyle}</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { key: "book", icon: BookImage, label: L.styleBook, desc: L.styleBookDesc },
                { key: "anime", icon: Brush, label: L.styleAnime, desc: L.styleAnimeDesc },
                { key: "realistic", icon: Camera, label: L.styleRealistic, desc: L.styleRealisticDesc },
              ].map(({ key, icon: I, label, desc }) => (
                <div key={key} onClick={async () => { setArtStyle(key); await ST.set("artStyle", key); }} style={{ textAlign: "center", padding: "14px 8px", borderRadius: 16, border: `2px solid ${artStyle === key ? T.accent : T.border}`, background: artStyle === key ? T.accentBg : T.bgCard, cursor: "pointer", transition: "all .25s" }}>
                  <I size={24} color={artStyle === key ? T.accent : T.tx3} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: artStyle === key ? T.accent : T.tx2 }}>{label}</div>
                  <div style={{ fontSize: 10, color: T.tx3, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimIn>

        <AnimIn delay={0.22}>
          <PillBtn onClick={() => startSession(activeChild, backstory)} disabled={!backstory.trim()} style={{ width: "100%" }}><Sparkles size={16} />{L.startStory}</PillBtn>
          {backstory && <div style={{ textAlign: "center", marginTop: 10 }}>
            <PillBtn variant="subtle" onClick={() => setBackstory("")} style={{ fontSize: 12 }}>{L.clear}</PillBtn>
          </div>}
        </AnimIn>
      </div>
    </div>
  );

  // ═══════════════════════════════════
  // SESSION (Flipbook)
  // ═══════════════════════════════════
  if (view === "session") {
    const allPages = curPage ? [...pages, { ...curPage, _curImg: curImg, _isCurrent: true }] : [...pages];
    const totalReady = allPages.length;
    const showChoices = curPage && !curPage.isEnd && textDone && !loading && !sel;
    const showEnd = curPage && curPage.isEnd;
    const childName = activeChild?.name || "";
    const flipNext = () => { try { bookRef.current?.flipNext(); } catch {} };
    const flipPrev = () => { try { bookRef.current?.flipPrev(); } catch {} };

    return (
    <div style={{ height: "100vh", background: T.bg, fontFamily: T.body, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{CSS}</style>
      {showSettings && <SettingsPanel />}

      {/* Top bar */}
      <div style={{ padding: "8px 16px", background: "rgba(248,247,252,0.95)", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={16} color={T.accent} />
          <span style={{ fontFamily: T.display, fontSize: 14, fontWeight: 500, color: T.tx, fontStyle: "italic" }}>{childName}</span>
          <span style={{ fontSize: 11, color: T.tx3, fontFamily: "monospace" }}>{fmtT(timer)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.tx3 }}>{totalReady}/{TOTAL_PAGES}</span>
          <PillBtn variant="ghost" onClick={() => { if (curPage) finishSession(); else setView("dashboard"); }} style={{ padding: "5px 14px", fontSize: 12 }}>{L.finish}</PillBtn>
        </div>
      </div>

      {/* Main: LEFT | BOOK | RIGHT */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT: Nav + TTS */}
        <div style={{ width: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 4px", flexShrink: 0 }}>
          <button onClick={flipPrev} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.bgCard, color: T.tx3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={16}/></button>
          <button onClick={() => { if (speaking) stopSpeak(); else if (curPage) speakText(curPage.tts_text || curPage.text); }} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${T.border}`, background: speaking ? T.accentBg : T.bgCard, color: speaking ? T.accent : T.tx3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{speaking ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>
        </div>

        {/* CENTER: Book */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0" }}>
          {loading && totalReady === 0 ? (
            <div style={{ textAlign: "center" }}>
              <Loader2 size={28} color={T.accent} style={{ animation: "spin .8s linear infinite", margin: "0 auto 14px" }}/>
              <p style={{ fontFamily: T.display, fontSize: 14, color: T.tx3, fontStyle: "italic" }}>
                {L.creatingStory} {childName}...
              </p>
              {error && <div style={{ marginTop: 12, padding: "10px 14px", background: T.coralBg, borderRadius: T.r, border: `1px solid rgba(255,107,138,0.15)`, fontSize: 12, color: T.coral }}>
                {error}
                <PillBtn variant="coral" onClick={() => { setError(null); setLoading(true); genPage({ name: activeChild.name, age: activeChild.age, theme: theme.prompt, history: pages.map(p => ({ text: p.text, choice: p.choice, mood: p.mood, sceneSummary: p.sceneSummary, actionSummary: p.actionSummary })), choice: picks[picks.length-1] || null, charDesc, lang }, antKey).then(r => { setCurPage(r); setLoading(false); }).catch(() => { setError("Retry failed."); setLoading(false); }); }} style={{ marginTop: 8, padding: "6px 16px", fontSize: 11 }}>Retry</PillBtn>
              </div>}
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", bottom: -6, left: "6%", right: "6%", height: 12, background: "radial-gradient(ellipse, rgba(0,0,0,0.05), transparent 70%)", borderRadius: "50%", zIndex: 0 }}/>
              <ReactFlipBook
                key={`book-${allPages.map((p,i) => `${p?.text?.length||0}${p?.imgUrl?'I':'_'}${(i===totalReady-1 && curImg)?'C':''}`).join('-')}`}
                ref={bookRef}
                width={420} height={580} size="stretch"
                minWidth={300} maxWidth={500} minHeight={400} maxHeight={680}
                drawShadow={true} flippingTime={1200} usePortrait={false} showCover={false}
                maxShadowOpacity={0.3} mobileScrollSupport={true}
                startPage={Math.max(0, (totalReady > 1 ? (totalReady % 2 === 0 ? totalReady - 2 : totalReady - 1) : 0))}
                style={{ boxShadow: T.shadowMd }}
              >
                {[0,1,2,3,4,5].map(i => {
                  const pg = allPages[i] || null;
                  const isCur = pg?._isCurrent || false;
                  const isBlur = !pg && i > 0 && allPages[i-1] && i === totalReady;
                  return <BookPage key={i} page={pg} pageNum={i + 1} isCurrent={isCur} isBlurred={isBlur} curImg={curImg} imgLoading={imgLoading} lang={lang} />;
                })}
              </ReactFlipBook>
            </div>
          )}
        </div>

        {/* RIGHT: Forward + Choices */}
        <div style={{ width: 200, display: "flex", flexDirection: "column", justifyContent: "center", padding: "12px 14px 12px 4px", flexShrink: 0, gap: 6 }}>
          <button onClick={flipNext} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.bgCard, color: T.tx3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}><ArrowRight size={16}/></button>

          {showEnd ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: T.display, fontSize: 14, color: T.accent, fontWeight: 600, fontStyle: "italic", marginBottom: 8 }}>{L.end}</p>
              {imgLoading && <p style={{ fontSize: 10, color: T.tx3, marginBottom: 6 }}>{lang === "ru" ? "Ждём иллюстрацию..." : "Waiting..."}</p>}
              <PillBtn onClick={finishSession} disabled={imgLoading} style={{ width: "100%", padding: "10px 14px", fontSize: 12 }}>
                <BarChart3 size={14} />{L.viewReport}
              </PillBtn>
            </div>
          ) : showChoices ? (
            <div>
              <div style={{ fontSize: 10, color: T.tx3, textAlign: "center", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{L.whatNext}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {curPage.choices?.map((ch, i) => {
                  const valInfo = VALS[ch.value] || {};
                  const isPos = valInfo.pos !== false;
                  return (
                    <button key={i} onClick={() => pickChoice(ch)} disabled={!!sel || loading} style={{
                      background: sel === ch.label ? T.accentBg : T.bgCard,
                      border: `1.5px solid ${sel === ch.label ? T.accent : T.border}`,
                      borderRadius: T.r, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8,
                      fontSize: 12, fontWeight: 600, fontFamily: T.body, color: T.tx, textAlign: "left",
                      cursor: sel ? "default" : "pointer", transition: "all .25s",
                    }}>
                      {isPos ? <TrendingUp size={12} color={T.teal} style={{ flexShrink: 0 }} /> : <TrendingDown size={12} color={T.coral} style={{ flexShrink: 0 }} />}
                      <span style={{ flex: 1, lineHeight: 1.3 }}>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 9, color: T.tx3, textAlign: "center", marginBottom: 4 }}>{L.orCustom}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <input value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submitCustom()} placeholder="..." style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgCard, color: T.tx, fontSize: 12, fontFamily: T.body, outline: "none" }}/>
                  <button onClick={submitCustom} disabled={!customInput.trim()} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: customInput.trim() ? T.accent : T.bgMuted, color: customInput.trim() ? "#fff" : T.tx3, fontSize: 12, fontWeight: 700, fontFamily: T.body, cursor: customInput.trim() ? "pointer" : "default" }}><ChevronRight size={14}/></button>
                </div>
              </div>
            </div>
          ) : loading && totalReady > 0 ? (
            <div style={{ textAlign: "center" }}>
              <Loader2 size={16} color={T.accent} style={{ animation: "spin .8s linear infinite", margin: "0 auto 6px" }}/>
              <p style={{ fontSize: 11, color: T.tx3, fontStyle: "italic" }}>{L.continuing}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
    );
  }

  // ═══════════════════════════════════
  // REPORT
  // ═══════════════════════════════════
  if (view === "report") {
    const vals = getVals();
    const dur = t0 ? Math.ceil((Date.now() - t0) / 60000) : 0;
    const topVal = vals[0];
    const allPages = [...pages, curPage].filter(Boolean);
    const posCount = vals.filter(v => VALS[v.k]?.pos).reduce((s, v) => s + v.count, 0);
    const negCount = vals.filter(v => !VALS[v.k]?.pos).reduce((s, v) => s + v.count, 0);
    const endType = negCount > posCount ? "sad" : negCount === posCount && negCount > 0 ? "mixed" : "good";
    const endColors = { good: T.teal, mixed: T.amber, sad: T.coral };
    const endBgs = { good: T.tealBg, mixed: T.amberBg, sad: T.coralBg };

    const qs = {
      generosity: lang === "ru" ? "проявил(а) щедрость. Спросите: «Поделишься, если мало?»" : "showed generosity. Ask: 'Would you share if you had little?'",
      empathy: lang === "ru" ? "проявил(а) сочувствие! «Что сделаешь, увидев грустного?»" : "showed empathy! 'What would you do if you saw someone sad?'",
      courage: lang === "ru" ? "выбрал(а) смелость! «Что помогает, когда страшно?»" : "chose courage! 'What helps when you're scared?'",
      curiosity: lang === "ru" ? "проявил(а) любопытство. «Что хочешь исследовать?»" : "showed curiosity. 'What do you want to explore?'",
      kindness: lang === "ru" ? "выбрал(а) доброту. «Кому ты помог(ла)?»" : "chose kindness. 'Who did you help?'",
      honesty: lang === "ru" ? "выбрал(а) честность. «Почему важно говорить правду?»" : "chose honesty. 'Why is it important to tell the truth?'",
      patience: lang === "ru" ? "проявил(а) терпение. «Было ли трудно ждать?»" : "showed patience. 'Was it hard to wait?'",
      teamwork: lang === "ru" ? "выбрал(а) дружбу. «Что лучше: один или с друзьями?»" : "chose teamwork. 'What's better: alone or with friends?'",
      selfishness: lang === "ru" ? "выбрал(а) жадность. «Что потерял герой из-за жадности?»" : "chose selfishness. 'What did the hero lose because of greed?'",
      cowardice: lang === "ru" ? "выбрал(а) трусость. «Бывает страшно — но что бы ты изменил?»" : "chose cowardice. 'It's scary — but what would you change?'",
      cruelty: lang === "ru" ? "поступил(а) жестоко. «Как думаешь, что почувствовал другой?»" : "was cruel. 'How do you think the other felt?'",
      greed: lang === "ru" ? "выбрал(а) алчность. «Стоило ли это того?»" : "chose greed. 'Was it worth it?'",
    };

    return (
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, position: "relative", overflow: "hidden" }}>
        <style>{CSS}</style>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(46,196,160,0.05),transparent 65%)", top: 40, right: -80, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "32px 20px" }}>
          {/* Header */}
          <AnimIn style={{ textAlign: "center", marginBottom: 28 }}>
            <SectionLabel>{L.sessionReport}</SectionLabel>
            <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 600, marginBottom: 8 }}>
              {L.journey} <GradientText colors={["#6C63FF","#FF6B8A","#6C63FF"]}>{activeChild?.name}</GradientText>
            </h1>
            <p style={{ fontSize: 12, color: T.tx3 }}>{theme?.name} · {dur} {L.min} · {picks.length} {L.choices} · {allPages.length} {L.pages}</p>
            <div style={{ marginTop: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 20, background: endBgs[endType], color: endColors[endType], fontSize: 13, fontWeight: 700 }}>
                {endType === "good" ? <Star size={14} /> : endType === "mixed" ? <CircleDot size={14} /> : <Heart size={14} />}
                {L.ending[endType]}
              </span>
            </div>
          </AnimIn>

          {/* Values */}
          {vals.length > 0 && <AnimIn delay={0.1}>
            <div className="skazka-card" style={{ marginBottom: 14 }}>
              <SectionLabel>{L.choicesOf} {activeChild?.name}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {vals.map((v, i) => {
                  const isPos = VALS[v.k]?.pos;
                  return (
                    <div key={v.k}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {isPos ? <TrendingUp size={14} color={T.teal} /> : <TrendingDown size={14} color={T.coral} />}
                          <span style={{ fontWeight: 700, fontSize: 14, color: T.tx }}>{lang === "ru" ? v.n : (v.nEn || v.k)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: isPos ? T.tealBg : T.coralBg, color: isPos ? T.teal : T.coral }}>
                            {isPos ? <Check size={10} /> : <X size={10} />}
                          </span>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 14, color: v.c }}>{v.pct}%</span>
                      </div>
                      <AnimBar color={`linear-gradient(90deg,${v.c},${v.c}88)`} pct={v.pct} delay={i * 150} />
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimIn>}

          {/* Discussion question */}
          <AnimIn delay={0.15}>
            <div style={{ background: `linear-gradient(135deg,${T.accentBg},${T.coralBg})`, borderRadius: T.r3, padding: 22, marginBottom: 14, border: `1px solid rgba(108,99,255,0.06)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Lightbulb size={14} color={T.accent} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: T.accent }}>{L.discussionQ}</span>
              </div>
              <p style={{ fontFamily: T.display, fontStyle: "italic", fontSize: 15, lineHeight: 1.7, color: T.tx2 }}>
                {activeChild?.name} {qs[topVal?.k] || (lang === "ru" ? "Что запомнилось из сказки?" : "What do you remember from the story?")}
              </p>
            </div>
          </AnimIn>

          {/* Full story recap */}
          <AnimIn delay={0.2}>
            <div className="skazka-card" style={{ marginBottom: 14 }}>
              <SectionLabel>{L.fullStory}</SectionLabel>
              {backstory && <div style={{ marginBottom: 16, padding: "12px 14px", background: T.accentBg, borderRadius: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: 4 }}>{L.parentPremise}</div>
                <p style={{ fontFamily: T.display, fontSize: 13, fontStyle: "italic", lineHeight: 1.6, color: T.tx2 }}>{backstory}</p>
              </div>}
              {allPages.map((pg, i) => (
                <div key={i} style={{ marginBottom: 16, paddingBottom: i < allPages.length - 1 ? 16 : 0, borderBottom: i < allPages.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.accent, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontFamily: T.display, fontSize: 13, fontWeight: 600, color: T.accent, fontStyle: "italic" }}>{pg?.title}</span>
                  </div>
                  {pg?.imgUrl && <div style={{ marginBottom: 8, borderRadius: T.r2, overflow: "hidden", border: `1px solid ${T.border}`, maxHeight: 200 }}><img src={pg.imgUrl} alt="" style={{ width: "100%", display: "block", objectFit: "cover" }} /></div>}
                  <p style={{ fontFamily: T.story, fontSize: 14, fontStyle: "italic", lineHeight: 1.8, color: T.tx2 }}>{pg?.text}</p>
                  {pg?.choice && (() => {
                    const isPos = VALS[pg.choice.value]?.pos !== false;
                    return <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: isPos ? T.tealBg : T.coralBg, fontSize: 11, color: isPos ? T.teal : T.coral, fontWeight: 600 }}>
                      {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {pg.choice.label}
                    </div>;
                  })()}
                </div>
              ))}
            </div>
          </AnimIn>

          {/* Decision path */}
          {picks.length > 0 && <AnimIn delay={0.25}>
            <div className="skazka-card" style={{ marginBottom: 20 }}>
              <SectionLabel>{L.decisionPath}</SectionLabel>
              <div style={{ position: "relative", paddingLeft: 24 }}>
                <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, borderRadius: 2, background: `linear-gradient(180deg,${T.accent},${T.accentSoft},${T.coral},${T.amber})` }} />
                {picks.map((p, i) => {
                  const vl = VALS[p.value] || {};
                  const isPos = vl.pos !== false;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", position: "relative" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: vl.c || T.tx3, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, zIndex: 1, boxShadow: `0 0 0 4px ${T.bg}`, flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontSize: 14, fontWeight: 600, flex: 1, color: T.tx }}>{p.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: isPos ? T.tealBg : T.coralBg, color: isPos ? T.teal : T.coral }}>
                        {lang === "ru" ? vl.n : (vl.nEn || p.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimIn>}

          {/* Actions */}
          <AnimIn delay={0.3}>
            <div style={{ display: "flex", gap: 10 }}>
              <PillBtn variant="coral" onClick={() => setView("dashboard")} style={{ flex: 1 }}><Sparkles size={16} />{L.newSessionBtn}</PillBtn>
              <PillBtn variant="ghost" onClick={() => setView("dashboard")} style={{ flex: 1 }}>{L.dashboardBtn}</PillBtn>
            </div>
          </AnimIn>
        </div>
      </div>
    );
  }

  return null;
}
