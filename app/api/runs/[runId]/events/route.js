import { createAdminClient } from "@/lib/supabase/admin";
import { getRouteSession } from "@/lib/auth/route-session";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { parseGameplayEvent } from "@/lib/game/gameplay-evidence";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request, { params }) {
  const rate = checkRequestLimit(request, "run-event", { limit: 240, windowMs: 10 * 60_000 });
  if (!rate.allowed) return jsonNoStore({ error: "Gameplay sync is temporarily busy." }, { status: 429 });
  const { configured, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Game persistence is not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Guests do not use saved gameplay runs." }, { status: 401 });

  const { runId } = await params;
  const values = parseGameplayEvent(await readJsonObject(request));
  if (!UUID_PATTERN.test(runId) || !values) return jsonNoStore({ error: "Invalid gameplay event." }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("record_game_run_event_admin", {
      p_user_id: identity.id,
      p_run_id: runId,
      p_world: values.worldNumber,
      p_event_type: values.type,
      p_event_id: values.id,
    });
    if (error) throw error;
    return jsonNoStore(data);
  } catch {
    return jsonNoStore({ error: "Gameplay progress could not be verified." }, { status: 409 });
  }
}
