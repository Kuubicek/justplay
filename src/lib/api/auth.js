import { supabase } from '../supabaseClient';
import { user, guest } from '../stores';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  try { await supabase.rpc('ensure_profile'); } catch {}
  await refreshUserStore();
  guest.set(false);
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  try { await supabase.rpc('ensure_profile'); } catch {}
  await refreshUserStore();
  guest.set(false);
  return data;
}

export async function signInWithGoogle() {
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/#/profile` : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: redirectTo ? { redirectTo } : undefined
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (e) {
    // Even if remote sign-out fails, clear local state so UI updates
    console.error('Sign out error:', e);
  } finally {
    user.set(null);
    guest.set(false);
  }
}

export async function refreshUserStore() {
  const { data } = await supabase.auth.getUser();
  user.set(data?.user || null);
}

// Call once at app start.
export async function initAuth() {
  await refreshUserStore();
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      try { await supabase.rpc('ensure_profile'); } catch {}
    }
    refreshUserStore();
  });
}
