export default async function handler(req, res) {
  // Extract the path after /api/replicate/
  const fullUrl = req.url;
  const match = fullUrl.match(/\/api\/replicate\/(.*)/);
  const path = match ? match[1] : '';
  const url = `https://api.replicate.com/${path}`;

  const headers = {};
  if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

  try {
    const fetchOpts = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOpts);
    const data = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const ct = response.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.status(response.status).send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
