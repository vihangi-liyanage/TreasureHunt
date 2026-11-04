import { WorldCard } from "@/components/worlds/world-card";
import { SiteHeader } from "@/components/layout/site-header";
import { PreviewBadge } from "@/components/ui/preview-badge";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { requireDevelopmentPreview } from "@/lib/ui/preview";

export default function WorldsPage() {
  requireDevelopmentPreview();
  return (
    <main className="worlds-shell">
      <SiteHeader backHref="/menu" backLabel="Main menu" />
      <section className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
        <div className="mb-8 max-w-3xl"><PreviewBadge /><p className="mt-6 text-xs font-black uppercase tracking-[.25em] text-amber-300">The expedition route</p><h1 className="font-display mt-2 text-5xl sm:text-7xl">Three worlds. One path.</h1><p className="mt-4 max-w-2xl leading-7 text-stone-100/68">The preview starts with Emerald Jungle unlocked. Progression will unlock later worlds only after their preceding checkpoint is saved.</p></div>
        <div className="grid gap-5 lg:grid-cols-3">{WORLD_CONFIGS.map((world,index) => <WorldCard key={world.id} world={world} index={index} locked={index > 0} />)}</div>
      </section>
    </main>
  );
}
