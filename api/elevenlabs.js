export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, xi-api-key, Accept');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Extract the path after /api/elevenlabs/
  const fullUrl = req.url;
  const match = fullUrl.match(/\/api\/elevenlabs\/(.*)/);
  const path = match ? match[1] : '';
  const url = `https://api.elevenlabs.io/${path}`;

  // Use server key, fall back to client-provided key
  const apiKey = process.env.ELEVENLABS_API_KEY || req.headers['xi-api-key'];
  if (!apiKey) return res.status(401).json({ error: "Missing ElevenLabs API key" });

  const headers = { 'xi-api-key': apiKey };
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  if (req.headers['accept']) headers['Accept'] = req.headers['accept'];

  try {
    const fetchOpts = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOpts);
    const ct = response.headers.get('content-type') || '';

    if (ct) res.setHeader('Content-Type', ct);

    if (ct.includes('audio') || ct.includes('octet-stream')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.status(response.status).send(buffer);
    } else {
      const data = await response.text();
      res.status(response.status).send(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
