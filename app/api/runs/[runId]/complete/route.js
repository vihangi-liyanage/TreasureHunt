import { createAdminClient } from "@/lib/supabase/admin";
import { getRouteSession } from "@/lib/auth/route-session";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { parseRunCompletion, validateStoredRunCompletion } from "@/lib/game/gameplay-evidence";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request, { params }) {
  const rate = checkRequestLimit(request, "run-complete", { limit: 12, windowMs: 60_000 });
  if (!rate.allowed) return jsonNoStore({ error: "Too many run submissions." }, { status: 429 });
  const { configured, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Game persistence is not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Guests cannot submit leaderboard runs." }, { status: 401 });

  const { runId } = await params;
  const values = parseRunCompletion(await readJsonObject(request));
  if (!UUID_PATTERN.test(runId) || !values) return jsonNoStore({ error: "Invalid run result." }, { status: 400 });

  try {
    const admin = createAdminClient();
    const [{ data: run, error: runError }, { data: events, error: eventsError }] = await Promise.all([
      admin.from("game_runs")
        .select("world_number, started_at, submitted_at")
        .eq("id", runId)
        .eq("user_id", identity.id)
        .maybeSingle(),
      admin.from("game_run_events")
        .select("id, event_type, event_id")
        .eq("run_id", runId)
        .order("id", { ascending: true }),
    ]);
    if (runError || eventsError || !validateStoredRunCompletion({ run, events, durationSeconds: values.durationSeconds })) {
      return jsonNoStore({ error: "Run evidence did not satisfy completion rules." }, { status: 409 });
    }
    const { data, error } = await admin.rpc("complete_verified_game_run_admin", {
      p_user_id: identity.id,
      p_run_id: runId,
      p_duration_seconds: values.durationSeconds,
    });
    if (error) throw error;
    return jsonNoStore(data);
  } catch {
    return jsonNoStore({ error: "Run result was rejected." }, { status: 409 });
  }
}
