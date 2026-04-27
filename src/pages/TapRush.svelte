<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import GameAchievementsPanel from '../components/GameAchievementsPanel.svelte';
  import { addScore } from '../lib/api/scores';
  import { user, guest } from '../lib/stores';

  const GAME_ID = 'tap-rush';
  const ROUND_TIME = 30;
  const bestKey = 'jp_tap_rush_best';

  let board;
  let boardRect = { width: 0, height: 0 };
  let target = { x: 0, y: 0 };
  let targetSize = 48;
  let score = 0;
  let best = 0;
  let streak = 0;
  let bestStreak = 0;
  let timeLeft = ROUND_TIME;
  let running = false;
  let gameOver = false;
  let timer = 0;
  let startedAt = 0;
  let saving = false;
  let saved = false;
  let saveStatus = '';
  let saveErr = '';

  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  function updateBoard() {
    if (!board) return;
    const rect = board.getBoundingClientRect();
    boardRect = { width: rect.width, height: rect.height };
    targetSize = Math.max(36, Math.min(boardRect.width, boardRect.height) * 0.14);
    positionTarget();
  }

  function positionTarget() {
    if (!boardRect.width || !boardRect.height) return;
    const pad = targetSize / 2;
    const x = pad + Math.random() * (boardRect.width - targetSize);
    const y = pad + Math.random() * (boardRect.height - targetSize);
    target = { x, y };
  }

  function resetGame() {
    running = false;
    gameOver = false;
    score = 0;
    streak = 0;
    bestStreak = 0;
    timeLeft = ROUND_TIME;
    saved = false;
    saving = false;
    saveStatus = '';
    saveErr = '';
    clearInterval(timer);
    timer = 0;
  }

  function startGame() {
    resetGame();
    running = true;
    startedAt = nowMs();
    positionTarget();
    timer = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        timeLeft = 0;
        stopGame();
      }
    }, 1000);
  }

  function stopGame() {
    running = false;
    gameOver = true;
    clearInterval(timer);
    timer = 0;
    if (score > best) {
      best = score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(bestKey, String(best));
      }
    }
    saveScore();
  }

  function handleHit() {
    if (!running) return;
    score += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    positionTarget();
  }

  function handleMiss() {
    if (!running) return;
    score = Math.max(0, score - 1);
    streak = 0;
  }

  function handleBoardKey(event) {
    if (!running) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleMiss();
    }
  }

  async function saveScore() {
    if (saved || saving || score <= 0) return;
    if (!$user && !$guest) {
      saveStatus = 'Sign in to save scores.';
      saved = true;
      return;
    }
    saving = true;
    saveErr = '';
    try {
      await addScore({
        game_id: GAME_ID,
        score,
        duration_seconds: Math.round((nowMs() - startedAt) / 1000),
        meta: { bestStreak }
      });
      saveStatus = 'Score saved.';
      saved = true;
    } catch (e) {
      saveErr = e?.message || 'Failed to save score.';
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = Number(localStorage.getItem(bestKey));
      best = Number.isFinite(stored) ? stored : 0;
    }
    updateBoard();
    window.addEventListener('resize', updateBoard);
  });

  onDestroy(() => {
    window.removeEventListener('resize', updateBoard);
    clearInterval(timer);
  });
</script>

<Page title="Tap Rush" subtitle="Singleplayer: hit the glowing target fast.">
  <div class="game-play-layout">
    <div class="game-play-stage">
      <div
        class="taprush-board"
        bind:this={board}
        on:click={handleMiss}
        on:keydown={handleBoardKey}
        role="button"
        tabindex="0"
        aria-label="Tap Rush board"
      >
        {#if running}
          <button
            class="taprush-target"
            style={`left:${target.x}px; top:${target.y}px; width:${targetSize}px; height:${targetSize}px;`}
            on:click|stopPropagation={handleHit}
            aria-label="Tap target"
            type="button"
          ></button>
        {/if}
        {#if !running}
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="px-4 py-3 rounded-xl bg-black/70 border border-slate-700 text-white/80 text-sm">
              {gameOver ? 'Time up' : 'Click Start to play'}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="game-play-panels game-play-panels--three">
      <div class="card">
        <h3 class="font-semibold mb-3">Controls</h3>
        <div class="flex flex-wrap items-center gap-3">
          <button class="btn btn-accent" on:click={startGame}>
            {running ? 'Restart' : gameOver ? 'Play again' : 'Start'}
          </button>
          <button
            class="btn btn-ghost"
            on:click={resetGame}
            disabled={running}
          >
            Reset
          </button>
          <span class="text-white/70 text-sm">Misses cost 1 point.</span>
        </div>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-2">Score</h3>
        <p class="text-3xl font-semibold">{score}</p>
        <p class="text-white/60 text-sm">Best: {best}</p>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-2">Timer</h3>
        <p class="text-2xl font-semibold">{timeLeft}s</p>
        <p class="text-white/60 text-sm">Best streak: {bestStreak}</p>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-2">Status</h3>
        <p class="text-white/70 text-sm">{running ? 'Hunting...' : gameOver ? 'Finished' : 'Ready'}</p>
        {#if saveStatus}
          <p class="text-emerald-300 text-sm mt-2">{saveStatus}</p>
        {/if}
        {#if saveErr}
          <p class="text-rose-400 text-sm mt-2">{saveErr}</p>
        {/if}
        {#if !running && !$user}
          <p class="text-white/60 text-sm mt-2">Sign in to save scores.</p>
        {/if}
      </div>
    </div>
  </div>
  <GameAchievementsPanel gameId={GAME_ID} title="Game achievements" />
</Page>
