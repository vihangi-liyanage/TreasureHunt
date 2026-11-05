import { WorldMap } from "@/components/worlds/world-map";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { getLeaderboard, getPlayerProfile, getPlayerProgress } from "@/lib/data/player-repository";

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
  try {
    [profile, progress, leaderboard] = await Promise.all([
      getPlayerProfile(supabase, identity.id),
      getPlayerProgress(supabase, identity.id),
      getLeaderboard(supabase),
    ]);
  } catch {
    // The authenticated shell remains usable while setup/migrations are being completed.
  }

  const completedWorldIds = WORLD_CONFIGS
    .slice(0, progress?.completed_worlds || 0)
    .map((world) => world.id);

  return (
    <WorldMap
      mode="authenticated"
      worlds={WORLD_CONFIGS}
      completedWorldIds={completedWorldIds}
      leaderboard={leaderboard}
      profile={{ username: profile?.username || "Explorer", email: identity.email }}
    />
  );
}
