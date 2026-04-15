// ═══════════════════════════════════════════════════════════
// AnyTurn — Text-in-Illustration Test
// Run: node test_text_ref.js
// 
// Tests 3 approaches:
// 1. Text ref image + scene → Gemini combines them
// 2. Scene with negative space → programmatic text overlay
// 3. Direct text-in-prompt → Gemini renders text itself
//
// Requires: GEMINI_API_KEY env var
// ═══════════════════════════════════════════════════════════

import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY env var");
  process.exit(1);
}

const STYLE = `Warm watercolor children's book illustration on cream textured paper. Thin pencil outlines visible underneath transparent watercolor washes. Soft muted palette: ochre, burnt sienna, sage green, dusty blue, warm grey. Visible paper grain showing through thin paint layers. Gentle imperfect hand-drawn quality. Similar to Oliver Jeffers and Benji Davies picture book style.`;

// Load text ref as base64
function loadImage(filepath) {
  const buf = fs.readFileSync(filepath);
  return buf.toString("base64");
}

async function geminiGenerate(prompt, referenceImages = [], aspectRatio = "3:4") {
  const parts = [{ text: prompt }];

  for (const img of referenceImages) {
    if (!img) continue;
    let base64Data, mimeType;
    if (img.startsWith("data:")) {
      const match = img.match(/^data:([^;]+);base64,(.+)$/);
      if (match) { mimeType = match[1]; base64Data = match[2]; }
    } else {
      // File path
      base64Data = loadImage(img);
      mimeType = "image/png";
    }
    if (base64Data) {
      parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.error) {
    console.error("Gemini error:", data.error.message);
    return null;
  }

  const result = { text: null, imageBase64: null, mimeType: null };
  const partsOut = data.candidates?.[0]?.content?.parts || [];
  for (const part of partsOut) {
    if (part.thought) continue;
    if (part.text && !result.text) result.text = part.text;
    if (part.inlineData && !result.imageBase64) {
      result.imageBase64 = part.inlineData.data;
      result.mimeType = part.inlineData.mimeType || "image/png";
    }
  }
  return result;
}

async function saveResult(name, result) {
  if (!result?.imageBase64) {
    console.log(`  ✗ ${name}: No image returned`);
    if (result?.text) console.log(`    Text: ${result.text.slice(0, 200)}`);
    return;
  }
  const outDir = "./test_results";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, `${name}.png`);
  fs.writeFileSync(outPath, Buffer.from(result.imageBase64, "base64"));
  console.log(`  ✓ ${name}: saved to ${outPath}`);
  if (result.text) console.log(`    Gemini said: ${result.text.slice(0, 150)}`);
}

// ═══════════════════════════════════════════════════════════
// TEST 1: Text reference image + scene
// Send the pre-rendered text as a reference and ask Gemini
// to integrate it into the illustration
// ═══════════════════════════════════════════════════════════
async function test1_textRef() {
  console.log("\n═══ TEST 1: Text as reference image ═══");
  
  const textRefPath = "./text_refs/test1_short.png"; // "The little fox looked up at the endless sky."
  
  const prompt = [
    STYLE,
    `Create a children's book illustration page.`,
    `Scene: A small red fox cub sitting on a grassy hilltop at twilight, looking up at a vast starry sky with a crescent moon. Warm golden-hour light. Fireflies floating around.`,
    `CRITICAL: The second reference image contains TEXT that must appear in the final illustration.`,
    `Copy this text EXACTLY as shown — same font, same style, same words.`,
    `Place the text in the upper-left area of the illustration, integrated naturally into the sky area.`,
    `The text should look hand-written but match the reference precisely.`,
    `Do NOT change any words. Do NOT add any other text.`,
    `Clean image with the text as part of the composition.`,
  ].join(" ");

  const result = await geminiGenerate(prompt, [textRefPath], "3:4");
  await saveResult("test1_text_ref", result);
}

// ═══════════════════════════════════════════════════════════
// TEST 2: Scene with negative space for programmatic overlay
// Ask Gemini to leave a clean area where we'll add text later
// ═══════════════════════════════════════════════════════════
async function test2_negativeSpace() {
  console.log("\n═══ TEST 2: Negative space for text overlay ═══");

  const prompt = [
    STYLE,
    `Create a children's book illustration.`,
    `Scene: A small red fox cub sitting on a grassy hilltop at twilight, looking up at a vast starry sky with a crescent moon. Warm golden-hour light. Fireflies floating around.`,
    `COMPOSITION RULE: Leave the TOP-LEFT QUARTER of the image as simple, clean sky — no stars, no detail, no clouds in that area. This area must be plain enough for text to be overlaid later.`,
    `The fox and all visual detail should be in the BOTTOM-RIGHT area.`,
    `Clean image without any text, words, or writing.`,
  ].join(" ");

  const result = await geminiGenerate(prompt, [], "3:4");
  await saveResult("test2_negative_space", result);
}

