<script>
  export let title = '';
  export let subtitle = '';
</script>

<section class="page-section">
  {#if title || subtitle}
    <header class="page-header">
      {#if title}
        <h1 class="page-header__title">{title}</h1>
      {/if}
      {#if subtitle}
        <p class="page-header__subtitle">{subtitle}</p>
      {/if}
    </header>
  {/if}
  <slot />
</section>

<style>
  .page-header {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
    display: grid;
    gap: 6px;
  }

  .page-header__title {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 700;
    font-family: "Space Grotesk", "Inter var", system-ui, sans-serif;
    letter-spacing: -0.01em;
  }

  .page-header__subtitle {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }
</style>
