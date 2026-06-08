import { supabase } from '../supabaseClient';
import { ensureAuthUser } from './auth';
import {
  evaluateScoreAchievements,
  evaluateLeaderboardRankAchievements,
  evaluateProgressAchievements
} from './achievements';
import { achievementRefreshTick } from '../stores';

export async function addScore({ game_id, score, duration_seconds = null, meta = {} }) {
  const user = await ensureAuthUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('scores')
    .insert({ user_id: user.id, game_id, score, duration_seconds, meta });
  if (error) throw error;
  try {
    await evaluateScoreAchievements({ gameId: game_id, score, meta });
  } catch {}
  try {
    await evaluateLeaderboardRankAchievements({ userId: user.id, gameId: game_id });
  } catch {}
  try {
    await evaluateProgressAchievements({ userId: user.id });
  } catch {}
  achievementRefreshTick.update((v) => v + 1);
}

export async function getLeaderboard(game_id = 'pong') {
  const { data, error } = await supabase
    .from('leaderboard_ranked')
    .select('*')
    .eq('game_id', game_id)
    .order('rank', { ascending: true })
    .limit(50);
  if (error) throw error;
  return data;
}
