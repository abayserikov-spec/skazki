import { I18N } from "lib/constants";
import {
  addChild as dbAddChild,
  getChildren as dbGetChildren,
  ensureUser,
  getAllBooks,
  getCharacters,
} from "lib/db";
import ST from "lib/storage";
import { supabase } from "lib/supabase";
import type {
  AppUser,
  Book,
  Character,
  Child,
  DbUser,
  Session,
} from "lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type Lang = "ru" | "en";

interface AppContextValue {
  view: string;
  setView: Dispatch<SetStateAction<string>>;
  user: AppUser | null;
  dbUser: DbUser | null;
  lang: Lang;
  toggleLang: () => Promise<void>;
  artStyle: string;
  saveArtStyle: (v: string) => Promise<void>;
  geminiModel: string;
  saveGeminiModel: (v: string) => Promise<void>;
  childrenList: Child[];
  setChildrenList: Dispatch<SetStateAction<Child[]>>;
  activeChild: Child | null;
  setActiveChild: Dispatch<SetStateAction<Child | null>>;
  characters: Character[];
  setCharacters: Dispatch<SetStateAction<Character[]>>;
  selectedChars: Character[];
  setSelectedChars: Dispatch<SetStateAction<Character[]>>;
  library: Book[];
  setLibrary: Dispatch<SetStateAction<Book[]>>;
  sessions: Session[];
  setSessions: Dispatch<SetStateAction<Session[]>>;
  register: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  addChild: (name: string, age: string | number) => Promise<Child | undefined>;
  refreshLibrary: () => Promise<void>;
  refreshCharacters: () => Promise<void>;
  L: typeof I18N.ru;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({
  children: childrenProp,
}: {
  children: ReactNode;
}) {
  const [view, setView] = useState<string>("loading");
  const [user, setUser] = useState<AppUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [lang, setLang] = useState<Lang>("ru");
  const [artStyle, setArtStyle] = useState<string>("book");
  const [geminiModel, setGeminiModel] = useState<string>("nb2-default");
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChars, setSelectedChars] = useState<Character[]>([]);
  const [library, setLibrary] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const L = I18N[lang];

  useEffect(() => {
    (async () => {
      const u = await ST.get<AppUser>("user");
      const sl = await ST.get<string>("lang");
      const ss = await ST.get<string>("artStyle");
      const gm = await ST.get<string>("geminiModel");
      if (sl === "ru" || sl === "en") setLang(sl);
      // Only accept known styles; fallback to "book" so old anime/realistic users get the default.
      const KNOWN_STYLES = ["book"]; // add "book2" here when second style ships
      if (ss && KNOWN_STYLES.includes(ss)) setArtStyle(ss);
      else if (ss) await ST.set("artStyle", "book");
      if (gm) {
        setGeminiModel(gm);
        try {
          window.localStorage?.setItem("geminiModel", gm);
        } catch {}
      } else {
        // Mirror default to localStorage so image-gen.js can read it synchronously
        try {
          window.localStorage?.setItem("geminiModel", "nb2-default");
        } catch {}
      }
      const resolvedUser =
        u ||
        (await (async () => {
          if (!supabase) return null;
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return null;
          if (window.location.hash)
            window.history.replaceState(null, "", window.location.pathname);
          const su = session.user;
          const name =
            su.user_metadata?.full_name ||
            su.user_metadata?.name ||
            su.email?.split("@")[0] ||
            "User";
          const email = su.email || "";
          const synced = { name, email };
          await ST.set("user", synced);
          return synced;
        })());

      if (resolvedUser) {
        setUser(resolvedUser);
        setSessions((await ST.get<Session[]>("sessions")) || []);
        setView("dashboard");
        if (supabase) {
          const dbU = await ensureUser(resolvedUser.email, resolvedUser.name);
          if (dbU) {
            setDbUser(dbU);
            const kids = await dbGetChildren(dbU.id);
            setChildrenList(kids);
            const books = await getAllBooks(dbU.id);
            setLibrary(books);
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (activeChild?.id && supabase) {
      getCharacters(activeChild.id).then((chars) => setCharacters(chars || []));
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

  const saveArtStyle = useCallback(async (v: string) => {
    setArtStyle(v);
    await ST.set("artStyle", v);
  }, []);

  const saveGeminiModel = useCallback(async (v: string) => {
    setGeminiModel(v);
    await ST.set("geminiModel", v);
    // Mirror to localStorage for synchronous read in image-gen.js
    try {
      window.localStorage?.setItem("geminiModel", v);
    } catch {}
  }, []);

  const register = useCallback(async (name: string, email: string) => {
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
    ST.clear({ preserve: ["lang"] });
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  }, []);

  const addChild = useCallback(
    async (name: string, age: string | number) => {
      if (!name.trim() || !supabase || !dbUser) return;
      const ch = await dbAddChild(
        dbUser.id,
        name.trim(),
        parseInt(String(age)),
      );
      if (!ch) return;
      setChildrenList((prev) => [...prev, ch]);
      return ch;
    },
    [dbUser],
  );

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
    <AppContext.Provider
      value={{
        view,
        setView,
        user,
        dbUser,
        lang,
        toggleLang,
        artStyle,
        saveArtStyle,
        geminiModel,
        saveGeminiModel,
        childrenList,
        setChildrenList,
        activeChild,
        setActiveChild,
        characters,
        setCharacters,
        selectedChars,
        setSelectedChars,
        library,
        setLibrary,
        sessions,
        setSessions,
        register,
        logout,
        addChild,
        refreshLibrary,
        refreshCharacters,
        L,
      }}
    >
      {childrenProp}
    </AppContext.Provider>
  );
}
