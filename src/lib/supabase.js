import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_URL       = import.meta.env.VITE_APP_URL;
const isProduction  = import.meta.env.PROD;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error('[MultiSkills] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

// In production, intercept every fetch the Supabase SDK makes
// and route it through /api/proxy so the user's browser never
// connects to supabase.co directly (bypasses Jio/BSNL blocks).
function makeProxyFetch(appUrl) {
  return function(url, options) {
    var original  = new URL(url);
    var supaPath  = original.pathname;
    var supaQuery = original.search ? original.search.slice(1) : '';
    var proxyUrl  = appUrl + '/api/proxy?path=' + encodeURIComponent(supaPath)
                    + (supaQuery ? '&' + supaQuery : '');
    return fetch(proxyUrl, options);
  };
}

var clientOptions = {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    flowType:           'pkce',
  },
};

if (isProduction && APP_URL) {
  clientOptions.global = { fetch: makeProxyFetch(APP_URL) };
}

var supabase = createClient(SUPABASE_URL, SUPABASE_ANON, clientOptions);

export default supabase;
export var isDemoMode = false;
