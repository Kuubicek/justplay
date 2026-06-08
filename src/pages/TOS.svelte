<script>
  import Page from '../components/Page.svelte';
</script>

<Page>
  <div class="content-shell">

    <div class="legal-hero">
      <p class="section-eyebrow">Legal</p>
      <h1 class="legal-hero__title">Terms of Service</h1>
      <p class="legal-hero__meta">Last updated: June 2025</p>
    </div>

    <div class="legal-body">

      <section class="legal-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using JustPlay ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. JustPlay is a browser-based arcade platform that provides games, leaderboards, and social features.
        </p>
      </section>

      <section class="legal-section">
        <h2>2. User Accounts</h2>
        <p>
          To access certain features such as leaderboards, achievements, and multiplayer rooms, you must create an account. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration and to keep it up to date.
        </p>
        <p>
          You may not create an account on behalf of another person or use another person's account. We reserve the right to suspend or terminate accounts that violate these terms.
        </p>
      </section>

      <section class="legal-section">
        <h2>3. Permitted Use</h2>
        <p>
          JustPlay is provided for personal, non-commercial entertainment. You may use the Platform to play games, track your progress, and compete on leaderboards. You may not use the Platform for any unlawful purpose or in a way that could harm the Platform or other users.
        </p>
      </section>

      <section class="legal-section">
        <h2>4. Prohibited Conduct</h2>
        <p>The following actions are strictly prohibited:</p>
        <ul>
          <li>Attempting to manipulate leaderboard scores through cheating, exploits, or automated tools</li>
          <li>Harassing, threatening, or abusing other users</li>
          <li>Attempting to gain unauthorized access to the Platform or other users' accounts</li>
          <li>Distributing malware or engaging in any activity that disrupts the Platform</li>
          <li>Creating multiple accounts to circumvent restrictions or gain unfair advantages</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>5. Intellectual Property</h2>
        <p>
          All content on JustPlay, including but not limited to game code, graphics, design, and text, is the property of the Platform's creator unless otherwise noted. You may not copy, reproduce, distribute, or create derivative works from any content on the Platform without prior written permission.
        </p>
      </section>

      <section class="legal-section">
        <h2>6. Disclaimer of Warranties</h2>
        <p>
          JustPlay is provided "as is" without warranties of any kind. We do not guarantee that the Platform will be available at all times, free of errors, or that scores and progress data will be retained indefinitely. The Platform is a student project and may be subject to changes, downtime, or discontinuation.
        </p>
      </section>

      <section class="legal-section">
        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by applicable law, JustPlay shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform, including loss of data or access to your account.
        </p>
      </section>

      <section class="legal-section">
        <h2>8. Changes to These Terms</h2>
        <p>
          We may update these Terms of Service from time to time. Continued use of the Platform after changes are posted constitutes your acceptance of the updated terms. We recommend reviewing this page periodically.
        </p>
      </section>

      <section class="legal-section">
        <h2>9. Contact</h2>
        <p>
          If you have any questions about these Terms of Service, you may contact us via the information provided on the Platform.
        </p>
      </section>

      <div class="legal-footer-links">
        <a href="#/privacy">Privacy Policy</a>
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
    margin: 8px 0 0;
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
