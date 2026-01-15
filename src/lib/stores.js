import { writable } from 'svelte/store';

// Supabase auth user
export const user = writable(null);

// Guest mode (persisted in localStorage)
const guestKey = 'jp_guest';
const storedGuest = typeof localStorage !== 'undefined' ? localStorage.getItem(guestKey) === '1' : false;
export const guest = writable(storedGuest);
guest.subscribe((v) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(guestKey, v ? '1' : '0');
});

// Simple UI store
export const ui = writable({ sidebarOpen: false });
