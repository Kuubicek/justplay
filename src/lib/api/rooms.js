import { supabase } from '../supabaseClient';

export async function listPublicRooms(gameId = null) {
  let query = supabase
    .from('rooms')
    .select('*, room_members(count)')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });
  if (gameId) query = query.eq('game_id', gameId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createRoom({ game_id = 'pong', max_players = 2 }) {
  const { data: userData } = await supabase.auth.getUser();
  const host = userData?.user?.id;
  if (!host) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('rooms')
    .insert({ game_id, host_user: host, max_players })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('room_members').insert({ room_id: data.id, user_id: host });
  return data;
}

export async function joinRoom(room_id) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase.from('room_members').insert({ room_id, user_id: uid });
  if (error && !error.message?.includes('duplicate')) throw error; // idempotent
}

export async function leaveRoom(room_id) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return;
  await supabase.from('room_members').delete().eq('room_id', room_id).eq('user_id', uid);
}

export async function myRooms() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('room_members')
    .select('room_id, rooms(*)')
    .eq('user_id', uid)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return data.map(r => r.rooms);
}

export function subscribeRooms(callback) {
  const channel = supabase
    .channel('rooms_rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
      callback(payload);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}
