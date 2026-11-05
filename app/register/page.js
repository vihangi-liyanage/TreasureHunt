import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getVerifiedIdentity } from "@/lib/auth/session";

export default async function RegisterPage() {
  if (hasSupabaseConfig()) {
    const identity = await getVerifiedIdentity(await createClient());
    if (identity) redirect("/worlds");
  }
  return <AuthFormShell title="Create Account"><RegisterForm /></AuthFormShell>;
}
