"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, UserPlus } from "lucide-react";
import { GameButton } from "@/components/ui/game-button";
import { FormField } from "./form-field";
import { PasswordInput } from "./password-input";
import { validateRegister } from "@/lib/validation/auth";

export function RegisterForm() {
  const [values, setValues] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  function update(field, value) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); setNotice(""); }
  function submit(event) { event.preventDefault(); const nextErrors = validateRegister(values); setErrors(nextErrors); if (!Object.keys(nextErrors).length) setNotice("Registration is not connected yet. No account was created; Supabase arrives in Phase 2B."); }
  function explainGoogle() { setNotice("Google authentication will connect in Phase 2B. No sign-up request was sent."); }
  return (
    <form noValidate onSubmit={submit} className="space-y-3">
      <FormField id="username" label="Username" error={errors.username} hint="3–24 characters"><input className="form-field" id="username" name="username" autoComplete="username" placeholder="JungleFox" value={values.username} onChange={(event) => update("username", event.target.value)} aria-describedby="username-help" aria-invalid={Boolean(errors.username)} /></FormField>
      <FormField id="email" label="Email address" error={errors.email}><input className="form-field" id="email" name="email" type="email" autoComplete="email" placeholder="explorer@example.com" value={values.email} onChange={(event) => update("email", event.target.value)} aria-describedby="email-help" aria-invalid={Boolean(errors.email)} /></FormField>
      <div className="grid gap-3">
        <FormField id="password" label="Password" error={errors.password} hint="8+ characters, letter and number"><PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Create password" value={values.password} onChange={(event) => update("password", event.target.value)} describedBy="password-help" invalid={Boolean(errors.password)} /></FormField>
        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword}><PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Repeat password" value={values.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} describedBy="confirmPassword-help" invalid={Boolean(errors.confirmPassword)} /></FormField>
      </div>
      {notice ? <div className="flex gap-3 rounded-xl border border-amber-200/20 bg-amber-200/8 p-3 text-sm leading-5 text-amber-50" role="status"><ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={18} />{notice}</div> : null}
      <GameButton className="w-full" type="submit"><UserPlus size={18} /> Create Account</GameButton>
      <button className="google-button" type="button" onClick={explainGoogle}><span className="google-mark" aria-hidden="true">G</span>Continue with Google</button>
      <p className="text-center text-sm text-stone-300/65">Already registered? <Link className="font-bold text-amber-300 underline-offset-4 hover:underline" href="/login">Player Login</Link></p>
    </form>
  );
}
