import { forwardRef } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { T } from "./UI.jsx";

// ═══════════════════════════════════════════════════════════
// BookPage v2 — Full bleed illustration with embedded text
// Each page is a single image that contains both the
// illustration and the story text (rendered by Gemini NB2
// with Sassoon Primary font reference)
// ═══════════════════════════════════════════════════════════

const BookPage = forwardRef(({ page, pageNum, isCurrent, isBlurred, curImg, imgLoading, lang }, ref) => {
  const side = pageNum % 2 === 1 ? "left" : "right";
  const imgUrl = isCurrent ? (curImg || page?.imgUrl) : page?.imgUrl;
  const isImgLoading = isCurrent && imgLoading && !imgUrl;

  return (
    <div ref={ref} style={{
      width: "100%",
      height: "100%",
      background: "#FFFFFF",
      position: "relative",
      overflow: "hidden",
      boxSizing: "border-box",
    }}>
      {/* Page edge shadow for book feel */}
      {side === "left" && (
        <div style={{
          position: "absolute", top: 0, right: 0, width: 20, height: "100%",
          background: "linear-gradient(to left, rgba(0,0,0,0.04), transparent)",
          pointerEvents: "none", zIndex: 2,
        }}/>
      )}
      {side === "right" && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: 20, height: "100%",
          background: "linear-gradient(to right, rgba(0,0,0,0.05), transparent)",
          pointerEvents: "none", zIndex: 2,
        }}/>
      )}

      {page ? (
        /* ─── Page with content ─── */
        <div style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}>
          {isImgLoading ? (
            /* Loading state — warm cream with gentle spinner */
            <div style={{
              width: "100%", height: "100%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 12,
            }}>
              <Loader2
                size={20}
                color={T.accent}
                style={{ animation: "spin .8s linear infinite", opacity: 0.4 }}
              />
              <span style={{
                fontSize: 11, color: T.tx3, fontStyle: "italic",
                fontFamily: "'Sassoon Primary', 'Nunito', sans-serif",
              }}>
                {lang === "ru" ? "Рисуем страницу..." : "Painting the page..."}
              </span>
            </div>
          ) : imgUrl ? (
            /* Full bleed illustration — the entire page IS the image */
            <img
              src={imgUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              loading="lazy"
            />
          ) : (
            /* Fallback: text only (if image generation failed) */
            <div style={{
              width: "100%", height: "100%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "24px 20px",
              background: "#FFFFFF",
            }}>
              <p style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#2C1810",
                fontFamily: "'Sassoon Primary', 'Literata', Georgia, serif",
                fontWeight: 400,
                textAlign: "center",
                maxWidth: "85%",
              }}>
                {page.text}
              </p>
            </div>
          )}

          {/* Page number — subtle, bottom corner */}
          <div style={{
            position: "absolute",
            bottom: 6,
            [side === "left" ? "left" : "right"]: 10,
            fontSize: 9,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'Sassoon Primary', 'Nunito', sans-serif",
            zIndex: 3,
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}>
            {pageNum}
          </div>
        </div>
      ) : isBlurred ? (
        /* ─── Next page placeholder ─── */
        <div style={{
          height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ textAlign: "center", opacity: 0.25 }}>
            <BookOpen size={28} style={{ opacity: 0.4, marginBottom: 8, color: T.tx3 }}/>
            <div style={{
              fontSize: 11, color: T.tx3,
              fontFamily: "'Sassoon Primary', 'Nunito', sans-serif",
              fontStyle: "italic",
            }}>
              {lang === "ru" ? "Следующая страница..." : "Next page..."}
            </div>
          </div>
        </div>
      ) : (
        /* ─── Empty page ─── */
        <div style={{
          height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <BookOpen size={22} color={T.tx3} style={{ opacity: 0.12 }}/>
        </div>
      )}
    </div>
  );
});

export default BookPage;
