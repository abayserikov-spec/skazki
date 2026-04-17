import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  TrendingUp, TrendingDown,
} from "lucide-react";
import { VALS } from "../lib/constants.js";

// ─── DESIGN TOKENS ───
export const T = {
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

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Nunito:wght@400;500;600;700;800&family=Literata:ital,wght@0,400;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::selection{background:rgba(108,99,255,0.12)}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes kenburns{0%{transform:scale(1) translate(0,0)}50%{transform:scale(1.06) translate(-1%,-1%)}100%{transform:scale(1.03) translate(0.5%,0.5%)}}
.skazka-input{width:100%;padding:13px 16px;border-radius:${T.r2}px;border:1.5px solid ${T.border};background:${T.bgCard};font-family:${T.body};font-size:15px;font-weight:500;color:${T.tx};outline:none;transition:border-color .25s,box-shadow .25s}
.skazka-input::placeholder{color:${T.tx3};font-weight:400}
.skazka-input:focus{border-color:${T.accent};box-shadow:0 0 0 3px ${T.borderFocus}}
.skazka-card{background:${T.bgCard};border-radius:${T.r3}px;border:1px solid ${T.border};box-shadow:${T.shadowSm};padding:24px;transition:box-shadow .3s}
.stf__parent{background:#FFFFFF !important}
.stf__block{background:#FFFFFF !important}
`;

export function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: T.tx3, fontFamily: T.body, marginBottom: 16 }}>{children}</div>;
}

export function PillBtn({ children, onClick, variant = "primary", disabled, style: st }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 28px", borderRadius: T.rF, fontFamily: T.body, fontWeight: 700, fontSize: 15, border: "none", cursor: disabled ? "default" : "pointer", transition: "all .3s cubic-bezier(.22,1,.36,1)", opacity: disabled ? 0.45 : 1, letterSpacing: "0.01em" };
  const v = {
    primary: { background: `linear-gradient(135deg,${T.accent},${T.accentSoft})`, color: "#fff", boxShadow: "0 4px 20px rgba(108,99,255,.2)" },
    coral: { background: `linear-gradient(135deg,${T.coral},#FF8FA3)`, color: "#fff", boxShadow: "0 4px 20px rgba(255,107,138,.2)" },
    ghost: { background: T.accentBg, color: T.accent, border: "1.5px solid rgba(108,99,255,.1)", padding: "10px 20px", fontSize: 13 },
    subtle: { background: "transparent", color: T.tx3, border: `1.5px solid ${T.border}`, padding: "10px 18px", fontSize: 13 },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...v[variant], ...st }} onMouseOver={e => { if (!disabled && variant === "primary") e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseOut={e => { e.currentTarget.style.transform = ""; }}>{children}</button>;
}

export function Avatar({ name, size = 36, gradient }) {
  const letter = (name || "?")[0].toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: size * 0.35, background: gradient || `linear-gradient(135deg,${T.accent},${T.accentSoft})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: T.body, fontWeight: 800, fontSize: size * 0.4, flexShrink: 0 }}>{letter}</div>;
}

export function IconCircle({ icon: Icon, size = 44, bg, color }) {
  return <div style={{ width: size, height: size, borderRadius: size * 0.32, background: bg || T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={size * 0.45} color={color || T.accent} strokeWidth={2} /></div>;
}

export function AnimIn({ children, delay = 0, y = 16, style: st }) {
  return <motion.div initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} style={st}>{children}</motion.div>;
}

export function ValueIcon({ valKey, size = 16 }) {
  const isPos = VALS[valKey]?.pos !== false;
  return isPos ? <TrendingUp size={size} color={T.teal} /> : <TrendingDown size={size} color={T.coral} />;
}

export function ProgressBar({ current, total }) {
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

export function AnimBar({ color, pct, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const tm = setTimeout(() => setW(pct), 200 + delay); return () => clearTimeout(tm); }, [pct, delay]);
  return <div style={{ height: 8, borderRadius: 8, background: T.border, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 8, width: `${w}%`, background: color, transition: "width 1.2s cubic-bezier(.22,1,.36,1)" }} /></div>;
}
