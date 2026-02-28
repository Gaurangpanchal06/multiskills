// api/proxy.js
// Vercel Node.js serverless function (nodejs20.x)
// Proxies all Supabase requests to bypass ISP blocks.
// Usage: /api/proxy?path=/auth/v1/signup

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info,x-supabase-api-version,prefer');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Validate env vars
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: 'Supabase env vars not set on server' });
  }

  // Get supabase path from query
  const path = req.query.path;
  if (!path) {
    return res.status(400).json({ error: 'Missing ?path= parameter' });
  }

  // Build remaining query params (everything except 'path')
  const forwardParams = { ...req.query };
  delete forwardParams.path;
  const queryString = new URLSearchParams(forwardParams).toString();
  const targetUrl   = `${SUPABASE_URL}${path}${queryString ? '?' + queryString : ''}`;

  try {
    // Forward headers
    const headers = {
      'apikey':        SUPABASE_ANON,
      'Authorization': req.headers['authorization'] || `Bearer ${SUPABASE_ANON}`,
      'Content-Type':  req.headers['content-type']  || 'application/json',
    };
    ['x-client-info', 'x-supabase-api-version', 'prefer'].forEach(h => {
      if (req.headers[h]) headers[h] = req.headers[h];
    });

    // Read body for POST/PATCH/PUT
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise(resolve => {
        let d = '';
        req.on('data', chunk => d += chunk);
        req.on('end',  () => resolve(d));
      });
    }

    // Call Supabase
    const upstream = await fetch(targetUrl, {
      method:  req.method,
      headers: headers,
      body:    body || undefined,
    });

    // Forward response headers
    const skip = new Set(['transfer-encoding', 'connection', 'keep-alive']);
    upstream.headers.forEach((value, key) => {
      if (!skip.has(key.toLowerCase())) res.setHeader(key, value);
    });

    // Send response
    const text = await upstream.text();
    res.status(upstream.status).send(text);

  } catch (err) {
    console.error('[proxy] Error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
};
