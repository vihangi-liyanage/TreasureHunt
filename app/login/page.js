import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getVerifiedIdentity } from "@/lib/auth/session";

export default async function LoginPage() {
  if (hasSupabaseConfig()) {
    const identity = await getVerifiedIdentity(await createClient());
    if (identity) redirect("/worlds");
  }
  return <AuthFormShell title="Welcome Back" description="Continue your treasure-hunting journey."><LoginForm /></AuthFormShell>;
}
