import { supabase } from '../supabaseClient';
import { ensureAuthUser } from './auth';
import { evaluateScoreAchievements } from './achievements';

export async function addScore({ game_id, score, duration_seconds = null, meta = {} }) {
  const user = await ensureAuthUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('scores')
    .insert({ user_id: user.id, game_id, score, duration_seconds, meta });
  if (error) throw error;
  try {
    await evaluateScoreAchievements({ gameId: game_id, score, meta });
  } catch {}
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
