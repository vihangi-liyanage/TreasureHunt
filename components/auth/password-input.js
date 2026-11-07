"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ id, describedBy, invalid, disabled = false, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input className="form-field !pr-12" id={id} type={visible ? "text" : "password"} aria-describedby={describedBy} aria-invalid={invalid} disabled={disabled} {...props} />
      <button className="password-visibility" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} disabled={disabled}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
  );
}
