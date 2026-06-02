import { useCallback, useEffect, useRef, useState } from "react";

const EL_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export function useTTS() {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);
  const [ttsVoice, setTtsVoice] = useState<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const pick = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      const ru = voices.filter((v) => v.lang.startsWith("ru"));
      const best = ru.find((v) => /milena|alena|yandex/i.test(v.name)) || ru[0];
      if (best) setTtsVoice(best);
    };
    pick();
    window.speechSynthesis?.addEventListener("voiceschanged", pick);
    return () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", pick);
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!text) return;
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(true);
    try {
      const cacheKey = EL_VOICE_ID + ":" + text;
      let url = ttsCacheRef.current.get(cacheKey);
      if (!url) {
        const res = await fetch(
          `/api/elevenlabs/v1/text-to-speech/${EL_VOICE_ID}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              model_id: "eleven_flash_v2_5",
              voice_settings: {
                stability: 0.55,
                similarity_boost: 0.7,
                style: 0.3,
              },
            }),
          },
        );
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        ttsCacheRef.current.set(cacheKey, url);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      audio.play();
    } catch {
      setSpeaking(false);
    }
  }, []);

  const stopSpeak = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const clearCache = useCallback(() => {
    ttsCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    ttsCacheRef.current.clear();
  }, []);

  return {
    speaking,
    ttsEnabled,
    setTtsEnabled,
    ttsVoice,
    speakText,
    stopSpeak,
    clearCache,
  };
}
