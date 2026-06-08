<script>
  import { onMount } from 'svelte';
  import Page from '../components/Page.svelte';
  import { supabase } from '../lib/supabaseClient';
  import { user } from '../lib/stores';
  import { isAnonymousUser } from '../lib/api/auth';
  import { gameList } from '../lib/gameData';

  let games = [];
  let selectedGame = '';
  let rows = [];
  let loading = false;
  let err = '';
  let statsLoading = false;
  let statsErr = '';
  let overview = null;
  let gameStats = [];
  let range = 'all';
  let scope = 'all';
  let isAnon = false;
  const selectId = 'leaderboard-game';
  const rangeId = 'leaderboard-range';
  const scopeId = 'leaderboard-scope';
  const localGames = gameList.map((g) => ({ id: g.id, name: g.name }));
  const ranges = [
    { id: 'all', label: 'All time', ms: null },
    { id: '24h', label: 'Last 24h', ms: 24 * 60 * 60 * 1000 },
    { id: '7d', label: 'Last 7d', ms: 7 * 24 * 60 * 60 * 1000 },
    { id: '30d', label: 'Last 30d', ms: 30 * 24 * 60 * 60 * 1000 }
  ];

  const rankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const loadGames = async () => {
    err = '';
    const { data, error } = await supabase
      .from('games')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (error) {
      err = error.message;
      games = [...localGames];
      if (!selectedGame && games.length) {
        selectedGame = games[0].id;
      }
      return;
    }
    const merged = new Map();
    for (const g of [...(data || []), ...localGames]) {
      if (!g?.id) continue;
      if (!merged.has(g.id)) merged.set(g.id, { id: g.id, name: g.name || g.id });
    }
    games = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
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
    if (scope === 'me' && (!$user?.id || isAnon)) {
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

  const fetchAllScores = async () => {
    const pageSize = 1000;
    let from = 0;
    let all = [];
    while (true) {
      const { data, error } = await supabase
        .from('scores')
        .select('game_id, score, user_id, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return all;
  };

  const loadGlobalStats = async () => {
    statsLoading = true;
    statsErr = '';
    try {
      const nameMap = new Map(games.map((g) => [g.id, g.name]));
      const statsMap = new Map();
      for (const g of games) {
        statsMap.set(g.id, {
          id: g.id,
          name: g.name,
          plays: 0,
          topScore: null,
          lastPlayedAt: null,
          playerIds: new Set()
        });
      }
      const allScores = await fetchAllScores();
      const playerSet = new Set();
      let latestAt = null;
      for (const row of allScores) {
        if (!statsMap.has(row.game_id)) {
          statsMap.set(row.game_id, {
            id: row.game_id,
            name: nameMap.get(row.game_id) || row.game_id,
            plays: 0,
            topScore: null,
            lastPlayedAt: null,
            playerIds: new Set()
          });
        }
        const entry = statsMap.get(row.game_id);
        entry.plays += 1;
        if (typeof row.score === 'number') {
          entry.topScore = entry.topScore == null ? row.score : Math.max(entry.topScore, row.score);
        }
        if (row.created_at) {
          if (!entry.lastPlayedAt || new Date(row.created_at) > new Date(entry.lastPlayedAt)) {
            entry.lastPlayedAt = row.created_at;
          }
          if (!latestAt || new Date(row.created_at) > new Date(latestAt)) {
            latestAt = row.created_at;
          }
        }
        if (row.user_id) playerSet.add(row.user_id);
        if (row.user_id) entry.playerIds.add(row.user_id);
      }
      const statsArray = Array.from(statsMap.values()).map((entry) => ({
        id: entry.id,
        name: entry.name,
        plays: entry.plays,
        topScore: entry.topScore,
        lastPlayedAt: entry.lastPlayedAt,
        uniquePlayers: entry.playerIds.size
      }));
      statsArray.sort((a, b) => (b.plays - a.plays) || a.name.localeCompare(b.name));
      const mostPlayed = statsArray.find((s) => s.plays > 0) || null;
      const bestScore = statsArray.reduce((best, s) => {
        if (s.topScore == null) return best;
        if (!best || (best.topScore ?? -1) < s.topScore) return s;
        return best;
      }, null);
      overview = {
        totalScores: allScores.length,
        uniquePlayers: playerSet.size,
        mostPlayed: mostPlayed ? mostPlayed.name : '—',
        topScore: bestScore?.topScore ?? '—',
        topScoreGame: bestScore ? bestScore.name : '—',
        latestAt
      };
      gameStats = statsArray;
    } catch (e) {
      statsErr = e?.message || 'Failed to load global stats.';
      overview = null;
      gameStats = [];
    } finally {
      statsLoading = false;
    }
  };

  onMount(async () => {
    await loadGames();
    await loadGlobalStats();
  });
  $: if (selectedGame) {
    range;
    scope;
    $user;
    loadLeaderboard();
  }
  $: isAnon = isAnonymousUser($user);
</script>

<Page title="Leaderboard" subtitle="Global stats and top scores for every game.">
  <div class="content-shell">

    <!-- Global overview stats -->
    <div class="card mb-6">
      <div class="lb-card-head">
        <div>
          <p class="section-eyebrow">Platform stats</p>
          <h2 class="lb-section-title">Global overview</h2>
        </div>
        <button class="btn btn-ghost" type="button" on:click={loadGlobalStats} disabled={statsLoading}>
          {statsLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {#if statsErr}
        <p class="lb-error">{statsErr}</p>
      {/if}

      {#if statsLoading}
        <p class="lb-loading">Loading global stats…</p>
      {:else if overview}
        <div class="stat-grid mb-5">
          <div class="stat-card">
            <span>Total plays</span>
            <strong>{overview.totalScores}</strong>
          </div>
          <div class="stat-card">
            <span>Unique players</span>
            <strong>{overview.uniquePlayers}</strong>
          </div>
          <div class="stat-card">
            <span>Most played</span>
            <strong class="lb-stat-md">{overview.mostPlayed}</strong>
          </div>
          <div class="stat-card">
            <span>Best score</span>
            <strong class="lb-stat-md">{overview.topScore}</strong>
            <small class="lb-stat-sub">{overview.topScoreGame}</small>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th class="px-3 py-2">Game</th>
                <th class="px-3 py-2">Plays</th>
                <th class="px-3 py-2">Top score</th>
                <th class="px-3 py-2">Players</th>
                <th class="px-3 py-2">Last played</th>
              </tr>
            </thead>
            <tbody>
              {#if gameStats.length === 0}
                <tr class="bg-slate-800/60">
                  <td class="px-3 py-2" colspan="5">No scores yet.</td>
                </tr>
              {:else}
                {#each gameStats as g, idx}
                  <tr class={idx < 3 ? 'lb-top-row' : 'bg-slate-800/60'}>
                    <td class="px-3 py-2 font-medium">
                      {#if idx === 0}<span class="lb-medal">&#127941;</span>{/if}
                      {g.name}
                    </td>
                    <td class="px-3 py-2">{g.plays}</td>
                    <td class="px-3 py-2">{g.topScore ?? '—'}</td>
                    <td class="px-3 py-2">{g.uniquePlayers}</td>
                    <td class="px-3 py-2 lb-date">
                      {g.lastPlayedAt ? new Date(g.lastPlayedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Per-game scores -->
    <div class="card">
      <div class="lb-card-head mb-4">
        <div>
          <p class="section-eyebrow">Rankings</p>
          <h2 class="lb-section-title">Top scores</h2>
        </div>
      </div>

      <div class="lb-filters">
        <div class="lb-filter-group">
          <label class="lb-label" for={selectId}>Game</label>
          <select id={selectId} bind:value={selectedGame}>
            {#each games as g}
              <option value={g.id}>{g.name}</option>
            {/each}
          </select>
        </div>

        <div class="lb-filter-group">
          <label class="lb-label" for={rangeId}>Range</label>
          <select id={rangeId} bind:value={range}>
            {#each ranges as r}
              <option value={r.id}>{r.label}</option>
            {/each}
          </select>
        </div>

        <div class="lb-filter-group">
          <label class="lb-label" for={scopeId}>Scope</label>
          <select
            id={scopeId}
            bind:value={scope}
            disabled={!$user || isAnon}
          >
            <option value="all">All players</option>
            <option value="me">Just me</option>
          </select>
        </div>
      </div>

      {#if err}
        <p class="lb-error">{err}</p>
      {/if}

      {#if loading}
        <p class="lb-loading">Loading scores…</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th class="px-3 py-2">#</th>
                <th class="px-3 py-2">Player</th>
                <th class="px-3 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {#if rows.length === 0}
                <tr class="bg-slate-800/60">
                  <td class="px-3 py-2" colspan="3">No scores yet for this selection.</td>
                </tr>
              {:else}
                {#each rows as r}
                  <tr class={r.rank <= 3 ? 'lb-top-row' : 'bg-slate-800/60'}>
                    <td class="px-3 py-2 lb-rank">
                      {#if r.rank === 1}&#127945;{:else if r.rank === 2}&#129352;{:else if r.rank === 3}&#129353;{:else}{r.rank}{/if}
                    </td>
                    <td class="px-3 py-2">
                      <a class="lb-player-link" href={`#/profile/${r.user_id}`}>{r.username}</a>
                    </td>
                    <td class="px-3 py-2 font-semibold">{r.score}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  </div>
</Page>

<style>
  .lb-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }

  .lb-section-title {
    margin: 4px 0 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .lb-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 20px;
  }

  .lb-filter-group {
    display: grid;
    gap: 5px;
  }

  .lb-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-muted);
  }

  .lb-stat-md {
    font-size: 1rem;
  }

  .lb-stat-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 400;
  }

  .lb-error {
    margin: 0 0 12px;
    color: #ff8fa3;
    font-size: 0.875rem;
  }

  .lb-loading {
    color: var(--text-secondary);
    margin: 0;
  }

  .lb-date {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .lb-medal {
    margin-right: 6px;
  }

  .lb-rank {
    font-size: 1rem;
    min-width: 36px;
  }

  .lb-player-link {
    color: var(--accent);
    font-weight: 500;
    text-decoration: none;
  }

  .lb-player-link:hover {
    text-decoration: underline;
  }

  .lb-top-row {
    background: linear-gradient(90deg, rgba(77, 163, 255, 0.08), rgba(var(--bg-surface-strong-rgb), 0.6));
  }
</style>
