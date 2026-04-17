// ═══════════════════════════════════════════════════════════
// ANYTURN — AI Module v11 (decomposed)
//
// Modules:
//   ai/text-render.js  — Sassoon Primary canvas rendering
//   ai/image-gen.js    — Gemini NB2 image generation
//   ai/story-gen.js    — Claude story generation
// ═══════════════════════════════════════════════════════════

// Re-export everything for backward compatibility
export { renderTextRef, getTextColor } from "./ai/text-render.js";
export { genCharPortrait, genNewCharPortrait, genBookPage, genFirstBookPage, genNextImage, genFirstImage, addCharToPortrait, STYLE_ANCHORS, STYLE_REF_INSTRUCTION } from "./ai/image-gen.js";
export { genPage } from "./ai/story-gen.js";
