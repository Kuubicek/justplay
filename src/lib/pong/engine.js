const LEFT_X = 0.06;
const RIGHT_X = 0.94;
const PADDLE_HEIGHT = 0.22;
const PADDLE_WIDTH = 0.02;
const BALL_RADIUS = 0.018;
const PADDLE_SPEED = 1.4; // normalized units per second
const BASE_BALL_SPEED = 0.75;
const BALL_ACCEL = 1.04;
const COOLDOWN_MS = 700;
const WIN_SCORE = 5;

export const geometry = {
  leftX: LEFT_X,
  rightX: RIGHT_X,
  paddleHeight: PADDLE_HEIGHT,
  paddleWidth: PADDLE_WIDTH,
  ballRadius: BALL_RADIUS
};

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function createInitialState(seed = Date.now()) {
  const dir = seed % 2 === 0 ? 1 : -1;
  return {
    matchId: seed,
    status: 'waiting', // waiting -> playing -> goal -> finished
    ball: {
      x: 0.5,
      y: 0.5,
      vx: BASE_BALL_SPEED * dir,
      vy: randomVy(seed),
      speed: BASE_BALL_SPEED
    },
    paddles: {
      left: { y: 0.5, targetY: 0.5 },
      right: { y: 0.5, targetY: 0.5 }
    },
    scores: { left: 0, right: 0 },
    lastTick: nowMs(),
    cooldownUntil: nowMs() + COOLDOWN_MS,
    winner: null,
    lastScorer: null,
    sequence: 0
  };
}

export function clampPaddle(y) {
  const half = PADDLE_HEIGHT / 2;
  return clamp(y, half, 1 - half);
}

export function applyInput(state, inputs = {}) {
  ['left', 'right'].forEach((side) => {
    const target = clampPaddle(inputs[side] ?? state.paddles[side].targetY);
    state.paddles[side].targetY = target;
  });
}

export function stepState(state, inputs = {}, now = nowMs(), activePlayers = 2) {
  const dt = Math.min(0.05, Math.max(0, (now - state.lastTick) / 1000));
  state.lastTick = now;
  applyInput(state, inputs);

  // Move paddles toward their targets
  ['left', 'right'].forEach((side) => {
    const paddle = state.paddles[side];
    paddle.y = moveTowards(paddle.y, paddle.targetY, PADDLE_SPEED * dt, clampPaddle);
  });

  if (state.winner) return state;
  const ready = activePlayers > 0;
  if (!ready) return state;

  if (state.cooldownUntil && now < state.cooldownUntil) {
    return state;
  }
  if (state.cooldownUntil && now >= state.cooldownUntil) {
    state.cooldownUntil = null;
    state.status = 'playing';
  }

  // Advance ball
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;

  // Wall collisions
  if (state.ball.y - BALL_RADIUS <= 0) {
    state.ball.y = BALL_RADIUS;
    state.ball.vy = Math.abs(state.ball.vy);
  } else if (state.ball.y + BALL_RADIUS >= 1) {
    state.ball.y = 1 - BALL_RADIUS;
    state.ball.vy = -Math.abs(state.ball.vy);
  }

  // Paddle collisions
  if (state.ball.vx < 0) {
    maybeBounce(state, 'left', LEFT_X);
  } else {
    maybeBounce(state, 'right', RIGHT_X);
  }

  // Check scores
  if (state.ball.x < -BALL_RADIUS * 2) {
    score(state, 'right');
  } else if (state.ball.x > 1 + BALL_RADIUS * 2) {
    score(state, 'left');
  }

  state.sequence += 1;
  return state;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function maybeBounce(state, side, wallX) {
  const paddle = state.paddles[side];
  const half = PADDLE_HEIGHT / 2;
  const reachesWall = side === 'left'
    ? state.ball.x - BALL_RADIUS <= wallX + PADDLE_WIDTH
    : state.ball.x + BALL_RADIUS >= wallX - PADDLE_WIDTH;

  if (!reachesWall) return;

  const withinY = Math.abs(state.ball.y - paddle.y) <= half + BALL_RADIUS;
  if (!withinY) return;

  const offset = clamp((state.ball.y - paddle.y) / (half + BALL_RADIUS), -1, 1);
  const speed = Math.max(BASE_BALL_SPEED, state.ball.speed * BALL_ACCEL);
  const horizontal = Math.cos(Math.PI / 4) * speed;
  const vertical = Math.sin(Math.PI / 4) * speed * offset;

  state.ball.speed = speed;
  state.ball.vx = side === 'left' ? Math.abs(horizontal) : -Math.abs(horizontal);
  state.ball.vy = vertical;
  state.ball.x = side === 'left'
    ? wallX + PADDLE_WIDTH + BALL_RADIUS
    : wallX - PADDLE_WIDTH - BALL_RADIUS;
}

function score(state, side) {
  state.scores[side] += 1;
  state.lastScorer = side;
  if (state.scores[side] >= WIN_SCORE) {
    state.winner = side;
    state.status = 'finished';
    return;
  }
  resetBall(state, side === 'left' ? 1 : -1);
}

function resetBall(state, dir = 1) {
  state.status = 'goal';
  state.ball.x = 0.5;
  state.ball.y = 0.5;
  state.ball.speed = BASE_BALL_SPEED;
  state.ball.vx = BASE_BALL_SPEED * dir;
  state.ball.vy = randomVy(state.lastTick);
  state.cooldownUntil = state.lastTick + COOLDOWN_MS;
}

function randomVy(seed) {
  const rng = Math.sin(seed) * 10000;
  const v = rng - Math.floor(rng);
  return (v * 0.5 - 0.25) * BASE_BALL_SPEED;
}

function moveTowards(current, target, maxDelta, clampFn = (v) => v) {
  const delta = target - current;
  const distance = Math.abs(delta);
  if (distance <= maxDelta) return clampFn(target);
  const step = maxDelta * Math.sign(delta);
  return clampFn(current + step);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export const constants = {
  WIN_SCORE,
  COOLDOWN_MS,
  BASE_BALL_SPEED,
  BALL_ACCEL
};
