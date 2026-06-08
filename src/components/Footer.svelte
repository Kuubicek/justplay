<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">

      <!-- Brand column -->
      <div class="footer-brand">
        <a class="footer-logo" href="#/">JustPlay</a>
        <p class="footer-tagline">
          A fast-loading browser arcade. Pick a game, play instantly, track your progress.
        </p>
      </div>

      <!-- Games column -->
      <div class="footer-col">
        <p class="footer-col-title">Games</p>
        <ul class="footer-links">
          <li><a href="#/game/pong">Pong Arena</a></li>
          <li><a href="#/game/pulse-rally">Pulse Rally</a></li>
          <li><a href="#/game/dodger">Astro Dodger</a></li>
          <li><a href="#/game/td-lite">Tower Defense Lite</a></li>
          <li><a href="#/game/age-of-war-lite">Age of War Lite</a></li>
          <li><a href="#/game/tap-rush">Tap Rush</a></li>
          <li><a href="#/game/orb-collector">Orb Collector</a></li>
        </ul>
      </div>

      <!-- Platform column -->
      <div class="footer-col">
        <p class="footer-col-title">Platform</p>
        <ul class="footer-links">
          <li><a href="#/games">All games</a></li>
          <li><a href="#/leaderboard">Leaderboard</a></li>
          <li><a href="#/lobby">Lobby</a></li>
          <li><a href="#/profile">Profile</a></li>
          <li><a href="#/about">About</a></li>
        </ul>
      </div>

      <!-- Account column -->
      <div class="footer-col">
        <p class="footer-col-title">Account</p>
        <ul class="footer-links">
          <li><a href="#/login">Login</a></li>
          <li><a href="#/register">Register</a></li>
        </ul>
      </div>

    </div>

    <div class="footer-bottom">
      <span>&copy; {new Date().getFullYear()} JustPlay — browser arcade.</span>
      <div class="footer-bottom-right">
        <a href="#/tos">Terms of Service</a>
        <span class="footer-sep">·</span>
        <a href="#/privacy">Privacy Policy</a>
      </div>
    </div>
  </div>
</footer>

<style>
  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
  }

  @media (max-width: 900px) {
    .footer-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 520px) {
    .footer-grid {
      grid-template-columns: 1fr;
    }
  }

  .footer-brand {
    display: grid;
    gap: 10px;
    align-content: start;
  }

  .footer-logo {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--text-primary);
    text-decoration: none;
  }

  .footer-logo:hover {
    color: var(--accent);
  }

  .footer-tagline {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.6;
    max-width: 240px;
  }

  .footer-col {
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .footer-col-title {
    margin: 0;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .footer-links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }

  .footer-links a {
    font-size: 0.88rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 120ms ease;
  }

  .footer-links a:hover {
    color: var(--text-primary);
  }

  .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .footer-bottom-right {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
  }

  .footer-bottom-right a {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.8rem;
    transition: color 120ms ease;
  }

  .footer-bottom-right a:hover {
    color: var(--text-secondary);
  }

  .footer-sep {
    font-size: 0.8rem;
  }
</style>
