// api/gemini.js — Vercel serverless proxy for Gemini NB2 Image API
// Supports: style reference + multiple character portraits + text prompt
//
// TIMING LOGS FORMAT:
//   [GEMINI] request received refs=N sizeIn=Xkb
//   [GEMINI] fetched ref <url> in Xms size=Xkb      (only for http refs)
//   [GEMINI] refs prepared in Xms (fetched:Y, data-urls:Z)
//   [GEMINI] google API call Xms status=200
//   [GEMINI] total Xms sizeOut=Xkb
//
// View logs: Vercel dashboard → Functions → /api/gemini → Logs
// Or locally: `vercel logs --follow`

export default async function handler(req, res) {
  const tStart = Date.now();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = req.headers.authorization?.replace("Bearer ", "") || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(401).json({ error: "Missing Gemini API key" });

  const { prompt, referenceImages, aspectRatio, imageSize } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const refCount = referenceImages?.filter(Boolean).length || 0;
  const sizeInKb = Math.round(JSON.stringify(req.body).length / 1024);
  console.log(`[GEMINI] request received refs=${refCount} sizeIn=${sizeInKb}kb imageSize=${imageSize || "default"} aspectRatio=${aspectRatio || "default"}`);

  // Build parts: text prompt first, then reference images
  const parts = [{ text: prompt }];

  const tRefsStart = Date.now();
  let dataUrlCount = 0;
  let fetchedCount = 0;

  // referenceImages = array of URLs or data-URIs
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

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio || "16:9",
        ...(imageSize && { imageSize }),
      },
    },
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;
    const tGoogle = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(`[GEMINI] google API call ${Date.now() - tGoogle}ms status=${response.status}`);

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

    const sizeOutKb = result.imageBase64 ? Math.round(result.imageBase64.length * 0.75 / 1024) : 0;
    console.log(`[GEMINI] total ${Date.now() - tStart}ms sizeOut=${sizeOutKb}kb`);

    return res.status(200).json(result);
  } catch (e) {
    console.error("Gemini proxy error:", e);
    console.log(`[GEMINI] FAILED after ${Date.now() - tStart}ms`);
    return res.status(500).json({ error: e.message });
  }
}
