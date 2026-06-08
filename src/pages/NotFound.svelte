<script>
  import Page from '../components/Page.svelte';
</script>

<Page>
  <div class="notfound">
    <div class="notfound__code">404</div>
    <h1 class="notfound__title">Page not found</h1>
    <p class="notfound__copy">
      The page you are looking for does not exist or has been moved.
    </p>
    <div class="notfound__actions">
      <a class="btn btn-accent" href="#/">Go home</a>
      <a class="btn btn-ghost" href="#/games">Browse games</a>
    </div>
  </div>
</Page>

<style>
  .notfound {
    display: grid;
    gap: 16px;
    justify-items: center;
    text-align: center;
    padding: 64px 0 80px;
  }

  .notfound__code {
    font-size: clamp(5rem, 16vw, 10rem);
    font-weight: 800;
    font-family: "Space Grotesk", "Inter var", system-ui, sans-serif;
    line-height: 1;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 40px rgba(77, 163, 255, 0.3));
  }

  .notfound__title {
    margin: 0;
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 600;
  }

  .notfound__copy {
    margin: 0;
    color: var(--text-secondary);
    font-size: 1rem;
    max-width: 360px;
  }

  .notfound__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
  }
</style>
