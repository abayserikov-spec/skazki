import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, useMotionValue, useAnimationFrame, useTransform } from "motion/react";
import {
  Settings, LogOut, Plus, Check, User, BookOpen, Clock,
  ChevronRight, Volume2, VolumeX, Music, Sparkles, Palette,
  Play, ArrowLeft, ArrowRight, Loader2, Globe, Moon, Sun,
  PenLine, Wand2, BookMarked, Star, Heart, Shield,
  Swords, TreePine, Rocket, GraduationCap
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   СКАЗКА ВМЕСТЕ — UI Redesign v4 (Iteration 1)
   
   Clean light theme · No emojis · Lucide icons only
   Embedded React Bits: BlurText, GradientText, ShinyText
   Screens: Auth, Dashboard (Setup/Session/Report = next iteration)
   ══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────
// REACT BITS: BlurText (from reactbits.dev)
// Dependency: motion/react (framer-motion)
// ─────────────────────────────────────────────
const buildKeyframes = (from, steps) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);
  const keyframes = {};
  keys.forEach(k => { keyframes[k] = [from[k], ...steps.map(s => s[k])]; });
  return keyframes;
};

function BlurText({
  text = "", delay = 200, className = "", animateBy = "words",
  direction = "top", threshold = 0.1, rootMargin = "0px",
  animationFrom, animationTo, easing = t => t,
  onAnimationComplete, stepDuration = 0.35
}) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(ref.current); } },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () => direction === "top"
      ? { filter: "blur(10px)", opacity: 0, y: -30 }
      : { filter: "blur(10px)", opacity: 0, y: 30 },
    [direction]
  );
  const defaultTo = useMemo(
    () => [
      { filter: "blur(5px)", opacity: 0.5, y: direction === "top" ? 4 : -4 },
      { filter: "blur(0px)", opacity: 1, y: 0 }
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));

  return (
    <p ref={ref} className={className} style={{ display: "flex", flexWrap: "wrap" }}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
        const spanTransition = { duration: totalDuration, times, delay: (index * delay) / 1000, ease: easing };
        return (
          <motion.span
            key={index}
            style={{ display: "inline-block", willChange: "transform, filter, opacity" }}
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
          >
            {segment === " " ? "\u00A0" : segment}
            {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
          </motion.span>
        );
      })}
    </p>
  );
}

