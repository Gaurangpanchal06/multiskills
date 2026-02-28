// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.DEV && (!SUPABASE_URL || !SUPABASE_ANON)) {
  console.error('[MultiSkills] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

const supabase = createClient(
  SUPABASE_URL  || '',
  SUPABASE_ANON || '',
  {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;
