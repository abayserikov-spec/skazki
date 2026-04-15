// Run: GEMINI_API_KEY=your_key node test_single.js [test_number]
// test_number: 2, 3, 4, or 5

import fs from "fs";

const API_KEY = process.env.GEMINI_API_KEY;
const TEST = process.argv[2] || "3";

if (!fs.existsSync("test_results")) fs.mkdirSync("test_results");

const STYLE = "Warm watercolor children's book illustration on cream textured paper. Thin pencil outlines visible underneath transparent watercolor washes. Soft muted palette: ochre, burnt sienna, sage green, dusty blue, warm grey. Gentle imperfect hand-drawn quality. Similar to Oliver Jeffers and Benji Davies picture book style.";

const tests = {
  "2": {
    name: "test2_negative_space",
    prompt: STYLE + " Create a children's book illustration. Scene: A small red fox cub sitting on a grassy hilltop at twilight, looking up at a vast starry sky with a crescent moon. Warm golden-hour light. Fireflies floating around. COMPOSITION RULE: Leave the TOP-LEFT QUARTER of the image as simple, clean sky — no stars, no detail, no clouds in that area. This area must be plain enough for text to be overlaid later. The fox and all visual detail should be in the BOTTOM-RIGHT area. Clean image without any text, words, or writing.",
    refs: [],
  },
  "3": {
    name: "test3_direct_text",
    prompt: STYLE + ' Create a children\'s book page illustration WITH text. Scene: A small red fox cub sitting on a grassy hilltop at twilight, looking up at a vast starry sky with a crescent moon. Include the following text in the illustration, written in an elegant serif font in dark brown color: "The little fox looked up at the endless sky." Place the text in the upper-left area of the image, on the sky. The text must be perfectly spelled and readable. The text should look like it belongs in a printed children\'s picture book page.',
    refs: [],
  },
  "4": {
    name: "test4_full_page",
    prompt: 'Create a single children\'s book PAGE that combines illustration and text.\nArt style: Warm watercolor on cream paper, thin pencil outlines, muted palette. Oliver Jeffers style.\n\nScene (TOP 65% of page): A young girl named Rosie crouching in tall golden grass at sunset, peeking through the reeds. A warm orange light glows ahead. Fireflies around her.\n\nText (BOTTOM 35% of page): The reference image contains the EXACT text to include.\nReproduce this text EXACTLY — same words, same line breaks, in a serif font, dark brown on cream/white background.\nThe text area should have a plain cream/white background, like a real picture book page.\n\nThe result should look like a single scanned page from a real children\'s picture book — illustration on top, text below, cohesive design.\nDo NOT add any text other than what is in the reference.',
    refs: ["text_refs/test4_full_sentence.png"],
  },
  "5": {
    name: "test5_overlay_dark",
    prompt: STYLE + " Create a dramatic children's book illustration — FULL BLEED, no margins. Scene: A vast dark forest at night. A single beam of moonlight illuminates a small clearing. A tiny fox stands in the light, looking up. Everything else is deep shadow and dark trees. Moody, cinematic. The reference image contains WHITE TEXT that must appear in the TOP-LEFT area of the illustration. Reproduce this text EXACTLY on the dark sky/trees area. The white text should be clearly readable against the dark background. Do NOT add any other text.",
    refs: ["text_refs/test2_overlay.png"],
  },
};

const t = tests[TEST];
if (!t) { console.error("Unknown test:", TEST, "— use 2, 3, 4, or 5"); process.exit(1); }

console.log(`Running ${t.name}...`);

const parts = [{ text: t.prompt }];
for (const refPath of t.refs) {
  const b64 = fs.readFileSync(refPath).toString("base64");
  parts.push({ inline_data: { mime_type: "image/png", data: b64 } });
}

const body = {
  contents: [{ parts }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "3:4" },
  },
};

fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
  signal: AbortSignal.timeout(120000),
  body: JSON.stringify(body),
})
  .then((r) => r.json())
  .then((d) => {
    if (d.error) { console.error("Gemini error:", d.error.message); return; }
    const ps = d.candidates?.[0]?.content?.parts || [];
    let saved = false;
    for (const part of ps) {
      if (part.text) console.log("Gemini:", part.text.slice(0, 200));
      if (part.inlineData) {
        fs.writeFileSync(`test_results/${t.name}.png`, Buffer.from(part.inlineData.data, "base64"));
        console.log(`Saved: test_results/${t.name}.png`);
        saved = true;
      }
    }
    if (!saved) console.log("No image returned");
  })
  .catch((e) => console.error("Error:", e.message));
