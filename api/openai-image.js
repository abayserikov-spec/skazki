// api/openai-image.js — Vercel serverless proxy for OpenAI image generation
// ("Images 2.0" / gpt-image-2). Drop-in alternative to /api/gemini.
//
// Accepts the SAME JSON body shape as /api/gemini so the client can switch
// providers without changing its payload:
//   { prompt, referenceImages: [dataURL|httpURL, ...], aspectRatio, imageSize }
//
// Routing:
//   - with reference images → POST /v1/images/edits   (multipart, multi-image)
//   - without references     → POST /v1/images/generations (JSON)
//
// Returns the SAME response shape as /api/gemini:
//   { imageBase64, mimeType, modelUsed, presetUsed, usage }
//
// MODEL SELECTION (priority order):
//   1. Request header: x-openai-model   (per-request override from browser)
//   2. Env variable:   OPENAI_IMAGE_MODEL
//   3. Fallback:       gpt-image-2

// gpt-image-2 supports: 1024x1024 (square), 1024x1536 (portrait), 1536x1024 (landscape).
const SIZE_BY_ASPECT = {
  "1:1": "1024x1024",
  "3:4": "1024x1536",
  "2:3": "1024x1536",
  "9:16": "1024x1536",
  "4:3": "1536x1024",
  "3:2": "1536x1024",
  "16:9": "1536x1024",
};

function extFromMime(mime) {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "png";
}

// Turn a data-URL or http(s) URL into a Blob suitable for multipart upload.
async function toBlob(imgUrl) {
  if (imgUrl.startsWith("data:")) {
    const match = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1];
    const buf = Buffer.from(match[2], "base64");
    return { blob: new Blob([buf], { type: mime }), mime };
  }
  const r = await fetch(imgUrl);
  if (!r.ok) return null;
  const mime = r.headers.get("content-type") || "image/png";
  const buf = Buffer.from(await r.arrayBuffer());
  return { blob: new Blob([buf], { type: mime }), mime };
}

export default async function handler(req, res) {
  const tStart = Date.now();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-openai-model");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = req.headers.authorization?.replace("Bearer ", "") || process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(401).json({ error: "Missing OpenAI API key" });

  const model = req.headers["x-openai-model"] || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

  const { prompt, referenceImages, aspectRatio } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const size = SIZE_BY_ASPECT[aspectRatio] || "1024x1024";
  const refs = Array.isArray(referenceImages) ? referenceImages.filter(Boolean) : [];

  const sizeInKb = Math.round(JSON.stringify(req.body).length / 1024);
  console.log(`[OPENAI-IMG] request refs=${refs.length} sizeIn=${sizeInKb}kb model=${model} size=${size} aspectRatio=${aspectRatio || "default"}`);

  try {
    let response;

    if (refs.length > 0) {
      // ─── EDITS endpoint (multi-image, for character/style consistency) ───
      const tRefs = Date.now();
      const blobs = [];
      for (const imgUrl of refs) {
        try {
          const b = await toBlob(imgUrl);
          if (b) blobs.push(b);
        } catch (e) {
          console.error("[OPENAI-IMG] failed to load ref:", imgUrl.slice(0, 60), e.message);
        }
      }
      console.log(`[OPENAI-IMG] refs prepared in ${Date.now() - tRefs}ms (${blobs.length}/${refs.length})`);

      if (blobs.length === 0) {
        return res.status(502).json({ error: "Failed to load any reference images" });
      }

      const form = new FormData();
      form.append("model", model);
      form.append("prompt", prompt);
      form.append("size", size);
      form.append("n", "1");
      blobs.forEach((b, i) => form.append("image[]", b.blob, `ref${i}.${extFromMime(b.mime)}`));

      const tCall = Date.now();
      response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` }, // fetch sets multipart boundary
        body: form,
      });
      console.log(`[OPENAI-IMG] edits call ${Date.now() - tCall}ms status=${response.status}`);
    } else {
      // ─── GENERATIONS endpoint (text-to-image) ───
      const tCall = Date.now();
      response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, prompt, size, n: 1 }),
      });
      console.log(`[OPENAI-IMG] generations call ${Date.now() - tCall}ms status=${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI image API error:", JSON.stringify(data.error));
      return res.status(response.status).json({ error: data.error.message || "OpenAI image API error" });
    }

    const item = data.data?.[0] || {};
    let imageBase64 = item.b64_json || null;
    let mimeType = "image/png";

    // dall-e fallback returns a URL instead of base64
    if (!imageBase64 && item.url) {
      const ir = await fetch(item.url);
      imageBase64 = Buffer.from(await ir.arrayBuffer()).toString("base64");
      mimeType = ir.headers.get("content-type") || "image/png";
    }

    if (!imageBase64) {
      console.warn("[OPENAI-IMG] empty image response");
      return res.status(502).json({ error: "OpenAI returned no image" });
    }

    const sizeOutKb = Math.round((imageBase64.length * 0.75) / 1024);
    console.log(`[OPENAI-IMG] total ${Date.now() - tStart}ms sizeOut=${sizeOutKb}kb model=${model}`);

    return res.status(200).json({
      imageBase64,
      mimeType,
      modelUsed: model,
      presetUsed: "openai-image",
      usage: data.usage || null,
    });
  } catch (e) {
    console.error("OpenAI image proxy error:", e);
    console.log(`[OPENAI-IMG] FAILED after ${Date.now() - tStart}ms`);
    return res.status(500).json({ error: e.message });
  }
}
