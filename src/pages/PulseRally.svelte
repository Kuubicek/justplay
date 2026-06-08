<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import GameAchievementsPanel from '../components/GameAchievementsPanel.svelte';
  import { supabase } from '../lib/supabaseClient';
  import { user } from '../lib/stores';
  import { query } from '../lib/router';
  import { joinRoom as joinDbRoom, leaveRoom as leaveDbRoom } from '../lib/api/rooms';
  import { addScore } from '../lib/api/scores';

  const GAME_ID = 'pulse-rally';
  const DEFAULT_ROOM = 'pulse';
  const TARGET_TAPS = 30;
  const ACTIVITY_PING_MS = 5000;
  const INACTIVITY_LIMIT_MS = 18000;
  const BUTTON_COOLDOWN_MS = 360;
  const KEY_POOL = ['Space', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL'];
  const KEY_LABEL = {
    Space: 'Space',
    KeyA: 'A',
    KeyS: 'S',
    KeyD: 'D',
    KeyJ: 'J',
    KeyK: 'K',
    KeyL: 'L'
  };
  const randomId = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2));

  let roomCode = DEFAULT_ROOM;
  let connection = 'idle';
  let err = '';
  let channel = null;
  let seat = 'spectator';
  let authority = null;
  let isAuthority = false;
  let presence = [];
  let activePlayers = 0;
  let state = createState();
  let clientId = `guest-${randomId().slice(0, 8)}`;
  let displayName = 'Guest';
  let dbRoomId = null;
  let lastJoinedRoom = null;
  let matchStartAt = 0;
  let lastMatchId = null;
  let savedMatchId = null;
  let savingScore = false;
  let saveStatus = '';
  let saveErr = '';
  let unsubUser = null;
  let activityTimer = 0;
  let activityTick = 0;
  let lastSeen = {};
  let keyFeedback = '';
  let buttonLockUntil = { left: 0, right: 0 };
  let kickNotice = '';

  function randomTapKey(except = null) {
    if (KEY_POOL.length === 0) return 'Space';
    if (KEY_POOL.length === 1) return KEY_POOL[0];
    let candidate = KEY_POOL[Math.floor(Math.random() * KEY_POOL.length)];
    while (candidate === except) {
      candidate = KEY_POOL[Math.floor(Math.random() * KEY_POOL.length)];
    }
    return candidate;
  }

  function nextSwapTap(currentTaps = 0) {
    return currentTaps + 3 + Math.floor(Math.random() * 4);
  }

  function createState(seed = Date.now()) {
    const leftKey = randomTapKey();
    const rightKey = randomTapKey(leftKey);
    return {
      matchId: seed,
      status: 'waiting',
      taps: { left: 0, right: 0 },
      winner: null,
      startedAt: null,
      finishedAt: null,
      keys: { left: leftKey, right: rightKey },
      nextSwapAt: { left: nextSwapTap(0), right: nextSwapTap(0) }
    };
  }

  function resolveSeat(list, id) {
    const idx = list.findIndex((p) => p.key === id);
    if (idx === 0) return 'left';
    if (idx === 1) return 'right';
    return 'spectator';
  }

  function keyLabel(code) {
    return KEY_LABEL[code] || code || '?';
  }

  function markActivity(playerId, at = Date.now()) {
    if (!playerId) return;
    lastSeen = { ...lastSeen, [playerId]: at };
  }

  function inactivityMs(playerId) {
    const seenAt = lastSeen[playerId] ?? 0;
    if (!seenAt) return Infinity;
    return Date.now() - seenAt;
  }

  function isInactive(playerId) {
    return inactivityMs(playerId) > INACTIVITY_LIMIT_MS;
  }

  function broadcastState(nextState) {
    if (!channel) return;
    channel.send({ type: 'broadcast', event: 'state', payload: nextState });
  }

  function startActivityLoop() {
    stopActivityLoop();
    activityTimer = setInterval(() => {
      activityTick += 1;
      if (!channel || connection !== 'online') return;
      channel.send({ type: 'broadcast', event: 'activity', payload: { from: clientId, at: Date.now() } });
    }, ACTIVITY_PING_MS);
  }

  function stopActivityLoop() {
    if (!activityTimer) return;
    clearInterval(activityTimer);
    activityTimer = 0;
  }

  function startMatch() {
    if (!isAuthority) return;
    if (state.status === 'running') return;
    if (activePlayers < 2) {
      err = 'Need two players connected to start.';
      return;
    }
    const now = Date.now();
    const leftKey = randomTapKey();
    const rightKey = randomTapKey(leftKey);
    state = {
      matchId: now,
      status: 'running',
      taps: { left: 0, right: 0 },
      winner: null,
      startedAt: now,
      finishedAt: null,
      keys: { left: leftKey, right: rightKey },
      nextSwapAt: { left: nextSwapTap(0), right: nextSwapTap(0) }
    };
    buttonLockUntil = { left: 0, right: 0 };
    keyFeedback = '';
    err = '';
    broadcastState(state);
  }

  function finishMatch(winner) {
    const now = Date.now();
    state = {
      ...state,
      status: 'finished',
      winner,
      finishedAt: now
    };
    keyFeedback = winner ? `${winner === seat ? 'You won' : 'Round finished'}` : '';
    broadcastState(state);
  }

  function applyTap(seatId) {
    if (state.status !== 'running') return;
    if (seatId !== 'left' && seatId !== 'right') return;
    const nextCount = (state.taps?.[seatId] ?? 0) + 1;
    const nextState = {
      ...state,
      taps: { ...state.taps, [seatId]: nextCount },
      keys: { ...state.keys },
      nextSwapAt: { ...state.nextSwapAt }
    };
    if (nextCount >= (nextState.nextSwapAt?.[seatId] ?? 4)) {
      nextState.keys[seatId] = randomTapKey(nextState.keys[seatId]);
      nextState.nextSwapAt[seatId] = nextSwapTap(nextCount);
    }
    state = nextState;
    if (nextCount >= TARGET_TAPS) {
      finishMatch(seatId);
      return;
    }
    broadcastState(state);
  }

  function payloadAccepted(payload) {
    if (!payload?.seat) return false;
    if (payload.kind === 'key') {
      return payload.code && payload.code === state.keys?.[payload.seat];
    }
    if (payload.kind === 'button') {
      const lock = buttonLockUntil?.[payload.seat] ?? 0;
      if (Date.now() < lock) return false;
      buttonLockUntil = { ...buttonLockUntil, [payload.seat]: Date.now() + BUTTON_COOLDOWN_MS };
      return true;
    }
    return false;
  }

  function submitTap(kind = 'button', code = null) {
    if (seat === 'spectator' || state.status !== 'running') return;
    const payload = { seat, from: clientId, kind, code, at: Date.now() };
    markActivity(clientId, payload.at);
    if (isAuthority) {
      if (!payloadAccepted(payload)) {
        keyFeedback = 'Wrong key';
        return;
      }
      applyTap(payload.seat);
      return;
    }
    channel?.send({ type: 'broadcast', event: 'tap', payload });
  }

  function handleButtonTap() {
    submitTap('button', null);
  }

  function handleKeydown(event) {
    if (seat === 'spectator') return;
    const inPool = KEY_POOL.includes(event.code);
    if (inPool || event.code === 'Space') {
      event.preventDefault();
    }
    if (state.status !== 'running') return;
    const expected = state.keys?.[seat];
    if (!expected) return;
    if (event.code !== expected) {
      keyFeedback = `Wrong key (${keyLabel(event.code)})`;
      return;
    }
    submitTap('key', event.code);
  }

  function requestStart() {
    if (!channel || seat === 'spectator') return;
    markActivity(clientId, Date.now());
    if (isAuthority) {
      startMatch();
      return;
    }
    channel.send({ type: 'broadcast', event: 'start', payload: { from: clientId, at: Date.now() } });
  }

  function kickPlayer(targetId) {
    if (!isAuthority || !channel || !targetId || targetId === clientId) return;
    channel.send({ type: 'broadcast', event: 'kick', payload: { target: targetId, by: displayName, at: Date.now() } });
  }

  function claimWinAgainstInactive() {
    if (!isAuthority || state.status !== 'running') return;
    const hostSeat = resolveSeat(presence, clientId);
    const opponentSeat = hostSeat === 'left' ? 'right' : 'left';
    const opponentPlayer = opponentSeat === 'left' ? presence[0] : presence[1];
    if (!opponentPlayer || isInactive(opponentPlayer.key)) {
      finishMatch(hostSeat);
      keyFeedback = 'Inactive opponent: win claimed.';
      return;
    }
    err = 'Opponent is still active.';
  }

  function handlePresenceSync() {
    if (!channel) return;
    const raw = channel.presenceState();
    const flat = Object.entries(raw).flatMap(([key, items]) => items.map((meta) => ({ key, ...meta })));
    flat.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    presence = flat;
    const seenUpdates = {};
    for (const entry of flat) {
      const fallback = entry.joinedAt || Date.now();
      seenUpdates[entry.key] = Math.max(lastSeen[entry.key] ?? 0, fallback);
    }
    lastSeen = { ...lastSeen, ...seenUpdates };
    activePlayers = Math.min(2, flat.length);
    authority = flat[0]?.key || null;
    const wasAuthority = isAuthority;
    isAuthority = authority === clientId;
    seat = resolveSeat(flat, clientId);
    if (isAuthority && !wasAuthority) {
      broadcastState(state);
    }
  }

  async function joinRoom() {
    err = '';
    kickNotice = '';
    connection = 'connecting';
    const trimmed = roomCode.trim();
    if (!trimmed) {
      err = 'Room code is required.';
      connection = 'idle';
      return;
    }
    roomCode = trimmed;
    lastJoinedRoom = trimmed;
    if (dbRoomId && dbRoomId !== trimmed) {
      leaveDbRoom(dbRoomId);
      dbRoomId = null;
    }
    stopActivityLoop();
    if (channel) supabase.removeChannel(channel);
    state = createState();
    saveStatus = '';
    saveErr = '';
    savedMatchId = null;
    keyFeedback = '';
    lastSeen = {};
    channel = supabase.channel(`pulse-${roomCode}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: clientId }
      }
    });

    channel.on('presence', { event: 'sync' }, handlePresenceSync);
    channel.on('broadcast', { event: 'state' }, ({ payload }) => {
      if (!payload || isAuthority) return;
      state = payload;
    });
    channel.on('broadcast', { event: 'tap' }, ({ payload }) => {
      if (!payload) return;
      markActivity(payload.from, payload.at || Date.now());
      if (!isAuthority) return;
      if (!payloadAccepted(payload)) return;
      applyTap(payload.seat);
    });
    channel.on('broadcast', { event: 'start' }, ({ payload }) => {
      if (!payload) return;
      markActivity(payload.from, payload.at || Date.now());
      if (isAuthority) startMatch();
    });
    channel.on('broadcast', { event: 'activity' }, ({ payload }) => {
      if (!payload?.from) return;
      markActivity(payload.from, payload.at || Date.now());
    });
    channel.on('broadcast', { event: 'kick' }, ({ payload }) => {
      if (!payload?.target || payload.target !== clientId) return;
      kickNotice = `You were removed from the room by ${payload.by || 'host'}.`;
      err = kickNotice;
      connection = 'idle';
      seat = 'spectator';
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      if (dbRoomId) {
        leaveDbRoom(dbRoomId);
        dbRoomId = null;
      }
    });

    channel.subscribe(async (status, subscribeError) => {
      if (subscribeError) {
        err = subscribeError.message || 'Realtime subscribe error.';
        connection = 'idle';
        return;
      }
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({ name: displayName, joinedAt: Date.now() });
          markActivity(clientId, Date.now());
          startActivityLoop();
          connection = 'online';
          err = '';
          try {
            await joinDbRoom(roomCode);
            dbRoomId = roomCode;
          } catch {}
        } catch (trackError) {
          err = trackError?.message || 'Presence tracking failed.';
          connection = 'idle';
          stopActivityLoop();
        }
      }
      if (status === 'CHANNEL_ERROR') {
        err = 'Realtime channel error. Check Supabase Realtime is enabled.';
        connection = 'idle';
        stopActivityLoop();
      }
      if (status === 'TIMED_OUT') {
        err = 'Realtime channel timed out.';
        connection = 'idle';
        stopActivityLoop();
      }
      if (status === 'CLOSED') {
        connection = 'idle';
        stopActivityLoop();
      }
    });
  }

  async function saveMatchScore() {
    if (savingScore) return;
    if (!state?.matchId || savedMatchId === state.matchId) return;
    if (seat === 'spectator') return;
    if (!$user) {
      saveStatus = 'Sign in to save match results.';
      savedMatchId = state.matchId;
      return;
    }
    savingScore = true;
    saveErr = '';
    try {
      const myScore = state?.taps?.[seat] ?? 0;
      const duration = matchStartAt ? Math.round((Date.now() - matchStartAt) / 1000) : null;
      await addScore({
        game_id: GAME_ID,
        score: myScore,
        duration_seconds: duration,
        meta: {
          matchId: state.matchId,
          seat,
          winner: state.winner,
          taps: state.taps
        }
      });
      saveStatus = 'Score saved.';
      savedMatchId = state.matchId;
    } catch (e) {
      saveErr = e?.message || 'Failed to save score.';
    } finally {
      savingScore = false;
    }
  }

  onMount(() => {
    unsubUser = user.subscribe((u) => {
      if (u?.id) clientId = u.id;
      if (u?.user_metadata?.username) displayName = u.user_metadata.username;
      else if (u?.email) displayName = u.email;
    });
    if ($query?.room) roomCode = $query.room;
    joinRoom();
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    stopActivityLoop();
    if (channel) supabase.removeChannel(channel);
    if (dbRoomId) leaveDbRoom(dbRoomId);
    unsubUser?.();
  });

  $: if ($query?.room && $query.room !== roomCode && connection !== 'connecting') {
    roomCode = $query.room;
    if ($query.room !== lastJoinedRoom) {
      joinRoom();
    }
  }

  $: leftProgress = Math.min(100, Math.round(((state.taps?.left ?? 0) / TARGET_TAPS) * 100));
  $: rightProgress = Math.min(100, Math.round(((state.taps?.right ?? 0) / TARGET_TAPS) * 100));
  $: leftName = presence[0]?.name || presence[0]?.key || 'Waiting';
  $: rightName = presence[1]?.name || presence[1]?.key || 'Waiting';
  $: hostLabel = (() => {
    if (!authority) return '-';
    const host = presence.find((p) => p.key === authority);
    const name = host?.name || host?.key || authority;
    return authority === clientId ? `${name} (you)` : name;
  })();
  $: if (state?.matchId && state.matchId !== lastMatchId) {
    lastMatchId = state.matchId;
    matchStartAt = state.startedAt || Date.now();
    saveStatus = '';
    saveErr = '';
    savedMatchId = null;
    keyFeedback = '';
  }
  $: if (state?.status === 'finished') {
    saveMatchScore();
  }
  $: playerRows = (() => {
    activityTick;
    return presence.map((p, idx) => {
      const idleMs = inactivityMs(p.key);
      const inactive = idleMs > INACTIVITY_LIMIT_MS;
      return {
        ...p,
        idx,
        inactive,
        idleSec: Number.isFinite(idleMs) ? Math.round(idleMs / 1000) : null,
        roleLabel: idx === 0 ? 'Left / Host' : idx === 1 ? 'Right' : 'Spectator'
      };
    });
  })();
  $: leftKey = keyLabel(state.keys?.left);
  $: rightKey = keyLabel(state.keys?.right);
</script>

<Page title="Pulse Rally" subtitle="Two-player tap race with randomized key prompts. First to 30 taps wins.">
  <div class="game-play-layout">
    <div class="game-play-stage">
      <div class="border border-slate-800 rounded-2xl bg-slate-900/60 p-5 space-y-4 relative">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white/60 text-xs uppercase tracking-[0.2em]">Left</p>
            <p class="font-semibold">{leftName}</p>
          </div>
          <div class="text-right">
            <p class="text-white/60 text-xs uppercase tracking-[0.2em]">Taps</p>
            <p class="text-lg font-semibold">{state.taps?.left ?? 0}</p>
            <p class="text-amber-300 text-xs mt-1">Key: {leftKey}</p>
          </div>
        </div>
        <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full bg-sky-400" style={`width: ${leftProgress}%`}></div>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="text-white/60 text-xs uppercase tracking-[0.2em]">Right</p>
            <p class="font-semibold">{rightName}</p>
          </div>
          <div class="text-right">
            <p class="text-white/60 text-xs uppercase tracking-[0.2em]">Taps</p>
            <p class="text-lg font-semibold">{state.taps?.right ?? 0}</p>
            <p class="text-amber-300 text-xs mt-1">Key: {rightKey}</p>
          </div>
        </div>
        <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full bg-emerald-400" style={`width: ${rightProgress}%`}></div>
        </div>

        {#if state.status === 'finished'}
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="max-w-sm w-[92%] px-5 py-5 rounded-2xl bg-black/78 border border-emerald-300/70 text-emerald-100 shadow-xl">
              <p class="text-xs uppercase tracking-[0.24em] text-emerald-200/80 mb-1">Round finished</p>
              <p class="text-2xl font-semibold">Winner: {state.winner || '-'}</p>
              {#if seat !== 'spectator'}
                <button class="btn btn-accent mt-3 w-full" type="button" on:click={requestStart}>Start next round</button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="game-play-panels game-play-panels--wide">
      <div class="card">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-white/70 text-sm">Room</p>
            <div class="flex flex-wrap items-center gap-2 mt-1">
              <input
                class="bg-slate-800 rounded-lg px-3 py-2"
                bind:value={roomCode}
                placeholder="room-id"
                aria-label="Room code"
              />
              <button class="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500" on:click={joinRoom}>
                Join / Create
              </button>
            </div>
          </div>
          <div class="text-right">
            <p class="text-white/70 text-sm">Role</p>
            <p class="text-lg font-semibold capitalize">{seat}</p>
            <p class="text-white/60 text-xs">Host: {hostLabel}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold mb-2">Controls</h3>
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <button
            class="btn btn-accent"
            on:click={requestStart}
            disabled={state.status === 'running' || activePlayers < 2}
          >
            {state.status === 'finished' ? 'Start new round' : 'Start round'}
          </button>
          <button class="btn" on:click={handleButtonTap} disabled={seat === 'spectator' || state.status !== 'running'}>
            Charge (assist)
          </button>
          <span class="text-white/70 text-sm">
            {state.status === 'waiting'
              ? activePlayers < 2
                ? 'Waiting for another player...'
                : 'Ready to start.'
              : state.status === 'running'
                ? `Press ${seat === 'left' ? leftKey : seat === 'right' ? rightKey : '-'}`
                : 'Round finished.'}
          </span>
        </div>
        {#if keyFeedback}
          <p class="text-amber-300 text-sm mt-3">{keyFeedback}</p>
        {/if}
      </div>

      <div class="card">
        <h3 class="font-semibold mb-2">Match info</h3>
        <ul class="text-sm text-white/70 space-y-1">
          <li>Status: {state.status}</li>
          <li>Players: {activePlayers}/2</li>
          <li>Target: {TARGET_TAPS} taps</li>
          <li>Winner: {state.winner || '-'}</li>
          <li>Inactive timeout: {Math.round(INACTIVITY_LIMIT_MS / 1000)}s</li>
        </ul>
        {#if saveStatus}
          <p class="text-emerald-300 text-sm mt-3">{saveStatus}</p>
        {/if}
        {#if saveErr}
          <p class="text-rose-400 text-sm mt-3">{saveErr}</p>
        {/if}
      </div>

      <div class="card">
        <h3 class="font-semibold mb-2">Players</h3>
        {#if playerRows.length === 0}
          <p class="text-white/60 text-sm">No one connected yet.</p>
        {:else}
          <ul class="space-y-2 text-sm">
            {#each playerRows as p}
              <li class="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                <div>
                  <p class="font-semibold">{p.name || p.key}{p.key === clientId ? ' (you)' : ''}</p>
                  <p class="text-white/60 text-xs">{p.key}</p>
                  <p class={`text-xs mt-1 ${p.inactive ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {p.inactive ? `Inactive ${p.idleSec}s` : `Active ${p.idleSec ?? 0}s ago`}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-white/70 text-xs px-2 py-1 rounded bg-slate-800">{p.roleLabel}</span>
                  {#if isAuthority && p.inactive && p.key !== clientId}
                    <button class="btn btn-danger" type="button" on:click={() => kickPlayer(p.key)}>Kick</button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
        {#if isAuthority && state.status === 'running'}
          <button class="btn btn-ghost mt-3" type="button" on:click={claimWinAgainstInactive}>Claim win vs inactive</button>
        {/if}
      </div>

      {#if err}
        <div class="card border border-rose-700 text-rose-200 text-sm">
          {err}
        </div>
      {/if}
      {#if kickNotice}
        <div class="card border border-rose-700 text-rose-200 text-sm">
          {kickNotice}
        </div>
      {/if}
    </div>
  </div>
  <GameAchievementsPanel gameId={GAME_ID} title="Game achievements" />
</Page>
