import { motion } from "motion/react";
import { X } from "lucide-react";
import { T, PillBtn } from "./UI.jsx";
import { useApp } from "../context/AppContext.jsx";

const MODEL_OPTIONS = [
  { key: "nb2-default", label: "Nano Banana 2 (default)", hint: "Gemini 3.1, текущая" },
  { key: "nb2-minimal", label: "NB2 + minimal thinking", hint: "NB2 с явным thinkingLevel=minimal" },
  { key: "nb1", label: "Nano Banana 1", hint: "Gemini 2.5, старая но может быть быстрее" },
];

export default function SettingsPanel({ onClose }) {
  const { geminiModel, saveGeminiModel, L } = useApp();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(30,27,46,0.3)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: T.bgCard, borderRadius: T.r3, padding: "32px 28px", maxWidth: 420, width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: T.shadowLg }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.tx }}>{L?.settings || "Settings"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} color={T.tx3} /></button>
        </div>

        {/* ─── Image Model Selector (A/B testing) ─── */}
        <div style={{ marginBottom: 20, padding: 16, borderRadius: T.r2, background: T.bgMuted }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.tx2, marginBottom: 10, display: "block" }}>
            Image model (A/B test)
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {MODEL_OPTIONS.map(opt => {
              const selected = (geminiModel || "nb2-default") === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => saveGeminiModel && saveGeminiModel(opt.key)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "10px 12px",
                    borderRadius: T.r1,
                    border: `1.5px solid ${selected ? T.accent : "transparent"}`,
                    background: selected ? `${T.accent}14` : T.bgCard,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: selected ? 600 : 500, color: selected ? T.accent : T.tx }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>
                    {opt.hint}
                  </span>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: T.tx3, marginTop: 10, lineHeight: 1.4 }}>
            Переключение сразу. В DevTools Console ищи <code style={{ fontFamily: "monospace", background: T.bgCard, padding: "1px 4px", borderRadius: 3 }}>preset=…</code>
          </p>
        </div>

        <PillBtn onClick={onClose} style={{ width: "100%" }}>{L?.done || "Done"}</PillBtn>
      </motion.div>
    </div>
  );
}