// ═══════════════════════════════════════════════════════════
// TEST 3: Direct text in prompt (no reference)
// Ask Gemini to render text directly
// ═══════════════════════════════════════════════════════════
async function test3_directText() {
  console.log("\n═══ TEST 3: Direct text in prompt ═══");

  const prompt = [
    STYLE,
    `Create a children's book page illustration WITH text.`,
    `Scene: A small red fox cub sitting on a grassy hilltop at twilight, looking up at a vast starry sky with a crescent moon.`,
    `Include the following text in the illustration, written in an elegant serif font in dark brown color:`,
    `"The little fox looked up at the endless sky."`,
    `Place the text in the bottom area of the image, on a slightly lighter/cream area.`,
    `The text must be perfectly spelled and readable.`,
    `The text should look like it's part of a printed children's picture book page.`,
  ].join(" ");

  const result = await geminiGenerate(prompt, [], "3:4");
  await saveResult("test3_direct_text", result);
}

// ═══════════════════════════════════════════════════════════
// TEST 4: Text ref + style ref (full pipeline)
// Both the style reference AND text reference
// ═══════════════════════════════════════════════════════════
async function test4_fullPipeline() {
  console.log("\n═══ TEST 4: Text ref + scene (full book page) ═══");

  const textRefPath = "./text_refs/test4_full_sentence.png";
  
  const prompt = [
    `Create a single children's book PAGE that combines illustration and text.`,
    `Art style: Warm watercolor on cream paper, thin pencil outlines, muted palette. Oliver Jeffers style.`,
    ``,
    `Scene (TOP 65% of page): A young girl named Rosie crouching in tall golden grass at sunset, peeking through the reeds. A warm orange light glows ahead. Fireflies around her.`,
    ``,
    `Text (BOTTOM 35% of page): The reference image contains the EXACT text to include.`,
    `Reproduce this text EXACTLY — same words, same line breaks, in a serif font, dark brown on cream/white background.`,
    `The text area should have a plain cream/white background, like a real picture book page.`,
    ``,
    `The result should look like a single scanned page from a real children's picture book — illustration on top, text below, cohesive design.`,
    `Do NOT add any text other than what's in the reference.`,
  ].join("\n");

  const result = await geminiGenerate(prompt, [textRefPath], "3:4");
  await saveResult("test4_full_page", result);
}

// ═══════════════════════════════════════════════════════════
// TEST 5: Text ref overlay on dark scene (white text)
// ═══════════════════════════════════════════════════════════
async function test5_overlayDark() {
  console.log("\n═══ TEST 5: White text overlay on dark scene ═══");

  const textRefPath = "./text_refs/test2_overlay.png"; // white text on transparent
  
  const prompt = [
    STYLE,
    `Create a dramatic children's book illustration — FULL BLEED, no margins.`,
    `Scene: A vast dark forest at night. A single beam of moonlight illuminates a small clearing. A tiny fox stands in the light, looking up. Everything else is deep shadow and dark trees. Moody, cinematic.`,
    `The reference image contains WHITE TEXT that must appear in the TOP-LEFT area of the illustration.`,
    `Reproduce this text EXACTLY on the dark sky/trees area. The white text should be clearly readable against the dark background.`,
    `Do NOT add any other text.`,
  ].join(" ");

  const result = await geminiGenerate(prompt, [textRefPath], "3:4");
  await saveResult("test5_overlay_dark", result);
}

// Run all tests
async function main() {
  console.log("AnyTurn Text-in-Illustration Test Suite");
  console.log("Using Gemini 3.1 Flash Image Preview (NB2)");
  console.log("========================================");

  await test1_textRef();
  await test2_negativeSpace();  
  await test3_directText();
  await test4_fullPipeline();
  await test5_overlayDark();

  console.log("\n========================================");
  console.log("Done! Check ./test_results/ for output images");
  console.log("\nCompare:");
  console.log("  test1 vs test3 → Does text ref produce more consistent font?");
  console.log("  test2 → Does negative space work for programmatic overlay?");
  console.log("  test4 → Can Gemini create a full book page layout?");
  console.log("  test5 → Does white text on dark scenes work?");
}

main().catch(console.error);
