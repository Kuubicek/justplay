import { get } from 'svelte/store';
import { supabase } from '../supabaseClient';
import { user, guest } from '../stores';

export const isAnonymousUser = (u) =>
  !!(u?.is_anonymous || u?.app_metadata?.provider === 'anonymous' || u?.app_metadata?.providers?.includes?.('anonymous'));

let guestSessionPromise = null;

export async function ensureGuestSession() {
  if (guestSessionPromise) return guestSessionPromise;
  if (!get(guest)) return null;
  const { data } = await supabase.auth.getUser();
  if (data?.user) return data.user;
  if (typeof supabase.auth.signInAnonymously !== 'function') return null;
  guestSessionPromise = supabase.auth.signInAnonymously()
    .then(({ data: anonData, error }) => {
      if (error) throw error;
      return anonData?.user || null;
    })
    .finally(() => {
      guestSessionPromise = null;
    });
  return guestSessionPromise;
}

export async function ensureAuthUser() {
  const { data } = await supabase.auth.getUser();
  if (data?.user) return data.user;
  return ensureGuestSession();
}

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
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth-redirect', '/profile');
  }
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
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
  ensureGuestSession();
  guest.subscribe((v) => {
    if (v) ensureGuestSession();
  });
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      try { await supabase.rpc('ensure_profile'); } catch {}
    }
    refreshUserStore();
    if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
      const redirectTo = sessionStorage.getItem('oauth-redirect');
      if (redirectTo) {
        sessionStorage.removeItem('oauth-redirect');
        window.location.hash = redirectTo;
      }
    }
  });
}
