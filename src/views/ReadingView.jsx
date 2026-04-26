import { useRef } from "react";
import { ReactFlipBook } from "@vuvandinh203/react-flipbook";
import {
  ArrowLeft, ArrowRight, Star, CircleDot, Heart, BookOpen,
  TrendingUp, TrendingDown, Sparkles, Play,
} from "lucide-react";
import { VALS } from "../lib/constants.js";
import { T, CSS, PillBtn } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useStory } from "../context/StoryContext.jsx";
import { forwardRef } from "react";

// ─── Simple page component for reading mode ───
const ReadPage = forwardRef(({ imageUrl, pageNum, side }, ref) => {
  return (
    <div ref={ref} style={{
      width: "100%", height: "100%", background: "#FFFFFF",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
    }}>
      {side === "left" && (
        <div style={{
          position: "absolute", top: 0, right: 0, width: 20, height: "100%",
          background: "linear-gradient(to left, rgba(0,0,0,0.04), transparent)",
          pointerEvents: "none", zIndex: 2,
        }}/>
      )}
      {side === "right" && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: 20, height: "100%",
          background: "linear-gradient(to right, rgba(0,0,0,0.05), transparent)",
          pointerEvents: "none", zIndex: 2,
        }}/>
      )}

      {imageUrl ? (
        <img src={imageUrl} alt="" style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
        }} loading="lazy" />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <BookOpen size={22} color={T.tx3} style={{ opacity: 0.12 }} />
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 6,
        [side === "left" ? "left" : "right"]: 10,
        fontSize: 9, color: "rgba(255,255,255,0.5)",
        fontFamily: "'Sassoon Primary', 'Nunito', sans-serif",
        zIndex: 3, textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}>
        {pageNum}
      </div>
    </div>
  );
});

