// api/render-text.js — Vercel serverless function
// Renders story text with Sassoon Primary font as PNG base64
// Used as reference image for Gemini to embed text in illustrations

import { createCanvas, registerFont } from "canvas";
import path from "path";

// Register Sassoon Primary font
// Place sassoon-primary.otf in /public/fonts/ or /api/fonts/
try {
  registerFont(path.join(process.cwd(), "public", "fonts", "sassoon-primary.otf"), {
    family: "Sassoon Primary",
  });
} catch (e) {
  console.warn("Sassoon font not found, falling back to sans-serif:", e.message);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, color = "#2C1810", bgColor = null, fontSize = 44, maxWidth = 600 } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const fontFamily = "Sassoon Primary";
    const lineSpacing = fontSize * 0.35;
    const padding = fontSize;

    // Measure text with word wrapping
    const measureCanvas = createCanvas(1, 1);
    const measureCtx = measureCanvas.getContext("2d");
    measureCtx.font = `${fontSize}px "${fontFamily}"`;

    // Word-wrap text
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = measureCtx.measureText(testLine);
      if (metrics.width > maxWidth - padding * 2 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Calculate canvas dimensions
    const lineHeight = fontSize + lineSpacing;
    const textHeight = lines.length * lineHeight;
    const canvasWidth = maxWidth;
    const canvasHeight = Math.ceil(textHeight + padding * 2);

    // Render
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Background
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    // If no bgColor, canvas is transparent (for overlay on dark scenes)

    // Text
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";

    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + i * lineHeight);
    });

    // Convert to base64
    const buffer = canvas.toBuffer("image/png");
    const base64 = buffer.toString("base64");

    return res.status(200).json({
      base64: `data:image/png;base64,${base64}`,
      width: canvasWidth,
      height: canvasHeight,
      lines: lines.length,
    });
  } catch (e) {
    console.error("Text render error:", e);
    return res.status(500).json({ error: e.message });
  }
}
