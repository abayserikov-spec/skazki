import { useApp } from "context/AppContext";
import { useCallback, useEffect, useRef } from "react";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

const STYLE_REF_SETS: Record<string, string[]> = {
  book: [
    ORIGIN + "/style-refs/ref-01-interior.png",
    ORIGIN + "/style-refs/ref-02-forest.png",
    ORIGIN + "/style-refs/ref-03-group.png",
    ORIGIN + "/style-refs/ref-04-owl.png",
    ORIGIN + "/style-refs/ref-05-hedgehog.png",
    ORIGIN + "/style-refs/ref-06-fox.png",
  ],
};

const MOOD_MAP: Record<string, number> = {
  home: 0,
  school: 0,
  forest: 1,
  city: 1,
  ocean: 1,
  sports: 1,
  magic: 4,
  castle: 4,
  space: 4,
};

export function useStyleRefs() {
  const { artStyle } = useApp();
  const cacheRef = useRef<Map<string, string>>(new Map());

  const refs = STYLE_REF_SETS[artStyle] || STYLE_REF_SETS.book;

  useEffect(() => {
    refs.forEach((url) => {
      if (cacheRef.current.has(url)) return;
      fetch(url)
        .then((r) => r.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = () =>
            cacheRef.current.set(url, reader.result as string);
          reader.readAsDataURL(blob);
        })
        .catch(() => {});
    });
  }, [refs]);

  const getStyleRef = useCallback(
    (mood: string): string => {
      const url = refs[MOOD_MAP[mood] ?? 1];
      return cacheRef.current.get(url) || url;
    },
    [refs],
  );

  return { getStyleRef };
}
