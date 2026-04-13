import { ArrowLeft, BookOpen, BookMarked, Star, CircleDot, Heart } from "lucide-react";
import { T, CSS, PillBtn, AnimIn } from "../components/UI.jsx";
import { useApp } from "../context/AppContext.jsx";
import { getBookWithPages } from "../lib/db.js";
import { useState } from "react";
import ReadingView from "./ReadingView.jsx";

export default function LibraryView() {
  const { library, lang, L, setView } = useApp();
  const [readingBook, setReadingBook] = useState(null);

  if (readingBook) {
    return <ReadingView book={readingBook} onBack={() => setReadingBook(null)} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
        <AnimIn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <PillBtn variant="subtle" onClick={() => setView("dashboard")} style={{ padding: "8px 16px", fontSize: 12 }}><ArrowLeft size={14} />{L.back}</PillBtn>
            <h2 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.tx }}>{lang === "ru" ? "Библиотека" : "Library"}</h2>
            <div style={{ width: 80 }} />
          </div>
        </AnimIn>

        {library.length === 0 ? (
          <AnimIn delay={0.1}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <BookMarked size={48} color={T.tx3} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 15, color: T.tx3, marginBottom: 4 }}>{lang === "ru" ? "Здесь пока пусто" : "Nothing here yet"}</p>
              <p style={{ fontSize: 12, color: T.tx3 }}>{lang === "ru" ? "Завершённые истории появятся здесь" : "Completed stories will appear here"}</p>
            </div>
          </AnimIn>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {library.map((book, i) => {
              const endColors = { good: T.teal, mixed: T.amber, sad: T.coral };
              const endBgs = { good: T.tealBg, mixed: T.amberBg, sad: T.coralBg };
              return (
                <AnimIn key={book.id} delay={0.05 + i * 0.03}>
                  <div
                    onClick={async () => {
                      const full = await getBookWithPages(book.id);
                      if (full) setReadingBook(full);
                    }}
                    className="skazka-card"
                    style={{ padding: 0, cursor: "pointer", overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}
                    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadowMd; }}
                    onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = T.shadowSm; }}
                  >
                    <div style={{ width: "100%", height: 140, background: T.bgMuted, position: "relative", overflow: "hidden" }}>
                      {book.cover_image_url ? (
                        <img src={book.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <BookOpen size={28} color={T.tx3} style={{ opacity: 0.2 }} />
                        </div>
                      )}
                      {book.ending_type && (
                        <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 8px", borderRadius: 8, background: endBgs[book.ending_type], fontSize: 10, fontWeight: 700, color: endColors[book.ending_type] }}>
                          {L.ending[book.ending_type]}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.tx, marginBottom: 3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                      <div style={{ fontSize: 11, color: T.tx3 }}>{book.child?.name} · {book.page_count || 0} {L.pages}</div>
                      <div style={{ fontSize: 10, color: T.tx3, marginTop: 2 }}>{new Date(book.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </AnimIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
