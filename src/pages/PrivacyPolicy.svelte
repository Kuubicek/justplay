<script>
  import Page from '../components/Page.svelte';
</script>

<Page>
  <div class="content-shell">

    <div class="legal-hero">
      <p class="section-eyebrow">Legal</p>
      <h1 class="legal-hero__title">Privacy Policy</h1>
      <p class="legal-hero__meta">Last updated: June 2025</p>
    </div>

    <div class="legal-body">

      <section class="legal-section">
        <h2>1. Introduction</h2>
        <p>
          JustPlay ("the Platform", "we", "us") is committed to protecting your personal data. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data. By using the Platform, you agree to the practices described in this policy.
        </p>
      </section>

      <section class="legal-section">
        <h2>2. Data We Collect</h2>
        <p>When you use JustPlay, we may collect the following data:</p>
        <ul>
          <li><strong>Account data</strong> — your email address and chosen username, provided during registration</li>
          <li><strong>Game data</strong> — scores, playtime, and game results submitted to leaderboards</li>
          <li><strong>Achievement data</strong> — achievements you have unlocked on the Platform</li>
          <li><strong>Session data</strong> — authentication tokens required to keep you logged in</li>
        </ul>
        <p>
          We do not collect payment information, location data, or any data beyond what is necessary to operate the Platform.
        </p>
      </section>

      <section class="legal-section">
        <h2>3. How We Use Your Data</h2>
        <p>We use your data solely for the following purposes:</p>
        <ul>
          <li>Providing and maintaining your account and player profile</li>
          <li>Displaying scores on public leaderboards</li>
          <li>Tracking and displaying achievements and player progression</li>
          <li>Enabling multiplayer features such as room matchmaking</li>
          <li>Improving the Platform based on usage patterns</li>
        </ul>
        <p>
          We do not sell, rent, or share your personal data with third parties for marketing purposes.
        </p>
      </section>

      <section class="legal-section">
        <h2>4. Data Storage and Security</h2>
        <p>
          Your data is stored and managed through <strong>Supabase</strong>, a third-party database and authentication service. Supabase stores data on servers in the European Union. Passwords are never stored in plain text — they are hashed using industry-standard algorithms before storage.
        </p>
        <p>
          Authentication is handled via secure, short-lived JWT tokens. We take reasonable technical measures to protect your data, but no system can guarantee absolute security.
        </p>
      </section>

      <section class="legal-section">
        <h2>5. Public Data</h2>
        <p>
          Your username and scores submitted to leaderboards are visible to all users of the Platform. By submitting a score, you agree that it may be displayed publicly alongside your username. If you wish to remove your scores from the leaderboard, you may delete your account.
        </p>
      </section>

      <section class="legal-section">
        <h2>6. Your Rights (GDPR)</h2>
        <p>
          If you are located in the European Union, you have the following rights regarding your personal data:
        </p>
        <ul>
          <li><strong>Right of access</strong> — you may request a copy of the data we hold about you</li>
          <li><strong>Right to rectification</strong> — you may request correction of inaccurate data</li>
          <li><strong>Right to erasure</strong> — you may request deletion of your account and associated data</li>
          <li><strong>Right to restriction</strong> — you may request that we limit how we process your data</li>
          <li><strong>Right to data portability</strong> — you may request your data in a machine-readable format</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us using the information below.
        </p>
      </section>

      <section class="legal-section">
        <h2>7. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. If you delete your account, your personal data will be removed from our systems within a reasonable period. Anonymised aggregate data (such as total game counts) may be retained for statistical purposes.
        </p>
      </section>

      <section class="legal-section">
        <h2>8. Cookies and Local Storage</h2>
        <p>
          JustPlay uses browser local storage to maintain your login session. We do not use third-party tracking cookies or advertising cookies. No data is shared with advertising networks.
        </p>
      </section>

      <section class="legal-section">
        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page. Continued use of the Platform after changes are posted constitutes your acceptance of the updated policy.
        </p>
      </section>

      <section class="legal-section">
        <h2>10. Contact</h2>
        <p>
          If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us via the information provided on the Platform.
        </p>
      </section>

      <div class="legal-footer-links">
        <a href="#/tos">Terms of Service</a>
        <a href="#/">Back to Home</a>
      </div>

    </div>
  </div>
</Page>

<style>
  .legal-hero {
    padding: 32px 0 24px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
    display: grid;
    gap: 6px;
  }

  .legal-hero__title {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 700;
    font-family: "Space Grotesk", "Inter var", system-ui, sans-serif;
  }

  .legal-hero__meta {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .legal-body {
    display: grid;
    gap: 0;
    max-width: 720px;
  }

  .legal-section {
    padding: 20px 0;
    border-bottom: 1px solid var(--border);
  }

  .legal-section:last-of-type {
    border-bottom: none;
  }

  .legal-section h2 {
    margin: 0 0 10px;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .legal-section p {
    margin: 0 0 8px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.65;
  }

  .legal-section p:last-child {
    margin-bottom: 0;
  }

  .legal-section ul {
    margin: 8px 0 8px;
    padding-left: 20px;
    display: grid;
    gap: 6px;
  }

  .legal-section ul li {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .legal-footer-links {
    display: flex;
    gap: 20px;
    padding-top: 28px;
    flex-wrap: wrap;
  }

  .legal-footer-links a {
    font-size: 0.88rem;
    color: var(--accent);
    text-decoration: none;
  }

  .legal-footer-links a:hover {
    text-decoration: underline;
  }
</style>
