import {
  ArrowLeft, Star, CircleDot, Heart, BookOpen, TrendingUp, TrendingDown, Sparkles, Palette,
} from "lucide-react";
import { VALS } from "../lib/constants.js";
import { T, CSS, PillBtn, AnimIn, SectionLabel, AnimBar } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function ReadingView({ book, onBack }) {
  const { lang, L, setView } = useApp();
  const rb = book;
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
        <AnimIn>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <PillBtn variant="subtle" onClick={onBack} style={{ padding: "8px 16px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
            <span style={{ fontFamily: T.display, fontSize: 16, fontWeight: 600, color: T.tx, flex: 1 }}>{rb.title}</span>
            {rb.ending_type && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 12, background: endBgs[rb.ending_type], color: endColors[rb.ending_type], fontSize: 11, fontWeight: 700 }}>
                {rb.ending_type === "good" ? <Star size={12} /> : rb.ending_type === "mixed" ? <CircleDot size={12} /> : <Heart size={12} />}
                {L.ending[rb.ending_type]}
              </span>
            )}
          </div>
        </AnimIn>

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

        <AnimIn delay={0.2}>
          <div style={{ display: "flex", gap: 10 }}>
            <PillBtn variant="ghost" onClick={onBack} style={{ flex: 1 }}><ArrowLeft size={14} />{lang === "ru" ? "Библиотека" : "Library"}</PillBtn>
            <PillBtn variant="coral" onClick={() => setView("dashboard")} style={{ flex: 1 }}><Sparkles size={16} />{L.newSessionBtn}</PillBtn>
          </div>
        </AnimIn>
      </div>
    </div>
  );
}