// ─────────────────────────────────────────────
// REACT BITS: GradientText (from reactbits.dev)
// ─────────────────────────────────────────────
function GradientText({
  children, className = "", colors = ["#6C63FF", "#FF6B8A", "#6C63FF"],
  animationSpeed = 6, showBorder = false, direction = "horizontal"
}) {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(null);
  const dur = animationSpeed * 1000;

  useAnimationFrame(time => {
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += dt;
    const full = dur * 2;
    const ct = elapsedRef.current % full;
    progress.set(ct < dur ? (ct / dur) * 100 : 100 - ((ct - dur) / dur) * 100);
  });

  const backgroundPosition = useTransform(progress, p =>
    direction === "horizontal" ? `${p}% 50%` : `50% ${p}%`
  );

  const gradientColors = [...colors, colors[0]].join(", ");
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${gradientColors})`,
    backgroundSize: "300% 100%",
    backgroundRepeat: "repeat",
  };

  return (
    <motion.span
      className={className}
      style={{
        ...gradientStyle,
        backgroundPosition,
        display: "inline-block",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </motion.span>
  );
}

// ─────────────────────────────────────────────
// REACT BITS: ShinyText (from reactbits.dev)
// ─────────────────────────────────────────────
function ShinyText({
  text, speed = 3, className = "", color = "#8E86A8",
  shineColor = "#6C63FF", spread = 120
}) {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(null);
  const dur = speed * 1000;

  useAnimationFrame(time => {
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += dt;
    const ct = elapsedRef.current % (dur * 2);
    progress.set(ct < dur ? (ct / dur) * 100 : 100 - ((ct - dur) / dur) * 100);
  });

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

  return (
    <motion.span
      className={className}
      style={{
        display: "inline-block",
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundPosition,
      }}
    >
      {text}
    </motion.span>
  );
}

// ─────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────
const THEME = {
  // Backgrounds
  bg:       "#F8F7FC",    // main page bg - warm off-white with hint of violet
  bgCard:   "#FFFFFF",    // card surfaces
  bgHover:  "#F3F1FA",    // hover state
  bgAccent: "#EEEAFC",    // accent backgrounds (selected states)
  bgMuted:  "#F5F3FB",    // muted card bg
  
  // Text - carefully calibrated contrast
  tx:       "#1E1B2E",    // primary text - dark enough to read, not pure black
  tx2:      "#4A4560",    // secondary text
  tx3:      "#8E86A8",    // muted/tertiary text
  txOnAccent: "#FFFFFF",  // text on accent bg
  
  // Accents
  accent:    "#6C63FF",   // primary violet
  accentSoft:"#9B8AFF",   // lighter violet
  accentBg:  "#F0EDFF",   // violet tint bg
  coral:     "#FF6B8A",   // secondary coral/pink
  coralBg:   "#FFF0F3",   // coral tint bg
  teal:      "#2EC4A0",   // positive/success
  tealBg:    "#E8FBF5",   // teal tint bg
  amber:     "#F5A623",   // warning
  amberBg:   "#FFF8EC",   // amber tint bg
  
  // Borders
  border:    "rgba(30, 27, 46, 0.06)", // subtle
  borderMed: "rgba(30, 27, 46, 0.10)", // medium
  borderFocus: "rgba(108, 99, 255, 0.3)", // focus ring
  
  // Shadows
  shadowSm:  "0 1px 3px rgba(30, 27, 46, 0.04), 0 1px 2px rgba(30, 27, 46, 0.02)",
  shadowMd:  "0 4px 16px rgba(30, 27, 46, 0.06), 0 1px 3px rgba(30, 27, 46, 0.04)",
  shadowLg:  "0 8px 32px rgba(108, 99, 255, 0.08), 0 2px 8px rgba(30, 27, 46, 0.04)",
  
  // Radii
  r:  12,   // small
  r2: 18,   // medium
  r3: 24,   // large (cards)
  rF: 9999, // full/pill
  
  // Fonts
  display: "'Fraunces', Georgia, serif",
  body: "'Nunito', system-ui, sans-serif",
  story: "'Literata', Georgia, serif",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Nunito:wght@400;500;600;700;800&family=Literata:ital,wght@0,400;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .skazka-input {
    width: 100%;
    padding: 13px 16px;
    border-radius: ${THEME.r2}px;
    border: 1.5px solid ${THEME.border};
    background: ${THEME.bgCard};
    font-family: ${THEME.body};
    font-size: 15px;
    font-weight: 500;
    color: ${THEME.tx};
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .skazka-input::placeholder { color: ${THEME.tx3}; font-weight: 400; }
  .skazka-input:focus {
    border-color: ${THEME.accent};
    box-shadow: 0 0 0 3px ${THEME.borderFocus};
  }

  .skazka-card {
    background: ${THEME.bgCard};
    border-radius: ${THEME.r3}px;
    border: 1px solid ${THEME.border};
    box-shadow: ${THEME.shadowSm};
    padding: 24px;
    transition: box-shadow 0.3s, transform 0.3s;
  }
  .skazka-card:hover {
    box-shadow: ${THEME.shadowMd};
  }
`;

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, letterSpacing: "0.14em",
      textTransform: "uppercase", color: THEME.tx3,
      fontFamily: THEME.body, marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function PillBtn({ children, onClick, variant = "primary", disabled, style: st }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "14px 28px", borderRadius: THEME.rF,
    fontFamily: THEME.body, fontWeight: 700, fontSize: 15,
    border: "none", cursor: disabled ? "default" : "pointer",
    transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
    opacity: disabled ? 0.5 : 1,
    letterSpacing: "0.01em",
  };
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentSoft})`,
      color: "#fff",
      boxShadow: `0 4px 20px rgba(108, 99, 255, 0.2)`,
    },
    coral: {
      background: `linear-gradient(135deg, ${THEME.coral}, #FF8FA3)`,
      color: "#fff",
      boxShadow: `0 4px 20px rgba(255, 107, 138, 0.2)`,
    },
    ghost: {
      background: THEME.accentBg,
      color: THEME.accent,
      border: `1.5px solid rgba(108, 99, 255, 0.1)`,
      padding: "10px 20px",
      fontSize: 13,
    },
    subtle: {
      background: "transparent",
      color: THEME.tx3,
      border: `1.5px solid ${THEME.border}`,
      padding: "10px 18px",
      fontSize: 13,
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...st }}
      onMouseOver={e => { if (!disabled && variant === "primary") e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseOut={e => { e.currentTarget.style.transform = ""; }}
    >
      {children}
    </button>
  );
}

