// src/lib/supabase.js
// ─────────────────────────────────────────────
// Supabase v2 client for Vite.
// Reads credentials from .env via import.meta.env
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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Persist session in localStorage across page reloads
    persistSession: true,
    // Automatically refresh the token before it expires
    autoRefreshToken: true,
    // Detect the OAuth callback hash/code on page load (needed for Google redirect)
    detectSessionInUrl: true,
  },
});

export default supabase;
export const isDemoMode = false;
