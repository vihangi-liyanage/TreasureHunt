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

export function LoginForm({ registrationSucceeded = false }) {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(registrationSucceeded);
  const [pending, setPending] = useState(false);
  function update(field, value) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); setNotice(""); setShowRegistrationSuccess(false); }
  function validateField(field) {
    const fieldError = validateLogin(values)[field];
    setErrors((current) => ({ ...current, [field]: fieldError }));
  }
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
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
    <form noValidate onSubmit={submit} className="auth-form" aria-busy={pending}>
      {showRegistrationSuccess ? <div className="auth-success" role="status"><ShieldCheck aria-hidden="true" size={19} /><span><strong>Account created successfully!</strong><br />Please log in to start your adventure.</span></div> : null}
      <FormField id="email" label="Email address" error={errors.email}><input className="form-field" id="email" name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(event) => update("email", event.target.value)} onBlur={() => validateField("email")} aria-describedby="email-help" aria-invalid={Boolean(errors.email)} disabled={pending} required /></FormField>
      <FormField id="password" label="Password" error={errors.password}><PasswordInput id="password" name="password" autoComplete="current-password" value={values.password} onChange={(event) => update("password", event.target.value)} onBlur={() => validateField("password")} describedBy="password-help" invalid={Boolean(errors.password)} disabled={pending} required /></FormField>
      {notice ? <div className="auth-notice" role="alert"><ShieldCheck aria-hidden="true" size={18} />{notice}</div> : null}
      <GameButton className="w-full auth-submit" type="submit" disabled={pending}><LogIn size={18} />{pending ? "Signing in..." : "Log In"}</GameButton>
      <p className="auth-switch-link">Need an account? <Link href="/register">Sign Up</Link></p>
    </form>
  );
}
