// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_URL       = import.meta.env.VITE_APP_URL;
const isProduction  = import.meta.env.PROD;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error('[MultiSkills] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

// ── Custom fetch that rewrites Supabase URLs → proxy ──────────────
// In production every fetch the Supabase SDK makes gets intercepted.
// The original URL  https://xxx.supabase.co/auth/v1/signup
// becomes           https://your-app.vercel.app/api/proxy?path=/auth/v1/signup
// The user's browser never touches supabase.co directly.

function makeProxyFetch(appUrl) {
  return function proxyFetch(url, options = {}) {
    const original   = new URL(url);
    // Extract the path+search from the supabase URL
    const supaPath   = original.pathname + (original.search || '');
    // Build the proxy URL
    const proxyUrl   = `${appUrl}/api/proxy?path=${encodeURIComponent(original.pathname)}${
      original.search ? '&' + original.search.slice(1) : ''
    }`;
    return fetch(proxyUrl, options);
  };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    flowType:           'pkce',
  },
  // In production, intercept all SDK fetches and route through proxy
  ...(isProduction && APP_URL && {
    global: {
      fetch: makeProxyFetch(APP_URL),
    },
  }),
});

export default supabase;
export const isDemoMode = false;
