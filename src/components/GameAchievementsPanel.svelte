<script>
  import { getAchievementsForUser } from '../lib/api/achievements';
  import { isAnonymousUser } from '../lib/api/auth';
  import { user } from '../lib/stores';

  export let gameId = '';
  export let title = 'Achievements';

  let loading = false;
  let err = '';
  let achievements = [];
  let requestedKey = '';
  let requestToken = 0;

  const includeAchievement = (achievement, currentGameId) =>
    achievement?.game_id === currentGameId || achievement?.game_id == null;

  const achievementSort = (a, b) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.title || '').localeCompare(b.title || '');

  const unlockedLabel = (achievement) =>
    achievement.unlocked_at
      ? `Unlocked ${new Date(achievement.unlocked_at).toLocaleString()}`
      : 'Unlocked';

  async function loadAchievements() {
    if (!gameId) {
      achievements = [];
      err = '';
      loading = false;
      return;
    }
    const token = ++requestToken;
    loading = true;
    err = '';
    try {
      const rows = await getAchievementsForUser($user?.id || null);
      if (token !== requestToken) return;
      achievements = (rows || [])
        .filter((achievement) => includeAchievement(achievement, gameId))
        .sort(achievementSort);
    } catch (e) {
      if (token !== requestToken) return;
      err = e?.message || 'Failed to load achievements.';
      achievements = [];
    } finally {
      if (token === requestToken) loading = false;
    }
  }

  $: {
    const key = `${gameId || ''}::${$user?.id || ($user ? 'anon' : 'guest')}`;
    if (gameId && key !== requestedKey) {
      requestedKey = key;
      loadAchievements();
    }
    if (!gameId) achievements = [];
  }

  $: totalCount = achievements.length;
  $: unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
  $: remainingCount = Math.max(0, totalCount - unlockedCount);
  $: completion = totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0;
  $: signedIn = !!$user && !isAnonymousUser($user);
</script>

<section class="game-achievements card">
  <div class="game-achievements__head">
    <div class="game-achievements__heading">
      <h3 class="font-semibold">{title}</h3>
      {#if totalCount > 0}
        <p class="text-white/60 text-sm">
          {unlockedCount}/{totalCount} unlocked · {remainingCount} remaining
        </p>
      {/if}
    </div>
    {#if totalCount > 0}
      <span class="game-achievements__percent">{completion}%</span>
    {/if}
  </div>

  {#if totalCount > 0}
    <div class="game-achievements__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}>
      <span style={`width: ${completion}%`}></span>
    </div>
  {/if}

  {#if err}
    <p class="text-rose-400 text-sm">{err}</p>
  {:else if loading}
    <p class="text-white/60 text-sm">Loading achievements...</p>
  {:else if totalCount === 0}
    <p class="text-white/60 text-sm">No achievements configured for this game yet.</p>
  {:else}
    <div class="game-achievements__track">
      {#each achievements as achievement}
        <article class={`achievement-card game-achievements__card ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}`}>
          <div class="achievement-header">
            <h4 class="achievement-title">{achievement.title}</h4>
            <span class="pill">{achievement.points || 0} pts</span>
          </div>
          <p class="achievement-desc">{achievement.description || 'No description available.'}</p>
          <p class="achievement-meta">
            {achievement.unlocked ? unlockedLabel(achievement) : 'Locked'}
          </p>
        </article>
      {/each}
    </div>
  {/if}

  {#if !signedIn}
    <p class="game-achievements__hint text-white/60 text-xs">
      Sign in with a full account to keep achievement progress across devices.
    </p>
  {/if}
</section>