export default function ReadingView({ book, onBack }) {
  const { lang, L, setView, activeChild, setActiveChild } = useApp();
  const { continueSession } = useStory();
  const bookRef = useRef(null);
  const rb = book;
  const rbPages = rb.pages || [];
  const rbVals = (rb.values || []).map(v => {
    const vi = VALS[v.value_key] || {};
    const total = rb.values.reduce((s, x) => s + x.count, 0) || 1;
    return { k: v.value_key, ...vi, count: v.count, pct: Math.round((v.count / total) * 100) };
  }).sort((a, b) => b.count - a.count);

  const handleContinue = async () => {
    // Make sure activeChild matches the book's child so SessionView has the right context
    if (rb.child && activeChild?.id !== rb.child_id) {
      setActiveChild({ id: rb.child_id, name: rb.child.name, age: rb.child.age });
    }
    await continueSession(rb);
  };

  const endColors = { good: T.teal, mixed: T.amber, sad: T.coral };
  const endBgs = { good: T.tealBg, mixed: T.amberBg, sad: T.coralBg };

  const flipNext = () => { try { bookRef.current?.flipNext(); } catch {} };
  const flipPrev = () => { try { bookRef.current?.flipPrev(); } catch {} };

  return (
    <div style={{ height: "100vh", background: T.bg, fontFamily: T.body, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ padding: "8px 16px", background: "rgba(248,247,252,0.95)", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PillBtn variant="subtle" onClick={onBack} style={{ padding: "6px 14px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
        </div>
        <span style={{ fontFamily: T.display, fontSize: 14, fontWeight: 600, color: T.tx, fontStyle: "italic", flex: 1, textAlign: "center" }}>{rb.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {rb.ending_type && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 10, background: endBgs[rb.ending_type], color: endColors[rb.ending_type], fontSize: 10, fontWeight: 700 }}>
              {rb.ending_type === "good" ? <Star size={10} /> : rb.ending_type === "mixed" ? <CircleDot size={10} /> : <Heart size={10} />}
              {L.ending[rb.ending_type]}
            </span>
          )}
          <span style={{ fontSize: 11, color: T.tx3 }}>{rbPages.length} {L.pages}</span>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left nav */}
        <div style={{ width: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 0 }}>
          <button onClick={flipPrev} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.bgCard, color: T.tx3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={16} /></button>
        </div>

        {/* Center: Flipbook */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0" }}>
          {rbPages.length > 0 ? (
            <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 4 }}>
              <div style={{ position: "absolute", bottom: -6, left: "6%", right: "6%", height: 12, background: "radial-gradient(ellipse, rgba(0,0,0,0.05), transparent 70%)", borderRadius: "50%", zIndex: 0 }} />
              <ReactFlipBook
                ref={bookRef}
                width={420} height={580} size="stretch"
                minWidth={300} maxWidth={500} minHeight={400} maxHeight={680}
                drawShadow={true} flippingTime={1200} usePortrait={false} showCover={false}
                maxShadowOpacity={0.3} mobileScrollSupport={true}
                startPage={0}
                style={{ boxShadow: T.shadowMd }}
              >
                {rbPages.map((pg, i) => (
                  <ReadPage
                    key={pg.id || i}
                    imageUrl={pg.image_url}
                    pageNum={i + 1}
                    side={i % 2 === 0 ? "left" : "right"}
                  />
                ))}
              </ReactFlipBook>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <BookOpen size={32} color={T.tx3} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: T.tx3 }}>{lang === "ru" ? "Нет страниц" : "No pages"}</p>
            </div>
          )}
        </div>

        {/* Right side: nav + info */}
        <div style={{ width: 200, display: "flex", flexDirection: "column", justifyContent: "center", padding: "12px 14px 12px 4px", flexShrink: 0, gap: 10, overflowY: "auto" }}>
          <button onClick={flipNext} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.bgCard, color: T.tx3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}><ArrowRight size={16} /></button>

          {/* Book info */}
          <div style={{ padding: "10px 12px", background: T.bgCard, borderRadius: T.r, border: `1px solid ${T.border}`, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: T.tx, marginBottom: 4 }}>{rb.child?.name}, {rb.child?.age} {L.years}</div>
            {rb.premise && <p style={{ fontSize: 11, color: T.tx3, lineHeight: 1.4, marginBottom: 4 }}>{rb.premise}</p>}
            <div style={{ fontSize: 10, color: T.tx3 }}>
              {rb.duration_seconds ? Math.ceil(rb.duration_seconds / 60) : "?"} {L.min} · {new Date(rb.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Values summary */}
          {rbVals.length > 0 && (
            <div style={{ padding: "10px 12px", background: T.bgCard, borderRadius: T.r, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: T.tx3, marginBottom: 8 }}>
                {lang === "ru" ? "Ценности" : "Values"}
              </div>
              {rbVals.slice(0, 5).map(v => {
                const isPos = VALS[v.k]?.pos;
                return (
                  <div key={v.k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    {isPos ? <TrendingUp size={10} color={T.teal} /> : <TrendingDown size={10} color={T.coral} />}
                    <span style={{ fontSize: 11, color: T.tx, flex: 1 }}>{lang === "ru" ? v.n : (v.nEn || v.k)}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: v.c }}>{v.pct}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            <PillBtn variant="primary" onClick={handleContinue} style={{ width: "100%", padding: "8px 14px", fontSize: 11 }}>
              <Play size={12} />{lang === "ru" ? "Продолжить" : "Continue"}
            </PillBtn>
            <PillBtn variant="ghost" onClick={onBack} style={{ width: "100%", padding: "8px 14px", fontSize: 11 }}>
              <ArrowLeft size={12} />{lang === "ru" ? "Библиотека" : "Library"}
            </PillBtn>
            <PillBtn variant="coral" onClick={() => setView("dashboard")} style={{ width: "100%", padding: "8px 14px", fontSize: 11 }}>
              <Sparkles size={12} />{L.newSessionBtn}
            </PillBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
