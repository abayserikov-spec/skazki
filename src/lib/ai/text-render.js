// ═══════════════════════════════════════════════════════════
// TEXT RENDERING — Sassoon Primary on Canvas → base64 PNG
// ═══════════════════════════════════════════════════════════

let _fontLoaded = false;

export async function renderTextRef(text, opts = {}) {
  const { color = "#2C1810", bgColor = null, fontSize = 44, maxWidth = 600 } = opts;
  try {
    if (!_fontLoaded) {
      try {
        const font = new FontFace("Sassoon Primary", "url(/fonts/sassoon-primary.otf)");
        await font.load();
        document.fonts.add(font);
        _fontLoaded = true;
      } catch (e) {
        console.warn("Sassoon font load failed, using fallback:", e);
        _fontLoaded = true;
      }
    }

    const fontFamily = document.fonts.check(`${fontSize}px "Sassoon Primary"`)
      ? '"Sassoon Primary"'
      : '"Nunito", sans-serif';

    const padding = fontSize;
    const lineSpacing = fontSize * 0.35;

    const measure = document.createElement("canvas").getContext("2d");
    measure.font = `${fontSize}px ${fontFamily}`;

    const words = text.split(" ");
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (measure.measureText(testLine).width > maxWidth - padding * 2 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize + lineSpacing;
    const canvasWidth = maxWidth;
    const canvasHeight = Math.ceil(lines.length * lineHeight + padding * 2);

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + i * lineHeight);
    });

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Text render failed:", err);
    return null;
  }
}

export function getTextColor(intensity, textZone) {
  if (textZone?.startsWith("overlay")) return "#FFFFFF";
  if (intensity >= 70) return "#FFFFFF";
  return "#2C1810";
}
