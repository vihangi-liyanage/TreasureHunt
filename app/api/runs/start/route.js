import { createAdminClient } from "@/lib/supabase/admin";
import { getRouteSession } from "@/lib/auth/route-session";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";
import { parseRunStart } from "@/lib/game/gameplay-evidence";

export async function POST(request) {
  const rate = checkRequestLimit(request, "run-start", { limit: 10, windowMs: 60_000 });
  if (!rate.allowed) return jsonNoStore({ error: "Too many run requests." }, { status: 429 });
  const { configured, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Game persistence is not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Guests cannot submit leaderboard runs." }, { status: 401 });

  const values = parseRunStart(await readJsonObject(request));
  if (!values) return jsonNoStore({ error: "Invalid world run." }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("start_game_run_admin", {
      p_user_id: identity.id,
      p_world: values.worldNumber,
    });
    if (error) throw error;
    return jsonNoStore({ run: { id: data.id, started_at: data.started_at, world_number: data.world_number } }, { status: 201 });
  } catch {
    return jsonNoStore({ error: "A game run could not be started." }, { status: 500 });
  }
}
