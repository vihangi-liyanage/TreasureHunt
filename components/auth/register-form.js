"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, UserPlus } from "lucide-react";
import { GameButton } from "@/components/ui/game-button";
import { FormField } from "./form-field";
import { PasswordInput } from "./password-input";
import { validateRegister } from "@/lib/validation/auth";
import { postJson } from "@/lib/auth/client-api";

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [pending, setPending] = useState(false);
  function update(field, value) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); setNotice(""); }
  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    setNotice("");
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    const result = await postJson("/api/auth/register", values);
    setPending(false);
    if (!result.ok) {
      setErrors(result.errors || {});
      setNotice(result.error || "Registration could not be completed.");
      return;
    }
    if (result.authenticated) {
      setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
      router.replace(result.redirectTo || "/worlds");
      router.refresh();
      return;
    }
    setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
    setErrors({});
    setConfirmationEmail(values.email.trim());
  }
  if (confirmationEmail) return (
    <section className="auth-confirmation" aria-labelledby="confirmation-title">
      <span className="auth-confirmation-icon" aria-hidden="true"><ShieldCheck size={34} /></span>
      <div role="status">
        <h2 id="confirmation-title">Check Your Email</h2>
        <p>We sent a secure confirmation link to <strong>{confirmationEmail}</strong>. Open it to activate your explorer account.</p>
      </div>
      <GameButton className="w-full" href="/login">Go to Login</GameButton>
      <p className="auth-confirmation-help">The link must be confirmed before password login can succeed.</p>
    </section>
  );
  return (
    <form noValidate onSubmit={submit} className="auth-form space-y-3">
      <FormField id="username" label="Username" error={errors.username} hint="3–24 characters"><input className="form-field" id="username" name="username" autoComplete="username" placeholder="JungleFox" value={values.username} onChange={(event) => update("username", event.target.value)} aria-describedby="username-help" aria-invalid={Boolean(errors.username)} /></FormField>
      <FormField id="email" label="Email address" error={errors.email}><input className="form-field" id="email" name="email" type="email" autoComplete="email" placeholder="explorer@example.com" value={values.email} onChange={(event) => update("email", event.target.value)} aria-describedby="email-help" aria-invalid={Boolean(errors.email)} /></FormField>
      <div className="grid gap-3">
        <FormField id="password" label="Password" error={errors.password} hint="8+ characters, letter and number"><PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Create password" value={values.password} onChange={(event) => update("password", event.target.value)} describedBy="password-help" invalid={Boolean(errors.password)} /></FormField>
        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword}><PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Repeat password" value={values.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} describedBy="confirmPassword-help" invalid={Boolean(errors.confirmPassword)} /></FormField>
      </div>
      {notice ? <div className="auth-notice flex gap-3 rounded-xl border border-amber-200/20 bg-amber-200/8 p-3 text-sm leading-5 text-amber-50" role="status"><ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={18} />{notice}</div> : null}
      <GameButton className="w-full" type="submit" disabled={pending}><UserPlus size={18} />{pending ? "Creating..." : "Create Account"}</GameButton>
      <a className="google-button" href="/api/auth/google?next=/worlds"><span className="google-mark" aria-hidden="true">G</span>Continue with Google</a>
      <p className="auth-switch-link text-center text-sm text-stone-300/65">Already registered? <Link className="font-bold text-amber-300 underline-offset-4 hover:underline" href="/login">Player Login</Link></p>
    </form>
  );
}
