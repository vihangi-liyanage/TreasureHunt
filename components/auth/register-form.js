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
  const [values, setValues] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  function update(field, value) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); setNotice(""); }
  function validateField(field) {
    const fieldError = validateRegister(values)[field];
    setErrors((current) => ({ ...current, [field]: fieldError }));
  }
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
    router.replace(result.redirectTo || "/worlds");
    router.refresh();
  }
  return (
    <form noValidate onSubmit={submit} className="auth-form" aria-busy={pending}>
      <FormField id="username" label="Username" error={errors.username} hint="3–24 characters"><input className="form-field" id="username" name="username" autoComplete="username" placeholder="JungleFox" value={values.username} onChange={(event) => update("username", event.target.value)} onBlur={() => validateField("username")} aria-describedby="username-help" aria-invalid={Boolean(errors.username)} disabled={pending} required /></FormField>
      <FormField id="email" label="Email address" error={errors.email}><input className="form-field" id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="explorer@example.com" value={values.email} onChange={(event) => update("email", event.target.value)} onBlur={() => validateField("email")} aria-describedby="email-help" aria-invalid={Boolean(errors.email)} disabled={pending} required /></FormField>
      <FormField id="password" label="Password" error={errors.password} hint="8+ characters, letter and number"><PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Create password" value={values.password} onChange={(event) => update("password", event.target.value)} onBlur={() => validateField("password")} describedBy="password-help" invalid={Boolean(errors.password)} disabled={pending} required /></FormField>
      {notice ? <div className="auth-notice" role="alert"><ShieldCheck aria-hidden="true" size={18} />{notice}</div> : null}
      <GameButton className="w-full auth-submit" type="submit" disabled={pending}><UserPlus size={18} />{pending ? "Creating account..." : "Create Account"}</GameButton>
      <p className="auth-switch-link">Already have an account? <Link href="/login">Log In</Link></p>
    </form>
  );
}
