// api/proxy.js
// Vercel serverless function.
// Called as: /api/proxy?path=/auth/v1/signup
// Forwards request to Supabase and returns response.

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info,x-supabase-api-version,prefer');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Get the supabase path from query param
  // e.g. /api/proxy?path=/auth/v1/signup&redirect_to=...
  const { path, ...restQuery } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing ?path= parameter' });
  }

  // Rebuild query string from remaining params (e.g. redirect_to)
  const queryString = new URLSearchParams(restQuery).toString();
  const targetUrl   = `${SUPABASE_URL}${path}${queryString ? '?' + queryString : ''}`;

  try {
    // Build headers
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

    const supabaseRes = await fetch(targetUrl, {
      method:  req.method,
      headers: headers,
      body:    body || undefined,
    });

    // Forward response headers
    supabaseRes.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(supabaseRes.status).send(await supabaseRes.text());

  } catch (err) {
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
};
