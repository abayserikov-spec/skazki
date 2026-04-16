// api/anthropic.js — Vercel serverless proxy for Anthropic Claude API
// Removes the need for "anthropic-dangerous-direct-browser-access" header
// Client sends API key via Authorization header, proxy forwards to Anthropic

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = req.headers.authorization?.replace("Bearer ", "") || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(401).json({ error: "Missing Anthropic API key" });

  const { model, max_tokens, system, messages, temperature } = req.body;
  if (!messages) return res.status(400).json({ error: "Missing messages" });

  try {
    const body = {
      model: model || "claude-sonnet-4-6",
      max_tokens: max_tokens || 1500,
      messages,
    };
    if (system) body.system = system;
    if (temperature !== undefined) body.temperature = temperature;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Anthropic API error:", JSON.stringify(data.error));
      return res.status(response.status).json({ error: data.error.message || "Anthropic API error" });
    }

    // Include usage for cost tracking
    return res.status(200).json({
      content: data.content,
      usage: data.usage || null,
      model: data.model,
      stop_reason: data.stop_reason,
    });
  } catch (e) {
    console.error("Anthropic proxy error:", e);
    return res.status(500).json({ error: e.message });
  }
}
