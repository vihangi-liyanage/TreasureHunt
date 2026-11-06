export async function getPlayerProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlayerProgress(supabase, userId) {
  const { data, error } = await supabase
    .from("player_progress")
    .select("completed_worlds, current_world, checkpoint_world, total_coins, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlayerAchievements(supabase, userId) {
  const { data, error } = await supabase
    .from("achievements")
    .select("achievement_key, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLeaderboard(supabase, limit = 10) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("run_id, username, score, coins, world_reached, duration_seconds, completed_at")
    .order("score", { ascending: false })
    .order("duration_seconds", { ascending: true })
    .limit(safeLimit);
  if (error) throw error;
  return data || [];
}
