<script>
  import Page from '../components/Page.svelte';
  import GameCard from '../components/GameCard.svelte';
  const single = [
    { id: 'dodger', name: 'Astro Dodger', mode: 'Singleplayer', desc: 'Dodge falling debris and survive as long as you can.' },
    { id: 'td-lite', name: 'Tower Defense Lite', mode: 'Singleplayer', desc: 'Planned.' },
    { id: 'coming-soon-sp', name: 'Coming Soon', mode: 'Singleplayer', desc: 'New singleplayer game on the way.' }
  ];
  const multi = [
    { id: 'pong', name: 'Pong', mode: 'Multiplayer', desc: 'MP core demo.' },
    { id: 'coming-soon-mp-1', name: 'Coming Soon', mode: 'Multiplayer', desc: 'New multiplayer experience incoming.' },
    { id: 'coming-soon-mp-2', name: 'Coming Soon', mode: 'Multiplayer', desc: 'More online games will appear here.' }
  ];
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
