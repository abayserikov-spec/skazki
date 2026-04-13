import {
  ArrowLeft, BookOpen, Sparkles, Check, RefreshCw, Loader2,
  BookImage, Brush, Camera,
} from "lucide-react";
import { T, CSS, PillBtn, IconCircle, AnimIn, SectionLabel } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useStory } from "../context/StoryContext.jsx";

export default function SetupView() {
  const { activeChild, lang, L, setView, artStyle, saveArtStyle, selectedChars, antKey } = useApp();
  const { backstory, setBackstory, presets, presetsLoading, generatePresets, startSession } = useStory();

  return (
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
              <PillBtn variant="ghost" onClick={() => generatePresets(activeChild.name, activeChild.age, selectedChars)} disabled={presetsLoading} style={{ padding: "6px 14px", borderRadius: T.r, fontSize: 11 }}><RefreshCw size={12} />{L.more}</PillBtn>
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
                <div key={key} onClick={() => saveArtStyle(key)} style={{ textAlign: "center", padding: "14px 8px", borderRadius: 16, border: `2px solid ${artStyle === key ? T.accent : T.border}`, background: artStyle === key ? T.accentBg : T.bgCard, cursor: "pointer", transition: "all .25s" }}>
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
}
