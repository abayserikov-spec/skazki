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
  const [view, setView] = useState("loading");
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [lang, setLang] = useState("ru");
  const [artStyle, setArtStyle] = useState("book");
  const [geminiModel, setGeminiModel] = useState("nb2-default");
  const [childrenList, setChildrenList] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedChars, setSelectedChars] = useState([]);
  const [library, setLibrary] = useState([]);
  const [sessions, setSessions] = useState([]);

  const L = I18N[lang] || I18N.ru;

  useEffect(() => {
    (async () => {
      const u = await ST.get("user");
      const sl = await ST.get("lang");
      const ss = await ST.get("artStyle");
      const gm = await ST.get("geminiModel");
      if (sl) setLang(sl);
      // Only accept known styles; fallback to "book" so old anime/realistic users get the default.
      const KNOWN_STYLES = ["book"]; // add "book2" here when second style ships
      if (ss && KNOWN_STYLES.includes(ss)) setArtStyle(ss);
      else if (ss) await ST.set("artStyle", "book");
      if (gm) {
        setGeminiModel(gm);
        try { window.localStorage?.setItem("geminiModel", gm); } catch {}
      } else {
        // Mirror default to localStorage so image-gen.js can read it synchronously
        try { window.localStorage?.setItem("geminiModel", "nb2-default"); } catch {}
      }
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

  useEffect(() => {
    if (activeChild?.id && supabase) {
      getCharacters(activeChild.id).then(chars => setCharacters(chars || []));
    } else {
      setCharacters([]);
    }
    setSelectedChars([]);
  }, [activeChild?.id]);

  const toggleLang = useCallback(async () => {
    const n = lang === "ru" ? "en" : "ru";
    setLang(n);
    await ST.set("lang", n);
  }, [lang]);

  const saveArtStyle = useCallback(async (v) => {
    setArtStyle(v);
    await ST.set("artStyle", v);
  }, []);

  const saveGeminiModel = useCallback(async (v) => {
    setGeminiModel(v);
    await ST.set("geminiModel", v);
    // Mirror to localStorage for synchronous read in image-gen.js
    try { window.localStorage?.setItem("geminiModel", v); } catch {}
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

  return (
    <AppContext.Provider value={{
      view, setView, user, dbUser,
      lang, toggleLang, artStyle, saveArtStyle,
      geminiModel, saveGeminiModel,
      childrenList, setChildrenList, activeChild, setActiveChild,
      characters, setCharacters, selectedChars, setSelectedChars,
      library, setLibrary, sessions, setSessions,
      register, logout, addChild, refreshLibrary, refreshCharacters,
      L,
    }}>
      {childrenProp}
    </AppContext.Provider>
  );
}
