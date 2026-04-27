<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import { supabase } from '../lib/supabaseClient';
  import { user, guest } from '../lib/stores';
  import { query } from '../lib/router';
  import { joinRoom as joinDbRoom, leaveRoom as leaveDbRoom } from '../lib/api/rooms';
  import { addScore } from '../lib/api/scores';
  import {
    createInitialState,
    stepState,
    clampPaddle,
    cloneState,
    geometry,
    constants
  } from '../lib/pong/engine';

  const DEFAULT_ROOM = 'prosinec';
  const INPUT_STEP = 0.06;
  const BROADCAST_EVERY_MS = 55;
  const INPUT_BROADCAST_MS = 30;
  const INTERP_DELAY_MS = 90;
  const randomId = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2));
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  let roomCode = DEFAULT_ROOM;
  let connection = 'idle'; // idle | connecting | online
  let err = '';
  let channel = null;
  let seat = 'spectator';
  let authority = null;
  let isAuthority = false;
  let presence = [];
  let activePlayers = 0;
  let state = createInitialState();
  let renderState = cloneState(state);
  let serverInputs = { left: 0.5, right: 0.5 };
  let loopHandle = 0;
  let clientLoopHandle = 0;
  let serverPrev = null;
  let serverNext = null;
  let lastBroadcast = 0;
  let lastInputSent = 0;
  let pendingInput = null;
  let inputTimer = 0;
  let unsubUser = null;
  let clientId = `guest-${randomId().slice(0, 8)}`;
  let displayName = 'Guest';
  let lastSeed = Date.now();
  let localPaddleState = null;
  let rematchVotes = {};
  let rematchTriggeredFor = null;
  let lastMatchId = null;
  let dbRoomId = null;
  let matchStartAt = 0;
  let savedMatchId = null;
  let savingScore = false;
  let saveStatus = '';
  let saveErr = '';

  function nextSeed() {
    const now = Date.now();
    lastSeed = Math.max(now, lastSeed + 1);
    return lastSeed;
  }
  let lastJoinedRoom = null;

  function shouldAcceptState(payload) {
    if (!payload || !renderState) return true;
    if (payload.matchId !== renderState.matchId) return true;
    if (payload.sequence == null || renderState.sequence == null) return true;
    return payload.sequence > renderState.sequence;
  }

  function rebaseAuthorityState(nextState) {
    const now = nowMs();
    const prevTick = nextState.lastTick ?? now;
    if (nextState.cooldownUntil) {
      const remaining = Math.max(0, nextState.cooldownUntil - prevTick);
      nextState.cooldownUntil = now + remaining;
    }
    nextState.lastTick = now;
  }

  function syncInputsFromState(nextState) {
    serverInputs = {
      left: clampPaddle(nextState.paddles?.left?.targetY ?? 0.5),
      right: clampPaddle(nextState.paddles?.right?.targetY ?? 0.5)
    };
  }

  function promoteToAuthority() {
    state = cloneState(renderState);
    rebaseAuthorityState(state);
    syncInputsFromState(state);
    lastBroadcast = 0;
    startLoop();
  }

  function resetInputSend() {
    if (inputTimer) clearTimeout(inputTimer);
    inputTimer = 0;
    pendingInput = null;
    lastInputSent = 0;
  }

  function resetSnapshots() {
    serverPrev = null;
    serverNext = null;
  }

  function applyLocalPaddle(nextState) {
    if (seat === 'spectator' || isAuthority) return nextState;
    if (!localPaddleState || localPaddleState.seat !== seat) return nextState;
    if (!nextState?.paddles?.[seat]) return nextState;
    return {
      ...nextState,
      paddles: {
        ...nextState.paddles,
        [seat]: { ...nextState.paddles[seat], ...localPaddleState }
      }
    };
  }

  function pushSnapshot(payload) {
    const snap = { state: payload, at: nowMs() };
    if (!serverPrev) {
      serverPrev = snap;
      serverNext = snap;
    } else {
      serverPrev = serverNext;
      serverNext = snap;
    }
  }

  function interpolateState(aState, bState, t) {
    if (!aState) return cloneState(bState);
    if (!bState) return cloneState(aState);
    const clamped = Math.max(0, Math.min(1, t));
    const lerp = (a, b) => a + (b - a) * clamped;
    return {
      ...bState,
      ball: {
        ...bState.ball,
        x: lerp(aState.ball.x, bState.ball.x),
        y: lerp(aState.ball.y, bState.ball.y)
      },
      paddles: {
        left: {
          ...bState.paddles.left,
          y: lerp(aState.paddles.left.y, bState.paddles.left.y),
          targetY: lerp(aState.paddles.left.targetY, bState.paddles.left.targetY)
        },
        right: {
          ...bState.paddles.right,
          y: lerp(aState.paddles.right.y, bState.paddles.right.y),
          targetY: lerp(aState.paddles.right.targetY, bState.paddles.right.targetY)
        }
      }
    };
  }

  onMount(() => {
    unsubUser = user.subscribe((u) => {
      if (u?.id) clientId = u.id;
      if (u?.user_metadata?.username) displayName = u.user_metadata.username;
      else if (u?.email) displayName = u.email;
    });
    if ($query?.room) roomCode = $query.room;
    joinRoom();
  });

  onDestroy(() => {
    stopLoop();
    stopClientLoop();
    resetInputSend();
    if (channel) supabase.removeChannel(channel);
    if (dbRoomId) leaveDbRoom(dbRoomId);
    unsubUser?.();
  });

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
    stopLoop();
    stopClientLoop();
    resetInputSend();
    resetSnapshots();
    localPaddleState = null;
    rematchVotes = {};
    rematchTriggeredFor = null;
    if (channel) supabase.removeChannel(channel);
    state = createInitialState();
    renderState = cloneState(state);
    serverInputs = { left: 0.5, right: 0.5 };
    lastBroadcast = 0;
    channel = supabase.channel(`pong-${roomCode}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: clientId }
      }
    });

    channel.on('presence', { event: 'sync' }, handlePresenceSync);
    channel.on('broadcast', { event: 'state' }, ({ payload }) => {
      if (!payload || isAuthority) return;
      if (!shouldAcceptState(payload)) return;
      pushSnapshot(payload);
      if (!clientLoopHandle) {
        renderState = applyLocalPaddle(payload);
      }
      state = cloneState(payload);
    });
    channel.on('broadcast', { event: 'restart' }, ({ payload }) => {
      if (!payload || !isAuthority) return;
      restartMatch();
    });
    channel.on('broadcast', { event: 'rematch' }, ({ payload }) => {
      if (!payload?.from) return;
      rematchVotes = { ...rematchVotes, [payload.from]: !!payload.wants };
    });
    channel.on('broadcast', { event: 'input' }, ({ payload }) => {
      if (!payload) return;
      if (isAuthority && payload.seat) {
        serverInputs[payload.seat] = clampPaddle(payload.y ?? 0.5);
      }
      if (!isAuthority && payload.from === clientId && seat === payload.seat && renderState?.paddles?.[seat]) {
        const next = clampPaddle(payload.y ?? renderState.paddles[seat].targetY);
        renderState = {
          ...renderState,
          paddles: {
            ...renderState.paddles,
            [seat]: { ...renderState.paddles[seat], targetY: next, y: next }
          }
        };
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

  $: if ($query?.room && $query.room !== roomCode && connection !== 'connecting') {
    roomCode = $query.room;
    if ($query.room !== lastJoinedRoom) {
      joinRoom();
    }
  }

  function handlePresenceSync() {
    if (!channel) return;
    const raw = channel.presenceState();
    const flat = Object.entries(raw).flatMap(([key, items]) =>
      items.map((meta) => ({ key, ...meta }))
    );
    flat.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    presence = flat;
    activePlayers = Math.min(2, flat.length);
    authority = flat[0]?.key || null;
    const wasAuthority = isAuthority;
    const prevSeat = seat;
    isAuthority = authority === clientId;
    seat = resolveSeat(flat, clientId);
    if (seat !== prevSeat) {
      localPaddleState = null;
    }

    if (isAuthority) {
      stopClientLoop();
      if (!wasAuthority) {
        resetSnapshots();
        promoteToAuthority();
      } else if (!loopHandle) {
        startLoop();
      }
    } else {
      stopLoop();
      startClientLoop();
    }
  }

  function resolveSeat(list, id) {
    const idx = list.findIndex((p) => p.key === id);
    if (idx === 0) return 'left';
    if (idx === 1) return 'right';
    return 'spectator';
  }

  function startLoop() {
    stopLoop();
    const tick = () => {
      if (!isAuthority) {
        loopHandle = 0;
        return;
      }
      const now = nowMs();
      stepState(state, serverInputs, now, activePlayers);
      renderState = cloneState(state);

      if (now - lastBroadcast >= BROADCAST_EVERY_MS) {
        channel?.send({ type: 'broadcast', event: 'state', payload: renderState });
        lastBroadcast = now;
      }
      loopHandle = requestAnimationFrame(tick);
    };
    loopHandle = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (loopHandle) cancelAnimationFrame(loopHandle);
    loopHandle = 0;
  }

  function startClientLoop() {
    if (clientLoopHandle) return;
    const tick = () => {
      if (isAuthority) {
        clientLoopHandle = 0;
        return;
      }
      if (serverNext) {
        const now = nowMs();
        const renderTime = now - INTERP_DELAY_MS;
        const prev = serverPrev?.state;
        const next = serverNext?.state;
        const span = serverNext.at - (serverPrev?.at ?? serverNext.at);
        const t = span > 0 ? (renderTime - serverPrev.at) / span : 1;
        const interp = interpolateState(prev, next, t);
        renderState = applyLocalPaddle(interp);
      }
      clientLoopHandle = requestAnimationFrame(tick);
    };
    clientLoopHandle = requestAnimationFrame(tick);
  }

  function stopClientLoop() {
    if (clientLoopHandle) cancelAnimationFrame(clientLoopHandle);
    clientLoopHandle = 0;
  }

  function updateLocalPaddle(clamped) {
    if (!renderState?.paddles?.[seat]) return;
    localPaddleState = { y: clamped, targetY: clamped, seat };
    renderState = {
      ...renderState,
      paddles: {
        ...renderState.paddles,
        [seat]: { ...renderState.paddles[seat], targetY: clamped, y: clamped }
      }
    };
  }

  function sendInput(clamped) {
    const payload = { seat, y: clamped, from: clientId, at: Date.now() };
    channel.send({ type: 'broadcast', event: 'input', payload });
    if (isAuthority) {
      serverInputs[seat] = clamped;
    }
  }

  function flushPendingInput() {
    inputTimer = 0;
    if (pendingInput == null || seat === 'spectator' || !channel) return;
    const clamped = pendingInput;
    pendingInput = null;
    sendInput(clamped);
    lastInputSent = nowMs();
    if (pendingInput != null) scheduleInputSend();
  }

  function scheduleInputSend() {
    if (inputTimer || pendingInput == null) return;
    const delay = Math.max(0, INPUT_BROADCAST_MS - (nowMs() - lastInputSent));
    inputTimer = setTimeout(flushPendingInput, delay);
  }

  function publishInput(targetY) {
    if (!channel || seat === 'spectator') return;
    const clamped = clampPaddle(targetY);
    updateLocalPaddle(clamped);
    const now = nowMs();
    if (!inputTimer && now - lastInputSent >= INPUT_BROADCAST_MS) {
      sendInput(clamped);
      lastInputSent = now;
      return;
    }
    pendingInput = clamped;
    scheduleInputSend();
  }

  function handlePointer(event) {
    if (seat === 'spectator') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    publishInput(ratio);
  }

  function handleKeydown(event) {
    if (seat === 'spectator') return;
    const keysUp = ['ArrowUp', 'w', 'W'];
    const keysDown = ['ArrowDown', 's', 'S'];
    if (!keysUp.includes(event.key) && !keysDown.includes(event.key)) return;
    event.preventDefault();
    const current = renderState?.paddles?.[seat]?.targetY ?? 0.5;
    const delta = keysUp.includes(event.key) ? -INPUT_STEP : INPUT_STEP;
    publishInput(current + delta);
  }

  function restartMatch() {
    if (!isAuthority) return;
    state = createInitialState(nextSeed());
    renderState = cloneState(state);
    serverInputs = { left: 0.5, right: 0.5 };
    lastBroadcast = 0;
    channel?.send({ type: 'broadcast', event: 'state', payload: renderState });
    rematchVotes = {};
    rematchTriggeredFor = null;
    matchStartAt = Date.now();
    savedMatchId = null;
    saveStatus = '';
    saveErr = '';
  }

  function requestRestart() {
    if (!channel || seat === 'spectator') return;
    if (renderState?.status === 'finished') {
      const wants = !rematchVotes[clientId];
      rematchVotes = { ...rematchVotes, [clientId]: wants };
      channel.send({ type: 'broadcast', event: 'rematch', payload: { from: clientId, wants, at: Date.now() } });
      return;
    }
    if (isAuthority) restartMatch();
    else channel.send({ type: 'broadcast', event: 'restart', payload: { from: clientId, at: Date.now() } });
  }

  $: winnerLabel = renderState.winner
    ? `Winner: ${renderState.winner === 'left' ? 'Left' : 'Right'}`
    : null;
  $: if (renderState?.matchId && renderState.matchId !== lastMatchId) {
    lastMatchId = renderState.matchId;
    rematchVotes = {};
    rematchTriggeredFor = null;
    matchStartAt = Date.now();
    savedMatchId = null;
    saveStatus = '';
    saveErr = '';
  }
  $: activeKeys = presence.slice(0, 2).map((p) => p.key);
  $: rematchReady = activeKeys.filter((key) => rematchVotes[key]).length;
  $: rematchNeeded = Math.max(1, activeKeys.length);
  $: rematchLabel = `${rematchReady}/${rematchNeeded} ready`;
  $: if (isAuthority && renderState?.status === 'finished' && rematchReady >= rematchNeeded) {
    if (rematchTriggeredFor !== renderState.matchId) {
      rematchTriggeredFor = renderState.matchId;
      restartMatch();
    }
  }
  $: if (renderState?.status === 'finished') {
    saveMatchScore();
  }

  async function saveMatchScore() {
    if (savingScore) return;
    if (!renderState?.matchId || savedMatchId === renderState.matchId) return;
    if (seat === 'spectator') return;
    if (!$user && !$guest) {
      saveStatus = 'Sign in to save match results.';
      savedMatchId = renderState.matchId;
      return;
    }
    savingScore = true;
    saveErr = '';
    try {
      const myScore = renderState?.scores?.[seat] ?? 0;
      const duration = matchStartAt ? Math.round((Date.now() - matchStartAt) / 1000) : null;
      await addScore({
        game_id: 'pong',
        score: myScore,
        duration_seconds: duration,
        meta: {
          matchId: renderState.matchId,
          seat,
          winner: renderState.winner,
          scores: renderState.scores
        }
      });
      saveStatus = 'Score saved.';
      savedMatchId = renderState.matchId;
    } catch (e) {
      saveErr = e?.message || 'Failed to save score.';
    } finally {
      savingScore = false;
    }
  }
  $: hostLabel = (() => {
    if (!authority) return '-';
    const host = presence.find((p) => p.key === authority);
    const name = host?.name || host?.key || authority;
    return authority === clientId ? `${name} (you)` : name;
  })();
</script>

<Page title="Pong Multiplayer">
  <div class="game-play-layout">
    <div class="game-play-stage">
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        class="relative w-full aspect-[16/9] rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden"
        role="application"
        aria-label="Pong field"
        tabindex="0"
        on:mousemove={handlePointer}
        on:click={handlePointer}
        on:keydown={handleKeydown}
      >
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 opacity-80"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-px h-full bg-white/10"></div>
        </div>
        <div class="absolute inset-0" aria-hidden="true">
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white/5"></div>
        </div>

        <!-- Paddles -->
        {#if renderState?.paddles}
          <div
            class="absolute bg-sky-400 shadow-lg shadow-sky-500/30 rounded-md"
            style={`left:${geometry.leftX * 100}%; width:${geometry.paddleWidth * 100}%; height:${geometry.paddleHeight * 100}%; top:${(renderState.paddles.left.y - geometry.paddleHeight / 2) * 100}%; transform: translate(-50%, 0);`}
          ></div>
          <div
            class="absolute bg-emerald-400 shadow-lg shadow-emerald-500/30 rounded-md"
            style={`left:${geometry.rightX * 100}%; width:${geometry.paddleWidth * 100}%; height:${geometry.paddleHeight * 100}%; top:${(renderState.paddles.right.y - geometry.paddleHeight / 2) * 100}%; transform: translate(-50%, 0);`}
          ></div>
        {/if}

        <!-- Ball -->
        {#if renderState?.ball}
          <div
            class="absolute bg-white shadow-xl shadow-white/40 rounded-full"
            style={`width:${geometry.ballRadius * 200}%; height:${geometry.ballRadius * 200}%; left:${renderState.ball.x * 100}%; top:${renderState.ball.y * 100}%; transform: translate(-50%, -50%);`}
          ></div>
        {/if}

        <div class="absolute top-3 left-4 text-sm flex items-center gap-3">
          <span class="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-white/80">
            {connection === 'online' ? 'Connected' : connection === 'connecting' ? 'Connecting...' : 'Idle'}
          </span>
          {#if renderState.cooldownUntil}
            <span class="text-white/60">Serve cooldown</span>
          {/if}
        </div>

        <div class="absolute top-3 right-4 flex items-center gap-3 text-lg font-semibold">
          <span class="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
            {renderState.scores.left ?? 0}
          </span>
          <span class="text-white/60">:</span>
          <span class="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
            {renderState.scores.right ?? 0}
          </span>
        </div>

        {#if winnerLabel}
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="px-4 py-3 rounded-xl bg-black/70 border border-emerald-400/60 text-emerald-200 font-semibold">
              {winnerLabel}
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
        <div class="flex flex-wrap items-center gap-3">
          <div class="text-white/70 text-sm">
            <p>Mouse/click on the field, arrows/W/S for small moves.</p>
            <p>Host runs the simulation and sends updates to others.</p>
          </div>
          {#if seat !== 'spectator'}
            <div class="flex items-center gap-2">
              <button class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700" on:click={requestRestart}>
                {renderState?.status === 'finished'
                  ? rematchVotes[clientId] ? 'Cancel rematch' : 'Ready for rematch'
                  : isAuthority ? 'Restart' : 'Request restart'}
              </button>
              {#if renderState?.status === 'finished'}
                <span class="text-white/60 text-xs">{rematchLabel}</span>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold mb-2">Match info</h3>
        <ul class="text-sm text-white/70 space-y-1">
          <li>Host: {hostLabel}</li>
          <li>Players: {activePlayers}/2</li>
          <li>Sim status: {renderState.status}</li>
          <li>Max score: {constants.WIN_SCORE}</li>
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
        {#if presence.length === 0}
          <p class="text-white/60 text-sm">No one connected yet.</p>
        {:else}
          <ul class="space-y-2 text-sm">
            {#each presence as p, idx}
              <li class="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                <div>
                  <p class="font-semibold">{p.name || p.key}{p.key === clientId ? ' (you)' : ''}</p>
                  <p class="text-white/60 text-xs">{p.key}</p>
                </div>
                <span class="text-white/70 text-xs px-2 py-1 rounded bg-slate-800">
                  {idx === 0 ? 'Left / Host' : idx === 1 ? 'Right' : 'Spectator'}
                </span>
              </li>
            {/each}
          </ul>
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
