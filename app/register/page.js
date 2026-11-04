import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <AuthFormShell eyebrow="Join the expedition" title="Create your explorer" description="Choose your identity for the adventure. This preview never creates an account or stores your details."><RegisterForm /></AuthFormShell>;
}
