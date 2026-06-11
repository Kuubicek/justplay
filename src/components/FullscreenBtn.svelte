<script>
  export let target = null;

  let isFs = false;

  function toggle() {
    if (!document.fullscreenElement) {
      (target || document.documentElement).requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function onFsChange() {
    isFs = !!document.fullscreenElement;
  }
</script>

<svelte:window on:fullscreenchange={onFsChange} />

<button
  class="fs-btn"
  type="button"
  on:click={toggle}
  title={isFs ? 'Exit fullscreen' : 'Fullscreen'}
  aria-label={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}
>
  {#if isFs}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
      <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
      <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
      <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
    </svg>
  {:else}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
      <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
      <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
      <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
    </svg>
  {/if}
</button>

<style>
  .fs-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 20;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.52);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    opacity: 0.55;
    transition: opacity 0.18s;
    padding: 0;
  }
  .fs-btn:hover {
    opacity: 1;
  }
</style>
