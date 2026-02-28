// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_URL       = import.meta.env.VITE_APP_URL;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    '[MultiSkills] Missing Supabase env vars.\n' +
    'Make sure your .env file contains:\n' +
    '  VITE_SUPABASE_URL=...\n' +
    '  VITE_SUPABASE_ANON_KEY=...'
  );
}

// In production: all traffic (auth + database) goes through the Vercel proxy.
// This means the browser never connects to supabase.co directly —
// completely bypassing Jio/BSNL ISP blocks.
// In development: connect to Supabase directly as normal.
const isProduction = import.meta.env.PROD;
const clientUrl    = isProduction && APP_URL
  ? `${APP_URL}/api/supabase`
  : SUPABASE_URL;

const supabase = createClient(clientUrl, SUPABASE_ANON, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    // Tell the auth client to use the proxy URL for all auth endpoints
    ...(isProduction && APP_URL && {
      flowType: 'pkce', // More secure flow, works better with proxies
    }),
  },
  global: {
    headers: {
      'x-app-name': 'multiskills',
    },
  },
});

export default supabase;
export const isDemoMode = false;
