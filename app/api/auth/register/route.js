import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getPublicAuthError } from "@/lib/auth/errors";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";
import { validateRegister } from "@/lib/validation/auth";

export async function POST(request) {
  const rate = checkRequestLimit(request, "auth-register", { limit: 5, windowMs: 10 * 60_000 });
  if (!rate.allowed) {
    return jsonNoStore({ error: "Too many registration attempts. Please wait and try again." }, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  }

  const values = await readJsonObject(request);
  if (!values) return jsonNoStore({ error: "Invalid request." }, { status: 400 });
  const errors = validateRegister(values);
  if (Object.keys(errors).length) return jsonNoStore({ errors }, { status: 400 });
  if (!hasSupabaseConfig()) return jsonNoStore({ error: "Authentication is not configured yet." }, { status: 503 });

  try {
    const admin = createAdminClient();
    const { data: usernameTaken, error: lookupError } = await admin
      .rpc("username_exists_admin", { p_username: values.username.trim() });
    if (lookupError) throw lookupError;
    if (usernameTaken) {
      return jsonNoStore({ errors: { username: "That username is already taken." } }, { status: 409 });
    }
  } catch {
    return jsonNoStore({ error: "Registration storage is not configured yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email.trim(),
    password: values.password,
    options: {
      data: { username: values.username.trim() },
    },
  });
  if (error) return jsonNoStore({ error: getPublicAuthError(error) }, { status: error.status === 429 ? 429 : 400 });
  if (!data.session) {
    return jsonNoStore({ error: "Disable Confirm email in Supabase to allow immediate registration." }, { status: 409 });
  }
  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) return jsonNoStore({ error: "Account created, but the temporary session could not be cleared." }, { status: 500 });

  return jsonNoStore({ ok: true, redirectTo: "/login?registered=1" });
}
