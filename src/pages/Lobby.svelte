<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import { listPublicRooms, createRoom, subscribeRooms } from '../lib/api/rooms';
  import { query } from '../lib/router';
  import { multiplayerGames } from '../lib/gameData';

  let roomName = '';
  let rooms = [];
  let err = '';
  let loading = false;
  let creating = false;
  let matching = false;
  let unsubscribe = null;
  const gameOptions = multiplayerGames;
  const validGame = (id) => gameOptions.some((g) => g.id === id);
  let selectedGame = gameOptions[0]?.id || 'pong';
  let lastSelectedGame = null;

  const GAME_NAMES = { 'pong': 'Pong Arena', 'pulse-rally': 'Pulse Rally' };
  const gameName = (id) => GAME_NAMES[id] || id || 'Unknown';

  const safeCount = (room) =>
    room?.room_members?.[0]?.count ??
    room?.player_count ??
    room?.current_players ??
    room?.players ??
    0;
  const roomCapacity = (room) => room?.max_players ?? 2;

  function roomStatus(room) {
    const c = safeCount(room);
    const cap = roomCapacity(room);
    if (c === 0) return 'empty';
    if (c >= cap) return 'full';
    return 'open';
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const secs = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  async function loadRooms() {
    loading = true;
    err = '';
    try {
      rooms = await listPublicRooms();
    } catch (e) {
      err = e?.message || 'Failed to load rooms.';
    } finally {
      loading = false;
    }
  }

  async function handleCreate() {
    const trimmed = roomName.trim();
    creating = true;
    err = '';
    try {
      const room = await createRoom({ game_id: selectedGame, max_players: 2 });
      roomName = '';
      window.location.hash = `#/play/${selectedGame}?room=${room.id}`;
    } catch (e) {
      if (e?.message?.includes('Not authenticated') && trimmed) {
        window.location.hash = `#/play/${selectedGame}?room=${encodeURIComponent(trimmed)}`;
        roomName = '';
        err = '';
      } else {
        err = e?.message || 'Failed to create room.';
      }
    } finally {
      creating = false;
    }
  }

  async function handleQuickMatch() {
    matching = true;
    err = '';
    try {
      const openRoom = rooms.find((r) => roomStatus(r) === 'open');
      if (openRoom) {
        window.location.hash = `#/play/${selectedGame}?room=${openRoom.id}`;
        return;
      }
      const room = await createRoom({ game_id: selectedGame, max_players: 2 });
      window.location.hash = `#/play/${selectedGame}?room=${room.id}`;
    } catch (e) {
      const fallback = `guest-${Math.random().toString(16).slice(2, 8)}`;
      window.location.hash = `#/play/${selectedGame}?room=${fallback}`;
    } finally {
      matching = false;
    }
  }

  onMount(() => {
    loadRooms();
    unsubscribe = subscribeRooms(() => loadRooms());
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  $: if ($query?.game && validGame($query.game) && $query.game !== selectedGame) {
    selectedGame = $query.game;
  }

  $: if (selectedGame && selectedGame !== lastSelectedGame) {
    lastSelectedGame = selectedGame;
  }
</script>

<Page title="Lobby" subtitle="Start a new match or join an open room.">
  <div class="content-shell">

    <!-- Game selector -->
    <div class="lobby-filter">
      <label class="lb-label" for="lobby-game">Game</label>
      <select id="lobby-game" bind:value={selectedGame}>
        {#each gameOptions as g}
          <option value={g.id}>{g.name}</option>
        {/each}
      </select>
    </div>

    {#if err}
      <p class="lobby-error">{err}</p>
    {/if}

    <div class="grid md:grid-cols-2 gap-6">

      <!-- Create room card -->
      <div class="card">
        <div class="lobby-card-header">
          <h2 class="lobby-card-title">Create a room</h2>
          <p class="lobby-card-desc">Start a new match and share the room code with a friend.</p>
        </div>
        <div class="lobby-create-form">
          <div class="lobby-input-row">
            <input
              bind:value={roomName}
              placeholder="Custom room code (optional)"
              class="flex-1"
            />
            <button
              class="btn btn-accent"
              on:click={handleCreate}
              disabled={creating || matching}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
          <button
            class="btn btn-ghost lobby-quickmatch"
            on:click={handleQuickMatch}
            disabled={creating || matching}
          >
            {matching ? 'Finding match…' : '⚡ Quick match'}
          </button>
          <p class="lobby-hint">Quick match joins an open room automatically, or creates one if none are available.</p>
        </div>
      </div>

      <!-- Public rooms card -->
      <div class="card">
        <div class="lobby-card-header">
          <div class="lobby-rooms-title-row">
            <h2 class="lobby-card-title">Active rooms</h2>
            {#if rooms.length > 0}
              <span class="lobby-rooms-count">{rooms.length}</span>
            {/if}
          </div>
          <p class="lobby-card-desc">All active multiplayer rooms across both games.</p>
        </div>
        {#if loading}
          <p class="lobby-loading">Loading rooms…</p>
        {:else if rooms.length === 0}
          <div class="lobby-empty">
            <p class="lobby-empty__text">No active rooms right now.</p>
            <p class="lobby-empty__hint">Create one and share the code to invite a friend.</p>
          </div>
        {:else}
          <ul class="lobby-rooms">
            {#each rooms as r}
              {@const cnt = safeCount(r)}
              {@const cap = roomCapacity(r)}
              {@const status = roomStatus(r)}
              {@const joinable = status === 'open' || status === 'empty'}
              <li class="lobby-room">
                <div class="lobby-room__top">
                  <div class="lobby-room__tags">
                    <span class="lobby-room__game-pill lobby-room__game-pill--{r.game_id || 'pong'}">
                      {gameName(r.game_id)}
                    </span>
                    <span class="lobby-room__status lobby-room__status--{status}">
                      <span class="lobby-room__dot"></span>
                      {status === 'open' ? 'Open' : status === 'full' ? 'Full' : 'Empty'}
                    </span>
                  </div>
                  <span class="lobby-room__count">{cnt}/{cap}</span>
                </div>
                <div class="lobby-room__bottom">
                  <div class="lobby-room__meta">
                    <span class="lobby-room__code">{r.id.slice(0, 8)}…</span>
                    {#if r.created_at}
                      <span class="lobby-room__time">{timeAgo(r.created_at)}</span>
                    {/if}
                  </div>
                  {#if joinable}
                    <a class="btn btn-accent lobby-room__btn" href={`#/play/${r.game_id || selectedGame}?room=${r.id}`}>
                      Join
                    </a>
                  {:else}
                    <span class="lobby-room__in-game">In game</span>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

    </div>

    <!-- How to play note -->
    <div class="lobby-howto">
      <p class="section-eyebrow">How it works</p>
      <div class="grid md:grid-cols-3 gap-4 mt-3">
        <div class="lobby-step">
          <span class="lobby-step__num">1</span>
          <div>
            <p class="lobby-step__title">Create a room</p>
            <p class="lobby-step__body">Click Create to start a new match. A room code is generated automatically.</p>
          </div>
        </div>
        <div class="lobby-step">
          <span class="lobby-step__num">2</span>
          <div>
            <p class="lobby-step__title">Invite a friend</p>
            <p class="lobby-step__body">Share the room code. Your friend enters it from the Lobby or Rooms page to join.</p>
          </div>
        </div>
        <div class="lobby-step">
          <span class="lobby-step__num">3</span>
          <div>
            <p class="lobby-step__title">Play</p>
            <p class="lobby-step__body">Once both players are in, the host starts the match. Rematch is available after each round.</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</Page>

<style>
  .lobby-filter {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .lb-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-muted);
  }

  .lobby-error {
    margin: 0 0 16px;
    color: #ff8fa3;
    font-size: 0.875rem;
  }

  .lobby-card-header {
    margin-bottom: 16px;
  }

  .lobby-card-title {
    margin: 0 0 4px;
    font-size: 1.05rem;
    font-weight: 600;
  }

  .lobby-card-desc {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .lobby-create-form {
    display: grid;
    gap: 10px;
  }

  .lobby-input-row {
    display: flex;
    gap: 8px;
  }

  .lobby-quickmatch {
    width: 100%;
    justify-content: center;
  }

  .lobby-hint {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .lobby-loading {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin: 0;
  }

  .lobby-empty {
    display: grid;
    gap: 4px;
    padding: 16px 0;
  }

  .lobby-empty__text {
    margin: 0;
    font-weight: 500;
  }

  .lobby-empty__hint {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .lobby-rooms-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lobby-rooms-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: rgba(var(--accent-rgb, 56,189,248), 0.18);
    color: var(--accent);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .lobby-rooms {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
    max-height: 360px;
    overflow-y: auto;
  }

  .lobby-room {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 11px 13px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.03);
    transition: border-color 0.15s;
  }

  .lobby-room:hover {
    border-color: rgba(var(--accent-rgb, 56,189,248), 0.28);
  }

  .lobby-room__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .lobby-room__tags {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .lobby-room__game-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.67rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: rgba(56, 189, 248, 0.14);
    color: #38bdf8;
  }

  .lobby-room__game-pill--pulse-rally {
    background: rgba(167, 139, 250, 0.14);
    color: #a78bfa;
  }

  .lobby-room__status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.74rem;
    font-weight: 500;
  }

  .lobby-room__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .lobby-room__status--open { color: #4ade80; }
  .lobby-room__status--open .lobby-room__dot { background: #4ade80; box-shadow: 0 0 6px #4ade8088; }
  .lobby-room__status--full { color: #fb923c; }
  .lobby-room__status--full .lobby-room__dot { background: #fb923c; }
  .lobby-room__status--empty { color: var(--text-muted); }
  .lobby-room__status--empty .lobby-room__dot { background: var(--text-muted); }

  .lobby-room__count {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    flex-shrink: 0;
  }

  .lobby-room__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .lobby-room__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .lobby-room__code {
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .lobby-room__time {
    font-size: 0.71rem;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .lobby-room__btn {
    padding: 0 14px;
    height: 32px;
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .lobby-room__in-game {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-style: italic;
    flex-shrink: 0;
  }

  .lobby-howto {
    margin-top: 36px;
    padding-top: 28px;
    border-top: 1px solid var(--border);
  }

  .lobby-step {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }

  .lobby-step__num {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #041020;
    font-weight: 700;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lobby-step__title {
    margin: 0 0 4px;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .lobby-step__body {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.5;
  }
</style>
