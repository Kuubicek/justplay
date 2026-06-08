<script>
  import Page from '../components/Page.svelte';
  import GameCard from '../components/GameCard.svelte';
  import { gameCatalog } from '../lib/gameData';
  import { user } from '../lib/stores';
  import { getAchievementProgressForUser } from '../lib/api/achievements';

  const single = gameCatalog.singleplayer;
  const multi = gameCatalog.multiplayer;
  let progressByGame = {};
  let progressKey = null;

  const gameProgress = (gameId) => progressByGame?.[gameId] || null;

  const loadProgress = async (userId) => {
    try {
      const summary = await getAchievementProgressForUser(userId || null);
      progressByGame = summary?.byGameId || {};
    } catch {
      progressByGame = {};
    }
  };

  $: {
    const nextKey = $user?.id || 'guest';
    if (nextKey !== progressKey) {
      progressKey = nextKey;
      loadProgress($user?.id || null);
    }
  }
</script>

<Page title="Games" subtitle="All singleplayer and multiplayer games available on JustPlay.">
  <div class="games-section-header">
    <div>
      <p class="section-eyebrow">Singleplayer</p>
      <h2 class="section-title">Solo sessions</h2>
      <p class="section-copy">Score-chase games and strategy runs you can pick up and finish in one sitting.</p>
    </div>
    <span class="games-count">{single.length} game{single.length !== 1 ? 's' : ''}</span>
  </div>
  <div class="grid md:grid-cols-3 gap-4 mb-10 game-grid">
    {#each single as g}
      <GameCard game={g} progress={gameProgress(g.id)} />
    {/each}
  </div>

  <div class="games-section-header">
    <div>
      <p class="section-eyebrow">Multiplayer</p>
      <h2 class="section-title">1v1 matches</h2>
      <p class="section-copy">Real-time games with room codes, lobby invites, and instant rematches.</p>
    </div>
    <span class="games-count">{multi.length} game{multi.length !== 1 ? 's' : ''}</span>
  </div>
  <div class="grid md:grid-cols-3 gap-4 game-grid">
    {#each multi as g}
      <GameCard game={g} progress={gameProgress(g.id)} />
    {/each}
  </div>
</Page>

<style>
  .games-section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .games-count {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--text-muted);
    padding-bottom: 6px;
  }
</style>
