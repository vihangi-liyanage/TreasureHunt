import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <AuthFormShell eyebrow="Explorer access" title="Player Login"><LoginForm /></AuthFormShell>;
}
