import { supabase } from '../supabaseClient';
import { ensureAuthUser } from './auth';
import { achievementCatalog } from '../achievementCatalog';

const ACHIEVEMENTS_TABLE = 'achievements';
const USER_ACHIEVEMENTS_TABLE = 'user_achievements';
const SCORES_TABLE = 'scores';
const PROGRESS_CRITERIA_TYPES = new Set(['plays_total', 'unique_games', 'active_days']);

let catalogSynced = false;

const normalizeAchievement = (entry) => ({
  id: entry.id,
  title: entry.title,
  description: entry.description,
  game_id: entry.game_id ?? null,
  points: entry.points ?? 0,
  sort_order: entry.sort_order ?? 0,
  criteria: entry.criteria ?? {},
  is_active: entry.is_active ?? true
});

const catalogSort = (a, b) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.title || '').localeCompare(b.title || '');

const safeIso = (value) => {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
};

const chooseEarlierIso = (a, b) => {
  if (!a) return b || null;
  if (!b) return a || null;
  return Date.parse(a) <= Date.parse(b) ? a : b;
};

function achievementMatchesRow(achievement, row) {
  if (!achievement || !row) return false;
  if (achievement.game_id && achievement.game_id !== row.game_id) return false;

  const criteria = achievement.criteria || {};
  const type = criteria.type;

  if (type === 'score') {
    const threshold = Number(criteria.threshold ?? 0);
    return Number(row.score) >= threshold;
  }

  if (type === 'win') {
    const outcome = row.meta?.outcome;
    const winner = row.meta?.winner;
    const seat = row.meta?.seat;
    if (outcome === 'win') return true;
    if (winner && seat && winner === seat) return true;
    return false;
  }

  if (type === 'meta') {
    const key = criteria.key;
    if (!key) return false;
    const value = row.meta?.[key];
    if (value == null) return false;
    if (criteria.threshold == null) return true;
    return Number(value) >= Number(criteria.threshold);
  }

  if (type === 'leaderboard_rank') {
    return false;
  }

  return false;
}

function deriveUnlockFromScores(achievement, scoreRows) {
  if (!Array.isArray(scoreRows) || scoreRows.length === 0) return null;
  for (const row of scoreRows) {
    if (!achievementMatchesRow(achievement, row)) continue;
    return {
      unlocked_at: safeIso(row.created_at),
      meta: {
        source: 'score',
        score_id: row.id,
        game_id: row.game_id,
        score: row.score,
        criteria: achievement.criteria || {}
      }
    };
  }
  return null;
}

function scopedRowsByGame(achievement, scoreRows) {
  if (!achievement?.game_id) return [...scoreRows];
  return scoreRows.filter((row) => row?.game_id === achievement.game_id);
}

function parseThreshold(criteria) {
  const threshold = Number(criteria?.threshold ?? 0);
  if (!Number.isFinite(threshold) || threshold <= 0) return null;
  return Math.floor(threshold);
}

function safeDayKey(value) {
  const iso = safeIso(value);
  if (!iso) return null;
  return iso.slice(0, 10);
}

function deriveUnlockFromProgress(achievement, scoreRows) {
  if (!Array.isArray(scoreRows) || scoreRows.length === 0) return null;
  const criteria = achievement.criteria || {};
  const type = criteria.type;
  if (!PROGRESS_CRITERIA_TYPES.has(type)) return null;

  if (type === 'plays_total') {
    const threshold = parseThreshold(criteria);
    if (!threshold) return null;
    const rows = scopedRowsByGame(achievement, scoreRows);
    if (rows.length < threshold) return null;
    const row = rows[threshold - 1] || rows[rows.length - 1];
    return {
      unlocked_at: safeIso(row?.created_at),
      meta: {
        source: 'progress',
        type,
        threshold,
        plays: rows.length,
        game_id: achievement.game_id || null
      }
    };
  }

  if (type === 'unique_games') {
    const threshold = parseThreshold(criteria);
    if (!threshold) return null;
    const seen = new Set();
    for (const row of scoreRows) {
      if (!row?.game_id) continue;
      seen.add(row.game_id);
      if (seen.size >= threshold) {
        return {
          unlocked_at: safeIso(row.created_at),
          meta: {
            source: 'progress',
            type,
            threshold,
            unique_games: seen.size,
            discovered_game_id: row.game_id
          }
        };
      }
    }
    return null;
  }

  if (type === 'active_days') {
    const threshold = parseThreshold(criteria);
    if (!threshold) return null;
    const seenDays = new Set();
    for (const row of scoreRows) {
      const day = safeDayKey(row?.created_at);
      if (!day) continue;
      seenDays.add(day);
      if (seenDays.size >= threshold) {
        return {
          unlocked_at: safeIso(row.created_at),
          meta: {
            source: 'progress',
            type,
            threshold,
            active_days: seenDays.size,
            day
          }
        };
      }
    }
    return null;
  }

  return null;
}

