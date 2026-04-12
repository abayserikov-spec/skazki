// api/gemini.js — Vercel serverless proxy for Gemini NB2 Image API
// Supports: style reference + multiple character portraits + text prompt

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = req.headers.authorization?.replace("Bearer ", "") || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(401).json({ error: "Missing Gemini API key" });

  const { prompt, referenceImages, aspectRatio, imageSize } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  // Build parts: text prompt first, then reference images
  const parts = [{ text: prompt }];

  // referenceImages = array of URLs (style ref, portrait1, portrait2, ...)
  if (referenceImages && Array.isArray(referenceImages)) {
    for (const imgUrl of referenceImages) {
      if (!imgUrl) continue;
      try {
        // Handle both URLs and base64 data URIs
        let base64Data, mimeType;
        if (imgUrl.startsWith("data:")) {
          const match = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        } else {
          const imgRes = await fetch(imgUrl);
          if (!imgRes.ok) continue;
          const imgBuf = Buffer.from(await imgRes.arrayBuffer());
          mimeType = imgRes.headers.get("content-type") || "image/png";
          base64Data = imgBuf.toString("base64");
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
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.error) {
      console.error("Gemini API error:", JSON.stringify(data.error));
      return res.status(response.status).json({ error: data.error.message || "Gemini API error" });
    }

    // Extract image and text from response, skip thinking parts
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

    // Include token usage for cost tracking
    result.usage = data.usageMetadata || null;
    return res.status(200).json(result);
  } catch (e) {
    console.error("Gemini proxy error:", e);
    return res.status(500).json({ error: e.message });
  }
}
