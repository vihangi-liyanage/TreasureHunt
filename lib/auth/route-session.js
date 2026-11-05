import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getVerifiedIdentity } from "./session";

export async function getRouteSession() {
  if (!hasSupabaseConfig()) return { configured: false, supabase: null, identity: null };
  const supabase = await createClient();
  const identity = await getVerifiedIdentity(supabase);
  return { configured: true, supabase, identity };
}
