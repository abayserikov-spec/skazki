import { forwardRef } from "react";
import { BookOpen, Image, Loader2 } from "lucide-react";
import { T } from "./UI.jsx";

const BookPage = forwardRef(({ page, pageNum, isCurrent, isBlurred, curImg, imgLoading, lang }, ref) => {
  const BOOK_FONT = "'Literata', Georgia, serif";
  const LAYOUTS = ["img-top", "text-img-text", "img-big", "text-top", "img-top", "img-big"];
  const layout = LAYOUTS[(pageNum - 1) % LAYOUTS.length];
  const side = pageNum % 2 === 1 ? "left" : "right";
  const imgUrl = isCurrent ? (curImg || page?.imgUrl) : page?.imgUrl;
  const isImgLoading = isCurrent && imgLoading && !imgUrl;

  const splitText = (text) => {
    if (!text) return ["", ""];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length < 2) return [text, ""];
    const mid = Math.ceil(sentences.length / 2);
    return [sentences.slice(0, mid).join("").trim(), sentences.slice(mid).join("").trim()];
  };

  const autoFontSize = (text) => {
    if (!text) return 13;
    const len = text.length;
    if (len < 80) return 16;
    if (len < 140) return 14;
    if (len < 200) return 13;
    if (len < 280) return 12;
    return 11;
  };

  const ImgBlock = ({ big }) => (
    <div style={{
      width: "100%", margin: "0 auto", height: big ? 180 : 155,
      position: "relative", flexShrink: 0, overflow: "visible",
    }}>
      {isImgLoading ? (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
          <Loader2 size={14} color={T.tx3} style={{ animation: "spin .8s linear infinite" }} />
        </div>
      ) : imgUrl ? (
        <img src={imgUrl} alt="" style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          borderRadius: 6,
        }} loading="lazy"/>
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.15 }}>
          <Image size={14} color={T.tx3} />
        </div>
      )}
    </div>
  );

  const TextBlock = ({ text }) => (
    <div style={{ overflow: "hidden", padding: "2px 6px", flex: "1 1 auto", minHeight: 20 }}>
      <p style={{ fontSize: autoFontSize(text), lineHeight: 1.45, color: T.tx, fontFamily: BOOK_FONT, fontWeight: 400, margin: 0, textIndent: "0.8em" }}>{text}</p>
    </div>
  );

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", background: "#fff", position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
      {side === "left" && <div style={{ position: "absolute", top: 0, right: 0, width: 15, height: "100%", background: "linear-gradient(to left, rgba(0,0,0,0.03), transparent)", pointerEvents: "none", zIndex: 2 }}/>}
      {side === "right" && <div style={{ position: "absolute", top: 0, left: 0, width: 15, height: "100%", background: "linear-gradient(to right, rgba(0,0,0,0.04), transparent)", pointerEvents: "none", zIndex: 2 }}/>}
      {page ? (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 1, padding: "8px 10px 4px", gap: 3, overflow: "hidden", boxSizing: "border-box" }}>
          <div style={{ textAlign: "center", marginBottom: 1 }}><span style={{ fontSize: 11, color: T.tx3, fontWeight: 500, fontFamily: BOOK_FONT, fontStyle: "italic" }}>{page.title || ''}</span></div>
          {layout === "img-top" && <><ImgBlock/><TextBlock text={page.text}/></>}
          {layout === "text-top" && <><TextBlock text={page.text}/><ImgBlock/></>}
          {layout === "img-big" && <><ImgBlock big/><TextBlock text={page.text}/></>}
          {layout === "text-img-text" && (() => { const [t1, t2] = splitText(page.text); return <><TextBlock text={t1}/><ImgBlock/><TextBlock text={t2}/></>; })()}
          <div style={{ textAlign: side === "left" ? "left" : "right", fontSize: 9, color: T.tx3, padding: "0 8px", fontFamily: BOOK_FONT }}>{pageNum}</div>
        </div>
      ) : isBlurred ? (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", opacity: .3 }}><BookOpen size={28} style={{ opacity: .4, marginBottom: 8, color: T.tx3 }}/><div style={{ fontSize: 11, color: T.tx3, fontFamily: BOOK_FONT, fontStyle: "italic" }}>{lang === "ru" ? "Следующая страница..." : "Next page..."}</div></div>
        </div>
      ) : (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BookOpen size={22} color={T.tx3} style={{ opacity: .15 }}/>
        </div>
      )}
    </div>
  );
});

export default BookPage;
