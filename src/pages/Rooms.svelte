<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import { myRooms, leaveRoom, subscribeRooms } from '../lib/api/rooms';

  let rooms = [];
  let err = '';
  let loading = false;
  let leaving = null;
  let unsubscribe = null;

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
</script>

<Page title="Rooms" subtitle="Your active / recent rooms.">
  {#if err}
    <p class="text-rose-400 text-sm mb-4">{err}</p>
  {/if}
  {#if loading}
    <p class="text-white/60 text-sm">Loading rooms...</p>
  {:else if rooms.length === 0}
    <p class="text-white/60 text-sm">No rooms yet.</p>
  {:else}
    <div class="grid md:grid-cols-2 gap-4">
      {#each rooms as r}
        <div class="border border-slate-800 rounded-2xl p-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">{r.id}</h3>
            <span class="text-xs px-2 py-1 rounded bg-slate-800">{r.status ?? 'waiting'}</span>
          </div>
          <div class="mt-3 flex gap-2">
            <a class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500" href={`#/play/pong?room=${r.id}`}>Enter</a>
            <button
              class="px-3 py-1 rounded bg-rose-600/80 hover:bg-rose-600"
              on:click={() => handleLeave(r.id)}
              disabled={leaving === r.id}
            >
              {leaving === r.id ? 'Leaving...' : 'Leave'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</Page>