function Avatar({ name, size = 36, gradient }) {
  const letter = (name || "?")[0].toUpperCase();
  const bg = gradient || `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentSoft})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.35,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontFamily: THEME.body, fontWeight: 800,
      fontSize: size * 0.4, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

function IconCircle({ icon: Icon, size = 44, bg, color }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32,
      background: bg || THEME.accentBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon size={size * 0.45} color={color || THEME.accent} strokeWidth={2} />
    </div>
  );
}

// ─────────────────────────────────────────────
// ANIMATED WRAPPER (lightweight, no GSAP needed)
// ─────────────────────────────────────────────
function AnimIn({ children, delay = 0, y = 16, style: st }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={st}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// STORAGE (same as original)
// ─────────────────────────────────────────────
const ST = {
  async get(k) { try { const v = localStorage.getItem("skazka_" + k); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(k, v) { try { localStorage.setItem("skazka_" + k, JSON.stringify(v)); } catch {} },
  async del(k) { try { localStorage.removeItem("skazka_" + k); } catch {} },
};

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("loading");
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("ru");
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  
  // Auth fields
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  
  // Add child fields
  const [newChild, setNewChild] = useState("");
  const [newAge, setNewAge] = useState("5");
  
  // API keys
  const [repToken, setRepToken] = useState("");
  const [antKey, setAntKey] = useState("");
  const [elKey, setElKey] = useState("");

  // Init
  useEffect(() => {
    (async () => {
      const u = await ST.get("user");
      const rt = await ST.get("repToken");
      const ak = await ST.get("antKey");
      const ek = await ST.get("elKey");
      const savedLang = await ST.get("lang");
      if (rt) setRepToken(rt);
      if (ak) setAntKey(ak);
      if (ek) setElKey(ek);
      if (savedLang) setLang(savedLang);
      if (u) {
        setUser(u);
        setSessions(await ST.get("sessions") || []);
        setChildren(await ST.get("children") || []);
        setView("dashboard");
      } else {
        setView("auth");
      }
    })();
  }, []);

  const register = async () => {
    if (!authName.trim() || !authEmail.trim()) return;
    const u = { name: authName.trim(), email: authEmail.trim() };
    await ST.set("user", u);
    setUser(u);
    setView("dashboard");
  };

  const addChild = async () => {
    if (!newChild.trim()) return;
    const ch = { id: Date.now().toString(), name: newChild.trim(), age: newAge };
    const upd = [...children, ch];
    setChildren(upd);
    await ST.set("children", upd);
    setNewChild("");
    setShowAdd(false);
  };

  const toggleLang = async () => {
    const next = lang === "ru" ? "en" : "ru";
    setLang(next);
    await ST.set("lang", next);
  };

  // ═══════════════════════════════════
  // AUTH SCREEN
  // ═══════════════════════════════════
  if (view === "auth") return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: THEME.body, position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>
      
      {/* Soft decorative blobs */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,99,255,0.06), transparent 70%)", top: -100, right: -80, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,138,0.05), transparent 70%)", bottom: -60, left: -60, pointerEvents: "none" }} />
      
      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto", padding: "72px 24px 48px", textAlign: "center" }}>
        {/* Logo */}
        <AnimIn delay={0.1}>
          <IconCircle icon={BookOpen} size={64} bg={`linear-gradient(135deg, ${THEME.accent}, ${THEME.accentSoft})`} color="#fff" />
        </AnimIn>
        
        {/* Title with BlurText */}
        <AnimIn delay={0.2} style={{ marginTop: 24, marginBottom: 6 }}>
          <h1 style={{ fontFamily: THEME.display, fontWeight: 600, fontSize: 38, lineHeight: 1.1 }}>
            <GradientText colors={["#6C63FF", "#FF6B8A", "#6C63FF"]} animationSpeed={6}>
              Сказка
            </GradientText>
          </h1>
        </AnimIn>
        
        <AnimIn delay={0.3}>
          <h1 style={{ fontFamily: THEME.display, fontStyle: "italic", fontWeight: 400, fontSize: 38, color: THEME.tx, lineHeight: 1.1 }}>
            Вместе
          </h1>
        </AnimIn>
        
        <AnimIn delay={0.4} style={{ marginTop: 16, marginBottom: 40 }}>
          <BlurText
            text={lang === "ru" ? "ИИ создаёт уникальную сказку. Читайте вместе с ребёнком." : "AI creates a unique story. Read it together with your child."}
            delay={60}
            animateBy="words"
            direction="top"
            className=""
            stepDuration={0.3}
          />
        </AnimIn>
        
        {/* Form card */}
        <AnimIn delay={0.5}>
          <div className="skazka-card" style={{ padding: 28, textAlign: "left" }}>
            <input
              className="skazka-input"
              value={authName}
              onChange={e => setAuthName(e.target.value)}
              placeholder={lang === "ru" ? "Ваше имя" : "Your name"}
              style={{ marginBottom: 12 }}
            />
            <input
              className="skazka-input"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              placeholder="Email"
              style={{ marginBottom: 20 }}
              onKeyDown={e => e.key === "Enter" && register()}
            />
            <PillBtn onClick={register} style={{ width: "100%" }}>
              <Sparkles size={16} />
              {lang === "ru" ? "Войти" : "Enter"}
            </PillBtn>
          </div>
        </AnimIn>
        
        {/* Social proof */}
        <AnimIn delay={0.7} style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ display: "flex" }}>
            <Avatar name="А" size={26} gradient={`linear-gradient(135deg, #FFD1DC, #FF8FA3)`} />
            <Avatar name="М" size={26} gradient={`linear-gradient(135deg, ${THEME.accentBg}, ${THEME.accentSoft})`} />
            <Avatar name="К" size={26} gradient={`linear-gradient(135deg, #A0D8EF, #64B5F6)`} />
          </div>
          <ShinyText text={lang === "ru" ? "230+ семей уже создают сказки" : "230+ families already creating stories"} speed={4} color={THEME.tx3} shineColor={THEME.accent} className="" />
        </AnimIn>
        
        {/* Disclaimer */}
        <AnimIn delay={0.8} style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Shield size={12} color={THEME.tx3} />
            <p style={{ fontSize: 11, color: THEME.tx3, lineHeight: 1.6 }}>
              {lang === "ru"
                ? "Контент безопасен для детей. Рекомендуется присутствие родителя."
                : "Content is safe for children. Parental supervision is recommended."}
            </p>
          </div>
        </AnimIn>
      </div>
    </div>
  );

  // ═══════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════
  if (view === "dashboard") return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: THEME.body, position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>
      
      {/* Blobs */}
      <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,99,255,0.05), transparent 65%)", top: -80, right: -60, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(46,196,160,0.04), transparent 65%)", bottom: 60, left: -80, pointerEvents: "none" }} />
      
      <div style={{ position: "relative", zIndex: 1, maxWidth: 540, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <AnimIn delay={0}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 13, color: THEME.tx3, marginBottom: 4, fontWeight: 500 }}>
                {lang === "ru" ? "Добрый вечер" : "Good evening"}
              </p>
              <h1 style={{ fontFamily: THEME.display, fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
                <span style={{ color: THEME.tx2 }}>{lang === "ru" ? "Привет, " : "Hello, "}</span>
                <GradientText colors={["#6C63FF", "#9B8AFF", "#6C63FF"]} animationSpeed={8}>
                  {user?.name}
                </GradientText>
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <PillBtn variant="subtle" onClick={toggleLang} style={{ padding: "8px 12px", borderRadius: THEME.r }}>
                <Globe size={14} />
                <span style={{ fontSize: 12 }}>{lang === "ru" ? "EN" : "RU"}</span>
              </PillBtn>
              <PillBtn variant="subtle" onClick={() => setShowSettings(true)} style={{ padding: "8px 12px", borderRadius: THEME.r, position: "relative" }}>
                <Settings size={14} />
                {(!repToken || !antKey) && (
                  <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: THEME.coral, border: `2px solid ${THEME.bg}` }} />
                )}
              </PillBtn>
            </div>
          </div>
        </AnimIn>

        {/* API key prompt */}
        {(!antKey || !repToken) && (
          <AnimIn delay={0.05}>
            <div
              onClick={() => setShowSettings(true)}
              className="skazka-card"
              style={{
                padding: "16px 20px", marginBottom: 16, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14,
                background: THEME.amberBg, border: `1px solid rgba(245,166,35,0.12)`,
              }}
            >
              <IconCircle icon={Palette} size={38} bg="rgba(245,166,35,0.1)" color={THEME.amber} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.tx, marginBottom: 2 }}>
                  {lang === "ru" ? "Подключите иллюстрации" : "Connect illustrations"}
                </div>
                <div style={{ fontSize: 11, color: THEME.tx3, fontWeight: 400 }}>
                  {lang === "ru" ? "Добавьте API-ключи в настройках" : "Add API keys in settings"}
                </div>
              </div>
              <ChevronRight size={16} color={THEME.amber} />
            </div>
          </AnimIn>
        )}

        {/* Children */}
        <AnimIn delay={0.08}>
          <div className="skazka-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <SectionLabel>{lang === "ru" ? "Дети" : "Children"}</SectionLabel>
              <PillBtn variant="ghost" onClick={() => setShowAdd(!showAdd)} style={{ padding: "6px 14px", borderRadius: THEME.r, fontSize: 12 }}>
                <Plus size={12} />
                {lang === "ru" ? "Добавить" : "Add"}
              </PillBtn>
            </div>
            
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{ display: "flex", gap: 8, marginBottom: 14 }}
              >
                <input
                  className="skazka-input"
                  value={newChild}
                  onChange={e => setNewChild(e.target.value)}
                  placeholder={lang === "ru" ? "Имя ребёнка" : "Child's name"}
                  style={{ flex: 1, padding: "11px 14px" }}
                />
                <select
                  value={newAge}
                  onChange={e => setNewAge(e.target.value)}
                  style={{
                    padding: "11px", borderRadius: THEME.r2, border: `1.5px solid ${THEME.border}`,
                    background: THEME.bgCard, color: THEME.tx, fontFamily: THEME.body, fontSize: 14,
                  }}
                >
                  {[3,4,5,6,7,8,9,10].map(a => <option key={a} value={a}>{a} {lang === "ru" ? "лет" : "y/o"}</option>)}
                </select>
                <PillBtn onClick={addChild} style={{ padding: "11px 16px", borderRadius: THEME.r2 }}>
                  <Check size={16} />
                </PillBtn>
              </motion.div>
            )}
            
            {children.length === 0 ? (
              <p style={{ fontSize: 13, color: THEME.tx3, textAlign: "center", padding: 20, fontWeight: 400 }}>
                {lang === "ru" ? "Добавьте ребёнка, чтобы начать" : "Add a child to begin"}
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {children.map(ch => (
                  <div
                    key={ch.id}
                    onClick={() => setActiveChild(activeChild?.id === ch.id ? null : ch)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                      borderRadius: 16, cursor: "pointer", transition: "all 0.25s",
                      background: activeChild?.id === ch.id ? THEME.accentBg : THEME.bgMuted,
                      border: `2px solid ${activeChild?.id === ch.id ? THEME.accent : "transparent"}`,
                    }}
                  >
                    <Avatar
                      name={ch.name}
                      size={34}
                      gradient={activeChild?.id === ch.id
                        ? `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentSoft})`
                        : `linear-gradient(135deg, ${THEME.accentBg}, ${THEME.accentSoft}40)`}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: THEME.tx }}>{ch.name}</div>
                      <div style={{ fontSize: 11, color: THEME.tx3, fontWeight: 400 }}>{ch.age} {lang === "ru" ? "лет" : "y/o"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimIn>

        {/* New Session CTA */}
        {children.length > 0 && (
          <AnimIn delay={0.12}>
            <div
              className="skazka-card"
              onClick={activeChild ? () => setView("setup") : undefined}
              style={{
                marginBottom: 16, cursor: activeChild ? "pointer" : "default",
                background: activeChild
                  ? `linear-gradient(135deg, ${THEME.accent}, #7B68EE, ${THEME.accentSoft})`
                  : THEME.bgCard,
                border: "none",
                padding: "26px 24px",
                opacity: activeChild ? 1 : 0.6,
                transition: "all 0.3s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: activeChild ? 14 : 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: activeChild ? "rgba(255,255,255,0.18)" : THEME.accentBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Wand2 size={20} color={activeChild ? "#fff" : THEME.accent} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: activeChild ? "#fff" : THEME.tx }}>
                    {lang === "ru" ? "Новая сказка" : "New story"}
                  </h3>
                  <p style={{ fontSize: 12, color: activeChild ? "rgba(255,255,255,0.7)" : THEME.tx3, fontWeight: 400 }}>
                    {activeChild
                      ? (lang === "ru" ? `Создать историю для ${activeChild.name}` : `Create a story for ${activeChild.name}`)
                      : (lang === "ru" ? "Выберите ребёнка" : "Select a child")}
                  </p>
                </div>
              </div>
              
              {activeChild && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { icon: TreePine, label: lang === "ru" ? "Лесная" : "Forest" },
                    { icon: Rocket, label: lang === "ru" ? "Космос" : "Space" },
                    { icon: GraduationCap, label: lang === "ru" ? "Школа" : "School" },
                  ].map(({ icon: I, label }, i) => (
                    <span key={i} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", borderRadius: 20,
                      background: "rgba(255,255,255,0.15)", color: "#fff",
                      fontSize: 11, fontWeight: 600,
                    }}>
                      <I size={12} />
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </AnimIn>
        )}

        {/* History */}
        {sessions.length > 0 && (
          <AnimIn delay={0.18}>
            <div className="skazka-card">
              <SectionLabel>{lang === "ru" ? "История" : "History"}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sessions.slice(0, 8).map((s, i) => (
                  <div key={s.id || i} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: 16, borderRadius: THEME.r2,
                    background: THEME.bgMuted, border: `1px solid ${THEME.border}`,
                    cursor: "pointer", transition: "all 0.25s",
                  }}>
                    <IconCircle icon={BookMarked} size={44} bg={THEME.tealBg} color={THEME.teal} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: THEME.tx, marginBottom: 2 }}>
                        {s.theme?.name || "Story"}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.tx3, fontWeight: 400 }}>
                        {s.child?.name} · {Math.ceil((s.duration || 0) / 60)} {lang === "ru" ? "мин" : "min"} · {s.pages?.length || 0} {lang === "ru" ? "стр." : "p."}
                      </div>
                    </div>
                    <ChevronRight size={16} color={THEME.tx3} />
                  </div>
                ))}
              </div>
            </div>
          </AnimIn>
        )}

        {/* Logout */}
        <AnimIn delay={0.22}>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <PillBtn
              variant="subtle"
              onClick={async () => { await ST.del("user"); window.location.href = "/"; }}
              style={{ fontSize: 12, gap: 6, color: THEME.tx3 }}
            >
              <LogOut size={12} />
              {lang === "ru" ? "Выйти" : "Log out"}
            </PillBtn>
          </div>
        </AnimIn>
      </div>
    </div>
  );

  // ═══ PLACEHOLDER FOR NEXT ITERATIONS ═══
  if (view === "setup" || view === "session" || view === "report") return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: THEME.body, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{CSS}</style>
      <IconCircle icon={Wand2} size={56} />
      <p style={{ fontSize: 15, color: THEME.tx2, fontWeight: 600 }}>{view} — next iteration</p>
      <PillBtn variant="ghost" onClick={() => setView("dashboard")}>
        <ArrowLeft size={14} />
        {lang === "ru" ? "Назад" : "Back"}
      </PillBtn>
    </div>
  );

  // Loading
  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <Loader2 size={24} color={THEME.accent} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
}
