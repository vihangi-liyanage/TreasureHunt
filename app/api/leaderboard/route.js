import { getRouteSession } from "@/lib/auth/route-session";
import { getLeaderboard } from "@/lib/data/player-repository";
import { jsonNoStore } from "@/lib/http/responses";

export async function GET() {
  const { configured, supabase, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Leaderboard is not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Sign in to view the leaderboard." }, { status: 401 });
  try {
    return jsonNoStore({ entries: await getLeaderboard(supabase) });
  } catch {
    return jsonNoStore({ error: "Leaderboard could not be loaded." }, { status: 500 });
  }
}
