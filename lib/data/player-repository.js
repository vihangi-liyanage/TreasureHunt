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
    .select("completed_worlds, current_world, checkpoint_world, total_coins, total_gems, fish_powerups_collected, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlayerAchievements(supabase, userId) {
  const { data, error } = await supabase
    .from("achievements")
    .select("achievement_key, metadata, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLeaderboard(admin, userId) {
  const { data, error } = await admin.rpc("get_leaderboard_admin", { p_user_id: userId });
  if (error) throw error;
  return data || [];
}
