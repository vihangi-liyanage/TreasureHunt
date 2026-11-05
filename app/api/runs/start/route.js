import { createAdminClient } from "@/lib/supabase/admin";
import { getRouteSession } from "@/lib/auth/route-session";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { jsonNoStore } from "@/lib/http/responses";

export async function POST(request) {
  const rate = checkRequestLimit(request, "run-start", { limit: 10, windowMs: 60_000 });
  if (!rate.allowed) return jsonNoStore({ error: "Too many run requests." }, { status: 429 });
  const { configured, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Game persistence is not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Guests cannot submit leaderboard runs." }, { status: 401 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("game_runs")
      .insert({ user_id: identity.id })
      .select("id, started_at")
      .single();
    if (error) throw error;
    return jsonNoStore({ run: data }, { status: 201 });
  } catch {
    return jsonNoStore({ error: "A game run could not be started." }, { status: 500 });
  }
}
