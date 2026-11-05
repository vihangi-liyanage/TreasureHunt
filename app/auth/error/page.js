import Link from "next/link";
import { AuthFormShell } from "@/components/auth/auth-form-shell";

export default function AuthErrorPage() {
  return (
    <AuthFormShell title="Sign-in interrupted">
      <div className="text-center">
        <p className="text-sm leading-6 text-stone-200/75">The secure sign-in could not be completed. Return to login and start again.</p>
        <Link className="game-button game-button-primary mt-5 w-full" href="/login">Return to Login</Link>
      </div>
    </AuthFormShell>
  );
}
