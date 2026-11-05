import { createAdminClient } from "@/lib/supabase/admin";
import { getPlayerProgress } from "@/lib/data/player-repository";
import { getRouteSession } from "@/lib/auth/route-session";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { parseWorldCompletion } from "@/lib/game/run-validation";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";

export async function GET() {
  const { configured, supabase, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Persistence is not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Sign in to access saved progress." }, { status: 401 });

  try {
    return jsonNoStore({ progress: await getPlayerProgress(supabase, identity.id) });
  } catch {
    return jsonNoStore({ error: "Saved progress could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const rate = checkRequestLimit(request, "progress-complete", { limit: 12, windowMs: 60_000 });
  if (!rate.allowed) return jsonNoStore({ error: "Too many progress updates." }, { status: 429 });
  const { configured, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Persistence is not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Sign in to save progress." }, { status: 401 });

  const values = parseWorldCompletion(await readJsonObject(request));
  if (!values) return jsonNoStore({ error: "Invalid world completion." }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("complete_world_admin", {
      p_user_id: identity.id,
      p_world: values.world,
      p_coins: values.coins,
    });
    if (error) throw error;
    return jsonNoStore({ progress: data });
  } catch {
    return jsonNoStore({ error: "Progress could not be saved." }, { status: 409 });
  }
}
