import type { FlipBookRef } from "lib/types";
import { useEffect, useRef } from "react";

export function useBookFlip(allPagesLen: number, viewName: string) {
  const bookRef = useRef<FlipBookRef | null>(null);
  const prevPageCountRef = useRef<number>(0);

  useEffect(() => {
    if (viewName !== "session") return;
    if (
      allPagesLen > prevPageCountRef.current &&
      allPagesLen >= 1 &&
      bookRef.current
    ) {
      const target = (allPagesLen - 1) * 2;
      setTimeout(() => {
        try {
          bookRef.current?.flip(target);
        } catch {}
      }, 300);
    }
    prevPageCountRef.current = allPagesLen;
  }, [allPagesLen, viewName]);

  return { bookRef };
}
