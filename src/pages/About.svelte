<script>
  import Page from '../components/Page.svelte';
</script>

<Page>
  <div class="content-shell">

    <!-- Hero banner -->
    <div class="about-hero">
      <p class="section-eyebrow">Platform overview</p>
      <h1 class="about-hero__title">Play fast. Track progress. Come back for more.</h1>
      <p class="about-hero__copy">
        JustPlay is a browser-based arcade built around short sessions, instant matchmaking, and clear progression. No installs, no waiting — open a game and start playing.
      </p>
      <div class="about-hero__actions">
        <a class="btn btn-accent" href="#/games">Browse games</a>
        <a class="btn btn-ghost" href="#/leaderboard">Leaderboard</a>
      </div>
    </div>

    <!-- Stats row -->
    <div class="about-stats">
      <div class="about-stat">
        <span class="about-stat__value">7</span>
        <span class="about-stat__label">Games</span>
      </div>
      <div class="about-stat">
        <span class="about-stat__value">2</span>
        <span class="about-stat__label">Multiplayer modes</span>
      </div>
      <div class="about-stat">
        <span class="about-stat__value">5</span>
        <span class="about-stat__label">Singleplayer games</span>
      </div>
      <div class="about-stat">
        <span class="about-stat__value">&infin;</span>
        <span class="about-stat__label">Replays</span>
      </div>
    </div>

    <!-- Feature cards 2-col grid -->
    <div class="about-section-header">
      <p class="section-eyebrow">What makes JustPlay</p>
      <h2 class="section-title">Simple structure, real progression</h2>
    </div>

    <div class="grid md:grid-cols-2 gap-3 mb-6">
      <section class="about-card">
        <div class="about-card__icon">&#127918;</div>
        <h3 class="about-card__title">Instant access</h3>
        <p class="about-card__body">
          Every game runs directly in the browser — no download, no plugin, no account required to get started. Pick a game from the catalog and you are playing in seconds.
        </p>
      </section>

      <section class="about-card">
        <div class="about-card__icon">&#128202;</div>
        <h3 class="about-card__title">Progression system</h3>
        <p class="about-card__body">
          Every score can unlock achievements and award achievement points. Points contribute to your player level. Track per-game progress from game cards, detail pages, and your profile.
        </p>
      </section>

      <section class="about-card">
        <div class="about-card__icon">&#128101;</div>
        <h3 class="about-card__title">Multiplayer rooms</h3>
        <p class="about-card__body">
          Room-based games use host authority, shareable room codes, and reconnect-friendly logic. Rematch voting, inactivity handling, and shadow mode keep matches running smoothly.
        </p>
      </section>

      <section class="about-card">
        <div class="about-card__icon">&#127941;</div>
        <h3 class="about-card__title">Leaderboards</h3>
        <p class="about-card__body">
          Global leaderboards for every game with time-range filters. See all-time records, last 24 hours, 7-day, and 30-day windows. Filter to just your own scores to track personal progress.
        </p>
      </section>

      <section class="about-card">
        <div class="about-card__icon">&#128274;</div>
        <h3 class="about-card__title">Fair play &amp; accounts</h3>
        <p class="about-card__body">
          Score submissions are tied to verified accounts. Registration uses email confirmation to keep leaderboards valid. Play as guest for a quick session or sign up to save your stats permanently.
        </p>
      </section>

      <section class="about-card">
        <div class="about-card__icon">&#127775;</div>
        <h3 class="about-card__title">Achievements</h3>
        <p class="about-card__body">
          Each game has its own achievement track — from first play milestones to high-score challenges. Platform-wide achievements reward exploration across the full catalog.
        </p>
      </section>
    </div>

    <!-- Game type breakdown -->
    <div class="about-section-header">
      <p class="section-eyebrow">The catalog</p>
      <h2 class="section-title">Two modes, seven games</h2>
    </div>

    <div class="grid md:grid-cols-2 gap-3 mb-6">
      <section class="about-mode-card">
        <div class="about-mode-card__header">
          <span class="pill">Singleplayer</span>
          <span class="about-mode-card__count">5 games</span>
        </div>
        <h3 class="about-mode-card__title">Score chase &amp; strategy</h3>
        <p class="about-mode-card__body">
          Solo games range from one-minute reaction sprints to 15-minute strategy sessions. Each has its own leaderboard and achievement track.
        </p>
        <ul class="about-mode-card__list">
          <li><a href="#/game/dodger">Astro Dodger</a> — dodge escalating meteor waves</li>
          <li><a href="#/game/td-lite">Tower Defense Lite</a> — lane defense &amp; upgrades</li>
          <li><a href="#/game/age-of-war-lite">Age of War Lite</a> — evolving lane combat</li>
          <li><a href="#/game/tap-rush">Tap Rush</a> — 30-second reaction sprint</li>
          <li><a href="#/game/orb-collector">Orb Collector</a> — timed grid chase</li>
        </ul>
      </section>

      <section class="about-mode-card">
        <div class="about-mode-card__header">
          <span class="pill">Multiplayer</span>
          <span class="about-mode-card__count">2 games</span>
        </div>
        <h3 class="about-mode-card__title">1v1 real-time matches</h3>
        <p class="about-mode-card__body">
          Multiplayer games use room codes and host-managed rounds. Matches are short, rematches are instant, and spectators can watch live.
        </p>
        <ul class="about-mode-card__list">
          <li><a href="#/game/pong">Pong Arena</a> — classic 1v1 paddles with fast lobbies</li>
          <li><a href="#/game/pulse-rally">Pulse Rally</a> — head-to-head tap race to 30 pulses</li>
        </ul>
      </section>
    </div>

    <!-- Tech note -->
    <div class="about-tech">
      <p class="section-eyebrow">Built with</p>
      <div class="about-tech__pills">
        <span class="pill">Svelte</span>
        <span class="pill">Vite</span>
        <span class="pill">Tailwind CSS</span>
        <span class="pill">Supabase</span>
        <span class="pill">HTML5 Canvas</span>
      </div>
    </div>

  </div>
