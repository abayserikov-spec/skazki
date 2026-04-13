import {
  Star, CircleDot, Heart, TrendingUp, TrendingDown, Check, X,
  Lightbulb, Sparkles,
} from "lucide-react";
import { VALS } from "../lib/constants.js";
import { T, CSS, PillBtn, AnimIn, SectionLabel, AnimBar } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useStory } from "../context/StoryContext.jsx";
import GradientText from "../components/reactbits/GradientText.jsx";

export default function ReportView() {
  const { activeChild, lang, L, setView } = useApp();
  const { theme, pages, curPage, curImg, picks, t0, backstory, getVals } = useStory();

  const vals = getVals();
  const dur = t0 ? Math.ceil((Date.now() - t0) / 60000) : 0;
  const topVal = vals[0];
  const allPages = [...pages, curPage].filter(Boolean);
  const posCount = vals.filter(v => VALS[v.k]?.pos).reduce((s, v) => s + v.count, 0);
  const negCount = vals.filter(v => !VALS[v.k]?.pos).reduce((s, v) => s + v.count, 0);
  const endType = negCount > posCount ? "sad" : negCount === posCount && negCount > 0 ? "mixed" : "good";
  const endColors = { good: T.teal, mixed: T.amber, sad: T.coral };
  const endBgs = { good: T.tealBg, mixed: T.amberBg, sad: T.coralBg };

  const qs = {
    generosity: lang === "ru" ? "проявил(а) щедрость. Спросите: «Поделишься, если мало?»" : "showed generosity. Ask: 'Would you share if you had little?'",
    empathy: lang === "ru" ? "проявил(а) сочувствие! «Что сделаешь, увидев грустного?»" : "showed empathy! 'What would you do if you saw someone sad?'",
    courage: lang === "ru" ? "выбрал(а) смелость! «Что помогает, когда страшно?»" : "chose courage! 'What helps when you're scared?'",
    curiosity: lang === "ru" ? "проявил(а) любопытство. «Что хочешь исследовать?»" : "showed curiosity. 'What do you want to explore?'",
    kindness: lang === "ru" ? "выбрал(а) доброту. «Кому ты помог(ла)?»" : "chose kindness. 'Who did you help?'",
    honesty: lang === "ru" ? "выбрал(а) честность. «Почему важно говорить правду?»" : "chose honesty. 'Why is it important to tell the truth?'",
    patience: lang === "ru" ? "проявил(а) терпение. «Было ли трудно ждать?»" : "showed patience. 'Was it hard to wait?'",
    teamwork: lang === "ru" ? "выбрал(а) дружбу. «Что лучше: один или с друзьями?»" : "chose teamwork. 'What's better: alone or with friends?'",
    selfishness: lang === "ru" ? "выбрал(а) жадность. «Что потерял герой из-за жадности?»" : "chose selfishness. 'What did the hero lose because of greed?'",
    cowardice: lang === "ru" ? "выбрал(а) трусость. «Бывает страшно — но что бы ты изменил?»" : "chose cowardice. 'It's scary — but what would you change?'",
    cruelty: lang === "ru" ? "поступил(а) жестоко. «Как думаешь, что почувствовал другой?»" : "was cruel. 'How do you think the other felt?'",
    greed: lang === "ru" ? "выбрал(а) алчность. «Стоило ли это того?»" : "chose greed. 'Was it worth it?'",
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(46,196,160,0.05),transparent 65%)", top: 40, right: -80, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <AnimIn style={{ textAlign: "center", marginBottom: 28 }}>
          <SectionLabel>{L.sessionReport}</SectionLabel>
          <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 600, marginBottom: 8 }}>
            {L.journey} <GradientText colors={["#6C63FF", "#FF6B8A", "#6C63FF"]}>{activeChild?.name}</GradientText>
          </h1>
          <p style={{ fontSize: 12, color: T.tx3 }}>{theme?.name} · {dur} {L.min} · {picks.length} {L.choices} · {allPages.length} {L.pages}</p>
          <div style={{ marginTop: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 20, background: endBgs[endType], color: endColors[endType], fontSize: 13, fontWeight: 700 }}>
              {endType === "good" ? <Star size={14} /> : endType === "mixed" ? <CircleDot size={14} /> : <Heart size={14} />}
              {L.ending[endType]}
            </span>
          </div>
        </AnimIn>

        {/* Values */}
        {vals.length > 0 && <AnimIn delay={0.1}>
          <div className="skazka-card" style={{ marginBottom: 14 }}>
            <SectionLabel>{L.choicesOf} {activeChild?.name}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {vals.map((v, i) => {
                const isPos = VALS[v.k]?.pos;
                return (
                  <div key={v.k}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isPos ? <TrendingUp size={14} color={T.teal} /> : <TrendingDown size={14} color={T.coral} />}
                        <span style={{ fontWeight: 700, fontSize: 14, color: T.tx }}>{lang === "ru" ? v.n : (v.nEn || v.k)}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: isPos ? T.tealBg : T.coralBg, color: isPos ? T.teal : T.coral }}>
                          {isPos ? <Check size={10} /> : <X size={10} />}
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: v.c }}>{v.pct}%</span>
                    </div>
                    <AnimBar color={`linear-gradient(90deg,${v.c},${v.c}88)`} pct={v.pct} delay={i * 150} />
                  </div>
                );
              })}
            </div>
          </div>
        </AnimIn>}

        {/* Discussion question */}
        <AnimIn delay={0.15}>
          <div style={{ background: `linear-gradient(135deg,${T.accentBg},${T.coralBg})`, borderRadius: T.r3, padding: 22, marginBottom: 14, border: `1px solid rgba(108,99,255,0.06)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Lightbulb size={14} color={T.accent} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: T.accent }}>{L.discussionQ}</span>
            </div>
            <p style={{ fontFamily: T.display, fontStyle: "italic", fontSize: 15, lineHeight: 1.7, color: T.tx2 }}>
              {activeChild?.name} {qs[topVal?.k] || (lang === "ru" ? "Что запомнилось из сказки?" : "What do you remember from the story?")}
            </p>
          </div>
        </AnimIn>

        {/* Full story recap */}
        <AnimIn delay={0.2}>
          <div className="skazka-card" style={{ marginBottom: 14 }}>
            <SectionLabel>{L.fullStory}</SectionLabel>
            {backstory && <div style={{ marginBottom: 16, padding: "12px 14px", background: T.accentBg, borderRadius: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: 4 }}>{L.parentPremise}</div>
              <p style={{ fontFamily: T.display, fontSize: 13, fontStyle: "italic", lineHeight: 1.6, color: T.tx2 }}>{backstory}</p>
            </div>}
            {allPages.map((pg, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: i < allPages.length - 1 ? 16 : 0, borderBottom: i < allPages.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.accent, flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontFamily: T.display, fontSize: 13, fontWeight: 600, color: T.accent, fontStyle: "italic" }}>{pg?.title}</span>
                </div>
                {pg?.imgUrl && <div style={{ marginBottom: 8, borderRadius: T.r2, overflow: "hidden", border: `1px solid ${T.border}`, maxHeight: 200 }}><img src={pg.imgUrl} alt="" style={{ width: "100%", display: "block", objectFit: "cover" }} /></div>}
                <p style={{ fontFamily: T.story, fontSize: 14, fontStyle: "italic", lineHeight: 1.8, color: T.tx2 }}>{pg?.text}</p>
                {pg?.choice && (() => {
                  const isPos = VALS[pg.choice.value]?.pos !== false;
                  return <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: isPos ? T.tealBg : T.coralBg, fontSize: 11, color: isPos ? T.teal : T.coral, fontWeight: 600 }}>
                    {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {pg.choice.label}
                  </div>;
                })()}
              </div>
            ))}
          </div>
        </AnimIn>

        {/* Decision path */}
        {picks.length > 0 && <AnimIn delay={0.25}>
          <div className="skazka-card" style={{ marginBottom: 20 }}>
            <SectionLabel>{L.decisionPath}</SectionLabel>
            <div style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, borderRadius: 2, background: `linear-gradient(180deg,${T.accent},${T.accentSoft},${T.coral},${T.amber})` }} />
              {picks.map((p, i) => {
                const vl = VALS[p.value] || {};
                const isPos = vl.pos !== false;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", position: "relative" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: vl.c || T.tx3, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, zIndex: 1, boxShadow: `0 0 0 4px ${T.bg}`, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 14, fontWeight: 600, flex: 1, color: T.tx }}>{p.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: isPos ? T.tealBg : T.coralBg, color: isPos ? T.teal : T.coral }}>
                      {lang === "ru" ? vl.n : (vl.nEn || p.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimIn>}

        {/* Actions */}
        <AnimIn delay={0.3}>
          <div style={{ display: "flex", gap: 10 }}>
            <PillBtn variant="coral" onClick={() => setView("dashboard")} style={{ flex: 1 }}><Sparkles size={16} />{L.newSessionBtn}</PillBtn>
            <PillBtn variant="ghost" onClick={() => setView("dashboard")} style={{ flex: 1 }}>{L.dashboardBtn}</PillBtn>
          </div>
        </AnimIn>
      </div>
    </div>
  );
}
