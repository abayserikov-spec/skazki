import {
  ArrowLeft, BookOpen, Palette, Play, Trash2, Users,
} from "lucide-react";
import { T, CSS, PillBtn, Avatar, AnimIn } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";
import { deleteCharacter } from "../lib/db.js";

export default function CharactersView() {
  const { lang, L, setView, characters, setCharacters, selectedChars, setSelectedChars } = useApp();

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
        <AnimIn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <PillBtn variant="subtle" onClick={() => setView("dashboard")} style={{ padding: "8px 16px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
            <h2 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.tx }}>{lang === "ru" ? "Персонажи" : "Characters"}</h2>
            <div style={{ width: 80 }} />
          </div>
        </AnimIn>

        {characters.length === 0 ? (
          <AnimIn delay={0.1}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Users size={48} color={T.tx3} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 15, color: T.tx3, marginBottom: 4 }}>{lang === "ru" ? "Пока нет персонажей" : "No characters yet"}</p>
              <p style={{ fontSize: 12, color: T.tx3 }}>{lang === "ru" ? "Персонажи появятся после первой истории" : "Characters appear after your first story"}</p>
            </div>
          </AnimIn>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {characters.map((c, i) => (
              <AnimIn key={c.id} delay={0.05 + i * 0.03}>
                <div className="skazka-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: 0 }}>
                    <div style={{ width: 120, minHeight: 140, background: T.bgMuted, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      {c.portrait_url ? (
                        <img src={c.portrait_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Avatar name={c.name} size={56} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}>
                      <div>
                        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17, color: T.tx, marginBottom: 6, lineHeight: 1.2 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: T.tx2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {c.description}
                        </div>
                        {c.story_arc && c.story_arc.length > 0 && (
                          <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: T.bgMuted, fontSize: 11, color: T.tx3, lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 700, color: T.tx2 }}>{lang === "ru" ? "Путь: " : "Journey: "}</span>
                            {c.story_arc.join(" → ")}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.tx3 }}>
                            <BookOpen size={12} />
                            <span>{c.stories_count || 0} {lang === "ru" ? "историй" : "stories"}</span>
                          </div>
                          {c.art_style && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.tx3 }}>
                              <Palette size={12} />
                              <span>{c.art_style}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => { setSelectedChars([c]); setView("dashboard"); }}
                            style={{ padding: "6px 12px", borderRadius: T.rF, background: T.accentBg, color: T.accent, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: T.body, display: "flex", alignItems: "center", gap: 4, transition: "all .2s" }}
                            onMouseOver={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = "#fff"; }}
                            onMouseOut={e => { e.currentTarget.style.background = T.accentBg; e.currentTarget.style.color = T.accent; }}
                          >
                            <Play size={10} />{lang === "ru" ? "Играть" : "Play"}
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(lang === "ru" ? `Удалить "${c.name}"?` : `Delete "${c.name}"?`)) {
                                await deleteCharacter(c.id);
                                setCharacters(prev => prev.filter(ch => ch.id !== c.id));
                                if (selectedChars.some(sc => sc.id === c.id)) setSelectedChars(prev => prev.filter(sc => sc.id !== c.id));
                              }
                            }}
                            style={{ padding: "6px 8px", borderRadius: T.rF, background: "transparent", color: T.tx3, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", transition: "all .2s" }}
                            onMouseOver={e => { e.currentTarget.style.background = T.coralBg; e.currentTarget.style.color = T.coral; e.currentTarget.style.borderColor = T.coral; }}
                            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.tx3; e.currentTarget.style.borderColor = T.border; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
