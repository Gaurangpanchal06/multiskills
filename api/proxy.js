// api/proxy.js
// Vercel serverless function — proxies all Supabase
// requests so Jio/BSNL users are never blocked.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // Strip /api/proxy from the path to get the Supabase path
    // e.g. /api/proxy/auth/v1/signup → /auth/v1/signup
    const supabasePath = req.url.replace('/api/proxy', '') || '/';
    const targetUrl = `${SUPABASE_URL}${supabasePath}`;

    // Build headers to forward
    const headers = {
      'apikey': SUPABASE_ANON,
      'Authorization': req.headers['authorization'] || `Bearer ${SUPABASE_ANON}`,
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Forward optional Supabase headers
    ['x-client-info', 'x-supabase-api-version', 'prefer'].forEach(h => {
      if (req.headers[h]) headers[h] = req.headers[h];
    });

    // Read request body for POST/PATCH/PUT
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
      });
    }

    const supabaseRes = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body || undefined,
    });

    // Forward status and headers back to client
    res.status(supabaseRes.status);
    supabaseRes.headers.forEach((value, key) => {
      // Skip headers that cause issues when forwarding
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const data = await supabaseRes.text();
    res.send(data);

  } catch (err) {
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
};