function chooseComputedUnlock(...candidates) {
  const available = candidates.filter((candidate) => candidate?.unlocked_at || candidate?.meta);
  if (available.length === 0) return null;
  if (available.length === 1) return available[0];
  return available.reduce((best, candidate) => {
    const bestAt = safeIso(best?.unlocked_at);
    const candidateAt = safeIso(candidate?.unlocked_at);
    if (!bestAt && !candidateAt) return best;
    if (!bestAt) return candidate;
    if (!candidateAt) return best;
    return Date.parse(candidateAt) < Date.parse(bestAt) ? candidate : best;
  });
}

async function readCatalog() {
  const local = achievementCatalog
    .map(normalizeAchievement)
    .filter((achievement) => achievement.is_active !== false)
    .sort(catalogSort);

  try {
    const { data, error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .select('id, title, description, game_id, points, sort_order, criteria, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error || !Array.isArray(data) || data.length === 0) return local;
    return data.map(normalizeAchievement).filter((achievement) => achievement.is_active !== false).sort(catalogSort);
  } catch {
    return local;
  }
}

export async function syncAchievementCatalog() {
  if (catalogSynced) return true;
  const payload = achievementCatalog.map(normalizeAchievement);
  try {
    const { error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .upsert(payload, { onConflict: 'id' });
    if (error) return false;
    catalogSynced = true;
    return true;
  } catch {
    return false;
  }
}

export async function unlockAchievement(achievementId, meta = {}) {
  const user = await ensureAuthUser();
  if (!user) throw new Error('Not authenticated');
  await syncAchievementCatalog();
  const { error } = await supabase
    .from(USER_ACHIEVEMENTS_TABLE)
    .insert({ user_id: user.id, achievement_id: achievementId, meta });
  if (error && error.code !== '23505') throw error;
}

export async function getAchievementsForUser(userId) {
  const catalog = await readCatalog();
  if (!userId) {
    return catalog.map((achievement) => ({
      ...achievement,
      unlocked: false,
      unlocked_at: null,
      meta: null
    }));
  }

  let explicitUnlockRows = [];
  try {
    const { data, error } = await supabase
      .from(USER_ACHIEVEMENTS_TABLE)
      .select('achievement_id, unlocked_at, meta')
      .eq('user_id', userId);
    if (!error) explicitUnlockRows = data || [];
  } catch {}

  let scoreRows = [];
  try {
    const { data, error } = await supabase
      .from(SCORES_TABLE)
      .select('id, game_id, score, created_at, meta')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (!error) scoreRows = data || [];
  } catch {}

  const explicitUnlockMap = new Map(
    explicitUnlockRows.map((row) => [
      row.achievement_id,
      { unlocked_at: safeIso(row.unlocked_at), meta: row.meta ?? null }
    ])
  );

  return catalog.map((achievement) => {
    const explicit = explicitUnlockMap.get(achievement.id) ?? null;
    const computed = chooseComputedUnlock(
      deriveUnlockFromScores(achievement, scoreRows),
      deriveUnlockFromProgress(achievement, scoreRows)
    );
    const unlocked = !!(explicit || computed);
    return {
      ...achievement,
      unlocked,
      unlocked_at: unlocked
        ? chooseEarlierIso(explicit?.unlocked_at ?? null, computed?.unlocked_at ?? null)
        : null,
      meta: explicit?.meta ?? computed?.meta ?? null
    };
  });
}

export async function evaluateScoreAchievements({ gameId, score, meta = {} }) {
  if (!Number.isFinite(score)) return;
  const probe = { game_id: gameId, score, meta };
  const unlocks = achievementCatalog
    .map(normalizeAchievement)
    .filter((achievement) => achievementMatchesRow(achievement, probe))
    .map((achievement) => achievement.id);
  if (unlocks.length === 0) return;
  await Promise.all(
    unlocks.map((id) =>
      unlockAchievement(id, { gameId, score, ...meta }).catch(() => null)
    )
  );
}

async function fetchUserScoreRows(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from(SCORES_TABLE)
    .select('id, game_id, score, created_at, meta')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function evaluateProgressAchievements({ userId }) {
  if (!userId) return;
  const candidates = achievementCatalog
    .map(normalizeAchievement)
    .filter((achievement) => PROGRESS_CRITERIA_TYPES.has(achievement.criteria?.type));
  if (candidates.length === 0) return;

  let scoreRows = [];
  try {
    scoreRows = await fetchUserScoreRows(userId);
  } catch {
    return;
  }
  if (scoreRows.length === 0) return;

  const unlocks = candidates
    .map((achievement) => ({
      achievement,
      computed: deriveUnlockFromProgress(achievement, scoreRows)
    }))
    .filter((item) => !!item.computed);

  if (unlocks.length === 0) return;

  await Promise.all(
    unlocks.map(({ achievement, computed }) =>
      unlockAchievement(achievement.id, {
        ...computed.meta,
        gameId: achievement.game_id || null
      }).catch(() => null)
    )
  );
}

function buildGameBestMap(rows) {
  const gameMap = new Map();
  for (const row of rows || []) {
    if (!row?.game_id || !row?.user_id) continue;
    if (!gameMap.has(row.game_id)) gameMap.set(row.game_id, new Map());
    const perUser = gameMap.get(row.game_id);
    const prev = perUser.get(row.user_id);
    const score = Number(row.score ?? 0);
    if (prev == null || score > prev) perUser.set(row.user_id, score);
  }
  return gameMap;
}

function computeLeaderboardRank(perUserBest, userId) {
  if (!perUserBest || !userId) return null;
  const userBest = perUserBest.get(userId);
  if (userBest == null) return null;
  const distinctScores = Array.from(new Set(Array.from(perUserBest.values()))).sort((a, b) => b - a);
  const rank = distinctScores.findIndex((score) => score === userBest) + 1;
  return rank > 0 ? rank : null;
}

async function fetchLeaderboardContext(userId, gameId) {
  if (!userId || !gameId) return null;
  const { data, error } = await supabase
    .from(SCORES_TABLE)
    .select('user_id, score, game_id')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(5000);
  if (error) throw error;
  const rows = data || [];
  const myScoreCount = rows.filter((row) => row.user_id === userId).length;
  const bestByGame = buildGameBestMap(rows);
  const perUserBest = bestByGame.get(gameId) || new Map();
  const rank = computeLeaderboardRank(perUserBest, userId);
  return { rank, myScoreCount };
}

export async function evaluateLeaderboardRankAchievements({ userId, gameId }) {
  if (!userId || !gameId) return;
  const candidates = achievementCatalog
    .map(normalizeAchievement)
    .filter((achievement) => {
      const criteriaType = achievement.criteria?.type;
      if (criteriaType !== 'leaderboard_rank') return false;
      if (achievement.game_id && achievement.game_id !== gameId) return false;
      return true;
    });
  if (candidates.length === 0) return;

  let context = null;
  try {
    context = await fetchLeaderboardContext(userId, gameId);
  } catch {
    return;
  }
  if (!context?.rank) return;

  const unlocks = candidates.filter((achievement) => {
    const threshold = Number(achievement.criteria?.threshold ?? 0);
    const minScores = Number(achievement.criteria?.min_scores ?? 1);
    if (!Number.isFinite(threshold) || threshold <= 0) return false;
    if ((context.myScoreCount ?? 0) < minScores) return false;
    return context.rank <= threshold;
  });
  if (unlocks.length === 0) return;

  await Promise.all(
    unlocks.map((achievement) =>
      unlockAchievement(achievement.id, {
        gameId,
        rank: context.rank,
        scoreCount: context.myScoreCount,
        criteria: achievement.criteria
      }).catch(() => null)
    )
  );
}

export function buildAchievementProgressByGame(achievements = []) {
  const progressMap = new Map();
  let totalPoints = 0;
  let unlockedPoints = 0;
  for (const achievement of achievements) {
    const key = achievement?.game_id || 'platform';
    if (!progressMap.has(key)) {
      progressMap.set(key, {
        gameId: achievement?.game_id || null,
        total: 0,
        unlocked: 0,
        pointsTotal: 0,
        pointsUnlocked: 0
      });
    }
    const entry = progressMap.get(key);
    const points = Number(achievement?.points ?? 0) || 0;
    const unlocked = !!achievement?.unlocked;
    entry.total += 1;
    entry.pointsTotal += points;
    totalPoints += points;
    if (unlocked) {
      entry.unlocked += 1;
      entry.pointsUnlocked += points;
      unlockedPoints += points;
    }
  }

  for (const entry of progressMap.values()) {
    entry.completion = entry.total ? Math.round((entry.unlocked / entry.total) * 100) : 0;
  }

  return {
    byGameId: Object.fromEntries(progressMap),
    totals: {
      totalAchievements: achievements.length,
      unlockedAchievements: achievements.filter((item) => item?.unlocked).length,
      totalPoints,
      unlockedPoints
    }
  };
}

export async function getAchievementProgressForUser(userId) {
  const achievements = await getAchievementsForUser(userId);
  return buildAchievementProgressByGame(achievements);
}
