<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import { myRooms, leaveRoom, subscribeRooms } from '../lib/api/rooms';
  import { query } from '../lib/router';
  import { multiplayerGames } from '../lib/gameData';

  let rooms = [];
  let filteredRooms = [];
  let err = '';
  let loading = false;
  let leaving = null;
  let unsubscribe = null;
  const gameOptions = [{ id: 'all', name: 'All games' }, ...multiplayerGames];
  const gameName = new Map(multiplayerGames.map((g) => [g.id, g.name]));
  let selectedGame = 'all';

  async function loadRooms() {
    loading = true;
    err = '';
    try {
      rooms = await myRooms();
    } catch (e) {
      err = e?.message || 'Failed to load rooms.';
    } finally {
      loading = false;
    }
  }

  async function handleLeave(roomId) {
    leaving = roomId;
    err = '';
    try {
      await leaveRoom(roomId);
      await loadRooms();
    } catch (e) {
      err = e?.message || 'Failed to leave room.';
    } finally {
      leaving = null;
    }
  }

  onMount(() => {
    loadRooms();
    unsubscribe = subscribeRooms(() => loadRooms());
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  const roomHref = (room) => {
    if (!room?.game_id) return '#/play/pong';
    return `#/play/${room.game_id}?room=${room.id}`;
  };

  $: if ($query?.game && $query.game !== selectedGame) {
    const valid = gameOptions.some((g) => g.id === $query.game);
    selectedGame = valid ? $query.game : 'all';
  }

  $: filteredRooms = selectedGame === 'all'
    ? rooms
    : rooms.filter((room) => room?.game_id === selectedGame);
</script>

<Page title="Rooms" subtitle="Your active and recent multiplayer rooms.">
  <div class="content-shell">

    <div class="rooms-filter">
      <label class="rooms-label" for="rooms-game">Game</label>
      <select id="rooms-game" bind:value={selectedGame}>
        {#each gameOptions as g}
          <option value={g.id}>{g.name}</option>
        {/each}
      </select>
    </div>

    {#if err}
      <p class="rooms-error">{err}</p>
    {/if}

    {#if loading}
      <p class="rooms-loading">Loading rooms…</p>
    {:else if filteredRooms.length === 0}
      <div class="rooms-empty">
        <div class="rooms-empty__icon">&#127918;</div>
        <h2 class="rooms-empty__title">No rooms yet</h2>
        <p class="rooms-empty__body">
          You are not currently in any rooms. Head to the Lobby to create or join a match.
        </p>
        <a class="btn btn-accent" href="#/lobby">Go to Lobby</a>
      </div>
    {:else}
      <div class="grid md:grid-cols-2 gap-4">
        {#each filteredRooms as r}
          <div class="card rooms-card">
            <div class="rooms-card__header">
              <div>
                <p class="rooms-card__code">{r.id}</p>
                <p class="rooms-card__game">{gameName.get(r.game_id) || r.game_id || 'Unknown game'}</p>
              </div>
              <span class="pill rooms-card__status">{r.status ?? 'waiting'}</span>
            </div>
            <div class="rooms-card__actions">
              <a class="btn btn-accent" href={roomHref(r)}>Enter room</a>
              <button
                class="btn btn-danger"
                on:click={() => handleLeave(r.id)}
                disabled={leaving === r.id}
              >
                {leaving === r.id ? 'Leaving…' : 'Leave'}
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

  </div>
</Page>

<style>
  .rooms-filter {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .rooms-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-muted);
  }

  .rooms-error {
    margin: 0 0 16px;
    color: #ff8fa3;
    font-size: 0.875rem;
  }

  .rooms-loading {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin: 0;
  }

  .rooms-empty {
    display: grid;
    gap: 12px;
    justify-items: center;
    text-align: center;
    padding: 56px 0 72px;
  }

  .rooms-empty__icon {
    font-size: 3rem;
    line-height: 1;
  }

  .rooms-empty__title {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .rooms-empty__body {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    max-width: 320px;
    line-height: 1.6;
  }

  .rooms-card {
    display: grid;
    gap: 14px;
  }

  .rooms-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .rooms-card__code {
    margin: 0;
    font-family: monospace;
    font-size: 0.95rem;
    font-weight: 600;
    word-break: break-all;
  }

  .rooms-card__game {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .rooms-card__status {
    flex-shrink: 0;
  }

  .rooms-card__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>
