import { useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext.jsx";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

// Sets of reference images per art style.
// Add new style? Just add a new key here with the same shape (6 refs in same mood order).
// Mood index: 0 = home/school, 1 = forest/city/ocean/sports, 4 = magic/castle/space.
const STYLE_REF_SETS = {
  book: [
    ORIGIN + "/style-refs/ref-01-interior.png",
    ORIGIN + "/style-refs/ref-02-forest.png",
    ORIGIN + "/style-refs/ref-03-group.png",
    ORIGIN + "/style-refs/ref-04-owl.png",
    ORIGIN + "/style-refs/ref-05-hedgehog.png",
    ORIGIN + "/style-refs/ref-06-fox.png",
  ],
  // book2: [
  //   ORIGIN + "/style-refs/book2/ref-01-interior.png",
  //   ORIGIN + "/style-refs/book2/ref-02-forest.png",
  //   ORIGIN + "/style-refs/book2/ref-03-group.png",
  //   ORIGIN + "/style-refs/book2/ref-04-owl.png",
  //   ORIGIN + "/style-refs/book2/ref-05-hedgehog.png",
  //   ORIGIN + "/style-refs/book2/ref-06-fox.png",
  // ],
};

const MOOD_MAP = { home: 0, school: 0, forest: 1, city: 1, ocean: 1, sports: 1, magic: 4, castle: 4, space: 4 };

export function useStyleRefs() {
  const { artStyle } = useApp();
  const cacheRef = useRef(new Map());

  // Pick the active set, fall back to "book" if unknown style is selected
  const refs = STYLE_REF_SETS[artStyle] || STYLE_REF_SETS.book;

  // Preload as base64 whenever active style changes
  useEffect(() => {
    refs.forEach(url => {
      if (cacheRef.current.has(url)) return;
      fetch(url).then(r => r.blob()).then(blob => {
        const reader = new FileReader();
        reader.onload = () => cacheRef.current.set(url, reader.result);
        reader.readAsDataURL(blob);
      }).catch(() => {});
    });
  }, [refs]);

  const getStyleRef = useCallback((mood) => {
    const url = refs[MOOD_MAP[mood] ?? 1];
    return cacheRef.current.get(url) || url;
  }, [refs]);

  return { getStyleRef };
}
