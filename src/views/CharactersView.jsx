import { useState } from "react";
import {
  ArrowLeft, BookOpen, Palette, Play, Trash2, Users,
  Plus, Loader2, RefreshCw, Sparkles, X,
} from "lucide-react";
import { T, CSS, PillBtn, Avatar, AnimIn } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";
import { deleteCharacter, createCharacter } from "../lib/db.js";
import { genCharPortrait } from "../lib/ai.js";
import { uploadPortrait } from "../lib/storage-cloud.js";
import { CLAUDE_MODEL } from "../lib/constants.js";

export default function CharactersView() {
  const { lang, L, setView, activeChild, artStyle, characters, setCharacters, selectedChars, setSelectedChars, refreshCharacters } = useApp();

  // ── Creator state ──
  const [showCreator, setShowCreator] = useState(false);
  const [charName, setCharName] = useState("");
  const [charDescription, setCharDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [genStep, setGenStep] = useState(null); // "portrait" | "saving"
  const [creatorError, setCreatorError] = useState(null);

  const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
  const defaultStyleRef = ORIGIN + "/style-refs/ref-02-forest.png";

  // ── Generate portrait preview ──
  const handleGenerate = async () => {
    if (!charDescription.trim()) return;
    setGenerating(true);
    setGenStep("portrait");
    setCreatorError(null);
    setPreviewUrl(null);
    try {
      const portrait = await genCharPortrait(charDescription.trim(), null, artStyle, { styleRefUrl: defaultStyleRef });
      if (portrait) {
        setPreviewUrl(portrait);
      } else {
        setCreatorError(lang === "ru" ? "Не удалось сгенерировать. Попробуйте ещё." : "Generation failed. Try again.");
      }
    } catch (err) {
      console.error("Character gen error:", err);
      setCreatorError(lang === "ru" ? "Ошибка генерации." : "Generation error.");
    }
    setGenerating(false);
    setGenStep(null);
  };

  // ── Save character ──
  const handleSave = async () => {
    if (!charName.trim() || !previewUrl || !activeChild?.id) return;
    setGenerating(true);
    setGenStep("saving");
    try {
      const tempId = Date.now().toString();
      const permUrl = await uploadPortrait(previewUrl, activeChild.id, tempId);
      const newChar = await createCharacter({
        childId: activeChild.id,
        name: charName.trim(),
        description: charDescription.trim(),
        portraitUrl: permUrl || previewUrl,
        artStyle,
      });
      if (newChar) {
        setCharacters(prev => [newChar, ...prev]);
        resetCreator();
      } else {
        setCreatorError(lang === "ru" ? "Ошибка сохранения." : "Save error.");
      }
    } catch (err) {
      console.error("Save character error:", err);
      setCreatorError(lang === "ru" ? "Ошибка сохранения." : "Save error.");
    }
    setGenerating(false);
    setGenStep(null);
  };

  // ── Suggest description via Sonnet ──
  const [suggesting, setSuggesting] = useState(false);
  const handleSuggest = async () => {
    if (!charName.trim()) return;
    setSuggesting(true);
    try {
      const prompt = lang === "ru"
        ? `Опиши внешность детского книжного персонажа по имени "${charName.trim()}" для иллюстрации. Одно предложение на английском. Включи: вид (животное/человек/существо), цвет шерсти/волос, цвет глаз, одежду, аксессуары, телосложение. Формат: "A small red fox cub with bright green eyes, wearing a blue scarf and brown leather satchel, fluffy tail with white tip". Ответь ТОЛЬКО описанием, без кавычек.`
        : `Describe the appearance of a children's book character named "${charName.trim()}" for illustration. One sentence in English. Include: species (animal/human/creature), fur/hair color, eye color, clothing, accessories, body build. Format: "A small red fox cub with bright green eyes, wearing a blue scarf and brown leather satchel, fluffy tail with white tip". Reply ONLY with the description, no quotes.`;
      const r = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 200, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await r.json();
      const txt = data?.content?.[0]?.text?.trim();
      if (txt) setCharDescription(txt);
    } catch (err) {
      console.error("Suggest error:", err);
    }
    setSuggesting(false);
  };

  const resetCreator = () => {
    setShowCreator(false);
    setCharName("");
    setCharDescription("");
    setPreviewUrl(null);
    setGenStep(null);
    setCreatorError(null);
    setGenerating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
        <AnimIn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <PillBtn variant="subtle" onClick={() => setView("dashboard")} style={{ padding: "8px 16px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
            <h2 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.tx }}>{lang === "ru" ? "Персонажи" : "Characters"}</h2>
            {activeChild && !showCreator ? (
              <PillBtn variant="ghost" onClick={() => setShowCreator(true)} style={{ padding: "8px 14px", fontSize: 12 }}>
                <Plus size={14} />{lang === "ru" ? "Создать" : "Create"}
              </PillBtn>
            ) : <div style={{ width: 80 }} />}
          </div>
        </AnimIn>

        {/* ── Character Creator ── */}
        {showCreator && (
          <AnimIn delay={0}>
            <div className="skazka-card" style={{ marginBottom: 20, padding: 20, border: `2px solid ${T.accent}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={16} color={T.accent} />
                  <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16, color: T.tx }}>
                    {lang === "ru" ? "Новый персонаж" : "New Character"}
                  </span>
                </div>
                <button onClick={resetCreator} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={16} color={T.tx3} />
                </button>
              </div>

              {/* Name */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                  {lang === "ru" ? "Имя" : "Name"}
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="skazka-input"
                    value={charName}
                    onChange={e => setCharName(e.target.value)}
                    placeholder={lang === "ru" ? "Лисёнок Рыжик" : "Rusty the Fox"}
                    style={{ flex: 1 }}
                  />
                  <PillBtn
                    variant="ghost"
                    onClick={handleSuggest}
                    disabled={!charName.trim() || suggesting}
                    style={{ padding: "10px 14px", fontSize: 11, whiteSpace: "nowrap" }}
                  >
                    {suggesting ? <Loader2 size={12} style={{ animation: "spin .8s linear infinite" }} /> : <Sparkles size={12} />}
                    {lang === "ru" ? "Придумать" : "Suggest"}
                  </PillBtn>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                  {lang === "ru" ? "Описание внешности (англ.)" : "Visual description (English)"}
                </label>
                <textarea
                  className="skazka-input"
                  value={charDescription}
                  onChange={e => setCharDescription(e.target.value)}
                  placeholder="A small red fox cub with bright green eyes, wearing a blue scarf and brown leather satchel, fluffy tail with white tip"
                  rows={3}
                  style={{ resize: "vertical", minHeight: 68, lineHeight: 1.5 }}
                />
                <p style={{ fontSize: 10, color: T.tx3, marginTop: 4 }}>
                  {lang === "ru" ? "Детальное описание на английском для генерации портрета" : "Detailed English description for portrait generation"}
                </p>
              </div>

              {/* Preview + Actions */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Portrait preview */}
                <div style={{
                  width: 140, height: 140, borderRadius: 16, background: T.bgMuted,
                  border: `2px dashed ${previewUrl ? T.teal : T.borderMed}`,
                  overflow: "hidden", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : generating && genStep === "portrait" ? (
                    <div style={{ textAlign: "center" }}>
                      <Loader2 size={24} color={T.accent} style={{ animation: "spin .8s linear infinite" }} />
                      <p style={{ fontSize: 10, color: T.tx3, marginTop: 8 }}>{lang === "ru" ? "Рисуем..." : "Drawing..."}</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: 12 }}>
                      <Users size={28} color={T.tx3} style={{ opacity: 0.3 }} />
                      <p style={{ fontSize: 10, color: T.tx3, marginTop: 4 }}>{lang === "ru" ? "Портрет" : "Portrait"}</p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <PillBtn
                    onClick={handleGenerate}
                    disabled={!charDescription.trim() || generating}
                    style={{ width: "100%", padding: "12px 16px", fontSize: 13 }}
                  >
                    {generating && genStep === "portrait"
                      ? <><Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />{lang === "ru" ? "Генерируем..." : "Generating..."}</>
                      : previewUrl
                        ? <><RefreshCw size={14} />{lang === "ru" ? "Перегенерировать" : "Regenerate"}</>
                        : <><Sparkles size={14} />{lang === "ru" ? "Сгенерировать портрет" : "Generate Portrait"}</>
                    }
                  </PillBtn>

                  {previewUrl && (
                    <PillBtn
                      variant="coral"
                      onClick={handleSave}
                      disabled={!charName.trim() || generating}
                      style={{ width: "100%", padding: "12px 16px", fontSize: 13 }}
                    >
                      {generating && genStep === "saving"
                        ? <><Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />{lang === "ru" ? "Сохраняем..." : "Saving..."}</>
                        : <><Plus size={14} />{lang === "ru" ? "Сохранить персонажа" : "Save Character"}</>
                      }
                    </PillBtn>
                  )}

                  {creatorError && (
                    <div style={{ padding: "8px 12px", borderRadius: 10, background: T.coralBg, fontSize: 11, color: T.coral, fontWeight: 600 }}>
                      {creatorError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AnimIn>
        )}

        {/* ── Character List ── */}
        {characters.length === 0 && !showCreator ? (
          <AnimIn delay={0.1}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Users size={48} color={T.tx3} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 15, color: T.tx3, marginBottom: 4 }}>{lang === "ru" ? "Пока нет персонажей" : "No characters yet"}</p>
              <p style={{ fontSize: 12, color: T.tx3, marginBottom: 16 }}>{lang === "ru" ? "Создайте персонажа или начните историю" : "Create a character or start a story"}</p>
              {activeChild && (
                <PillBtn onClick={() => setShowCreator(true)} style={{ fontSize: 13 }}>
                  <Plus size={14} />{lang === "ru" ? "Создать первого персонажа" : "Create your first character"}
                </PillBtn>
              )}
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
