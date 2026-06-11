<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import FullscreenBtn from '../components/FullscreenBtn.svelte';
  import GameAchievementsPanel from '../components/GameAchievementsPanel.svelte';
  import { addScore } from '../lib/api/scores';
  import { user, guest } from '../lib/stores';

  const GAME_ID = 'td-lite';
  const grid = { cols: 12, rows: 8, cell: 48 };
  const canvasWidth = grid.cols * grid.cell;
  const canvasHeight = grid.rows * grid.cell;
  const towerCost = 50;
  const baseLives = 15;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  const pathNodes = [
    { x: 0, y: 3 },
    { x: 3, y: 3 },
    { x: 3, y: 1 },
    { x: 8, y: 1 },
    { x: 8, y: 5 },
    { x: 11, y: 5 }
  ];

  const cellCenter = (gx, gy) => ({
    x: (gx + 0.5) * grid.cell,
    y: (gy + 0.5) * grid.cell
  });

  const pathCells = (() => {
    const cells = new Set();
    const add = (gx, gy) => cells.add(`${gx},${gy}`);
    for (let i = 0; i < pathNodes.length - 1; i += 1) {
      const a = pathNodes[i];
      const b = pathNodes[i + 1];
      if (a.x === b.x) {
        const step = a.y < b.y ? 1 : -1;
        for (let y = a.y; y !== b.y + step; y += step) add(a.x, y);
      } else if (a.y === b.y) {
        const step = a.x < b.x ? 1 : -1;
        for (let x = a.x; x !== b.x + step; x += step) add(x, a.y);
      }
    }
    return cells;
  })();

  const pathPoints = pathNodes.map((n) => cellCenter(n.x, n.y));
  const segments = pathPoints.slice(0, -1).map((p, i) => {
    const next = pathPoints[i + 1];
    const dx = next.x - p.x;
    const dy = next.y - p.y;
    const len = Math.hypot(dx, dy);
    return { ax: p.x, ay: p.y, len, ux: dx / len, uy: dy / len };
  });

  let canvas;
  let boardEl;
  let ctx;
  let towers = [];
  let enemies = [];
  let shots = [];
  let money = 120;
  let lives = baseLives;
  let wave = 0;
  let spawning = false;
  let spawnTimer = 0;
  let spawned = 0;
  let toSpawn = 0;
  let lastTime = 0;
  let rafId = null;
  let gameOver = false;
  let startedAt = 0;
  let saving = false;
  let saved = false;
  let saveStatus = '';
  let saveErr = '';

  const resetGame = () => {
    towers = [];
    enemies = [];
    shots = [];
    money = 120;
    lives = baseLives;
    wave = 0;
    spawning = false;
    spawnTimer = 0;
    spawned = 0;
    toSpawn = 0;
    gameOver = false;
    startedAt = 0;
    saved = false;
    saving = false;
    saveStatus = '';
    saveErr = '';
  };

  const startWave = () => {
    if (spawning || gameOver) return;
    if (!startedAt) startedAt = nowMs();
    wave += 1;
    spawning = true;
    spawned = 0;
    toSpawn = 6 + wave * 2;
    spawnTimer = 0;
  };

  const computeScore = () =>
    Math.max(0, wave * 100 + Math.max(0, lives) * 25 + towers.length * 8 + Math.floor(money / 2));

  const saveScore = async (outcome = 'loss') => {
    if (saved || saving) return;
    const score = computeScore();
    if (score <= 0) {
      saved = true;
      return;
    }
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
        duration_seconds: startedAt ? Math.round((nowMs() - startedAt) / 1000) : null,
        meta: { wave, lives, money, towers: towers.length, outcome }
      });
      saveStatus = 'Score saved.';
      saved = true;
    } catch (e) {
      saveErr = e?.message || 'Failed to save score.';
    } finally {
      saving = false;
    }
  };

  const spawnEnemy = () => {
    const baseHp = 30 + wave * 6;
    enemies.push({
      segIndex: 0,
      offset: 0,
      speed: 40 + wave * 3,
      hp: baseHp,
      maxHp: baseHp,
      dead: false
    });
  };

  const updateEnemies = (dt) => {
    enemies = enemies.filter((enemy) => {
      if (enemy.dead || enemy.hp <= 0) return false;
      let remaining = enemy.offset + enemy.speed * dt;
      let segIndex = enemy.segIndex;
      while (segIndex < segments.length && remaining >= segments[segIndex].len) {
        remaining -= segments[segIndex].len;
        segIndex += 1;
      }
      if (segIndex >= segments.length) {
        lives -= 1;
        return false;
      }
      enemy.segIndex = segIndex;
      enemy.offset = remaining;
      return true;
    });
  };

  const updateTowers = (dt) => {
    for (const tower of towers) {
      tower.cooldown = Math.max(0, tower.cooldown - dt);
      if (tower.cooldown > 0) continue;
      let target = null;
      let closest = Infinity;
      for (const enemy of enemies) {
        if (enemy.dead || enemy.hp <= 0) continue;
        const pos = enemyPosition(enemy);
        const dx = pos.x - tower.x;
        const dy = pos.y - tower.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= tower.range && dist < closest) {
          closest = dist;
          target = { enemy, pos };
        }
      }
      if (target) {
        target.enemy.hp -= tower.damage;
        tower.cooldown = 1 / tower.rate;
        shots.push({
          x1: tower.x,
          y1: tower.y,
          x2: target.pos.x,
          y2: target.pos.y,
          ttl: 0.12
        });
        if (target.enemy.hp <= 0 && !target.enemy.dead) {
          target.enemy.dead = true;
          money += 12;
        }
      }
    }
  };

  const updateSpawning = (dt) => {
    if (!spawning) return;
    spawnTimer -= dt;
    if (spawned < toSpawn && spawnTimer <= 0) {
      spawnEnemy();
      spawned += 1;
      spawnTimer = 0.8;
    }
    if (spawned >= toSpawn && enemies.length === 0) {
      spawning = false;
      money += 20;
    }
  };

  const updateShots = (dt) => {
    shots = shots.filter((shot) => {
      shot.ttl -= dt;
      return shot.ttl > 0;
    });
  };

  const enemyPosition = (enemy) => {
    const seg = segments[enemy.segIndex];
    return {
      x: seg.ax + seg.ux * enemy.offset,
      y: seg.ay + seg.uy * enemy.offset
    };
  };

  const update = (time) => {
    if (!lastTime) lastTime = time;
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    if (!gameOver) {
      updateSpawning(dt);
      updateEnemies(dt);
      updateTowers(dt);
      updateShots(dt);
      if (lives <= 0 && !gameOver) {
        gameOver = true;
        saveScore('loss');
      }
    }
    draw();
    rafId = requestAnimationFrame(update);
  };

  const drawGrid = () => {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= grid.cols; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * grid.cell, 0);
      ctx.lineTo(x * grid.cell, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= grid.rows; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * grid.cell);
      ctx.lineTo(canvasWidth, y * grid.cell);
      ctx.stroke();
    }
  };

  const drawPath = () => {
    ctx.fillStyle = 'rgba(77, 163, 255, 0.16)';
    pathCells.forEach((cell) => {
      const [gx, gy] = cell.split(',').map(Number);
      ctx.fillRect(gx * grid.cell, gy * grid.cell, grid.cell, grid.cell);
    });
    ctx.strokeStyle = 'rgba(77, 163, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    pathPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  };

  const drawTowers = () => {
    ctx.fillStyle = 'rgba(71, 230, 199, 0.9)';
    towers.forEach((tower) => {
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawEnemies = () => {
    enemies.forEach((enemy) => {
      const pos = enemyPosition(enemy);
      ctx.fillStyle = 'rgba(255, 120, 120, 0.9)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fill();

      const hpWidth = 24;
      const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(pos.x - hpWidth / 2, pos.y - 18, hpWidth, 4);
      ctx.fillStyle = 'rgba(71, 230, 199, 0.9)';
      ctx.fillRect(pos.x - hpWidth / 2, pos.y - 18, hpWidth * hpRatio, 4);
    });
  };

  const drawShots = () => {
    shots.forEach((shot) => {
      ctx.strokeStyle = `rgba(77, 163, 255, ${Math.min(1, shot.ttl * 10)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shot.x1, shot.y1);
      ctx.lineTo(shot.x2, shot.y2);
      ctx.stroke();
    });
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = 'rgba(5, 10, 18, 0.9)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    drawPath();
    drawGrid();
    drawTowers();
    drawEnemies();
    drawShots();
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#e9f0ff';
      ctx.font = '28px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvasWidth / 2, canvasHeight / 2);
    }
  };

  const handleCanvasClick = (event) => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const gx = Math.floor(x / grid.cell);
    const gy = Math.floor(y / grid.cell);
    if (gx < 0 || gy < 0 || gx >= grid.cols || gy >= grid.rows) return;
    if (pathCells.has(`${gx},${gy}`)) return;
    if (towers.some((t) => t.gx === gx && t.gy === gy)) return;
    if (money < towerCost) return;
    money -= towerCost;
    const center = cellCenter(gx, gy);
    towers = [
      ...towers,
      {
        gx,
        gy,
        x: center.x,
        y: center.y,
        range: grid.cell * 2.4,
        rate: 1.4,
        damage: 12,
        cooldown: 0
      }
    ];
  };

  onMount(() => {
    ctx = canvas.getContext('2d');
    lastTime = 0;
    rafId = requestAnimationFrame(update);
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });
</script>

<Page title="Tower Defense Lite" subtitle="Place towers, stop waves, and keep the core safe.">
  <div class="td-wrap game-play-layout">
    <div class="td-board" bind:this={boardEl}>
      <canvas
        bind:this={canvas}
        width={canvasWidth}
        height={canvasHeight}
        class="td-canvas"
        on:click={handleCanvasClick}
        aria-label="Tower defense board"
      ></canvas>
      <FullscreenBtn target={boardEl} />
    </div>

    <div class="td-panel">
      <div class="td-stats">
        <div class="td-stat">
          <span>Money</span>
          <strong>{money}</strong>
        </div>
        <div class="td-stat">
          <span>Lives</span>
          <strong>{lives}</strong>
        </div>
        <div class="td-stat">
          <span>Wave</span>
          <strong>{wave}</strong>
        </div>
      </div>
      <div class="td-controls">
        <button class="btn btn-accent" on:click={startWave} disabled={spawning || gameOver}>
          {spawning ? 'Wave in progress...' : 'Start wave'}
        </button>
        <button class="btn btn-ghost" on:click={resetGame} type="button">Reset</button>
        <div class="td-hint">
          Click a free tile to place a tower ({towerCost}).
        </div>
      </div>
    </div>

    <div class="td-panel td-panel--info">
      <h3 class="td-title">Controls</h3>
      <ul>
        <li>Click on empty tiles to place towers.</li>
        <li>Start waves to spawn enemies.</li>
        <li>Keep at least 1 life to continue.</li>
      </ul>
      {#if saveStatus}
        <p class="text-emerald-300 text-sm">{saveStatus}</p>
      {/if}
      {#if saveErr}
        <p class="text-rose-400 text-sm">{saveErr}</p>
      {/if}
      {#if gameOver && !$user}
        <p class="text-white/60 text-sm">Sign in to save scores.</p>
      {/if}
    </div>
  </div>
  <GameAchievementsPanel gameId="td-lite" title="Game achievements" />
</Page>
