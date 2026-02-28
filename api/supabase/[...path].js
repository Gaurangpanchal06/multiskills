// api/supabase/[...path].js
// ─────────────────────────────────────────────
// Vercel serverless proxy — forwards all requests
// to Supabase server-side. Users never connect to
// Supabase directly, bypassing ISP blocks entirely.
// ─────────────────────────────────────────────

export const config = {
  // Use edge runtime for lowest latency worldwide
  runtime: 'edge',
};

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req) {
  try {
    // Build the target Supabase URL
    // e.g. /api/supabase/auth/v1/signup → https://xxx.supabase.co/auth/v1/signup
    const url = new URL(req.url);
    const supabasePath = url.pathname.replace('/api/supabase', '');
    const targetUrl = `${SUPABASE_URL}${supabasePath}${url.search}`;

    // Forward all original headers, inject anon key
    const headers = new Headers(req.headers);
    headers.set('apikey', SUPABASE_ANON);

    // Ensure Authorization header is forwarded (for authenticated requests)
    // It will already be in req.headers if present, this is just a safeguard
    if (!headers.get('Authorization')) {
      headers.set('Authorization', `Bearer ${SUPABASE_ANON}`);
    }

    // Remove headers that cause issues when proxying
    headers.delete('host');

    // Forward the request to Supabase
    const supabaseResponse = await fetch(targetUrl, {
      method:  req.method,
      headers: headers,
      body:    req.method !== 'GET' && req.method !== 'HEAD'
               ? req.body
               : undefined,
    });

    // Return Supabase's response back to the client
    return new Response(supabaseResponse.body, {
      status:  supabaseResponse.status,
      headers: supabaseResponse.headers,
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
