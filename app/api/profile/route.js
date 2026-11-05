import { getRouteSession } from "@/lib/auth/route-session";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { getPlayerProfile } from "@/lib/data/player-repository";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";
import { validateUsername } from "@/lib/validation/auth";

export async function GET() {
  const { configured, supabase, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Profiles are not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Sign in to access your profile." }, { status: 401 });
  try {
    return jsonNoStore({ profile: await getPlayerProfile(supabase, identity.id) });
  } catch {
    return jsonNoStore({ error: "Profile could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const rate = checkRequestLimit(request, "profile-update", { limit: 6, windowMs: 10 * 60_000 });
  if (!rate.allowed) {
    return jsonNoStore({ error: "Too many profile updates. Please wait and try again." }, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  }
  const { configured, supabase, identity } = await getRouteSession();
  if (!configured) return jsonNoStore({ error: "Profiles are not configured." }, { status: 503 });
  if (!identity) return jsonNoStore({ error: "Sign in to update your profile." }, { status: 401 });
  const values = await readJsonObject(request);
  const usernameError = validateUsername(values?.username);
  if (usernameError) return jsonNoStore({ errors: { username: usernameError } }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles")
    .update({ username: values.username.trim() })
    .eq("id", identity.id)
    .select("id, username, created_at")
    .single();
  if (error) {
    const message = error.code === "23505" ? "That username is already taken." : "Profile could not be updated.";
    return jsonNoStore({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }
  return jsonNoStore({ profile: data });
}
