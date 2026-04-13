import { motion } from "motion/react";
import { X } from "lucide-react";
import { T, PillBtn } from "./UI.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function SettingsPanel({ onClose }) {
  const { antKey, saveAntKey, geminiKey, saveGeminiKey, elKey, saveElKey, elVoiceName, L } = useApp();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(30,27,46,0.3)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: T.bgCard, borderRadius: T.r3, padding: "32px 28px", maxWidth: 420, width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: T.shadowLg }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.tx }}>{L.settings}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} color={T.tx3} /></button>
        </div>

        {[
          { label: "Anthropic API Key", value: antKey, set: saveAntKey, placeholder: "sk-ant-...", hint: "console.anthropic.com", url: "https://console.anthropic.com/settings/keys" },
          { label: "Gemini API Key", value: geminiKey, set: saveGeminiKey, placeholder: "AIza...", hint: "aistudio.google.com", url: "https://aistudio.google.com/apikey" },
          { label: "ElevenLabs API Key", value: elKey, set: saveElKey, placeholder: "sk_...", hint: "elevenlabs.io", url: "https://elevenlabs.io/app/settings/api-keys" },
        ].map(({ label, value, set, placeholder, hint, url }) => (
          <div key={label} style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.tx2, marginBottom: 6, display: "block" }}>{label}</label>
            <input
              className="skazka-input"
              value={value}
              onChange={e => set(e.target.value.trim())}
              placeholder={placeholder}
              type="password"
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <p style={{ fontSize: 11, color: T.tx3, marginTop: 4 }}>
              <a href={url} target="_blank" rel="noopener" style={{ color: T.accent }}>{hint}</a>
            </p>
          </div>
        ))}

        {/* Status indicators */}
        <div style={{ padding: 16, borderRadius: T.r2, background: T.bgMuted, marginBottom: 20 }}>
          {[
            { ok: !!antKey, on: "Sonnet connected", off: "Need Anthropic key" },
            { ok: !!geminiKey, on: "Nano Banana 2 connected", off: "Need Gemini key for illustrations" },
            { ok: !!elKey, on: `ElevenLabs — ${elVoiceName}`, off: "Using browser voice (free)" },
          ].map(({ ok, on, off }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ok ? T.teal : T.coral, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: ok ? T.teal : T.tx3 }}>{ok ? on : off}</span>
            </div>
          ))}
        </div>

        <PillBtn onClick={onClose} style={{ width: "100%" }}>{L.done}</PillBtn>
      </motion.div>
    </div>
  );
}
