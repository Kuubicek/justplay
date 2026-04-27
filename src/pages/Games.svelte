<script>
  import Page from '../components/Page.svelte';
  import GameCard from '../components/GameCard.svelte';
  import { gameCatalog } from '../lib/gameData';

  const single = gameCatalog.singleplayer;
  const multi = gameCatalog.multiplayer;
</script>

<Page title="Games" subtitle="Browse singleplayer & multiplayer.">
  <h2 class="text-xl font-semibold mb-3">Singleplayer</h2>
  <div class="grid md:grid-cols-3 gap-4 mb-8 game-grid">
    {#each single as g}
      <GameCard game={g} />
    {/each}
  </div>

  <h2 class="text-xl font-semibold mb-3">Multiplayer</h2>
  <div class="grid md:grid-cols-3 gap-4 game-grid">
    {#each multi as g}
      <GameCard game={g} />
    {/each}
  </div>
</Page>
