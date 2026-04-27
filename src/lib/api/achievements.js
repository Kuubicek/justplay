import { supabase } from '../supabaseClient';
import { ensureAuthUser } from './auth';
import { achievementCatalog } from '../achievementCatalog';

const ACHIEVEMENTS_TABLE = 'achievements';
const USER_ACHIEVEMENTS_TABLE = 'user_achievements';

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

export async function syncAchievementCatalog() {
  if (catalogSynced) return;
  const payload = achievementCatalog.map(normalizeAchievement);
  const { error } = await supabase
    .from(ACHIEVEMENTS_TABLE)
    .upsert(payload, { onConflict: 'id' });
  if (!error) catalogSynced = true;
  else throw error;
}

export async function unlockAchievement(achievementId, meta = {}) {
  const user = await ensureAuthUser();
  if (!user) throw new Error('Not authenticated');
  await syncAchievementCatalog();
  const { error } = await supabase
    .from(USER_ACHIEVEMENTS_TABLE)
    .upsert(
      { user_id: user.id, achievement_id: achievementId, meta },
      { onConflict: 'user_id,achievement_id' }
    );
  if (error) throw error;
}

export async function getAchievementsForUser(userId) {
  try {
    await syncAchievementCatalog();
    const { data: achievements, error: achievementsErr } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .select('id, title, description, game_id, points, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (achievementsErr) throw achievementsErr;

    let unlocked = [];
    if (userId) {
      const { data: unlockedRows, error: unlockedErr } = await supabase
        .from(USER_ACHIEVEMENTS_TABLE)
        .select('achievement_id, unlocked_at, meta')
        .eq('user_id', userId);
      if (unlockedErr) throw unlockedErr;
      unlocked = unlockedRows || [];
    }

    const unlockedMap = new Map(
      unlocked.map((row) => [row.achievement_id, { unlocked_at: row.unlocked_at, meta: row.meta }])
    );

    return (achievements || []).map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlocked_at: unlockedMap.get(a.id)?.unlocked_at ?? null,
      meta: unlockedMap.get(a.id)?.meta ?? null
    }));
  } catch (e) {
    return achievementCatalog.map((a) => ({
      ...normalizeAchievement(a),
      unlocked: false,
      unlocked_at: null,
      meta: null
    }));
  }
}

export async function evaluateScoreAchievements({ gameId, score, meta = {} }) {
  if (!Number.isFinite(score)) return;
  const checks = achievementCatalog.filter((a) => {
    if (a.game_id && a.game_id !== gameId) return false;
    return true;
  });
  const unlocks = [];

  for (const achievement of checks) {
    const criteria = achievement.criteria || {};
    if (criteria.type === 'score' && score >= (criteria.threshold ?? 0)) {
      unlocks.push(achievement.id);
    }
    if (criteria.type === 'win' && meta?.outcome === 'win') {
      unlocks.push(achievement.id);
    }
    if (criteria.type === 'meta' && criteria.key && typeof meta?.[criteria.key] === 'number') {
      if (meta[criteria.key] >= (criteria.threshold ?? 0)) {
        unlocks.push(achievement.id);
      }
    }
  }

  if (unlocks.length === 0) return;
  await Promise.all(unlocks.map((id) => unlockAchievement(id, { gameId, score, ...meta }).catch(() => null)));
}

