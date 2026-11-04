import { AdventureShell } from "@/components/ui/adventure-shell";
import { SiteHeader } from "@/components/layout/site-header";

export function AuthFormShell({ eyebrow, title, description, children }) {
  return (
    <AdventureShell className="auth-shell">
      <SiteHeader backHref="/welcome" backLabel="Welcome" />
      <section className="relative z-10 mx-auto flex w-full max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="glass-panel my-4 w-full max-w-lg rounded-[1.7rem] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.24em] text-amber-300">{eyebrow}</p>
          <h1 className="font-display mt-3 text-4xl text-amber-50 sm:text-5xl">{title}</h1>
          <p className="mt-3 leading-6 text-stone-200/65">{description}</p>
          <div className="gold-rule my-6" />{children}
        </div>
      </section>
    </AdventureShell>
  );
}
