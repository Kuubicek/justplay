<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '../lib/router';
  import { signOut, isAnonymousUser } from '../lib/api/auth';
  import { user, guest } from '../lib/stores';

  const nav = [
    { href: '/games', label: 'Games' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/lobby', label: 'Lobby' },
    { href: '/about', label: 'About' }
  ];

  let theme = 'dark';
  let isAnon = false;
  let lastScrollY = 0;
  let ticking = false;
  let visible = true;
  let appearing = false;
  let appearTimer;
  let prevVisible = true;

  function onVisibleChange(v) {
    if (v && !prevVisible) {
      appearing = true;
      clearTimeout(appearTimer);
      appearTimer = setTimeout(() => { appearing = false; }, 650);
    }
    prevVisible = v;
  }

  $: onVisibleChange(visible);

  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const current = window.scrollY;
        if (current < 80) {
          visible = true;
        } else {
          visible = current <= lastScrollY;
        }
        lastScrollY = current;
        ticking = false;
      });
      ticking = true;
    }
  }

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

    if (typeof window !== 'undefined') {
      lastScrollY = window.scrollY;
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScroll);
    }
    clearTimeout(appearTimer);
  });

  const doLogout = async () => {
    await signOut();
    goto('/');
  };

  $: isAnon = isAnonymousUser($user);
</script>

<nav class="site-nav island" class:island--hidden={!visible} class:island--appearing={appearing}>
  <div class="container nav-inner">
    <button class="nav-brand" on:click={() => goto('/')}>
      <span class="nav-brand__text">JustPlay</span>
    </button>
    <div class="nav-actions">
      {#each nav as n}
        <a class="nav-link" href={`#${n.href}`}>{n.label}</a>
      {/each}

      <button
        class="btn btn-ghost nav-theme-btn"
        type="button"
        on:click={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {#if theme === 'light'}
          <!-- Moon icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {:else}
          <!-- Sun icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        {/if}
      </button>

      {#if $user && !isAnon}
        <a class="btn btn-ghost" href="#/profile">Profile</a>
        <button class="btn btn-ghost" type="button" on:click={doLogout}>Logout</button>
      {:else if $guest || isAnon}
        <span class="pill">Guest</span>
        <a class="btn btn-accent" href="#/login">Login</a>
      {:else}
        <a class="btn btn-ghost" href="#/register">Register</a>
        <a class="btn btn-accent" href="#/login">Login</a>
      {/if}
    </div>
  </div>
</nav>

<style>
  .nav-brand__text {
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .nav-theme-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Island nav — all pages */
  :global(.site-nav.island) {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: clamp(600px, 72vw, 1100px);
    max-width: calc(100vw - 32px);
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.13);
    background: rgba(var(--bg-body-rgb), 0.76);
    backdrop-filter: blur(22px);
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.09);
    padding: 0 10px;
    transition: top 0.38s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 50;
  }

  :global(.site-nav.island::after) {
    display: none;
  }

  /* Hidden — slide up */
  :global(.site-nav.island.island--hidden) {
    top: -100px;
    opacity: 0;
    pointer-events: none;
  }

  /* Appear bounce — plays once, then class is removed */
  :global(.site-nav.island.island--appearing) {
    animation: island-bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes island-bounce-in {
    from { transform: translateX(-50%) translateY(-18px); }
    to   { transform: translateX(-50%) translateY(0px); }
  }

  :global(.site-nav.island) :global(.nav-inner) {
    height: 68px;
    padding: 0 8px;
    gap: 6px;
  }

  /* Pill buttons inside island */
  :global(.site-nav.island) :global(.btn) {
    border-radius: 999px;
    padding: 0 20px;
    height: 40px;
    font-size: 0.875rem;
  }

  :global(.site-nav.island) :global(.btn-ghost) {
    border-style: solid;
  }
</style>
