// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

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
    return { ok: true, needsConfirmation: !data.session };
  }

  async function signInWithGoogle() {
    setError(null);

    // In production, the OAuth flow must go entirely through our Vercel proxy
    // so users on Jio/BSNL never make a direct connection to supabase.co.
    // We point redirectTo back to our own origin — Supabase will redirect
    // the browser here after Google authenticates, and detectSessionInUrl
    // picks up the token automatically.
    const redirectTo = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) setError(error.message);
  }

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
