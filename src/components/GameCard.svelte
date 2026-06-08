<script>
  export let game = { id: 'pong', name: 'Pong', mode: 'Multiplayer', desc: 'Classic MP pong.' };
  export let progress = null;

  $: hasProgress = (progress?.total ?? 0) > 0;
  $: completion = hasProgress
    ? progress.completion ?? Math.round(((progress.unlocked ?? 0) / Math.max(1, progress.total)) * 100)
    : 0;
</script>

<a href={`#/game/${game.id}`} class="game-card">
  <div class="game-card__media">
    {#if game.image}
      <img class="game-card__image" src={game.image} alt={`${game.name} cover`} loading="lazy" decoding="async" />
    {:else}
      <div class="game-card__placeholder">
        <span>{game.name}</span>
      </div>
    {/if}
  </div>
  <div class="game-card__body">
    <div class="game-card__header">
      <h3 class="game-card__title">{game.name}</h3>
      <span class="game-card__badge">{game.mode}</span>
    </div>
    {#if hasProgress}
      <div class="game-card__progress">
        <div class="game-card__progress-head">
          <span>Achievements</span>
          <span>{progress.unlocked}/{progress.total}</span>
        </div>
        <div class="game-card__progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}>
          <span style={`width:${completion}%`}></span>
        </div>
        <p class="game-card__progress-meta">{progress.pointsUnlocked}/{progress.pointsTotal} pts</p>
      </div>
    {/if}
    <p class="game-card__desc">{game.desc}</p>
  </div>
</a>
