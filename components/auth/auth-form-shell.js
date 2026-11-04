import { AdventureShell } from "@/components/ui/adventure-shell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthFormShell({ eyebrow, title, description, children }) {
  return (
    <AdventureShell className="auth-shell">
      <Link className="screen-control auth-back" href="/welcome"><ArrowLeft size={18} />Back to Welcome</Link>
      <section className="auth-stage">
        <div className="game-panel auth-panel">
          <p className="text-xs font-black uppercase tracking-[.24em] text-amber-300">{eyebrow}</p>
          <h1 className="font-display mt-2 text-4xl text-amber-50 sm:text-5xl">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-6 text-stone-200/58">{description}</p> : null}
          <div className="gold-rule my-5" />{children}
        </div>
      </section>
    </AdventureShell>
  );
}
