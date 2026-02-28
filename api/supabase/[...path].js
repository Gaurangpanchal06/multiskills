// api/supabase/[...path].js
// ─────────────────────────────────────────────
// Vercel edge proxy — forwards ALL Supabase traffic
// including auth redirects, so Jio/BSNL users are
// never blocked.
// ─────────────────────────────────────────────

export const config = { runtime: 'edge' };

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL       = process.env.VITE_APP_URL;

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const supabasePath = url.pathname.replace('/api/supabase', '');
    const targetUrl = `${SUPABASE_URL}${supabasePath}${url.search}`;

    const headers = new Headers(req.headers);
    headers.set('apikey', SUPABASE_ANON);
    if (!headers.get('Authorization')) {
      headers.set('Authorization', `Bearer ${SUPABASE_ANON}`);
    }
    headers.delete('host');

    const supabaseResponse = await fetch(targetUrl, {
      method:  req.method,
      headers: headers,
      body:    req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      redirect: 'manual', // Don't auto-follow redirects — we handle them below
    });

    // ── Rewrite redirect locations ────────────────
    // When Supabase sends a redirect (e.g. after Google OAuth callback),
    // it may redirect to its own domain. We rewrite those to go through
    // our proxy instead, so the browser never touches supabase.co directly.
    if (supabaseResponse.status >= 300 && supabaseResponse.status < 400) {
      const location = supabaseResponse.headers.get('location');
      if (location) {
        const rewritten = location.replace(SUPABASE_URL, `${APP_URL}/api/supabase`);
        const newHeaders = new Headers(supabaseResponse.headers);
        newHeaders.set('location', rewritten);
        return new Response(null, {
          status:  supabaseResponse.status,
          headers: newHeaders,
        });
      }
    }

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
