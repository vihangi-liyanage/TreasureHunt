import { AdventureShell } from "@/components/ui/adventure-shell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthFormShell({ title, children }) {
  return (
    <AdventureShell className="auth-shell">
      <Link className="screen-control auth-back" href="/welcome"><ArrowLeft size={18} />Back to Welcome</Link>
      <section className="auth-stage">
        <div className="game-panel auth-panel">
          <h1 className="font-display text-center text-4xl text-amber-50 sm:text-5xl">{title}</h1>
          <div className="gold-rule mx-auto my-5" />{children}
        </div>
      </section>
    </AdventureShell>
  );
}
