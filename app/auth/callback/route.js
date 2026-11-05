import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getSiteOrigin, safeNextPath } from "@/lib/auth/redirects";

export async function GET(request) {
  const origin = getSiteOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!code || !hasSupabaseConfig()) {
    const response = NextResponse.redirect(new URL("/auth/error?code=missing-code", origin));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );
  const response = NextResponse.redirect(new URL(error ? "/auth/error?code=exchange-failed" : next, origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
