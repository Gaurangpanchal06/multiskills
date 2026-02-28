// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_URL       = import.meta.env.VITE_APP_URL;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    '[MultiSkills] Missing Supabase env vars.\n' +
    '  VITE_SUPABASE_URL=...\n' +
    '  VITE_SUPABASE_ANON_KEY=...'
  );
}

// Production: route through /api/proxy so Jio/BSNL users
// never connect to supabase.co directly.
// Development: connect to Supabase directly.
const isProduction = import.meta.env.PROD;
const clientUrl    = isProduction && APP_URL
  ? `${APP_URL}/api/proxy`
  : SUPABASE_URL;

const supabase = createClient(clientUrl, SUPABASE_ANON, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    flowType:           'pkce',
  },
});

export default supabase;
export const isDemoMode = false;
