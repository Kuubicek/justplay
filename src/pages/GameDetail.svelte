<script>
  import Page from '../components/Page.svelte';
  import GameAchievementsPanel from '../components/GameAchievementsPanel.svelte';
  import { params } from '../lib/router';
  import { gameDetails } from '../lib/gameData';

  const buttonClass = (variant) => {
    if (variant === 'accent') return 'btn btn-accent';
    if (variant === 'ghost') return 'btn btn-ghost';
    return 'btn';
  };

  const fallback = {
    id: 'game',
    name: 'Game',
    mode: 'Unknown',
    status: 'Unavailable',
    summary: 'This game is not listed yet. Check back soon for updates.',
    controls: ['Controls info will appear here.'],
    actions: [{ label: 'Browse Games', href: '#/games', variant: 'accent' }],
    meta: [{ label: 'Game ID', value: 'unknown' }]
  };

  $: gameId = $params.gameId || 'game';
  $: game = gameDetails[gameId] || { ...fallback, id: gameId, meta: [{ label: 'Game ID', value: gameId }] };
</script>

<Page>
  <div class="game-detail">
    <div class="game-detail__hero">
      <div class="game-detail__media">
        {#if game.image}
          <img class="game-detail__image" src={game.image} alt={`${game.name} cover`} loading="lazy" decoding="async" />
        {:else}
          <div class="game-detail__placeholder">
            <span>{game.name}</span>
          </div>
        {/if}
      </div>
      <div class="game-detail__info">
        <div class="game-detail__tags">
          <span class="pill">{game.mode}</span>
          <span class="pill">{game.status}</span>
        </div>
        <h1 class="game-detail__title">{game.name}</h1>
        <p class="game-detail__summary">{game.summary}</p>
        <div class="game-detail__controls">
          <h2 class="game-detail__section-title">Controls</h2>
          <ul>
            {#each game.controls as control}
              <li>{control}</li>
            {/each}
          </ul>
        </div>
        {#if game.playPanel}
          <div class="game-detail__play">
            <a class="btn game-detail__play-button" href={game.playHref}>Play</a>
            <div class="game-detail__actions game-detail__actions--stacked">
              {#each game.actions as action}
                <a class={buttonClass(action.variant)} href={action.href}>{action.label}</a>
              {/each}
            </div>
            {#if game.playNote}
              <p class="game-detail__play-note">{game.playNote}</p>
            {/if}
          </div>
        {:else}
          <div class="game-detail__actions">
            {#each game.actions as action}
              <a class={buttonClass(action.variant)} href={action.href}>{action.label}</a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    <div class="game-detail__meta">
      <h2 class="game-detail__section-title">Details</h2>
      <div class="game-detail__meta-grid">
        {#each game.meta as item}
          <div class="game-detail__meta-card">
            <span class="game-detail__meta-label">{item.label}</span>
            <span class="game-detail__meta-value">{item.value}</span>
          </div>
        {/each}
      </div>
    </div>
    <GameAchievementsPanel gameId={game.id} title={`${game.name} achievements`} />
  </div>
</Page>
