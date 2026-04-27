<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import GameAchievementsPanel from '../components/GameAchievementsPanel.svelte';
  import { addScore } from '../lib/api/scores';
  import { user, guest } from '../lib/stores';

  const GAME_ID = 'orb-collector';
  const GRID_COLS = 12;
  const GRID_ROWS = 8;
  const ROUND_TIME = 45;
  const bestKey = 'jp_orb_collector_best';

  let container;
  let canvas;
  let ctx;
  let width = 0;
  let height = 0;
  let player = { x: 5, y: 4 };
  let orb = { x: 2, y: 2 };
  let score = 0;
  let best = 0;
  let timeLeft = ROUND_TIME;
  let running = false;
  let gameOver = false;
  let timer = 0;
  let raf = 0;
  let startedAt = 0;
  let saving = false;
  let saved = false;
  let saveStatus = '';
  let saveErr = '';

  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

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
  }

  function spawnOrb() {
    let next;
    do {
      next = {
        x: Math.floor(Math.random() * GRID_COLS),
        y: Math.floor(Math.random() * GRID_ROWS)
      };
    } while (next.x === player.x && next.y === player.y);
    orb = next;
  }

  function resetGame() {
    running = false;
    gameOver = false;
    score = 0;
    timeLeft = ROUND_TIME;
    player = { x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) };
    spawnOrb();
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

  function movePlayer(dx, dy) {
    if (!running) return;
    const next = {
      x: Math.max(0, Math.min(GRID_COLS - 1, player.x + dx)),
      y: Math.max(0, Math.min(GRID_ROWS - 1, player.y + dy))
    };
    if (next.x === player.x && next.y === player.y) return;
    player = next;
    if (player.x === orb.x && player.y === orb.y) {
      score += 1;
      spawnOrb();
    }
  }

  function handleKeydown(event) {
    const key = event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(key)) {
      event.preventDefault();
    }
    if (key === 'ArrowUp' || key === 'w' || key === 'W') movePlayer(0, -1);
    if (key === 'ArrowDown' || key === 's' || key === 'S') movePlayer(0, 1);
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') movePlayer(-1, 0);
    if (key === 'ArrowRight' || key === 'd' || key === 'D') movePlayer(1, 0);
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
        meta: { grid: `${GRID_COLS}x${GRID_ROWS}` }
      });
      saveStatus = 'Score saved.';
      saved = true;
    } catch (e) {
      saveErr = e?.message || 'Failed to save score.';
    } finally {
      saving = false;
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#071726');
    gradient.addColorStop(1, '#05090f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const cellW = width / GRID_COLS;
    const cellH = height / GRID_ROWS;

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 1; x < GRID_COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * cellW, 0);
      ctx.lineTo(x * cellW, height);
      ctx.stroke();
    }
    for (let y = 1; y < GRID_ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellH);
      ctx.lineTo(width, y * cellH);
      ctx.stroke();
    }

    const orbX = (orb.x + 0.5) * cellW;
    const orbY = (orb.y + 0.5) * cellH;
    const orbR = Math.min(cellW, cellH) * 0.28;
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const px = player.x * cellW + cellW * 0.1;
    const py = player.y * cellH + cellH * 0.1;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px, py, cellW * 0.8, cellH * 0.8);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, cellW * 0.8, cellH * 0.8);
  }

  function tick() {
    draw();
    raf = requestAnimationFrame(tick);
  }

  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = Number(localStorage.getItem(bestKey));
      best = Number.isFinite(stored) ? stored : 0;
    }
    resizeCanvas();
    spawnOrb();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeydown);
    raf = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('keydown', handleKeydown);
    clearInterval(timer);
    if (raf) cancelAnimationFrame(raf);
  });
</script>

<Page title="Orb Collector" subtitle="Singleplayer grid chase: collect orbs before time runs out.">
  <div class="game-play-layout">
    <div class="game-play-stage">
      <div class="orb-field" bind:this={container}>
        <div class="w-full aspect-[16/18]">
          <canvas
            bind:this={canvas}
            class="orb-canvas w-full h-full block"
            tabindex="0"
            aria-label="Orb Collector grid"
          ></canvas>
        </div>
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
        <div class="flex flex-wrap items-center gap-3 mb-3">
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
          <span class="text-white/70 text-sm">Move with arrow keys or WASD.</span>
        </div>

        <div class="grid grid-cols-3 gap-2 max-w-xs">
          <span></span>
          <button class="btn btn-ghost w-full" on:click={() => movePlayer(0, -1)}>
            Up
          </button>
          <span></span>
          <button class="btn btn-ghost w-full" on:click={() => movePlayer(-1, 0)}>
            Left
          </button>
          <button class="btn btn-ghost w-full" on:click={() => movePlayer(0, 1)}>
            Down
          </button>
          <button class="btn btn-ghost w-full" on:click={() => movePlayer(1, 0)}>
            Right
          </button>
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
        <p class="text-white/60 text-sm">Grid: {GRID_COLS}x{GRID_ROWS}</p>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-2">Status</h3>
        <p class="text-white/70 text-sm">{running ? 'Collecting...' : gameOver ? 'Finished' : 'Ready'}</p>
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
