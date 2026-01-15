<script>
  export let title = '';
  export let subtitle = '';
</script>

<section class="page-section">
  {#if title}
    <h1 class="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
  {/if}
  {#if subtitle}
    <p class="page-subtitle">{subtitle}</p>
  {/if}
  <slot />
</section>
