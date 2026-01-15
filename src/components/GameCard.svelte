<script>
  export let game = { id: 'pong', name: 'Pong', mode: 'Multiplayer', desc: 'Classic MP pong.' };
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
    <p class="game-card__desc">{game.desc}</p>
  </div>
</a>
