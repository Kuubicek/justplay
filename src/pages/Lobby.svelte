<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import { listPublicRooms, createRoom, subscribeRooms } from '../lib/api/rooms';

  let roomName = '';
  let rooms = [];
  let err = '';
  let loading = false;
  let creating = false;
  let matching = false;
  let unsubscribe = null;

  const safeCount = (room) =>
    room?.room_members?.[0]?.count ??
    room?.player_count ??
    room?.current_players ??
    room?.players ??
    0;
  const roomCapacity = (room) => room?.max_players ?? 2;

  async function loadRooms() {
    loading = true;
    err = '';
    try {
      rooms = await listPublicRooms('pong');
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
      const room = await createRoom({ game_id: 'pong', max_players: 2 });
      roomName = '';
      window.location.hash = `#/play/pong?room=${room.id}`;
    } catch (e) {
      if (e?.message?.includes('Not authenticated') && trimmed) {
        window.location.hash = `#/play/pong?room=${encodeURIComponent(trimmed)}`;
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
      const openRoom = rooms.find((r) => safeCount(r) < roomCapacity(r));
      if (openRoom) {
        window.location.hash = `#/play/pong?room=${openRoom.id}`;
        return;
      }
      const room = await createRoom({ game_id: 'pong', max_players: 2 });
      window.location.hash = `#/play/pong?room=${room.id}`;
    } catch (e) {
      const fallback = `guest-${Math.random().toString(16).slice(2, 8)}`;
      window.location.hash = `#/play/pong?room=${fallback}`;
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
</script>

<Page title="Lobby" subtitle="Create a room or join an existing one.">
  <div class="grid md:grid-cols-2 gap-6">
    <div class="border border-slate-800 rounded-2xl p-4">
      <h3 class="font-semibold mb-2">Create Room</h3>
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <input bind:value={roomName} placeholder="Room code (optional)" class="px-3 py-2 rounded-lg bg-slate-800 w-full"/>
          <button
            class="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500"
            on:click={handleCreate}
            disabled={creating || matching}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
        <button
          class="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500"
          on:click={handleQuickMatch}
          disabled={creating || matching}
        >
          {matching ? 'Finding match...' : 'Quick match'}
        </button>
      </div>
      {#if err}
        <p class="text-rose-400 text-sm mt-3">{err}</p>
      {/if}
    </div>
    <div class="border border-slate-800 rounded-2xl p-4">
      <h3 class="font-semibold mb-2">Public Rooms</h3>
      <ul class="space-y-2">
        {#if loading}
          <li class="text-white/60 text-sm">Loading rooms...</li>
        {:else if rooms.length === 0}
          <li class="text-white/60 text-sm">No public rooms yet.</li>
        {:else}
          {#each rooms as r}
            <li class="flex items-center justify-between p-3 rounded-lg bg-slate-800">
              <span class="font-mono">{r.id}</span>
              <div class="flex items-center gap-3">
                <span class="text-white/60">{safeCount(r)}/{roomCapacity(r)}</span>
                <a class="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500" href={`#/play/pong?room=${r.id}`}>Join</a>
              </div>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  </div>
</Page>
