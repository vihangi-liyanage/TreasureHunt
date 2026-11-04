import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <AuthFormShell eyebrow="Explorer access" title="Return to the trail" description="Phase 1 validates this form locally. Authentication and session cookies are intentionally deferred to Phase 2."><LoginForm /></AuthFormShell>;
}
