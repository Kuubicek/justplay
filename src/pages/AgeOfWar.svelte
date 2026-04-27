<script>
  import { onMount, onDestroy } from 'svelte';
  import Page from '../components/Page.svelte';
  import GameAchievementsPanel from '../components/GameAchievementsPanel.svelte';
  import { addScore } from '../lib/api/scores';
  import { user, guest } from '../lib/stores';

  const GAME_ID = 'age-of-war-lite';
  const BASE_HP = 520;
  const BASE_OFFSET = 70;
  const UNIT_SIZE = 18;

  const AGE_LEVELS = [
    { id: 1, label: 'Age I', upgradeCost: 160, goldRate: 6 },
    { id: 2, label: 'Age II', upgradeCost: 260, goldRate: 8 },
    { id: 3, label: 'Age III', upgradeCost: null, goldRate: 10 }
  ];

  const UNIT_TYPES = {
    militia: {
      id: 'militia',
      label: 'Militia',
      age: 1,
      cost: 30,
      hp: 90,
      damage: 10,
      range: 24,
      speed: 42,
      rate: 1.1,
      color: '#38bdf8'
    },
    spearman: {
      id: 'spearman',
      label: 'Spearman',
      age: 1,
      cost: 42,
      hp: 120,
      damage: 12,
      range: 32,
      speed: 36,
      rate: 1.0,
      color: '#60a5fa'
    },
    slinger: {
      id: 'slinger',
      label: 'Slinger',
      age: 1,
      cost: 36,
      hp: 70,
      damage: 9,
      range: 120,
      speed: 40,
      rate: 1.15,
      color: '#fbbf24'
    },
    archer: {
      id: 'archer',
      label: 'Archer',
      age: 2,
      cost: 48,
      hp: 70,
      damage: 12,
      range: 96,
      speed: 38,
      rate: 0.9,
      color: '#f59e0b'
    },
    guardian: {
      id: 'guardian',
      label: 'Guardian',
      age: 2,
      cost: 78,
      hp: 200,
      damage: 14,
      range: 22,
      speed: 28,
      rate: 0.8,
      color: '#94a3b8'
    },
    raider: {
      id: 'raider',
      label: 'Raider',
      age: 2,
      cost: 62,
      hp: 105,
      damage: 16,
      range: 26,
      speed: 58,
      rate: 0.85,
      color: '#fb7185'
    },
    knight: {
      id: 'knight',
      label: 'Knight',
      age: 3,
      cost: 72,
      hp: 150,
      damage: 18,
      range: 26,
      speed: 46,
      rate: 0.8,
      color: '#4ade80'
    },
    mage: {
      id: 'mage',
      label: 'Mage',
      age: 3,
      cost: 90,
      hp: 80,
      damage: 26,
      range: 140,
      speed: 34,
      rate: 0.75,
      color: '#c084fc'
    },
    siege: {
      id: 'siege',
      label: 'Siege',
      age: 3,
      cost: 120,
      hp: 220,
      damage: 32,
      range: 70,
      speed: 26,
      rate: 0.65,
      color: '#f97316'
    }
  };

  let container;
  let canvas;
  let ctx;
  let width = 0;
  let height = 0;
  let units = [];
  let gold = 80;
  let age = 1;
  let enemyAge = 1;
  let playerBase = { hp: BASE_HP, max: BASE_HP };
  let enemyBase = { hp: BASE_HP, max: BASE_HP };
  let elapsed = 0;
  let kills = 0;
  let running = false;
  let gameOver = false;
  let victory = false;
  let enemyTimer = 2.5;
  let lastTime = 0;
  let raf = 0;
  let saving = false;
  let saved = false;
  let saveStatus = '';
  let saveErr = '';

  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const playerBaseX = () => BASE_OFFSET;
  const enemyBaseX = () => width - BASE_OFFSET;
  const laneY = () => height * 0.55;

  const availableUnits = () =>
    Object.values(UNIT_TYPES)
      .filter((u) => u.age <= age)
      .sort((a, b) => (a.age - b.age) || (a.cost - b.cost));

  const enemyUnits = () =>
    Object.values(UNIT_TYPES)
      .filter((u) => u.age <= enemyAge)
      .sort((a, b) => (a.age - b.age) || (a.cost - b.cost));

  const goldRate = () => AGE_LEVELS.find((a) => a.id === age)?.goldRate ?? 6;
  const enemyGoldRate = () => AGE_LEVELS.find((a) => a.id === enemyAge)?.goldRate ?? 6;

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

  function resetGame() {
    units = [];
    gold = 80;
    age = 1;
    enemyAge = 1;
    playerBase = { hp: BASE_HP, max: BASE_HP };
    enemyBase = { hp: BASE_HP, max: BASE_HP };
    elapsed = 0;
    kills = 0;
    running = false;
    gameOver = false;
    victory = false;
    enemyTimer = 2.5;
    lastTime = 0;
    saved = false;
    saving = false;
    saveStatus = '';
    saveErr = '';
  }

  function startGame() {
    resetGame();
    running = true;
    lastTime = nowMs();
  }

  function endGame(win) {
    running = false;
    gameOver = true;
    victory = win;
    saveScore();
  }

  function spawnUnit(typeId, team = 'player') {
    const type = UNIT_TYPES[typeId];
    if (!type) return;
    if (team === 'player' && gold < type.cost) return;
    const direction = team === 'player' ? 1 : -1;
    const baseX = team === 'player' ? playerBaseX() : enemyBaseX();
    const x = baseX + direction * 28;
    const unit = {
      id: `${team}-${typeId}-${Math.random().toString(16).slice(2, 7)}`,
      team,
      typeId,
      x,
      hp: type.hp,
      maxHp: type.hp,
      cooldown: 0,
      direction
    };
    units = [...units, unit];
    if (team === 'player') gold -= type.cost;
  }

  function upgradeAge() {
    const level = AGE_LEVELS.find((a) => a.id === age);
    if (!level?.upgradeCost) return;
    if (gold < level.upgradeCost) return;
    gold -= level.upgradeCost;
    age = clamp(age + 1, 1, AGE_LEVELS.length);
  }

  function autoEnemyUpgrade() {
    if (elapsed > 45 && enemyAge < 2) enemyAge = 2;
    if (elapsed > 90 && enemyAge < 3) enemyAge = 3;
  }

  function chooseEnemyUnit() {
    const pool = enemyUnits();
    if (pool.length === 0) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx].id;
  }

  function enemySpawnInterval() {
    const pace = 3.2 - elapsed * 0.012 - enemyAge * 0.25;
    return clamp(pace, 1.1, 3.2);
  }

  function updateUnits(dt) {
    const enemiesFor = (team) => units.filter((u) => u.team !== team);
    units = units.filter((unit) => unit.hp > 0);

    for (const unit of units) {
      unit.cooldown = Math.max(0, unit.cooldown - dt);
      const type = UNIT_TYPES[unit.typeId];
      if (!type) continue;

      const enemies = enemiesFor(unit.team);
      const direction = unit.direction;
      const target = enemies
        .filter((e) => (direction > 0 ? e.x > unit.x : e.x < unit.x))
        .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0];

      let targetDist = null;
      let attackingBase = false;

      if (target) {
        targetDist = Math.abs(target.x - unit.x);
      } else {
        const baseX = direction > 0 ? enemyBaseX() : playerBaseX();
        targetDist = Math.abs(baseX - unit.x) - UNIT_SIZE;
        attackingBase = true;
      }

      if (targetDist != null && targetDist <= type.range) {
        if (unit.cooldown <= 0) {
          if (attackingBase) {
            if (direction > 0) enemyBase.hp = Math.max(0, enemyBase.hp - type.damage);
            else playerBase.hp = Math.max(0, playerBase.hp - type.damage);
          } else if (target) {
            target.hp -= type.damage;
            if (target.hp <= 0 && target.team === 'enemy') kills += 1;
          }
          unit.cooldown = 1 / type.rate;
        }
      } else {
        const nextX = unit.x + direction * type.speed * dt;
        unit.x = clamp(nextX, playerBaseX() + 12, enemyBaseX() - 12);
      }
    }
  }

  function update(dt) {
    if (!running) return;
    elapsed += dt;
    gold = Math.min(999, gold + goldRate() * dt);

    autoEnemyUpgrade();
    enemyTimer -= dt;
    if (enemyTimer <= 0) {
      const enemyUnitId = chooseEnemyUnit();
      if (enemyUnitId) spawnUnit(enemyUnitId, 'enemy');
      enemyTimer = enemySpawnInterval();
    }

    updateUnits(dt);

    if (playerBase.hp <= 0) endGame(false);
    if (enemyBase.hp <= 0) endGame(true);
  }

  function drawBase(x, hp, maxHp, color) {
    const w = 42;
    const h = 90;
    const y = laneY() - h + 12;
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x - w / 2, y - 10, w, 6);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x - w / 2, y - 10, w * (hp / maxHp), 6);
  }

  function drawUnits() {
    for (const unit of units) {
      const type = UNIT_TYPES[unit.typeId];
      if (!type) continue;
      ctx.fillStyle = unit.team === 'player' ? type.color : 'rgba(248, 113, 113, 0.95)';
      ctx.beginPath();
      ctx.arc(unit.x, laneY(), UNIT_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(unit.x - 14, laneY() - 24, 28, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(unit.x - 14, laneY() - 24, 28 * (unit.hp / unit.maxHp), 4);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a1320');
    gradient.addColorStop(1, '#05090f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(77, 163, 255, 0.08)';
    ctx.fillRect(0, laneY() - 24, width, 48);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, laneY());
    ctx.lineTo(width, laneY());
    ctx.stroke();
    ctx.setLineDash([]);

    drawBase(playerBaseX(), playerBase.hp, playerBase.max, '#1e3a8a');
    drawBase(enemyBaseX(), enemyBase.hp, enemyBase.max, '#7f1d1d');
    drawUnits();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Player Base', playerBaseX(), laneY() + 54);
    ctx.fillText('Enemy Base', enemyBaseX(), laneY() + 54);
  }

  function tick(now) {
    const t = now || nowMs();
    const dt = lastTime ? Math.min(0.05, (t - lastTime) / 1000) : 0;
    lastTime = t;
    update(dt);
    draw();
    raf = requestAnimationFrame(tick);
  }

  async function saveScore() {
    if (saved || saving) return;
    if (!$user && !$guest) {
      saveStatus = 'Sign in to save scores.';
      saved = true;
      return;
    }
    saving = true;
    saveErr = '';
    try {
      const score = Math.max(0, Math.floor(elapsed * 6 + kills * 18 + (victory ? 180 : 0)));
      if (score <= 0) {
        saveStatus = 'No score to save.';
        saved = true;
        return;
      }
      await addScore({
        game_id: GAME_ID,
        score,
        duration_seconds: Math.round(elapsed),
        meta: { outcome: victory ? 'win' : 'loss', kills, age }
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
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    raf = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    window.removeEventListener('resize', resizeCanvas);
    if (raf) cancelAnimationFrame(raf);
  });
</script>

<Page title="Age of War Lite" subtitle="Singleplayer lane battle: spawn units, upgrade ages, destroy the enemy base.">
  <div class="game-play-layout">
    <div class="game-play-stage">
      <div class="aow-board" bind:this={container}>
        <canvas bind:this={canvas} class="aow-canvas" aria-label="Age of War battlefield"></canvas>
        {#if !running}
          <div class="aow-overlay">
            <div class="aow-overlay__card">
              {gameOver ? (victory ? 'Victory!' : 'Defeat') : 'Press Start to begin'}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <div class="space-y-3">
        <div class="card">
          <div class="flex flex-wrap items-center gap-3">
            <button class="btn btn-accent" on:click={startGame}>
              {running ? 'Restart' : gameOver ? 'Play again' : 'Start'}
            </button>
            <button class="btn btn-ghost" on:click={resetGame} disabled={running}>
              Reset
            </button>
            <div class="text-white/70 text-sm">Goal: reduce the enemy base to 0 HP.</div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold mb-3">Unit controls</h3>
          <div class="aow-unit-grid">
            {#each availableUnits() as unit}
              <button
                class="aow-unit"
                on:click={() => spawnUnit(unit.id)}
                disabled={!running || gold < unit.cost}
                type="button"
              >
                <span class="aow-unit__title">{unit.label}</span>
                <span class="aow-unit__meta">Cost {unit.cost}</span>
              </button>
            {/each}
            <button
              class="aow-upgrade"
              on:click={upgradeAge}
              disabled={!running || !AGE_LEVELS.find((a) => a.id === age)?.upgradeCost || gold < (AGE_LEVELS.find((a) => a.id === age)?.upgradeCost ?? 0)}
              type="button"
            >
              <span class="aow-unit__title">Upgrade Age</span>
              <span class="aow-unit__meta">
                {AGE_LEVELS.find((a) => a.id === age)?.upgradeCost
                  ? `Cost ${AGE_LEVELS.find((a) => a.id === age)?.upgradeCost}`
                  : 'Max age'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="card">
          <h3 class="font-semibold mb-3">Match stats</h3>
          <div class="stat-grid">
            <div class="stat-card">
              <span>Gold</span>
              <strong>{Math.floor(gold)}</strong>
            </div>
            <div class="stat-card">
              <span>Age</span>
              <strong>{AGE_LEVELS.find((a) => a.id === age)?.label}</strong>
            </div>
            <div class="stat-card">
              <span>Kills</span>
              <strong>{kills}</strong>
            </div>
            <div class="stat-card">
              <span>Enemy age</span>
              <strong>{AGE_LEVELS.find((a) => a.id === enemyAge)?.label}</strong>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold mb-2">Base status</h3>
          <p class="text-white/70 text-sm">Player base: {playerBase.hp}/{playerBase.max}</p>
          <p class="text-white/70 text-sm">Enemy base: {enemyBase.hp}/{enemyBase.max}</p>
          <p class="text-white/60 text-sm mt-2">Gold income: {goldRate()}/s (enemy {enemyGoldRate()}/s).</p>
        </div>

        <div class="card">
          <h3 class="font-semibold mb-2">Status</h3>
          <p class="text-white/70 text-sm">
            {running ? 'Battle in progress...' : gameOver ? victory ? 'Victory achieved' : 'Defeat' : 'Ready'}
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
  </div>
  <GameAchievementsPanel gameId={GAME_ID} title="Game achievements" />
</Page>
