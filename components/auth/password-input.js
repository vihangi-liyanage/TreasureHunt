"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ id, describedBy, invalid, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input className="form-field !pr-12" id={id} type={visible ? "text" : "password"} aria-describedby={describedBy} aria-invalid={invalid} {...props} />
      <button className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-stone-300/65 transition hover:bg-white/8 hover:text-white" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
  );
}
