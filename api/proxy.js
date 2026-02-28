// api/proxy.js
// CommonJS — do NOT add "type":"module" to package.json

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: 'Missing env vars on server' });
  }

  const path = req.query && req.query.path;
  if (!path) {
    return res.status(400).json({ error: 'Missing ?path= parameter' });
  }

  const forwardParams = Object.assign({}, req.query);
  delete forwardParams.path;
  const qs        = new URLSearchParams(forwardParams).toString();
  const targetUrl = `${SUPABASE_URL}${path}${qs ? '?' + qs : ''}`;

  try {
    const headers = {
      'apikey':        SUPABASE_ANON,
      'Authorization': req.headers['authorization'] || ('Bearer ' + SUPABASE_ANON),
      'Content-Type':  req.headers['content-type']  || 'application/json',
    };

    ['x-client-info', 'x-supabase-api-version', 'prefer'].forEach(function(h) {
      if (req.headers[h]) headers[h] = req.headers[h];
    });

    var body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise(function(resolve) {
        var d = '';
        req.on('data', function(c) { d += c; });
        req.on('end',  function()  { resolve(d); });
      });
    }

    var upstream = await fetch(targetUrl, {
      method:  req.method,
      headers: headers,
      body:    body || undefined,
    });

    var skip = ['transfer-encoding', 'connection', 'keep-alive'];
    upstream.headers.forEach(function(value, key) {
      if (skip.indexOf(key.toLowerCase()) === -1) {
        res.setHeader(key, value);
      }
    });

    var text = await upstream.text();
    return res.status(upstream.status).send(text);

  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', message: err.message });
  }
};
