import { createContext, useContext, useState, useEffect, useCallback } from "react";
import ST from "../lib/storage.js";
import { I18N } from "../lib/constants.js";
import { supabase } from "../lib/supabase.js";
import {
  ensureUser, getChildren as dbGetChildren, addChild as dbAddChild,
  getAllBooks, getCharacters,
} from "../lib/db.js";

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children: childrenProp }) {
  // ── Navigation ──
  const [view, setView] = useState("loading");
  const [showSettings, setShowSettings] = useState(false);

  // ── User ──
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);

  // ── Settings ──
  const [lang, setLang] = useState("ru");
  const [artStyle, setArtStyle] = useState("book");
  const [geminiKey, setGeminiKey] = useState("");
  const [antKey, setAntKey] = useState("");
  const [elKey, setElKey] = useState("");
  const [elVoiceId, setElVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
  const [elVoiceName, setElVoiceName] = useState("Sarah");

  // ── Children & Characters ──
  const [childrenList, setChildrenList] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedChars, setSelectedChars] = useState([]);

  // ── Library ──
  const [library, setLibrary] = useState([]);
  const [sessions, setSessions] = useState([]);

  // ── Derived ──
  const L = I18N[lang] || I18N.ru;

  // ── Init ──
  useEffect(() => {
    (async () => {
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
        setChildrenList(await ST.get("children") || []);
        setView("dashboard");
        if (supabase) {
          const dbU = await ensureUser(u.email, u.name);
          if (dbU) {
            setDbUser(dbU);
            const kids = await dbGetChildren(dbU.id);
            if (kids.length > 0) setChildrenList(kids);
            const books = await getAllBooks(dbU.id);
            setLibrary(books);
          }
        }
      } else {
        setView("auth");
      }
    })();
  }, []);

  // ── Load characters when child selected ──
  useEffect(() => {
    if (activeChild?.id && supabase) {
      getCharacters(activeChild.id).then(chars => setCharacters(chars || []));
    } else {
      setCharacters([]);
    }
    setSelectedChars([]);
  }, [activeChild?.id]);

  // ── Save helpers ──
  const saveGeminiKey = useCallback(async (v) => { setGeminiKey(v); await ST.set("geminiKey", v); }, []);
  const saveAntKey = useCallback(async (v) => { setAntKey(v); await ST.set("antKey", v); }, []);
  const saveElKey = useCallback(async (v) => { setElKey(v); await ST.set("elKey", v); }, []);

  const toggleLang = useCallback(async () => {
    const n = lang === "ru" ? "en" : "ru";
    setLang(n);
    await ST.set("lang", n);
  }, [lang]);

  const saveArtStyle = useCallback(async (v) => {
    setArtStyle(v);
    await ST.set("artStyle", v);
  }, []);

  const register = useCallback(async (name, email) => {
    if (!name.trim() || !email.trim()) return;
    const u = { name: name.trim(), email: email.trim() };
    await ST.set("user", u);
    setUser(u);
    if (supabase) {
      const dbU = await ensureUser(u.email, u.name);
      if (dbU) setDbUser(dbU);
    }
    setView("dashboard");
  }, []);

  const logout = useCallback(async () => {
    await ST.del("user");
    window.location.href = "/";
  }, []);

  const addChild = useCallback(async (name, age) => {
    if (!name.trim()) return;
    let ch;
    if (supabase && dbUser) {
      ch = await dbAddChild(dbUser.id, name.trim(), parseInt(age));
    }
    if (!ch) ch = { id: Date.now().toString(), name: name.trim(), age };
    const upd = [...childrenList, ch];
    setChildrenList(upd);
    await ST.set("children", upd);
    return ch;
  }, [childrenList, dbUser]);

  const refreshLibrary = useCallback(async () => {
    if (dbUser && supabase) {
      const books = await getAllBooks(dbUser.id);
      setLibrary(books);
    }
  }, [dbUser]);

  const refreshCharacters = useCallback(async () => {
    if (activeChild?.id && supabase) {
      const chars = await getCharacters(activeChild.id);
      setCharacters(chars || []);
    }
  }, [activeChild?.id]);

  const value = {
    // Navigation
    view, setView, showSettings, setShowSettings,
    // User
    user, dbUser,
    // Settings
    lang, toggleLang, artStyle, saveArtStyle,
    geminiKey, saveGeminiKey, antKey, saveAntKey, elKey, saveElKey,
    elVoiceId, setElVoiceId, elVoiceName, setElVoiceName,
    // Children & Characters
    childrenList, setChildrenList, activeChild, setActiveChild,
    characters, setCharacters, selectedChars, setSelectedChars,
    // Library
    library, setLibrary, sessions, setSessions,
    // Actions
    register, logout, addChild, refreshLibrary, refreshCharacters,
    // i18n
    L,
  };

  return <AppContext.Provider value={value}>{childrenProp}</AppContext.Provider>;
}
