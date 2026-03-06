export default async function handler(req, res) {
  const path = req.query.path ? (Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path) : '';
  const url = `https://api.elevenlabs.io/${path}`;

  const headers = {};
  if (req.headers['xi-api-key']) headers['xi-api-key'] = req.headers['xi-api-key'];
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  if (req.headers['accept']) headers['Accept'] = req.headers['accept'];

  try {
    const fetchOpts = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOpts);
    const ct = response.headers.get('content-type') || '';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, xi-api-key, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    res.status(response.status);
    if (ct) res.setHeader('Content-Type', ct);

    if (ct.includes('audio') || ct.includes('octet-stream')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } else {
      const data = await response.text();
      res.send(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
