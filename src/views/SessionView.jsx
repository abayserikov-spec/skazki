import { ReactFlipBook } from "@vuvandinh203/react-flipbook";
import {
  BookOpen, Loader2, ArrowLeft, ArrowRight, ChevronRight,
  Volume2, VolumeX, TrendingUp, TrendingDown, BarChart3,
} from "lucide-react";
import { TOTAL_PAGES, VALS } from "../lib/constants.js";
import { genPage } from "../lib/ai.js";
import { T, CSS, PillBtn } from "../components/UI.jsx";
import BookPage from "../components/BookPage.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useStory } from "../context/StoryContext.jsx";

export default function SessionView() {
  const app = useApp();
  const story = useStory();
  const { activeChild, lang, L, setView } = app;
  const {
    theme, pages, curPage, curImg, imgLoading, loading, sel, error,
    timer, customInput, setCustomInput, textDone, picks,
    speaking, speakText, stopSpeak,
    bookRef, fmtT, genStep,
    pickChoice, submitCustom, finishSession,
    setError, setLoading, setCurPage,
  } = story;

  const allPages = curPage ? [...pages, { ...curPage, _curImg: curImg, _isCurrent: true }] : [...pages];
  const totalReady = allPages.length;
  const showChoices = curPage && !curPage.isEnd && textDone && !loading && !sel;
  const showEnd = curPage && curPage.isEnd;
  const childName = activeChild?.name || "";
  const flipNext = () => { try { bookRef.current?.flipNext(); } catch {} };
  const flipPrev = () => { try { bookRef.current?.flipPrev(); } catch {} };

  return (
    <div style={{ height: "100vh", background: T.bg, fontFamily: T.body, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ padding: "8px 16px", background: "rgba(248,247,252,0.95)", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={16} color={T.accent} />
          <span style={{ fontFamily: T.display, fontSize: 14, fontWeight: 500, color: T.tx, fontStyle: "italic" }}>{childName}</span>
          <span style={{ fontSize: 11, color: T.tx3, fontFamily: "monospace" }}>{fmtT(timer)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.tx3 }}>{totalReady}/{TOTAL_PAGES}</span>
          <PillBtn variant="ghost" onClick={() => { if (curPage) finishSession(); else setView("dashboard"); }} style={{ padding: "5px 14px", fontSize: 12 }}>{L.finish}</PillBtn>
        </div>
      </div>

      {/* Main: LEFT | BOOK | RIGHT */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT: Nav + TTS */}
        <div style={{ width: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 4px", flexShrink: 0 }}>
          <button onClick={flipPrev} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.bgCard, color: T.tx3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={16}/></button>
          <button onClick={() => { if (speaking) stopSpeak(); else if (curPage) speakText(curPage.tts_text || curPage.text); }} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${T.border}`, background: speaking ? T.accentBg : T.bgCard, color: speaking ? T.accent : T.tx3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{speaking ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>
        </div>

        {/* CENTER: Book */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0" }}>
          {loading && totalReady === 0 ? (
            <div style={{ textAlign: "center", maxWidth: 320 }}>
              {/* Step-by-step generation progress */}
              <div style={{ marginBottom: 20 }}>
                {[
                  { key: "story", labelRu: "Придумываем историю", labelEn: "Writing the story", icon: "✍️" },
                  { key: "portrait", labelRu: "Создаём персонажа", labelEn: "Creating character", icon: "🎨" },
                  { key: "portrait-1", labelRu: "Создаём первого персонажа", labelEn: "Creating first character", icon: "🎨" },
                  { key: "portrait-2", labelRu: "Создаём второго персонажа", labelEn: "Creating second character", icon: "🎨" },
                  { key: "page", labelRu: "Рисуем первую страницу", labelEn: "Painting the first page", icon: "📖" },
                ].map(step => {
                  const isActive = genStep === step.key;
                  const isDone = !isActive && (
                    (step.key === "story" && genStep !== "story" && genStep !== null) ||
                    (step.key === "portrait" && ["page", "next-page"].includes(genStep)) ||
                    (step.key === "portrait-1" && ["portrait-2", "page", "next-page"].includes(genStep)) ||
                    (step.key === "portrait-2" && ["page", "next-page"].includes(genStep)) ||
                    (step.key === "page" && genStep === null && !loading)
                  );
                  const isVisible = isActive || isDone;
                  if (!isVisible) return null;
                  return (
                    <div key={step.key} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                      opacity: isActive ? 1 : 0.5,
                      transition: "opacity 0.3s",
                    }}>
                      {isActive ? (
                        <Loader2 size={16} color={T.accent} style={{ animation: "spin .8s linear infinite", flexShrink: 0 }} />
                      ) : (
                        <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>
                      )}
                      <span style={{
                        fontFamily: T.display, fontSize: 13, color: isActive ? T.tx : T.tx3,
                        fontStyle: "italic", fontWeight: isActive ? 600 : 400,
                      }}>
                        {step.icon} {lang === "ru" ? step.labelRu : step.labelEn}
                        {isActive && <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>...</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!genStep && loading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Loader2 size={20} color={T.accent} style={{ animation: "spin .8s linear infinite" }}/>
                  <p style={{ fontFamily: T.display, fontSize: 14, color: T.tx3, fontStyle: "italic" }}>
                    {L.creatingStory} {childName}...
                  </p>
                </div>
              )}
              {error && <div style={{ marginTop: 12, padding: "10px 14px", background: T.coralBg, borderRadius: T.r, border: `1px solid rgba(255,107,138,0.15)`, fontSize: 12, color: T.coral }}>
                {error}
                <PillBtn variant="coral" onClick={() => {
                  setError(null); setLoading(true);
                  genPage({ name: activeChild.name, age: activeChild.age, theme: theme.prompt, history: pages.map(p => ({ text: p.text, choice: p.choice, mood: p.mood, sceneSummary: p.sceneSummary, actionSummary: p.actionSummary })), choice: picks[picks.length-1] || null, charDesc: story.charDesc, lang })
                    .then(r => { setCurPage(r); setLoading(false); })
                    .catch(() => { setError("Retry failed."); setLoading(false); });
                }} style={{ marginTop: 8, padding: "6px 16px", fontSize: 11 }}>Retry</PillBtn>
              </div>}
            </div>
          ) : (
            <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 4 }}>
              <div style={{ position: "absolute", bottom: -6, left: "6%", right: "6%", height: 12, background: "radial-gradient(ellipse, rgba(0,0,0,0.05), transparent 70%)", borderRadius: "50%", zIndex: 0 }}/>
              <ReactFlipBook
                key={`book-${allPages.map((p,i) => `${p?.text?.length||0}${p?.imgUrl?'I':'_'}${(i===totalReady-1 && curImg)?'C':''}`).join('-')}`}
                ref={bookRef}
                width={420} height={580} size="stretch"
                minWidth={300} maxWidth={500} minHeight={400} maxHeight={680}
                drawShadow={true} flippingTime={1200} usePortrait={false} showCover={false}
                maxShadowOpacity={0.3} mobileScrollSupport={true}
                startPage={Math.max(0, (totalReady > 1 ? (totalReady % 2 === 0 ? totalReady - 2 : totalReady - 1) : 0))}
                style={{ boxShadow: T.shadowMd }}
              >
                {[0,1,2,3,4,5].map(i => {
                  const pg = allPages[i] || null;
                  const isCur = pg?._isCurrent || false;
                  const isBlur = !pg && i > 0 && allPages[i-1] && i === totalReady;
                  return <BookPage key={i} page={pg} pageNum={i + 1} isCurrent={isCur} isBlurred={isBlur} curImg={curImg} imgLoading={imgLoading} lang={lang} />;
                })}
              </ReactFlipBook>
            </div>
          )}
        </div>

        {/* RIGHT: Forward + Choices */}
        <div style={{ width: 200, display: "flex", flexDirection: "column", justifyContent: "center", padding: "12px 14px 12px 4px", flexShrink: 0, gap: 6 }}>
          <button onClick={flipNext} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.bgCard, color: T.tx3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}><ArrowRight size={16}/></button>

          {showEnd ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: T.display, fontSize: 14, color: T.accent, fontWeight: 600, fontStyle: "italic", marginBottom: 8 }}>{L.end}</p>
              {imgLoading && <p style={{ fontSize: 10, color: T.tx3, marginBottom: 6 }}>{lang === "ru" ? "Ждём иллюстрацию..." : "Waiting..."}</p>}
              <PillBtn onClick={finishSession} disabled={imgLoading} style={{ width: "100%", padding: "10px 14px", fontSize: 12 }}>
                <BarChart3 size={14} />{L.viewReport}
              </PillBtn>
            </div>
          ) : showChoices ? (
            <div>
              <div style={{ fontSize: 10, color: T.tx3, textAlign: "center", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{L.whatNext}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {curPage.choices?.map((ch, i) => {
                  const valInfo = VALS[ch.value] || {};
                  const isPos = valInfo.pos !== false;
                  return (
                    <button key={i} onClick={() => pickChoice(ch)} disabled={!!sel || loading} style={{
                      background: sel === ch.label ? T.accentBg : T.bgCard,
                      border: `1.5px solid ${sel === ch.label ? T.accent : T.border}`,
                      borderRadius: T.r, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8,
                      fontSize: 12, fontWeight: 600, fontFamily: T.body, color: T.tx, textAlign: "left",
                      cursor: sel ? "default" : "pointer", transition: "all .25s",
                    }}>
                      {isPos ? <TrendingUp size={12} color={T.teal} style={{ flexShrink: 0 }} /> : <TrendingDown size={12} color={T.coral} style={{ flexShrink: 0 }} />}
                      <span style={{ flex: 1, lineHeight: 1.3 }}>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 9, color: T.tx3, textAlign: "center", marginBottom: 4 }}>{L.orCustom}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <input value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submitCustom()} placeholder="..." style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgCard, color: T.tx, fontSize: 12, fontFamily: T.body, outline: "none" }}/>
                  <button onClick={submitCustom} disabled={!customInput.trim()} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: customInput.trim() ? T.accent : T.bgMuted, color: customInput.trim() ? "#fff" : T.tx3, fontSize: 12, fontWeight: 700, fontFamily: T.body, cursor: customInput.trim() ? "pointer" : "default" }}><ChevronRight size={14}/></button>
                </div>
              </div>
            </div>
          ) : loading && totalReady > 0 ? (
            <div style={{ textAlign: "center" }}>
              <Loader2 size={16} color={T.accent} style={{ animation: "spin .8s linear infinite", margin: "0 auto 6px" }}/>
              <p style={{ fontSize: 11, color: T.tx3, fontStyle: "italic" }}>{L.continuing}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
