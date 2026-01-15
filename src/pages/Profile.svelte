<script>
  import { onMount } from 'svelte';
  import Page from '../components/Page.svelte';
  import { supabase } from '../lib/supabaseClient';
  import { params } from '../lib/router';
  import { user, guest } from '../lib/stores';

  let profileId = null;
  let profile = null;
  let scores = [];
  let loading = false;
  let err = '';
  let lastLoadedId = null;

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

      const { data: scoreRows, error: scoreErr } = await supabase
        .from('scores')
        .select('id, score, game_id, created_at, games(name)')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (scoreErr) throw scoreErr;
      scores = scoreRows || [];
    } catch (e) {
      err = e.message;
      profile = null;
      scores = [];
    } finally {
      loading = false;
    }
  };

  const loadIfNeeded = () => {
    profileId = $params.profileId || $user?.id || null;
    if (profileId && profileId !== lastLoadedId) {
      lastLoadedId = profileId;
      fetchProfile(profileId);
    }
  };

  onMount(loadIfNeeded);
  $: loadIfNeeded();
</script>

<Page title="Profile" subtitle="Player stats & settings.">
  {#if err}
    <p class="text-rose-400 text-sm mb-4">{err}</p>
  {/if}

  {#if !$user && !$params.profileId}
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

    <div class="border border-slate-800 rounded-2xl p-4 mb-4">
      <h3 class="font-semibold mb-2">Recent scores</h3>
      {#if scores.length === 0}
        <p class="text-white/60 text-sm">No games played yet.</p>
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
  {:else if $guest}
    <p class="text-white/70">Guest mode: no profile data to show. <a class="underline" href="#/login">Sign in</a> to save stats.</p>
  {/if}
</Page>
