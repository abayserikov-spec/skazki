// api/gemini.js — Vercel serverless proxy for Gemini Image API
//
// MODEL SELECTION (priority order):
//   1. Request header: x-gemini-model  (from browser, per-request override)
//   2. Env variable: GEMINI_MODEL      (Vercel settings, server default)
//   3. Fallback: nb2-default
//
// Browser can switch model on the fly via Settings panel — no redeploy needed.
//
// Presets:
//   nb2-default  → gemini-3.1-flash-image-preview (current, no explicit thinking)
//   nb2-minimal  → gemini-3.1-flash-image-preview + thinkingLevel=minimal + tools=[]
//   nb1          → gemini-2.5-flash-image (older but may be faster)

const MODEL_PRESETS = {
  "nb2-default": {
    modelId: "gemini-3.1-flash-image-preview",
    thinkingLevel: null,
    explicitNoTools: false,
  },
  "nb2-minimal": {
    modelId: "gemini-3.1-flash-image-preview",
    thinkingLevel: "minimal",
    explicitNoTools: true,
  },
  "nb1": {
    modelId: "gemini-2.5-flash-image",
    thinkingLevel: null,
    explicitNoTools: true,
  },
};

function getPreset(req) {
  // Priority 1: header from browser
  const headerKey = req.headers["x-gemini-model"];
  if (headerKey && MODEL_PRESETS[headerKey]) {
    return { preset: MODEL_PRESETS[headerKey], source: "header", key: headerKey };
  }
  // Priority 2: env variable
  const envKey = process.env.GEMINI_MODEL;
  if (envKey && MODEL_PRESETS[envKey]) {
    return { preset: MODEL_PRESETS[envKey], source: "env", key: envKey };
  }
  // Priority 3: fallback
  return { preset: MODEL_PRESETS["nb2-default"], source: "default", key: "nb2-default" };
}

export default async function handler(req, res) {
  const tStart = Date.now();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-gemini-model");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = req.headers.authorization?.replace("Bearer ", "") || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(401).json({ error: "Missing Gemini API key" });

  const { prompt, referenceImages, aspectRatio, imageSize } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const { preset, source, key: presetKey } = getPreset(req);
  const refCount = referenceImages?.filter(Boolean).length || 0;
  const sizeInKb = Math.round(JSON.stringify(req.body).length / 1024);
  console.log(`[GEMINI] request refs=${refCount} sizeIn=${sizeInKb}kb preset=${presetKey} (${source}) model=${preset.modelId} tl=${preset.thinkingLevel || "default"} tools=${preset.explicitNoTools ? "[]" : "unset"} imageSize=${imageSize || "default"} aspectRatio=${aspectRatio || "default"}`);

  // Build parts
  const parts = [{ text: prompt }];

  const tRefsStart = Date.now();
  let dataUrlCount = 0;
  let fetchedCount = 0;

  if (referenceImages && Array.isArray(referenceImages)) {
    for (const imgUrl of referenceImages) {
      if (!imgUrl) continue;
      try {
        let base64Data, mimeType;
        if (imgUrl.startsWith("data:")) {
          const match = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
            dataUrlCount++;
          }
        } else {
          const tFetch = Date.now();
          const imgRes = await fetch(imgUrl);
          if (!imgRes.ok) continue;
          const imgBuf = Buffer.from(await imgRes.arrayBuffer());
          mimeType = imgRes.headers.get("content-type") || "image/png";
          base64Data = imgBuf.toString("base64");
          fetchedCount++;
          console.log(`[GEMINI] fetched ref ${imgUrl.slice(0, 60)}... in ${Date.now() - tFetch}ms size=${Math.round(imgBuf.length / 1024)}kb`);
        }
        if (base64Data) {
          parts.push({
            inline_data: { mime_type: mimeType, data: base64Data },
          });
        }
      } catch (e) {
        console.error("Failed to fetch reference image:", imgUrl.slice(0, 80), e.message);
      }
    }
  }
  console.log(`[GEMINI] refs prepared in ${Date.now() - tRefsStart}ms (fetched:${fetchedCount}, data-urls:${dataUrlCount})`);

  // Build request body
  const generationConfig = {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio: aspectRatio || "16:9",
      ...(imageSize && { imageSize }),
    },
  };

  if (preset.thinkingLevel) {
    generationConfig.thinkingConfig = {
      thinkingLevel: preset.thinkingLevel,
      includeThoughts: false,
    };
  }

  const body = {
    contents: [{ parts }],
    generationConfig,
  };

  if (preset.explicitNoTools) {
    body.tools = [];
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${preset.modelId}:generateContent`;
    const tGoogle = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(`[GEMINI] google API call ${Date.now() - tGoogle}ms status=${response.status} preset=${presetKey}`);

    if (data.error) {
      console.error("Gemini API error:", JSON.stringify(data.error));
      return res.status(response.status).json({ error: data.error.message || "Gemini API error" });
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

    result.usage = data.usageMetadata || null;
    result.modelUsed = preset.modelId;
    result.presetUsed = presetKey;

    const sizeOutKb = result.imageBase64 ? Math.round(result.imageBase64.length * 0.75 / 1024) : 0;
    console.log(`[GEMINI] total ${Date.now() - tStart}ms sizeOut=${sizeOutKb}kb preset=${presetKey}`);

    return res.status(200).json(result);
  } catch (e) {
    console.error("Gemini proxy error:", e);
    console.log(`[GEMINI] FAILED after ${Date.now() - tStart}ms`);
    return res.status(500).json({ error: e.message });
  }
}
