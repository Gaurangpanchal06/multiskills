// src/context/AuthContext.jsx
// ─────────────────────────────────────────────
// Auth state provider for Supabase v2 + Vite.
// ─────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    // Restore session on mount (also handles Google OAuth redirect callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) { setError(error.message); return false; }
    return true;
  }

  async function signUp(email, password, fullName) {
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName?.trim() || '' },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) { setError(error.message); return { ok: false }; }
    if (data?.user?.identities?.length === 0) {
      setError('An account with this email already exists. Please sign in.');
      return { ok: false };
    }
    const needsConfirmation = !data.session;
    return { ok: true, needsConfirmation };
  }

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This must exactly match a Redirect URL in:
        // Supabase Dashboard → Auth → URL Configuration → Redirect URLs
        // AND an Authorized redirect URI in Google Cloud Console → OAuth 2.0
        // The redirect goes: Google → Supabase → your app
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    // user state will be cleared by onAuthStateChange listener above
    // App.jsx watches isAuthenticated and redirects to /auth automatically
  }

  const value = {
    user,
    loading,
    error,
    setError,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    displayName: user?.user_metadata?.full_name
                 || user?.email?.split('@')[0]
                 || 'User',
    avatarUrl: user?.user_metadata?.avatar_url
               || user?.user_metadata?.picture
               || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
