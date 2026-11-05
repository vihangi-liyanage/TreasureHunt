import { createAdminClient } from "@/lib/supabase/admin";
import { getRouteSession } from "@/lib/auth/route-session";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { parseRunResult } from "@/lib/game/run-validation";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request, { params }) {
  const rate = checkRequestLimit(request, "run-complete", { limit: 12, windowMs: 60_000 });
  if (!rate.allowed) return jsonNoStore({ error: "Too many run submissions." }, { status: 429 });
  const { configured, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Game persistence is not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Guests cannot submit leaderboard runs." }, { status: 401 });

  const { runId } = await params;
  const values = parseRunResult(await readJsonObject(request));
  if (!UUID_PATTERN.test(runId) || !values) return jsonNoStore({ error: "Invalid run result." }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("complete_game_run_admin", {
      p_user_id: identity.id,
      p_run_id: runId,
      p_score: values.score,
      p_coins: values.coins,
      p_world_reached: values.worldReached,
      p_duration_seconds: values.durationSeconds,
      p_completed: values.completed,
    });
    if (error) throw error;
    return jsonNoStore({ run: data });
  } catch {
    return jsonNoStore({ error: "Run result was rejected." }, { status: 409 });
  }
}
