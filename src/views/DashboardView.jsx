import { useState } from "react";
import {
  LogOut, Plus, Check, BookOpen, ChevronRight,
  Globe, Wand2, BookMarked, Sparkles, Users,
} from "lucide-react";
import { T, CSS, PillBtn, Avatar, IconCircle, AnimIn, SectionLabel } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useStory } from "../context/StoryContext.jsx";
import GradientText from "../components/reactbits/GradientText.jsx";

export default function DashboardView() {
  const app = useApp();
  const story = useStory();
  const {
    user, lang, L, toggleLang,
    childrenList, activeChild, setActiveChild,
    characters, selectedChars, setSelectedChars,
    library, sessions, logout, addChild, setView,
  } = app;
  const { generatePresets, setBackstory } = story;

  const [showAdd, setShowAdd] = useState(false);
  const [newChild, setNewChild] = useState("");
  const [newAge, setNewAge] = useState("5");

  const handleAddChild = async () => {
    if (!newChild.trim()) return;
    await addChild(newChild.trim(), newAge);
    setNewChild("");
    setShowAdd(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>
      <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(108,99,255,0.05),transparent 65%)", top: -80, right: -60, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 540, margin: "0 auto", padding: "32px 20px" }}>
        <AnimIn>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 13, color: T.tx3, marginBottom: 4, fontWeight: 500 }}>{lang === "ru" ? "Добрый вечер" : "Good evening"}</p>
              <h1 style={{ fontFamily: T.display, fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
                <span style={{ color: T.tx2 }}>{L.hello}, </span>
                <GradientText colors={["#6C63FF", "#9B8AFF", "#6C63FF"]} animationSpeed={8}>{user?.name}</GradientText>
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <PillBtn variant="subtle" onClick={toggleLang} style={{ padding: "8px 12px", borderRadius: T.r }}><Globe size={14} /><span style={{ fontSize: 12 }}>{lang === "ru" ? "EN" : "RU"}</span></PillBtn>
            </div>
          </div>
        </AnimIn>

        {/* Children selector */}
        <AnimIn delay={0.05}>
          <div className="skazka-card" style={{ marginBottom: 16 }}>
            <SectionLabel>{L.children}</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: showAdd ? 14 : 0 }}>
              {childrenList.map(ch => (
                <div key={ch.id} onClick={() => setActiveChild(ch)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: T.rF, cursor: "pointer", transition: "all .25s", background: activeChild?.id === ch.id ? `linear-gradient(135deg,${T.accent},${T.accentSoft})` : T.bgMuted, color: activeChild?.id === ch.id ? "#fff" : T.tx, fontWeight: 600, fontSize: 14 }}>
                  <Avatar name={ch.name} size={24} gradient={activeChild?.id === ch.id ? "rgba(255,255,255,0.2)" : undefined} />
                  {ch.name}
                  {activeChild?.id === ch.id && <Check size={14} />}
                </div>
              ))}
              <div onClick={() => setShowAdd(!showAdd)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: T.rF, cursor: "pointer", border: `1.5px dashed ${T.borderMed}`, color: T.tx3, fontSize: 13, fontWeight: 600, transition: "all .25s" }}>
                <Plus size={14} />{L.addChild}
              </div>
            </div>
            {showAdd && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="skazka-input" value={newChild} onChange={e => setNewChild(e.target.value)} placeholder={L.childName} style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && handleAddChild()} />
                <select value={newAge} onChange={e => setNewAge(e.target.value)} style={{ padding: "12px 10px", borderRadius: T.r2, border: `1.5px solid ${T.border}`, fontFamily: T.body, fontSize: 14, fontWeight: 600, color: T.tx, background: T.bgCard }}>
                  {Array.from({ length: 10 }, (_, i) => <option key={i + 3} value={i + 3}>{i + 3} {L.years}</option>)}
                </select>
                <PillBtn onClick={handleAddChild} style={{ padding: "12px 16px" }}><Check size={16} /></PillBtn>
              </div>
            )}
          </div>
        </AnimIn>

        {/* Character picker */}
        {activeChild && characters.length > 0 && <AnimIn delay={0.08}>
          <div className="skazka-card" style={{ marginBottom: 16 }}>
            <SectionLabel>{lang === "ru" ? "Выберите персонажа" : "Pick a character"}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div onClick={() => setSelectedChars([])}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 14, cursor: "pointer", transition: "all .25s", background: selectedChars.length === 0 ? T.accentBg : T.bgMuted, border: `2px solid ${selectedChars.length === 0 ? T.accent : "transparent"}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={16} color={T.accent} />
                </div>
                <div><div style={{ fontWeight: 600, fontSize: 13, color: T.tx }}>{lang === "ru" ? "Новый герой" : "New character"}</div></div>
              </div>
              {characters.map(c => {
                const isSelected = selectedChars.some(sc => sc.id === c.id);
                return (
                  <div key={c.id}
                    onClick={() => setSelectedChars(prev => isSelected ? prev.filter(sc => sc.id !== c.id) : [...prev, c])}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 14, cursor: "pointer", transition: "all .25s", background: isSelected ? T.tealBg : T.bgMuted, border: `2px solid ${isSelected ? T.teal : "transparent"}`, position: "relative" }}>
                    {c.portrait_url ? (
                      <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                        <img src={c.portrait_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : <Avatar name={c.name} size={36} />}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: T.tx }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: T.tx3 }}>{c.stories_count || 0} {lang === "ru" ? "историй" : "stories"}</div>
                    </div>
                    {isSelected && (
                      <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, background: T.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Companion suggestions */}
            {selectedChars.length > 0 && (() => {
              const selectedIds = new Set(selectedChars.map(sc => sc.id));
              const suggestedIds = new Set();
              selectedChars.forEach(sc => { (sc.companion_ids || []).forEach(cid => { if (!selectedIds.has(cid)) suggestedIds.add(cid); }); });
              const suggested = characters.filter(c => suggestedIds.has(c.id));
              if (suggested.length === 0) return null;
              return (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: T.bgMuted, border: `1px dashed ${T.borderMed}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.tx3, marginBottom: 8 }}>{lang === "ru" ? "Также участвовали:" : "Also appeared together:"}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {suggested.map(c => (
                      <div key={c.id} onClick={() => setSelectedChars(prev => [...prev, c])}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 10, cursor: "pointer", background: T.bgCard, border: `1.5px solid ${T.border}`, transition: "all .2s", fontSize: 12, fontWeight: 600, color: T.tx }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.background = T.tealBg; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bgCard; }}>
                        {c.portrait_url ? (
                          <div style={{ width: 24, height: 24, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                            <img src={c.portrait_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ) : <Avatar name={c.name} size={24} />}
                        <span>{c.name}</span>
                        <Plus size={12} color={T.teal} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </AnimIn>}

        {/* New Session CTA */}
        {childrenList.length > 0 && <AnimIn delay={0.12}>
          <div onClick={activeChild ? () => { story.setBackstory(""); setView("setup"); generatePresets(activeChild.name, activeChild.age, selectedChars); } : undefined}
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

        {/* Library */}
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
                ) : <Avatar key={c.id} name={c.name} size={32} />
              ))}
            </div>
            <ChevronRight size={16} color={T.accent} />
          </div>
        </AnimIn>}

        {/* History fallback */}
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
            <PillBtn variant="subtle" onClick={logout} style={{ fontSize: 12, gap: 6, color: T.tx3 }}><LogOut size={12} />{L.logout}</PillBtn>
          </div>
        </AnimIn>
      </div>
    </div>
  );
}
