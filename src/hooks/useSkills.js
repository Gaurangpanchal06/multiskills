// src/hooks/useSkills.js
// ─────────────────────────────────────────────
// Custom hook for skill CRUD tied to the current user.
// Works with real Supabase AND demo mode.
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useSkills() {
  const { user } = useAuth();
  const [skills,  setSkills]  = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Fetch skills for current user ─────────
  const fetchSkills = useCallback(async () => {
    if (!user) { setSkills([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setSkills(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  // ── Add a skill ───────────────────────────
  async function addSkill({ skillName, aiSuggestedCategory, finalCategory, aiReason }) {
    if (!user) return null;
    const row = {
      user_id: user.id,
      skill_name: skillName,
      ai_suggested_category: aiSuggestedCategory,
      final_category: finalCategory,
      ai_reason: aiReason,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('skills').insert([row]).select().single();
    if (!error && data) setSkills(prev => [data, ...prev]);
    return data;
  }

  // ── Delete a skill ────────────────────────
  async function deleteSkill(id) {
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (!error) setSkills(prev => prev.filter(s => s.id !== id));
  }

  // ── Filter by category ────────────────────
  function byCategory(cat) {
    return skills.filter(s => s.final_category === cat);
  }

  return { skills, loading, addSkill, deleteSkill, byCategory, refetch: fetchSkills };
}
