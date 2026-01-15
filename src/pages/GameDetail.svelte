<script>
  import Page from '../components/Page.svelte';
  import { params } from '../lib/router';

  const games = {
    pong: {
      id: 'pong',
      name: 'Pong Arena',
      mode: 'Multiplayer',
      status: 'Live',
      summary: 'Classic paddles meet fast matchmaking and lobby invites built for quick rematches.',
      controls: ['W/S or Up/Down to move', 'Space to serve', 'Local: W/S left paddle, Up/Down right paddle'],
      playHref: '#/play/pong',
      actions: [
        { label: 'Create match', href: '#/lobby', variant: 'accent' },
        { label: 'Join match', href: '#/rooms', variant: 'ghost' },
        { label: 'Local match', href: '#/play/pong?mode=local', variant: 'ghost' }
      ],
      meta: [
        { label: 'Game ID', value: 'pong' },
        { label: 'Players', value: '2 players' },
        { label: 'Session', value: '3-6 min' }
      ]
    },
    dodger: {
      id: 'dodger',
      name: 'Astro Dodger',
      mode: 'Singleplayer',
      status: 'Live',
      summary: 'Dodge debris, chase your best score, and climb the leaderboards.',
      controls: ['Mouse or touch to move', 'Arrow keys or A/D'],
      actions: [
        { label: 'Play Astro Dodger', href: '#/play/dodger', variant: 'accent' },
        { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
      ],
      meta: [
        { label: 'Game ID', value: 'dodger' },
        { label: 'Players', value: '1 player' },
        { label: 'Session', value: '5-10 min' }
      ]
    },
    'td-lite': {
      id: 'td-lite',
      name: 'Tower Defense Lite',
      mode: 'Singleplayer',
      status: 'Coming soon',
      summary: 'Build your lanes, upgrade fast, and see how long your defenses can hold.',
      controls: ['Mouse to place towers', 'Scroll to zoom', 'Space to pause'],
      actions: [
        { label: 'View Roadmap', href: '#/games', variant: 'accent' },
        { label: 'Notify Me', href: '#/register', variant: 'ghost' }
      ],
      meta: [
        { label: 'Game ID', value: 'td-lite' },
        { label: 'Players', value: '1 player' },
        { label: 'Session', value: '8-15 min' }
      ]
    }
  };

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
  $: game = games[gameId] || { ...fallback, id: gameId, meta: [{ label: 'Game ID', value: gameId }] };
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
        {#if gameId === 'pong'}
          <div class="game-detail__play">
            <a class="btn game-detail__play-button" href={game.playHref}>Play</a>
            <div class="game-detail__actions game-detail__actions--stacked">
              {#each game.actions as action}
                <a class={buttonClass(action.variant)} href={action.href}>{action.label}</a>
              {/each}
            </div>
            <p class="game-detail__play-note">Local match: W/S left paddle, Up/Down right paddle.</p>
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
  </div>
</Page>
