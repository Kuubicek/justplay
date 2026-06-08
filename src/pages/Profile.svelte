<script>
  import { onMount } from 'svelte';
  import Page from '../components/Page.svelte';
  import { supabase } from '../lib/supabaseClient';
  import { params } from '../lib/router';
  import { user, guest } from '../lib/stores';
  import { isAnonymousUser } from '../lib/api/auth';
  import { gameList } from '../lib/gameData';
  import { getAchievementsForUser, buildAchievementProgressByGame } from '../lib/api/achievements';

  let profileId = null;
  let profile = null;
  let games = [];
  let selectedGame = 'all';
  let range = 'all';
  let scores = [];
  let loading = false;
  let err = '';
  let scoresErr = '';
  let achievements = [];
  let achievementsErr = '';
  let achievementsLoading = false;
  let lastLoadedId = null;
  let isAnon = false;
  const LEVEL_STEP = 120;
  const selectId = 'profile-game-filter';
  const rangeId = 'profile-range-filter';
  const localGames = gameList.map((g) => ({ id: g.id, name: g.name }));
  const gameNameById = new Map(localGames.map((game) => [game.id, game.name]));
  const ranges = [
    { id: 'all', label: 'All time', ms: null },
    { id: '24h', label: 'Last 24h', ms: 24 * 60 * 60 * 1000 },
    { id: '7d', label: 'Last 7d', ms: 7 * 24 * 60 * 60 * 1000 },
    { id: '30d', label: 'Last 30d', ms: 30 * 24 * 60 * 60 * 1000 }
  ];

  const achievementSort = (a, b) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.title || '').localeCompare(b.title || '');

  const gameLabel = (gameId) => {
    if (!gameId) return 'JustPlay Platform';
    return gameNameById.get(gameId) || gameId;
  };

  const fetchProfile = async (id) => {
    loading = true;
    err = '';
    try {
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at')
        .eq('id', id)
        .maybeSingle();
      if (profErr) throw profErr;
      if (!prof) throw new Error('Profile not found');
      profile = prof;

      await loadScores(id);
      await loadAchievements(id);
    } catch (e) {
      err = e.message;
      profile = null;
      scores = [];
      achievements = [];
    } finally {
      loading = false;
    }
  };

  const loadGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (error) {
      games = [...localGames];
      return;
    }
    const merged = new Map();
    for (const g of [...(data || []), ...localGames]) {
      if (!g?.id) continue;
      if (!merged.has(g.id)) merged.set(g.id, { id: g.id, name: g.name || g.id });
    }
    games = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const loadScores = async (id = profileId) => {
    if (!id) return;
    try {
      scoresErr = '';
      let query = supabase
        .from('scores')
        .select('id, score, game_id, created_at, games(name)')
        .eq('user_id', id);
      if (selectedGame !== 'all') {
        query = query.eq('game_id', selectedGame);
      }
      const rangeEntry = ranges.find((r) => r.id === range);
      if (rangeEntry?.ms) {
        const since = new Date(Date.now() - rangeEntry.ms).toISOString();
        query = query.gte('created_at', since);
      }
      const { data: scoreRows, error: scoreErr } = await query
        .order('created_at', { ascending: false })
        .limit(20);
      if (scoreErr) throw scoreErr;
      scores = scoreRows || [];
    } catch (e) {
      scoresErr = e.message || 'Failed to load scores.';
      scores = [];
    }
  };

  const loadAchievements = async (id = profileId) => {
    if (!id) {
      achievements = [];
      return;
    }
    achievementsLoading = true;
    achievementsErr = '';
    try {
      achievements = await getAchievementsForUser(id);
    } catch (e) {
      achievementsErr = e.message || 'Failed to load achievements.';
      achievements = [];
    } finally {
      achievementsLoading = false;
    }
  };

  const loadIfNeeded = () => {
    profileId = $params.profileId || (!isAnon ? $user?.id : null);
    if (profileId && profileId !== lastLoadedId) {
      lastLoadedId = profileId;
      fetchProfile(profileId);
    }
  };

  onMount(() => {
    loadGames();
    loadIfNeeded();
  });
  $: loadIfNeeded();
  $: if (profileId) {
    selectedGame;
    range;
    loadScores(profileId);
  }
  $: achievementProgress = buildAchievementProgressByGame(achievements);
  $: totalAchievements = achievementProgress.totals.totalAchievements;
  $: unlockedAchievements = achievementProgress.totals.unlockedAchievements;
  $: unlockedAchievementPoints = achievementProgress.totals.unlockedPoints;
  $: totalAchievementPoints = achievementProgress.totals.totalPoints;
  $: remainingAchievements = Math.max(0, totalAchievements - unlockedAchievements);
  $: overallCompletion = totalAchievements ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0;
  $: playerLevel = Math.max(1, Math.floor(unlockedAchievementPoints / LEVEL_STEP) + 1);
  $: pointsIntoLevel = unlockedAchievementPoints % LEVEL_STEP;
  $: pointsToNextLevel = LEVEL_STEP - pointsIntoLevel;
  $: levelProgress = Math.max(0, Math.min(100, Math.round((pointsIntoLevel / LEVEL_STEP) * 100)));
  $: achievementGroups = (() => {
    const groups = new Map();
    for (const achievement of achievements) {
      const key = achievement.game_id || 'platform';
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          gameId: achievement.game_id || null,
          title: gameLabel(achievement.game_id),
          items: []
        });
      }
      groups.get(key).items.push(achievement);
    }
    return Array.from(groups.values())
      .map((group) => {
        const items = [...group.items].sort(achievementSort);
        const unlocked = items.filter((achievement) => achievement.unlocked).length;
        const total = items.length;
        const remaining = Math.max(0, total - unlocked);
        const completion = total ? Math.round((unlocked / total) * 100) : 0;
        const pointsUnlocked = items.reduce((sum, achievement) => sum + (achievement.unlocked ? (achievement.points || 0) : 0), 0);
        const pointsTotal = items.reduce((sum, achievement) => sum + (achievement.points || 0), 0);
        return { ...group, items, unlocked, total, remaining, completion, pointsUnlocked, pointsTotal };
      })
      .sort((a, b) => {
        if (a.id === 'platform') return -1;
        if (b.id === 'platform') return 1;
        return a.title.localeCompare(b.title);
      });
  })();
  $: isAnon = isAnonymousUser($user);
