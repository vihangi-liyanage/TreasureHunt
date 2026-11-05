import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getSiteOrigin, safeNextPath } from "@/lib/auth/redirects";

const ALLOWED_EMAIL_TYPES = new Set(["email", "signup"]);

function redirectNoStore(url) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request) {
  const origin = getSiteOrigin(request);
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!hasSupabaseConfig() || !tokenHash || !ALLOWED_EMAIL_TYPES.has(type)) {
    return redirectNoStore(new URL("/auth/error?code=invalid-confirmation", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  return redirectNoStore(new URL(error ? "/auth/error?code=confirmation-failed" : next, origin));
}
