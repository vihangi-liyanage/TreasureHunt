import { getRouteSession } from "@/lib/auth/route-session";
import { getLeaderboard } from "@/lib/data/player-repository";
import { jsonNoStore } from "@/lib/http/responses";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { configured, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Leaderboard is not configured." }, { status: 503 });
  try {
    return jsonNoStore({ entries: await getLeaderboard(createAdminClient(), identity?.id ?? null) });
  } catch {
    return jsonNoStore({ error: "Leaderboard could not be loaded." }, { status: 500 });
  }
}
