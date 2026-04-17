import { useEffect, useRef, useCallback } from "react";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
const STYLE_REFS = [
  ORIGIN + "/style-refs/ref-01-interior.png",
  ORIGIN + "/style-refs/ref-02-forest.png",
  ORIGIN + "/style-refs/ref-03-group.png",
  ORIGIN + "/style-refs/ref-04-owl.png",
  ORIGIN + "/style-refs/ref-05-hedgehog.png",
  ORIGIN + "/style-refs/ref-06-fox.png",
];

const MOOD_MAP = { home: 0, school: 0, forest: 1, city: 1, ocean: 1, sports: 1, magic: 4, castle: 4, space: 4 };

export function useStyleRefs() {
  const cacheRef = useRef(new Map());

  // Preload as base64 on mount
  useEffect(() => {
    STYLE_REFS.forEach(url => {
      fetch(url).then(r => r.blob()).then(blob => {
        const reader = new FileReader();
        reader.onload = () => cacheRef.current.set(url, reader.result);
        reader.readAsDataURL(blob);
      }).catch(() => {});
    });
  }, []);

  const getStyleRef = useCallback((mood) => {
    const url = STYLE_REFS[MOOD_MAP[mood] ?? 1];
    return cacheRef.current.get(url) || url;
  }, []);

  return { getStyleRef };
}
