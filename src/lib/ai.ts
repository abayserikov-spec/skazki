// ═══════════════════════════════════════════════════════════
// ANYTURN — AI Module v11 (decomposed)
//
// Modules:
//   ai/text-render.ts  — Sassoon Primary canvas rendering
//   ai/image-gen.ts    — Gemini NB2 image generation
//   ai/story-gen.ts    — Claude story generation
// ═══════════════════════════════════════════════════════════

// Re-export everything for backward compatibility
export {
  addCharToPortrait,
  genBookPage,
  genBookSpread,
  genCharPortrait,
  genFirstBookPage,
  genFirstBookSpread,
  genFirstImage,
  genNewCharPortrait,
  genNextImage,
  STYLE_ANCHORS,
  STYLE_REF_INSTRUCTION,
} from "lib/ai/image-gen";
export { genPage } from "lib/ai/story-gen";
export { getTextColor, renderTextRef } from "lib/ai/text-render";
