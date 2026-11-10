import { getPlayerProgress } from "@/lib/data/player-repository";
import { getRouteSession } from "@/lib/auth/route-session";
import { jsonNoStore } from "@/lib/http/responses";

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
