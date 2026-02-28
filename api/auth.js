// api/auth.js
// Vercel serverless function.
// Handles signup + signin server-side so the user's
// browser never connects to Supabase directly.
// Called by the frontend as POST /api/auth

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  let body = '';
  await new Promise(resolve => {
    req.on('data', chunk => body += chunk);
    req.on('end', resolve);
  });

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { action, email, password, fullName } = parsed;

  if (!action || !email || !password) {
    return res.status(400).json({ error: 'Missing action, email or password' });
  }

  try {
    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || '' },
        },
      });
      if (error) return res.status(400).json({ error: error.message });

      // Already registered with no new identity
      if (data?.user?.identities?.length === 0) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      return res.status(200).json({
        user:             data.user,
        session:          data.session,
        needsConfirmation: !data.session,
      });
    }

    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ user: data.user, session: data.session });
    }

    return res.status(400).json({ error: 'Invalid action. Use signup or signin.' });

  } catch (err) {
    console.error('[api/auth] Error:', err.message);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
};
