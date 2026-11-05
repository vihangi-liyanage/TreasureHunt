import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getSiteOrigin, safeNextPath } from "@/lib/auth/redirects";
import { checkRequestLimit } from "@/lib/auth/request-guard";

function errorRedirect(request, code) {
  const response = NextResponse.redirect(new URL(`/auth/error?code=${code}`, getSiteOrigin(request)));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request) {
  const rate = checkRequestLimit(request, "auth-google", { limit: 8, windowMs: 5 * 60_000 });
  if (!rate.allowed) return errorRedirect(request, "rate-limit");
  if (!hasSupabaseConfig()) return errorRedirect(request, "not-configured");

  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const callback = new URL("/auth/callback", getSiteOrigin(request));
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) return errorRedirect(request, "oauth-start-failed");

  const response = NextResponse.redirect(data.url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
