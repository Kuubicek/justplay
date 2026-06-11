<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import FullscreenBtn from '../components/FullscreenBtn.svelte';
  import GameAchievementsPanel from '../components/GameAchievementsPanel.svelte';
  import { addScore } from '../lib/api/scores';
  import { user, guest } from '../lib/stores';

  const GAME_ID = 'dodger';
  const BASE_SPAWN = 0.85;
  const MIN_SPAWN = 0.35;
  const BASE_SPEED = 0.32;
  const SPEED_GROWTH = 0.025;
  const PLAYER_Y = 0.84;

  let container;
  let boardEl;
  let canvas;
  let ctx;
  let width = 0;
  let height = 0;
  let playerRadius = 12;
  let playerX = 0.5;
  let obstacles = [];
  let running = false;
  let gameOver = false;
  let score = 0;
  let best = 0;
  let spawnTimer = 0;
  let startedAt = 0;
  let lastTime = 0;
  let raf = 0;
  let saving = false;
  let saved = false;
  let saveStatus = '';
  let saveErr = '';

  const bestKey = 'jp_dodger_best';
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function resizeCanvas() {
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    playerRadius = Math.max(10, Math.min(width, height) * 0.035);
  }

  function clampPlayerX(next) {
    if (!width) return 0.5;
    const min = playerRadius / width;
    return clamp(next, min, 1 - min);
  }

  function resetGame() {
    running = false;
    gameOver = false;
    obstacles = [];
    score = 0;
    spawnTimer = 0;
    startedAt = 0;
    lastTime = 0;
    saved = false;
    saving = false;
    saveStatus = '';
    saveErr = '';
  }

  function startGame() {
    resetGame();
    if (canvas) canvas.focus();
    running = true;
    startedAt = nowMs();
    lastTime = startedAt;
  }

  function stopGame() {
    running = false;
    gameOver = true;
    if (score > best) {
      best = score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(bestKey, String(best));
      }
    }
    saveScore();
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
        meta: { mode: 'survival' }
      });
      saveStatus = 'Score saved.';
      saved = true;
    } catch (e) {
      saveErr = e?.message || 'Failed to save score.';
    } finally {
      saving = false;
    }
  }

  function spawnObstacle(elapsed) {
    const size = Math.min(width, height) * (0.02 + Math.random() * 0.03);
    const x = (0.08 + Math.random() * 0.84) * width;
    obstacles = [
      ...obstacles,
      {
        x,
        y: -size,
        r: size,
        speed: height * (BASE_SPEED + elapsed * SPEED_GROWTH)
      }
    ];
  }

  function update(dt, now) {
    const elapsed = (now - startedAt) / 1000;
    score = Math.max(0, Math.floor(elapsed * 10));

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle(elapsed);
      spawnTimer = Math.max(MIN_SPAWN, BASE_SPAWN - elapsed * 0.01);
    }

    const px = clampPlayerX(playerX) * width;
    const py = PLAYER_Y * height;
    obstacles = obstacles
      .map((o) => ({ ...o, y: o.y + o.speed * dt }))
      .filter((o) => o.y - o.r < height + 40);

    for (const o of obstacles) {
      const dx = o.x - px;
      const dy = o.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist <= o.r + playerRadius * 0.9) {
        stopGame();
        break;
      }
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0b1320');
    gradient.addColorStop(1, '#05090f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(77, 163, 255, 0.2)';
    for (let i = 0; i < 12; i += 1) {
      const x = (i * 83 + 17) % width;
      const y = (i * 131 + 29) % height;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = '#f59e0b';
    for (const o of obstacles) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const px = clampPlayerX(playerX) * width;
    const py = PLAYER_Y * height;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, playerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function tick(now) {
    const t = now || nowMs();
    const dt = lastTime ? Math.min(0.05, (t - lastTime) / 1000) : 0;
    lastTime = t;
    if (running) update(dt, t);
    draw();
    raf = requestAnimationFrame(tick);
  }

  function handlePointer(event) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const ratio = (clientX - rect.left) / rect.width;
    playerX = clampPlayerX(ratio);
  }

  function handleKeydown(event) {
    const leftKeys = ['ArrowLeft', 'a', 'A'];
    const rightKeys = ['ArrowRight', 'd', 'D'];
    if (![...leftKeys, ...rightKeys].includes(event.key)) return;
    event.preventDefault();
    const delta = leftKeys.includes(event.key) ? -0.06 : 0.06;
    playerX = clampPlayerX(playerX + delta);
  }

  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = Number(localStorage.getItem(bestKey));
      best = Number.isFinite(stored) ? stored : 0;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    raf = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    window.removeEventListener('resize', resizeCanvas);
    if (raf) cancelAnimationFrame(raf);
  });
</script>

<Page title="Astro Dodger" subtitle="Singleplayer survival: dodge the debris.">
  <div class="game-play-layout">
    <div class="game-play-stage">
      <div class="card relative overflow-hidden" bind:this={boardEl}>
        <div class="w-full" style="height: min(calc(100vh - 200px), calc(100vw * 0.6)); min-height: 300px;" bind:this={container}>
          <canvas
            bind:this={canvas}
            class="w-full h-full block"
            tabindex="0"
            role="application"
            aria-label="Astro Dodger field"
            on:mousemove={handlePointer}
            on:click={handlePointer}
            on:touchmove|preventDefault={handlePointer}
            on:keydown={handleKeydown}
          ></canvas>
        </div>
        {#if !running}
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="px-4 py-3 rounded-xl bg-black/70 border border-slate-700 text-white/80 text-sm">
              {gameOver ? 'Game over' : 'Click or press Start to play'}
            </div>
          </div>
        {/if}
        <FullscreenBtn target={boardEl} />
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
          <span class="text-white/70 text-sm">Move: mouse/touch, or arrows/A/D.</span>
        </div>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-2">Score</h3>
        <p class="text-3xl font-semibold">{score}</p>
        <p class="text-white/60 text-sm">Best: {best}</p>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-2">Status</h3>
        <p class="text-white/70 text-sm">
          {running ? 'Dodging...' : gameOver ? 'Game over' : 'Ready'}
        </p>
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
