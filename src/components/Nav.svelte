<script>
  import { onMount } from 'svelte';
  import { goto } from '../lib/router';
  import { signOut } from '../lib/api/auth';
  import { user, guest } from '../lib/stores';

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'Games' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/lobby', label: 'Lobby' },
    { href: '/rooms', label: 'Rooms' },
    { href: '/about', label: 'About' }
  ];

  let theme = 'dark';

  const applyTheme = (t) => {
    theme = t;
    if (typeof document !== 'undefined') {
      if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('jp_theme', t);
    }
  };

  const toggleTheme = () => applyTheme(theme === 'light' ? 'dark' : 'light');

  onMount(() => {
    let stored = null;
    if (typeof localStorage !== 'undefined') stored = localStorage.getItem('jp_theme');
    const prefersLight = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;
    applyTheme(stored === 'light' || (!stored && prefersLight) ? 'light' : 'dark');
  });

  const doLogout = async () => {
    await signOut();
    goto('/');
  };
</script>

<nav class="site-nav">
  <div class="container nav-inner">
    <button class="nav-brand" on:click={() => goto('/')}>JustPlay</button>
    <div class="nav-actions">
      {#each nav as n}
        <a class="nav-link" href={`#${n.href}`}>{n.label}</a>
      {/each}
      <button class="btn btn-ghost" type="button" on:click={toggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? 'Light' : 'Dark'}
      </button>
      {#if $user}
        <a class="px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600" href="#/profile">Profile</a>
        <button class="btn btn-ghost" type="button" on:click={doLogout}>Logout</button>
      {:else if $guest}
        <span class="text-white/70">Guest</span>
        <a class="px-3 py-1 rounded-lg bg-sky-600/80 hover:bg-sky-600" href="#/login">Login</a>
      {:else}
        <a class="px-3 py-1 rounded-lg bg-sky-600/80 hover:bg-sky-600" href="#/login">Login</a>
      {/if}
    </div>
  </div>
</nav>
