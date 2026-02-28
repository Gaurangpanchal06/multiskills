// api/proxy.js
// ─────────────────────────────────────────────
// Vercel serverless function — proxies ALL requests
// to Supabase so users on Jio/BSNL never connect
// to supabase.co directly.
//
// Route: /api/proxy?path=/auth/v1/signup
// ─────────────────────────────────────────────

export const config = { runtime: 'edge' };

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req) {
  try {
    const url = new URL(req.url);

    // The supabase path comes from the URL after /api/proxy
    // e.g. /api/proxy/auth/v1/signup → /auth/v1/signup
    const supabasePath = url.pathname.replace('/api/proxy', '') || '/';
    const targetUrl    = `${SUPABASE_URL}${supabasePath}${url.search}`;

    // Build forwarded headers
    const headers = new Headers();
    headers.set('apikey',        SUPABASE_ANON);
    headers.set('Authorization', req.headers.get('Authorization') || `Bearer ${SUPABASE_ANON}`);
    headers.set('Content-Type',  req.headers.get('Content-Type')  || 'application/json');

    // Forward optional Supabase headers if present
    const optionalHeaders = ['x-client-info', 'x-supabase-api-version', 'prefer'];
    optionalHeaders.forEach(h => {
      const val = req.headers.get(h);
      if (val) headers.set(h, val);
    });

    const supabaseRes = await fetch(targetUrl, {
      method:   req.method,
      headers:  headers,
      body:     req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      redirect: 'manual',
    });

    // Rewrite any redirect Location headers so they also go through the proxy
    const resHeaders = new Headers(supabaseRes.headers);
    const location   = resHeaders.get('location');
    if (location && location.includes(SUPABASE_URL)) {
      resHeaders.set(
        'location',
        location.replace(SUPABASE_URL, '/api/proxy')
      );
    }

    // CORS headers so browser requests work
    resHeaders.set('Access-Control-Allow-Origin',  '*');
    resHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: resHeaders });
    }

    return new Response(supabaseRes.body, {
      status:  supabaseRes.status,
      headers: resHeaders,
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
