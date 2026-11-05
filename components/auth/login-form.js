"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, ShieldCheck } from "lucide-react";
import { GameButton } from "@/components/ui/game-button";
import { FormField } from "./form-field";
import { PasswordInput } from "./password-input";
import { validateLogin } from "@/lib/validation/auth";
import { postJson } from "@/lib/auth/client-api";

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  function update(field, value) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); setNotice(""); }
  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setNotice("");
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    const result = await postJson("/api/auth/login", values);
    setPending(false);
    if (!result.ok) {
      setErrors(result.errors || {});
      setNotice(result.error || "Login could not be completed.");
      return;
    }
    router.replace(result.redirectTo || "/worlds");
    router.refresh();
  }
  return (
    <form noValidate onSubmit={submit} className="auth-form space-y-4">
      <FormField id="email" label="Email address" error={errors.email}><input className="form-field" id="email" name="email" type="email" autoComplete="email" placeholder="explorer@example.com" value={values.email} onChange={(event) => update("email", event.target.value)} aria-describedby="email-help" aria-invalid={Boolean(errors.email)} /></FormField>
      <FormField id="password" label="Password" error={errors.password}><PasswordInput id="password" name="password" autoComplete="current-password" placeholder="At least 8 characters" value={values.password} onChange={(event) => update("password", event.target.value)} describedBy="password-help" invalid={Boolean(errors.password)} /></FormField>
      {notice ? <div className="auth-notice flex gap-3 rounded-xl border border-amber-200/20 bg-amber-200/8 p-3 text-sm leading-5 text-amber-50" role="status"><ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={18} />{notice}</div> : null}
      <GameButton className="w-full" type="submit" disabled={pending}><LogIn size={18} />{pending ? "Signing in..." : "Login"}</GameButton>
      <a className="google-button" href="/api/auth/google?next=/worlds"><span className="google-mark" aria-hidden="true">G</span>Continue with Google</a>
      <Link className="create-account-link" href="/register">Create Account</Link>
    </form>
  );
}
