// api/proxy.js

export default async function handler(req, res) {
  const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

  // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars' });
  }

  const path = req.query?.path;
  if (!path) {
    return res.status(400).json({ error: 'Missing ?path= query parameter' });
  }

  // Forward any extra query params (e.g. redirect_to)
  const forwardParams = { ...req.query };
  delete forwardParams.path;
  const qs        = new URLSearchParams(forwardParams).toString();
  const targetUrl = `${SUPABASE_URL}${path}${qs ? '?' + qs : ''}`;

  try {
    const headers = {
      'apikey':        SUPABASE_ANON,
      'Authorization': req.headers['authorization'] || `Bearer ${SUPABASE_ANON}`,
      'Content-Type':  req.headers['content-type']  || 'application/json',
    };
    ['x-client-info', 'x-supabase-api-version', 'prefer'].forEach(h => {
      if (req.headers[h]) headers[h] = req.headers[h];
    });

    // Read body
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise(resolve => {
        let d = '';
        req.on('data', c => d += c);
        req.on('end',  () => resolve(d));
      });
    }

    const upstream = await fetch(targetUrl, {
      method:  req.method,
      headers,
      body:    body || undefined,
    });

    // Forward response headers
    const skip = new Set(['transfer-encoding', 'connection', 'keep-alive']);
    upstream.headers.forEach((value, key) => {
      if (!skip.has(key.toLowerCase())) res.setHeader(key, value);
    });

    const text = await upstream.text();
    return res.status(upstream.status).send(text);

  } catch (err) {
    console.error('[proxy] Error:', err.message);
    return res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}
