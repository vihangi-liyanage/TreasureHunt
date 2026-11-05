import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getPublicAuthError } from "@/lib/auth/errors";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";
import { validateLogin } from "@/lib/validation/auth";

export async function POST(request) {
  const rate = checkRequestLimit(request, "auth-login", { limit: 10, windowMs: 5 * 60_000 });
  if (!rate.allowed) {
    return jsonNoStore({ error: "Too many login attempts. Please wait and try again." }, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  }

  const values = await readJsonObject(request);
  if (!values) return jsonNoStore({ error: "Invalid request." }, { status: 400 });
  const errors = validateLogin(values);
  if (Object.keys(errors).length) return jsonNoStore({ errors }, { status: 400 });
  if (!hasSupabaseConfig()) return jsonNoStore({ error: "Authentication is not configured yet." }, { status: 503 });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: values.email.trim(),
    password: values.password,
  });
  if (error) return jsonNoStore({ error: getPublicAuthError(error) }, { status: error.status === 429 ? 429 : 401 });

  return jsonNoStore({ ok: true, redirectTo: "/worlds" });
}
