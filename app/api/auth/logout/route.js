import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { jsonNoStore } from "@/lib/http/responses";

export async function POST() {
  if (!hasSupabaseConfig()) return jsonNoStore({ ok: true });
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return jsonNoStore({ error: "Could not sign out. Please try again." }, { status: 500 });
  return jsonNoStore({ ok: true });
}
