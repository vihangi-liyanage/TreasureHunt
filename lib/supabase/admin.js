import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminConfig } from "./config";

export function createAdminClient() {
  const { url, secretKey } = getSupabaseAdminConfig();
  return createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
