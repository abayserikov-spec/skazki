import { useEffect, useRef } from "react";

export function useBookFlip(allPagesLen, viewName) {
  const bookRef = useRef(null);
  const prevPageCountRef = useRef(0);

  useEffect(() => {
    if (viewName !== "session") return;
    if (allPagesLen > prevPageCountRef.current && allPagesLen > 1 && bookRef.current) {
      const target = allPagesLen - 1;
      const spreadPage = target % 2 === 0 ? target : target - 1;
      setTimeout(() => { try { bookRef.current?.flip(spreadPage); } catch {} }, 300);
    }
    prevPageCountRef.current = allPagesLen;
  }, [allPagesLen, viewName]);

  return { bookRef };
}
