import { useEffect, useRef } from "react";

// allPagesLen = number of STORY pages (each = one spread = two flipbook pages)
export function useBookFlip(allPagesLen, viewName) {
  const bookRef = useRef(null);
  const prevPageCountRef = useRef(0);

  useEffect(() => {
    if (viewName !== "session") return;
    if (allPagesLen > prevPageCountRef.current && allPagesLen >= 1 && bookRef.current) {
      // Flip to the LEFT page of the latest spread (latest story idx * 2).
      const target = (allPagesLen - 1) * 2;
      setTimeout(() => { try { bookRef.current?.flip(target); } catch {} }, 300);
    }
    prevPageCountRef.current = allPagesLen;
  }, [allPagesLen, viewName]);

  return { bookRef };
}
