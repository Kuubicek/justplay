<script>
  import { onMount } from 'svelte';
  import GameCard from '../components/GameCard.svelte';
  import { user } from '../lib/stores';
  import { getAchievementProgressForUser } from '../lib/api/achievements';

  const previewGames = [
    { id: 'pong',          name: 'Pong Arena',     mode: 'Multiplayer',  image: '/images/games/pong.jpg',          accent: '#4da3ff' },
    { id: 'pulse-rally',   name: 'Pulse Rally',    mode: 'Multiplayer',  image: '/images/games/pulse-rally.jpg',   accent: '#f59e0b' },
    { id: 'age-of-war-lite', name: 'Age of War Lite', mode: 'Singleplayer', image: '/images/games/age-of-war-lite.svg', accent: '#fb7185' },
  ];

  const featured = [
    { id: 'pong',          name: 'Pong Arena',      mode: 'Multiplayer',  desc: 'Fast duels, lobby invites, and instant rematches.',          image: '/images/games/pong.jpg' },
    { id: 'pulse-rally',   name: 'Pulse Rally',     mode: 'Multiplayer',  desc: 'Tap fast to charge your meter in head-to-head races.',       image: '/images/games/pulse-rally.jpg' },
    { id: 'tap-rush',      name: 'Tap Rush',        mode: 'Singleplayer', desc: '30-second clicking sprint with a moving target.',           image: '/images/games/tap-rush.svg' },
    { id: 'age-of-war-lite', name: 'Age of War Lite', mode: 'Singleplayer', desc: 'Lane battle: spawn units, upgrade ages, destroy the base.', image: '/images/games/age-of-war-lite.svg' },
    { id: 'orb-collector', name: 'Orb Collector',   mode: 'Singleplayer', desc: 'Collect orbs on a grid before the timer runs out.',         image: '/images/games/orb-collector.svg' },
  ];

  let progressByGame = {};
  let progressKey = null;

  const gameProgress = (gameId) => progressByGame?.[gameId] || null;

  const loadProgress = async (userId) => {
    try {
      const summary = await getAchievementProgressForUser(userId || null);
      progressByGame = summary?.byGameId || {};
    } catch {
      progressByGame = {};
    }
  };

  $: {
    const nextKey = $user?.id || 'guest';
    if (nextKey !== progressKey) {
      progressKey = nextKey;
      loadProgress($user?.id || null);
    }
  }
</script>

