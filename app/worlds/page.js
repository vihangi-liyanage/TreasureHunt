import { WorldMap } from "@/components/worlds/world-map";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { getLeaderboard, getPlayerAchievements, getPlayerProfile, getPlayerProgress } from "@/lib/data/player-repository";

export default async function WorldsPage({ searchParams }) {
  const query = await searchParams;
  if (query?.mode === "guest") return <WorldMap mode="guest" worlds={WORLD_CONFIGS} />;
  if (!hasSupabaseConfig()) redirect("/login");

  const supabase = await createClient();
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) redirect("/login");

  let profile = null;
  let progress = null;
  let leaderboard = [];
  let leaderboardStatus = "ready";
  let achievements = [];
  const [profileResult, progressResult, leaderboardResult, achievementsResult] = await Promise.allSettled([
    getPlayerProfile(supabase, identity.id),
    getPlayerProgress(supabase, identity.id),
    getLeaderboard(supabase),
    getPlayerAchievements(supabase, identity.id),
  ]);
  if (profileResult.status === "fulfilled") profile = profileResult.value;
  if (progressResult.status === "fulfilled") progress = progressResult.value;
  if (leaderboardResult.status === "fulfilled") leaderboard = leaderboardResult.value;
  else leaderboardStatus = "unavailable";
  if (achievementsResult.status === "fulfilled") achievements = achievementsResult.value;

  const completedWorldIds = WORLD_CONFIGS
    .slice(0, progress?.completed_worlds || 0)
    .map((world) => world.id);

  return (
    <WorldMap
      mode="authenticated"
      worlds={WORLD_CONFIGS}
      completedWorldIds={completedWorldIds}
      leaderboard={leaderboard}
      leaderboardStatus={leaderboardStatus}
      profile={{
        username: profile?.username || "Explorer", email: identity.email, createdAt: profile?.created_at || null,
        progress: progress || null, achievements,
      }}
    />
  );
}
