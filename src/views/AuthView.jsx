import { useState } from "react";
import { BookOpen, Sparkles, Shield } from "lucide-react";
import { T, CSS, PillBtn, IconCircle, AnimIn, Avatar } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";
import BlurText from "../components/reactbits/BlurText.jsx";
import GradientText from "../components/reactbits/GradientText.jsx";
import ShinyText from "../components/reactbits/ShinyText.jsx";

export default function AuthView() {
  const { register, lang, L } = useApp();
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");

  return (
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
          <BlurText text={`${L.aiCreates} ${L.readTogether}`} delay={60} animateBy="words" direction="top" stepDuration={0.3} className="" />
        </AnimIn>
        <AnimIn delay={0.5}>
          <div className="skazka-card" style={{ padding: 28, textAlign: "left" }}>
            <input className="skazka-input" value={authName} onChange={e => setAuthName(e.target.value)} placeholder={L.yourName} style={{ marginBottom: 12 }} />
            <input className="skazka-input" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder={L.email} style={{ marginBottom: 20 }} onKeyDown={e => e.key === "Enter" && register(authName, authEmail)} />
            <PillBtn onClick={() => register(authName, authEmail)} style={{ width: "100%" }}><Sparkles size={16} />{L.login}</PillBtn>
          </div>
        </AnimIn>
        <AnimIn delay={0.7} style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ display: "flex" }}>
            {["#FFD1DC", "#C4B8FF", "#A0D8EF"].map((c, i) => <Avatar key={i} name={["А", "М", "К"][i]} size={26} gradient={`linear-gradient(135deg,${c},${c}dd)`} />)}
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
}
