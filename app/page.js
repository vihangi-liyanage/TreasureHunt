import { WORLD_CONFIGS } from "@/game/config/worlds";

const foundationItems = [
  "Next.js App Router and React",
  "Phaser boundary ready",
  "Supabase SSR boundary ready",
  "Fish API adapter verified",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#071a1a] text-stone-50">
      <section className="hero-grid relative isolate min-h-screen px-6 py-8 sm:px-10 lg:px-16">
        <div className="glow glow-gold" aria-hidden="true" />
        <div className="glow glow-emerald" aria-hidden="true" />

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-amber-300/40 bg-amber-300/10 text-xl" aria-hidden="true">✦</span>
            <span className="font-display text-lg tracking-[0.18em]">TREASUREHUNT</span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-100/75">Phase 0</span>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 pb-10 pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pt-28">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">The map is only the beginning</p>
            <h1 className="font-display max-w-3xl text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">
              Three worlds.<br />One legendary treasure.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-stone-200/75 sm:text-lg">
              A colourful 2D platform adventure through emerald canopies, sunset ruins, and crystal-lit caverns.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <span className="button-primary">Foundation ready</span>
              <span className="button-secondary">Gameplay arrives next</span>
            </div>
          </div>

          <div className="map-card relative rounded-[2rem] border border-amber-200/20 p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-200/60">Expedition route</p>
                <h2 className="font-display mt-1 text-2xl">World map</h2>
              </div>
              <span className="text-sm text-stone-300/60">3 lives</span>
            </div>
            <ol className="space-y-3">
              {WORLD_CONFIGS.map((world, index) => (
                <li className="world-row" key={world.id}>
                  <span className={`world-number world-${index + 1}`}>{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{world.name}</span>
                    <span className="block text-sm text-stone-300/55">{world.goal}</span>
                  </span>
                  <span className="font-mono text-sm text-amber-200">{world.timerSeconds}s</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {foundationItems.map((item) => <div className="status-chip" key={item}><span aria-hidden="true">✓</span>{item}</div>)}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
