import { AdventureShell } from "@/components/ui/adventure-shell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthFormShell({ title, description, children }) {
  return (
    <AdventureShell className="auth-shell">
      <Link className="screen-control auth-back" href="/welcome"><ArrowLeft size={18} />Back to Welcome</Link>
      <section className="auth-stage" aria-labelledby="auth-title">
        <div className="game-panel auth-panel">
          <header className="auth-heading">
            <span>Explorer access</span>
            <h1 id="auth-title" className="font-display">{title}</h1>
            {description ? <p>{description}</p> : null}
            <div className="gold-rule" aria-hidden="true" />
          </header>
          {children}
        </div>
      </section>
    </AdventureShell>
  );
}
