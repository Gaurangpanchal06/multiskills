// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext(null);

const IS_PROD = import.meta.env.PROD;

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Restore session on mount
  useEffect(() => {
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

  // ── Sign In ───────────────────────────────
  async function signIn(email, password) {
    setError(null);
    try {
      if (IS_PROD) {
        // Go through Vercel server — browser never touches Supabase
        const res  = await fetch('/api/auth', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'signin', email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return false; }

        // Manually set the session so Supabase client knows user is logged in
        await supabase.auth.setSession({
          access_token:  data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        return true;
      } else {
        // Dev: call Supabase directly
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(), password,
        });
        if (error) { setError(error.message); return false; }
        return true;
      }
    } catch (err) {
      setError('Connection failed. Please check your internet and try again.');
      return false;
    }
  }

  // ── Sign Up ───────────────────────────────
  async function signUp(email, password, fullName) {
    setError(null);
    try {
      if (IS_PROD) {
        // Go through Vercel server
        const res  = await fetch('/api/auth', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'signup', email: email.trim(), password, fullName }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return { ok: false }; }

        // If session returned (email confirmation off), set it immediately
        if (data.session) {
          await supabase.auth.setSession({
            access_token:  data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        return { ok: true, needsConfirmation: data.needsConfirmation };
      } else {
        // Dev: call Supabase directly
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName || '' } },
        });
        if (error) { setError(error.message); return { ok: false }; }
        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists.');
          return { ok: false };
        }
        return { ok: true, needsConfirmation: !data.session };
      }
    } catch (err) {
      setError('Connection failed. Please check your internet and try again.');
      return { ok: false };
    }
  }

  // ── Google OAuth ──────────────────────────
  // Google OAuth is a browser redirect — works fine
  // on its own since Supabase handles it server-side.
  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  // ── Sign Out ──────────────────────────────
  async function signOut() {
    await supabase.auth.signOut();
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
