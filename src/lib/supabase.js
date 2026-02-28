// src/lib/supabase.js
// ─────────────────────────────────────────────
// Supabase v2 client for Vite.
// In production: routes through Vercel proxy so
// Jio/BSNL users are never blocked.
// In development: connects to Supabase directly.
// ─────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    '[MultiSkills] Missing Supabase env vars.\n' +
    'Make sure your .env file contains:\n' +
    '  VITE_SUPABASE_URL=...\n' +
    '  VITE_SUPABASE_ANON_KEY=...'
  );
}

// In production, route through our Vercel proxy instead of hitting
// Supabase directly — this bypasses ISP-level blocks (Jio, BSNL, etc.)
// In development (localhost), hit Supabase directly as usual.
const isProduction  = import.meta.env.PROD;
const SUPABASE_CLIENT_URL = isProduction
  ? `${import.meta.env.VITE_APP_URL}/api/supabase`
  : SUPABASE_URL;

const supabase = createClient(SUPABASE_CLIENT_URL, SUPABASE_ANON, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
});

export default supabase;
export const isDemoMode = false;
