import { WorldMap } from "@/components/worlds/world-map";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { getLeaderboard, getPlayerAchievements, getPlayerProfile, getPlayerProgress } from "@/lib/data/player-repository";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function WorldsPage({ searchParams }) {
  const query = await searchParams;
  const initialOverlay = query?.leaderboard === "1" ? "leaderboard" : null;
  if (query?.mode === "guest") {
    let guestLeaderboard = [];
    let guestLeaderboardStatus = "ready";
    try {
      guestLeaderboard = await getLeaderboard(createAdminClient(), null);
    } catch {
      guestLeaderboardStatus = "unavailable";
    }
    return <WorldMap mode="guest" worlds={WORLD_CONFIGS} leaderboard={guestLeaderboard} leaderboardStatus={guestLeaderboardStatus} initialOverlay={initialOverlay} />;
  }
  if (!hasSupabaseConfig()) redirect("/login");

  const supabase = await createClient();
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) redirect("/login");

  let profile = null;
  let progress = null;
  let leaderboard = [];
  let leaderboardStatus = "ready";
  let achievements = [];
  const admin = createAdminClient();
  const [profileResult, progressResult, leaderboardResult, achievementsResult] = await Promise.allSettled([
    getPlayerProfile(supabase, identity.id),
    getPlayerProgress(supabase, identity.id),
    getLeaderboard(admin, identity.id),
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

  const playerRanking = leaderboard.find((entry) => entry.is_current) || null;
  return (
    <WorldMap
      mode="authenticated"
      worlds={WORLD_CONFIGS}
      completedWorldIds={completedWorldIds}
      leaderboard={leaderboard}
      leaderboardStatus={leaderboardStatus}
      initialOverlay={initialOverlay}
      profile={{
        username: profile?.username || "Explorer", email: identity.email, createdAt: profile?.created_at || null,
        progress: progress || null, achievements, bestRun: playerRanking,
      }}
    />
  );
}