</script>

<Page title="Profile" subtitle="Player stats & settings.">
  {#if err}
    <p class="text-rose-400 text-sm mb-4">{err}</p>
  {/if}

  {#if (!$user || isAnon) && !$params.profileId}
    <p class="text-white/70">You are not logged in. <a class="underline" href="#/login">Login</a> or continue as guest.</p>
  {:else if loading}
    <p class="text-white/70">Loading profile...</p>
  {:else if profile}
    <div class="flex gap-4 items-center mb-6">
      <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-semibold">
        {profile.username?.charAt(0)?.toUpperCase() || 'P'}
      </div>
      <div>
        <p class="text-lg font-semibold">{profile.username || 'Unnamed player'}</p>
        <p class="text-white/60 text-sm">{profile.id}</p>
      </div>
    </div>

    <div class="card mb-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-white/60 text-xs uppercase tracking-[0.2em]">Player level</p>
          <p class="text-2xl font-semibold">Level {playerLevel}</p>
          <p class="text-white/60 text-sm">{pointsIntoLevel}/{LEVEL_STEP} pts in current level</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="pill">{unlockedAchievementPoints}/{totalAchievementPoints} achievement pts</span>
          <span class="pill">{unlockedAchievements}/{totalAchievements} unlocked</span>
        </div>
      </div>
      <div class="profile-achievement-group__progress mt-3" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={levelProgress}>
        <span style={`width: ${levelProgress}%`}></span>
      </div>
      <p class="text-white/60 text-xs mt-2">
        {pointsToNextLevel} pts to Level {playerLevel + 1}
      </p>
    </div>

    <div class="card mb-4">
      <div class="flex flex-wrap items-center gap-3 mb-3">
        <h3 class="font-semibold">Recent scores</h3>
        <div class="flex flex-wrap items-center gap-2 text-sm text-white/70">
          <label for={selectId}>Game:</label>
          <select id={selectId} bind:value={selectedGame}>
            <option value="all">All games</option>
            {#each games as g}
              <option value={g.id}>{g.name}</option>
            {/each}
          </select>
          <label for={rangeId}>Range:</label>
          <select id={rangeId} bind:value={range}>
            {#each ranges as r}
              <option value={r.id}>{r.label}</option>
            {/each}
          </select>
        </div>
      </div>
      {#if scoresErr}
        <p class="text-rose-400 text-sm mb-2">{scoresErr}</p>
      {/if}
      {#if scores.length === 0}
        <p class="text-white/60 text-sm">No scores for the selected filters.</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-left border-separate border-spacing-y-1">
            <thead class="text-white/70">
              <tr>
                <th class="px-3 py-2">Game</th>
                <th class="px-3 py-2">Score</th>
                <th class="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {#each scores as s}
                <tr class="bg-slate-800/60">
                  <td class="px-3 py-2">{s.games?.name || s.game_id}</td>
                  <td class="px-3 py-2">{s.score}</td>
                  <td class="px-3 py-2 text-white/60">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
    <div class="card">
      <div class="profile-achievements__summary">
        <div>
          <h3 class="font-semibold">Achievements</h3>
          <p class="text-white/60 text-sm">Progress by game, including unlocked and remaining targets.</p>
        </div>
        {#if totalAchievements > 0}
          <div class="profile-achievements__summary-meta">
            <span class="pill">{unlockedAchievements}/{totalAchievements} unlocked</span>
            <span class="pill">{remainingAchievements} remaining</span>
            <span class="pill">{overallCompletion}% complete</span>
            <span class="pill">{unlockedAchievementPoints}/{totalAchievementPoints} pts</span>
          </div>
        {/if}
      </div>
      {#if achievementsErr}
        <p class="text-rose-400 text-sm mb-2">{achievementsErr}</p>
      {/if}
      {#if achievementsLoading}
        <p class="text-white/60 text-sm">Loading achievements...</p>
      {:else if totalAchievements === 0}
        <p class="text-white/60 text-sm">No achievements available yet.</p>
      {:else}
        <div class="profile-achievement-groups">
          {#each achievementGroups as group}
            <section class="profile-achievement-group">
              <div class="profile-achievement-group__head">
                <div>
                  <h4 class="profile-achievement-group__title">{group.title}</h4>
                  <p class="text-white/60 text-sm">{group.unlocked}/{group.total} unlocked - {group.remaining} remaining</p>
                </div>
                <div class="profile-achievement-group__meta">
                  <span class="text-white/70 text-xs uppercase tracking-[0.2em]">
                    {group.pointsUnlocked}/{group.pointsTotal} pts
                  </span>
                  {#if group.gameId}
                    <a class="btn btn-ghost" href={`#/game/${group.gameId}`}>Open game</a>
                  {/if}
                </div>
              </div>
              <div class="profile-achievement-group__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={group.completion}>
                <span style={`width: ${group.completion}%`}></span>
              </div>
              <div class="profile-achievement-group__track">
                {#each group.items as achievement}
                  <article class={`achievement-card profile-achievement-group__card ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}`}>
                    <div class="achievement-header">
                      <h5 class="achievement-title">{achievement.title}</h5>
                      <span class="pill">{achievement.points || 0} pts</span>
                    </div>
                    <p class="achievement-desc">{achievement.description}</p>
                    <p class="achievement-meta">
                      {achievement.unlocked
                        ? achievement.unlocked_at
                          ? `Unlocked ${new Date(achievement.unlocked_at).toLocaleString()}`
                          : 'Unlocked'
                        : 'Locked'}
                    </p>
                  </article>
                {/each}
              </div>
            </section>
          {/each}
        </div>
      {/if}
    </div>
  {:else if $guest || isAnon}
    <p class="text-white/70">Guest mode: no profile data to show. <a class="underline" href="#/login">Sign in</a> to save stats.</p>
  {/if}
</Page>