<!-- ========== HERO ========== -->
<section class="hero-v2" aria-label="JustPlay arcade">

  <!-- Animated background -->
  <div class="hbg" aria-hidden="true">
    <div class="hbg__blob hbg__blob--1"></div>
    <div class="hbg__blob hbg__blob--2"></div>
    <div class="hbg__blob hbg__blob--3"></div>
    <div class="hbg__grid"></div>
  </div>

  <div class="hero-inner container">

    <!-- Left: text -->
    <div class="hero-text">
      <div class="hero-badge">
        <span class="hero-badge__dot"></span>
        Browser arcade &middot; 7 games live
      </div>

      <h1 class="hero-title">
        Play. Compete.<br>
        <span class="hero-title__shine">Rank up.</span>
      </h1>

      <p class="hero-desc">
        Instant browser games with real leaderboards, achievements, and live 1v1 multiplayer.
        No install. Open a game and go.
      </p>

      <div class="hero-actions">
        <a class="btn btn-accent" href="#/games">Browse games</a>
        <a class="btn btn-ghost" href="#/leaderboard">Leaderboard</a>
      </div>

      <div class="hero-stats">
        <div class="hero-stat">
          <span class="hero-stat__n">7</span>
          <span class="hero-stat__l">Games</span>
        </div>
        <div class="hero-stat-sep"></div>
        <div class="hero-stat">
          <span class="hero-stat__n">2</span>
          <span class="hero-stat__l">Multiplayer</span>
        </div>
        <div class="hero-stat-sep"></div>
        <div class="hero-stat">
          <span class="hero-stat__n">&infin;</span>
          <span class="hero-stat__l">Replays</span>
        </div>
      </div>
    </div>

    <!-- Right: floating game cards -->
    <div class="hero-visual" aria-hidden="true">
      {#each previewGames as game, i}
        <div
          class="hcard hcard--{i}"
          style="--ha: {game.accent};"
        >
          <div class="hcard__img">
            <img src={game.image} alt={game.name} loading="lazy" />
          </div>
          <div class="hcard__body">
            <span class="hcard__mode">{game.mode}</span>
            <span class="hcard__name">{game.name}</span>
          </div>
          <div class="hcard__glow"></div>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ========== FEATURED GAMES ========== -->
<section class="page-section">
  <div class="section-header">
    <div>
      <p class="section-eyebrow">Ready to play</p>
      <h2 class="section-title">Pick a quick match or a longer run</h2>
      <p class="section-copy">
        Highlighted games move fast, load instantly, and are ready for your next score chase.
      </p>
    </div>
    <a class="btn btn-ghost" href="#/games">View all</a>
  </div>
  <div class="grid md:grid-cols-2 gap-4 game-grid">
    {#each featured as g}
      <GameCard game={g} progress={gameProgress(g.id)} />
    {/each}
  </div>
</section>

<style>
  /* =====================
     HERO WRAPPER
  ===================== */
  .hero-v2 {
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--border);
  }

  /* =====================
     ANIMATED BACKGROUND
  ===================== */
  .hbg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  /* Dot grid overlay */
  .hbg__grid {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.055) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* Colored animated blobs */
  .hbg__blob {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(90px);
  }

  .hbg__blob--1 {
    width: 560px;
    height: 560px;
    top: -220px;
    left: -100px;
    background: radial-gradient(circle, rgba(77, 163, 255, 0.55), transparent 65%);
    opacity: 0.55;
    animation: blob1 15s ease-in-out infinite;
  }

  .hbg__blob--2 {
    width: 460px;
    height: 460px;
    bottom: -160px;
    right: 5%;
    background: radial-gradient(circle, rgba(71, 230, 199, 0.5), transparent 65%);
    opacity: 0.48;
    animation: blob2 19s ease-in-out infinite;
  }

  .hbg__blob--3 {
    width: 380px;
    height: 380px;
    top: 25%;
    left: 38%;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.4), transparent 65%);
    opacity: 0.38;
    animation: blob3 13s ease-in-out infinite;
  }

  @keyframes blob1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(55px, -35px) scale(1.09); }
    66%       { transform: translate(-25px, 28px) scale(0.95); }
  }
  @keyframes blob2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40%       { transform: translate(-42px, 32px) scale(1.07); }
    70%       { transform: translate(32px, -22px) scale(1.11); }
  }
  @keyframes blob3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%       { transform: translate(-55px, -44px) scale(1.16); }
  }

  /* =====================
     HERO INNER 2-COL
  ===================== */
  .hero-inner {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
    padding-top: 68px;
    padding-bottom: 68px;
  }

  /* =====================
     TEXT SIDE
  ===================== */
  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* Live badge */
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 13px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgba(var(--text-primary-rgb), 0.06);
    backdrop-filter: blur(10px);
    font-size: 0.74rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 22px;
    width: fit-content;
  }

  .hero-badge__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 10px rgba(74, 222, 128, 1);
    flex-shrink: 0;
    animation: dot-pulse 2.5s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(74, 222, 128, 0.9); opacity: 1; }
    50%       { box-shadow: 0 0 3px rgba(74, 222, 128, 0.3); opacity: 0.6; }
  }

  /* Headline */
  .hero-title {
    margin: 0 0 18px;
    font-size: clamp(2.5rem, 4.2vw, 4rem);
    font-weight: 800;
    font-family: "Space Grotesk", "Inter var", system-ui, sans-serif;
    line-height: 1.06;
    letter-spacing: -0.025em;
  }

  /* Gradient animated word */
  .hero-title__shine {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 50%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: shine 5s ease infinite;
  }

  @keyframes shine {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }

  /* Description */
  .hero-desc {
    margin: 0 0 28px;
    font-size: 1rem;
    color: var(--text-secondary);
    max-width: 440px;
    line-height: 1.65;
  }

  /* CTA buttons */
  .hero-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 38px;
  }

  /* Stat row */
  .hero-stats {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .hero-stat__n {
    font-size: 1.5rem;
    font-weight: 700;
    font-family: "Space Grotesk", system-ui, sans-serif;
    line-height: 1;
  }

  .hero-stat__l {
    font-size: 0.67rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-muted);
  }

  .hero-stat-sep {
    width: 1px;
    height: 34px;
    background: var(--border);
    flex-shrink: 0;
  }

  /* =====================
     VISUAL SIDE – floating cards
  ===================== */
  .hero-visual {
    position: relative;
    height: 380px;
  }

  .hcard {
    position: absolute;
    width: 195px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(var(--bg-surface-strong-rgb), 0.88);
    backdrop-filter: blur(14px);
    overflow: hidden;
    box-shadow:
      0 20px 55px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.04);
    transition:
      transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 260ms ease,
      filter 260ms ease,
      z-index 0ms;
  }

  /* Top accent stripe using card color */
  .hcard::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--ha), transparent 80%);
    z-index: 2;
  }

  /* Card 0 — left/back */
  .hcard--0 {
    left: 0;
    top: 55px;
    z-index: 2;
    transform: rotate(-7deg);
    filter: brightness(0.68) saturate(0.8);
    animation: fc0 8s ease-in-out infinite;
  }
  @keyframes fc0 {
    0%, 100% { transform: rotate(-7deg) translateY(0px); }
    50%       { transform: rotate(-7deg) translateY(-14px); }
  }

  /* Card 1 — center/front */
  .hcard--1 {
    left: 80px;
    top: 15px;
    z-index: 4;
    transform: rotate(0deg);
    animation: fc1 6.5s ease-in-out infinite;
  }
  @keyframes fc1 {
    0%, 100% { transform: rotate(0deg) translateY(0px); }
    50%       { transform: rotate(0deg) translateY(-18px); }
  }

  /* Card 2 — right/behind */
  .hcard--2 {
    left: 158px;
    top: 60px;
    z-index: 3;
    transform: rotate(7deg);
    filter: brightness(0.74) saturate(0.85);
    animation: fc2 9.5s ease-in-out infinite;
  }
  @keyframes fc2 {
    0%, 100% { transform: rotate(7deg) translateY(0px); }
    50%       { transform: rotate(7deg) translateY(-11px); }
  }

  /* Hover: bring to front, full brightness */
  .hcard:hover {
    z-index: 10;
    filter: brightness(1) saturate(1) !important;
    box-shadow:
      0 32px 80px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 0 28px rgba(77, 163, 255, 0.18);
  }

  /* Subtle inner glow using card accent */
  .hcard__glow {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.35), transparent);
    pointer-events: none;
  }

  .hcard__img {
    width: 100%;
    height: 138px;
    overflow: hidden;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    background: var(--bg-surface-strong);
  }

  .hcard__img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .hcard__body {
    padding: 12px 14px 14px;
    display: grid;
    gap: 3px;
  }

  .hcard__mode {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--ha);
  }

  .hcard__name {
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.25;
  }

  /* =====================
     LIGHT THEME
  ===================== */
  :global([data-theme='light']) .hbg__blob--1 { opacity: 0.22; }
  :global([data-theme='light']) .hbg__blob--2 { opacity: 0.18; }
  :global([data-theme='light']) .hbg__blob--3 { opacity: 0.14; }
  :global([data-theme='light']) .hbg__grid {
    background-image: radial-gradient(circle, rgba(0, 0, 0, 0.055) 1px, transparent 1px);
  }
  :global([data-theme='light']) .hcard {
    border-color: rgba(15, 27, 45, 0.1);
    box-shadow: 0 12px 36px rgba(15, 27, 45, 0.14);
  }
  :global([data-theme='light']) .hcard::before {
    opacity: 0.7;
  }

  /* =====================
     RESPONSIVE
  ===================== */
  @media (max-width: 820px) {
    .hero-inner {
      grid-template-columns: 1fr;
      padding-top: 48px;
      padding-bottom: 48px;
      gap: 0;
    }
    .hero-visual {
      display: none;
    }
  }

  @media (max-width: 520px) {
    .hero-title {
      font-size: clamp(2rem, 8vw, 2.8rem);
    }
    .hero-actions .btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hbg__blob,
    .hcard--0, .hcard--1, .hcard--2,
    .hero-title__shine,
    .hero-badge__dot {
      animation: none;
    }
  }
</style>
