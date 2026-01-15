<script>
  import { onMount } from 'svelte';
  import Page from '../components/Page.svelte';
  import { supabase } from '../lib/supabaseClient';
  import { user } from '../lib/stores';

  let games = [];
  let selectedGame = '';
  let rows = [];
  let loading = false;
  let err = '';
  let range = 'all';
  let scope = 'all';
  const selectId = 'leaderboard-game';
  const rangeId = 'leaderboard-range';
  const scopeId = 'leaderboard-scope';
  const ranges = [
    { id: 'all', label: 'All time', ms: null },
    { id: '24h', label: 'Last 24h', ms: 24 * 60 * 60 * 1000 },
    { id: '7d', label: 'Last 7d', ms: 7 * 24 * 60 * 60 * 1000 },
    { id: '30d', label: 'Last 30d', ms: 30 * 24 * 60 * 60 * 1000 }
  ];

  const loadGames = async () => {
    err = '';
    const { data, error } = await supabase
      .from('games')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (error) {
      err = error.message;
      return;
    }
    games = data || [];
    if (!selectedGame && games.length) {
      selectedGame = games[0].id;
    }
  };

  const loadLeaderboard = async () => {
    if (!selectedGame) {
      rows = [];
      return;
    }
    loading = true;
    err = '';
    if (scope === 'me' && !$user?.id) {
      err = 'Login to filter by your scores.';
      rows = [];
      loading = false;
      return;
    }
    let query = supabase
      .from('scores')
      .select('user_id, score, game_id, created_at, profiles(username)')
      .eq('game_id', selectedGame);
    const rangeEntry = ranges.find((r) => r.id === range);
    if (rangeEntry?.ms) {
      const since = new Date(Date.now() - rangeEntry.ms).toISOString();
      query = query.gte('created_at', since);
    }
    if (scope === 'me' && $user?.id) {
      query = query.eq('user_id', $user.id);
    }
    const { data, error } = await query.order('score', { ascending: false }).limit(20);
    if (error) {
      err = error.message;
      rows = [];
    } else {
      rows = (data || []).map((r, idx) => ({
        rank: idx + 1,
        user_id: r.user_id,
        username: r.profiles?.username || r.user_id,
        score: r.score
      }));
    }
    loading = false;
  };

  onMount(loadGames);
  $: if (selectedGame) {
    range;
    scope;
    $user;
    loadLeaderboard();
  }
</script>

<Page title="Leaderboard" subtitle="Filter by game to see top scores.">
  <div class="flex flex-wrap items-center gap-3 mb-4">
    <label class="text-white/70 text-sm" for={selectId}>Game:</label>
    <select id={selectId} class="bg-slate-800 rounded-lg px-3 py-2" bind:value={selectedGame}>
      {#each games as g}
        <option value={g.id}>{g.name}</option>
      {/each}
    </select>

    <label class="text-white/70 text-sm" for={rangeId}>Range:</label>
    <select id={rangeId} class="bg-slate-800 rounded-lg px-3 py-2" bind:value={range}>
      {#each ranges as r}
        <option value={r.id}>{r.label}</option>
      {/each}
    </select>

    <label class="text-white/70 text-sm" for={scopeId}>Scope:</label>
    <select
      id={scopeId}
      class="bg-slate-800 rounded-lg px-3 py-2"
      bind:value={scope}
      disabled={!$user}
    >
      <option value="all">All players</option>
      <option value="me">Just me</option>
    </select>
  </div>

  {#if err}
    <p class="text-rose-400 text-sm mb-3">{err}</p>
  {/if}

  {#if loading}
    <p class="text-white/70">Loading leaderboard...</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-left border-separate border-spacing-y-1">
        <thead class="text-white/70">
          <tr>
            <th class="px-3 py-2">#</th>
            <th class="px-3 py-2">Player</th>
            <th class="px-3 py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {#if rows.length === 0}
            <tr class="bg-slate-800/60">
              <td class="px-3 py-2" colspan="3">No scores yet.</td>
            </tr>
          {:else}
            {#each rows as r}
              <tr class="bg-slate-800/60">
                <td class="px-3 py-2">{r.rank}</td>
                <td class="px-3 py-2">
                  <a class="underline" href={`#/profile/${r.user_id}`}>{r.username}</a>
                </td>
                <td class="px-3 py-2">{r.score}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</Page>
