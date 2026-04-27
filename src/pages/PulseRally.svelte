<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import { supabase } from '../lib/supabaseClient';
  import { user } from '../lib/stores';
  import { query } from '../lib/router';
  import { joinRoom as joinDbRoom, leaveRoom as leaveDbRoom } from '../lib/api/rooms';
  import { addScore } from '../lib/api/scores';

  const GAME_ID = 'pulse-rally';
  const DEFAULT_ROOM = 'pulse';
  const TARGET_TAPS = 30;
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

  function createState(seed = Date.now()) {
    return {
      matchId: seed,
      status: 'waiting',
      taps: { left: 0, right: 0 },
      winner: null,
      startedAt: null,
      finishedAt: null
    };
  }

  function resolveSeat(list, id) {
    const idx = list.findIndex((p) => p.key === id);
    if (idx === 0) return 'left';
    if (idx === 1) return 'right';
    return 'spectator';
  }

  function broadcastState(nextState) {
    if (!channel) return;
    channel.send({ type: 'broadcast', event: 'state', payload: nextState });
  }

  function startMatch() {
    if (!isAuthority) return;
    if (state.status === 'running') return;
    if (activePlayers < 2) {
      err = 'Need two players connected to start.';
      return;
    }
    const now = Date.now();
    state = {
      matchId: now,
      status: 'running',
      taps: { left: 0, right: 0 },
      winner: null,
      startedAt: now,
      finishedAt: null
    };
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
    broadcastState(state);
  }

  function applyTap(seatId) {
    if (state.status !== 'running') return;
    if (seatId !== 'left' && seatId !== 'right') return;
    const nextCount = (state.taps?.[seatId] ?? 0) + 1;
    const next = {
      ...state,
      taps: { ...state.taps, [seatId]: nextCount }
    };
    state = next;
    if (nextCount >= TARGET_TAPS) {
      finishMatch(seatId);
      return;
    }
    broadcastState(state);
  }

  function handleTap() {
    if (seat === 'spectator' || state.status !== 'running') return;
    if (isAuthority) {
      applyTap(seat);
      return;
    }
    channel?.send({
      type: 'broadcast',
      event: 'tap',
      payload: { seat, from: clientId, at: Date.now() }
    });
  }

  function handleKeydown(event) {
    if (event.code === 'Space') {
      event.preventDefault();
      handleTap();
    }
  }

  function requestStart() {
    if (!channel) return;
    if (seat === 'spectator') return;
    if (isAuthority) {
      startMatch();
      return;
    }
    channel.send({ type: 'broadcast', event: 'start', payload: { from: clientId, at: Date.now() } });
  }

  function handlePresenceSync() {
    if (!channel) return;
    const raw = channel.presenceState();
    const flat = Object.entries(raw).flatMap(([key, items]) => items.map((meta) => ({ key, ...meta })));
    flat.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    presence = flat;
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
    if (channel) supabase.removeChannel(channel);
    state = createState();
    saveStatus = '';
    saveErr = '';
    savedMatchId = null;
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
      if (!payload || !isAuthority) return;
      applyTap(payload.seat);
    });
    channel.on('broadcast', { event: 'start' }, () => {
      if (isAuthority) startMatch();
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
          connection = 'online';
          err = '';
          try {
            await joinDbRoom(roomCode);
            dbRoomId = roomCode;
          } catch {}
        } catch (trackError) {
          err = trackError?.message || 'Presence tracking failed.';
          connection = 'idle';
        }
      }
      if (status === 'CHANNEL_ERROR') {
        err = 'Realtime channel error. Check Supabase Realtime is enabled.';
        connection = 'idle';
      }
      if (status === 'TIMED_OUT') {
        err = 'Realtime channel timed out.';
        connection = 'idle';
      }
      if (status === 'CLOSED') {
        connection = 'idle';
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
  }
  $: if (state?.status === 'finished') {
    saveMatchScore();
  }
</script>

<Page title="Pulse Rally" subtitle="Two-player tap race. First to 30 pulses wins.">
  <div class="game-play-layout">
    <div class="game-play-stage">
      <div class="border border-slate-800 rounded-2xl bg-slate-900/60 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white/60 text-xs uppercase tracking-[0.2em]">Left</p>
            <p class="font-semibold">{leftName}</p>
          </div>
          <div class="text-right">
            <p class="text-white/60 text-xs uppercase tracking-[0.2em]">Taps</p>
            <p class="text-lg font-semibold">{state.taps?.left ?? 0}</p>
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
          </div>
        </div>
        <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full bg-emerald-400" style={`width: ${rightProgress}%`}></div>
        </div>
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
          <button class="btn" on:click={handleTap} disabled={seat === 'spectator' || state.status !== 'running'}>
            Charge (Space)
          </button>
          <span class="text-white/70 text-sm">
            {state.status === 'waiting'
              ? activePlayers < 2
                ? 'Waiting for another player...'
                : 'Ready to start.'
              : state.status === 'running'
                ? 'Tap fast to win.'
                : 'Round finished.'}
          </span>
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold mb-2">Match info</h3>
        <ul class="text-sm text-white/70 space-y-1">
          <li>Status: {state.status}</li>
          <li>Players: {activePlayers}/2</li>
          <li>Target: {TARGET_TAPS} taps</li>
          <li>Winner: {state.winner || '-'}</li>
        </ul>
        {#if saveStatus}
          <p class="text-emerald-300 text-sm mt-3">{saveStatus}</p>
        {/if}
        {#if saveErr}
          <p class="text-rose-400 text-sm mt-3">{saveErr}</p>
        {/if}
      </div>

      {#if err}
        <div class="card border border-rose-700 text-rose-200 text-sm">
          {err}
        </div>
      {/if}
    </div>
  </div>
</Page>