</Page>

<style>
  .about-hero {
    padding: 32px 0 28px;
    display: grid;
    gap: 12px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 28px;
  }

  .about-hero__title {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    font-weight: 700;
    font-family: "Space Grotesk", "Inter var", system-ui, sans-serif;
    line-height: 1.2;
  }

  .about-hero__copy {
    margin: 0;
    max-width: 580px;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .about-hero__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .about-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
    margin-bottom: 32px;
  }

  .about-stat {
    display: grid;
    gap: 4px;
    padding: 14px 12px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--bg-surface-strong);
    text-align: center;
  }

  .about-stat__value {
    font-size: 1.85rem;
    font-weight: 700;
    font-family: "Space Grotesk", system-ui, sans-serif;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .about-stat__label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-muted);
  }

  .about-section-header {
    margin-bottom: 16px;
  }

  .about-card {
    display: grid;
    gap: 8px;
    padding: 16px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--bg-surface-strong);
    transition: border-color 140ms ease, transform 140ms ease;
  }

  .about-card:hover {
    border-color: rgba(var(--text-primary-rgb), 0.18);
    transform: translateY(-1px);
  }

  .about-card__icon {
    font-size: 1.5rem;
    line-height: 1;
  }

  .about-card__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .about-card__body {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.55;
  }

  .about-mode-card {
    display: grid;
    gap: 10px;
    padding: 16px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: linear-gradient(135deg, rgba(77, 163, 255, 0.06), rgba(71, 230, 199, 0.04));
  }

  .about-mode-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .about-mode-card__count {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-muted);
  }

  .about-mode-card__title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
  }

  .about-mode-card__body {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .about-mode-card__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }

  .about-mode-card__list li {
    position: relative;
    padding-left: 16px;
    color: var(--text-secondary);
    font-size: 0.88rem;
    line-height: 1.4;
  }

  .about-mode-card__list li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.52em;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--accent);
    opacity: 0.65;
  }

  .about-mode-card__list a {
    color: var(--text-primary);
    font-weight: 500;
    text-decoration: none;
  }

  .about-mode-card__list a:hover {
    color: var(--accent);
  }

  .about-tech {
    display: grid;
    gap: 12px;
    padding: 24px 0 8px;
    border-top: 1px solid var(--border);
    margin-top: 8px;
  }

  .about-tech__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
