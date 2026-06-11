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

  // avatar modal
  let showAvatarModal = false;
  let avatarUploading = false;
  let avatarErr = '';
  let modalFile = null;
  let modalUrl = '';
  let modalPreviewUrl = '';
  let modalObjectUrl = '';

  // username edit
  let editingUsername = false;
  let newUsername = '';
  let usernameErr = '';
  let savingUsername = false;
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
  $: isOwnProfile = !$params.profileId || $params.profileId === $user?.id;

  function openAvatarModal() {
    modalFile = null;
    modalUrl = profile?.avatar_url || '';
    modalPreviewUrl = profile?.avatar_url || '';
    avatarErr = '';
    showAvatarModal = true;
  }

  function closeAvatarModal() {
    showAvatarModal = false;
    if (modalObjectUrl) { URL.revokeObjectURL(modalObjectUrl); modalObjectUrl = ''; }
    modalFile = null;
    modalUrl = '';
    modalPreviewUrl = '';
    avatarErr = '';
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { avatarErr = 'Image must be under 3 MB.'; return; }
    avatarErr = '';
    if (modalObjectUrl) URL.revokeObjectURL(modalObjectUrl);
    modalObjectUrl = URL.createObjectURL(file);
    modalFile = file;
    modalPreviewUrl = modalObjectUrl;
    modalUrl = '';
  }

  function handleUrlInput() {
    modalFile = null;
    if (modalObjectUrl) { URL.revokeObjectURL(modalObjectUrl); modalObjectUrl = ''; }
    modalPreviewUrl = modalUrl.trim();
  }

  async function saveAvatar() {
    if (!profileId) return;
    avatarUploading = true;
    avatarErr = '';
    try {
      let finalUrl = '';
      if (modalFile) {
        const ext = modalFile.name.split('.').pop().toLowerCase() || 'jpg';
        const path = `${profileId}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, modalFile, { upsert: true, contentType: modalFile.type });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        finalUrl = publicUrl;
      } else if (modalUrl.trim()) {
        finalUrl = modalUrl.trim();
      }
      await supabase.from('profiles').update({ avatar_url: finalUrl || null }).eq('id', profileId);
      profile = { ...profile, avatar_url: finalUrl || null };
      closeAvatarModal();
    } catch (ex) {
      avatarErr = ex?.message || 'Upload failed. Make sure the "avatars" bucket exists in Supabase Storage.';
    } finally {
      avatarUploading = false;
    }
  }

  async function removeAvatar() {
    if (!profileId) return;
    avatarUploading = true;
    avatarErr = '';
    try {
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', profileId);
      profile = { ...profile, avatar_url: null };
      closeAvatarModal();
    } catch (ex) {
      avatarErr = ex?.message || 'Failed to remove avatar.';
    } finally {
      avatarUploading = false;
    }
  }

  function startEditUsername() {
    newUsername = profile?.username || '';
    usernameErr = '';
    editingUsername = true;
  }

  async function saveUsername() {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile?.username) { editingUsername = false; return; }
    if (trimmed.length < 2) { usernameErr = 'At least 2 characters.'; return; }
    if (trimmed.length > 24) { usernameErr = 'Max 24 characters.'; return; }
    savingUsername = true;
    usernameErr = '';
    try {
      await supabase.from('profiles').update({ username: trimmed }).eq('id', profileId);
      profile = { ...profile, username: trimmed };
      editingUsername = false;
    } catch (ex) {
      usernameErr = ex?.message || 'Failed to save.';
    } finally {
      savingUsername = false;
    }
  }
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

    <!-- Avatar modal -->
    {#if showAvatarModal}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="avatar-modal-backdrop" on:click|self={closeAvatarModal}>
        <div class="avatar-modal">
          <div class="avatar-modal__header">
            <h3 class="avatar-modal__title">Change profile photo</h3>
            <button class="avatar-modal__close" type="button" on:click={closeAvatarModal} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Preview -->
          <div class="avatar-modal__preview-wrap">
            {#if modalPreviewUrl}
              <img src={modalPreviewUrl} alt="Preview" class="avatar-modal__preview-img" />
            {:else}
              <div class="avatar-modal__preview-placeholder">
                {profile.username?.charAt(0)?.toUpperCase() || 'P'}
              </div>
            {/if}
          </div>

          <!-- Upload file -->
          <label class="avatar-modal__upload-area">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Click to upload photo</span>
            <small>PNG, JPG, WebP — max 3 MB</small>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="sr-only" on:change={handleFileSelect} />
          </label>

          <!-- URL input -->
          <div class="avatar-modal__url-row">
            <span class="avatar-modal__or">or paste image URL</span>
            <input
              class="auth-input"
              placeholder="https://example.com/photo.jpg"
              bind:value={modalUrl}
              on:input={handleUrlInput}
              type="url"
            />
          </div>

          {#if avatarErr}
            <p class="avatar-modal__err">{avatarErr}</p>
          {/if}

          <!-- Actions -->
          <div class="avatar-modal__actions">
            {#if profile.avatar_url}
              <button class="btn btn-ghost avatar-modal__remove" type="button" on:click={removeAvatar} disabled={avatarUploading}>
                Remove photo
              </button>
            {/if}
            <button class="btn btn-ghost" type="button" on:click={closeAvatarModal} disabled={avatarUploading}>Cancel</button>
            <button class="btn btn-accent" type="button" on:click={saveAvatar} disabled={avatarUploading || (!modalFile && !modalUrl.trim())}>
              {avatarUploading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Profile header -->
    <div class="profile-header">
      <div class="profile-avatar-wrap">
        {#if profile.avatar_url}
          <img src={profile.avatar_url} alt={profile.username || 'Avatar'} class="profile-avatar-img" />
        {:else}
          <div class="profile-avatar-placeholder">
            {profile.username?.charAt(0)?.toUpperCase() || 'P'}
          </div>
        {/if}
        {#if isOwnProfile}
          <button class="profile-avatar-overlay" type="button" on:click={openAvatarModal} aria-label="Change photo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span>Change</span>
          </button>
        {/if}
      </div>
      <div class="profile-header__info">
        {#if editingUsername}
          <div class="profile-username-edit">
            <input
              class="auth-input profile-username-input"
              bind:value={newUsername}
              maxlength="24"
              on:keydown={(e) => e.key === 'Enter' && saveUsername()}
              on:keydown={(e) => e.key === 'Escape' && (editingUsername = false)}
              autofocus
            />
            <button class="btn btn-accent btn-sm" type="button" on:click={saveUsername} disabled={savingUsername}>
              {savingUsername ? '…' : 'Save'}
            </button>
            <button class="btn btn-ghost btn-sm" type="button" on:click={() => editingUsername = false}>Cancel</button>
          </div>
          {#if usernameErr}<p class="text-rose-400 text-xs mt-1">{usernameErr}</p>{/if}
        {:else}
          <div class="profile-username-row">
            <p class="text-xl font-semibold">{profile.username || 'Unnamed player'}</p>
            {#if isOwnProfile}
              <button class="profile-edit-name-btn" type="button" on:click={startEditUsername} title="Edit name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            {/if}
          </div>
        {/if}
        <p class="text-white/50 text-xs mt-1 font-mono">{profile.id}</p>
        {#if isOwnProfile}
          <button class="btn btn-ghost profile-change-photo-btn" type="button" on:click={openAvatarModal}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Change photo
          </button>
        {/if}
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
