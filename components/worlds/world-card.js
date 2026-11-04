import { Clock3, LockKeyhole, Sparkles } from "lucide-react";

export function WorldCard({ world, index, locked }) {
  return (
    <article className="world-card" data-position={index} data-locked={locked}>
      <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between"><span className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] backdrop-blur-md">World {world.number}</span><span className={`grid size-11 place-items-center rounded-full border ${locked ? "border-white/15 bg-black/45 text-white/65" : "border-amber-200/45 bg-amber-300/18 text-amber-200"}`} aria-label={locked ? "Locked" : "Unlocked"}>{locked ? <LockKeyhole size={19} /> : <Sparkles size={19} />}</span></div>
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">{world.difficulty}</p><h2 className="font-display mt-2 text-4xl leading-none text-white">{world.name}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-stone-100/72">{world.description}</p><div className="mt-5 flex items-center justify-between border-t border-white/14 pt-4"><span className="inline-flex items-center gap-2 text-sm font-bold"><Clock3 size={16} className="text-amber-300" /> {world.timerSeconds} seconds</span><span className="text-xs font-bold uppercase tracking-[.15em] text-stone-300/55">{locked ? "Locked" : "Available"}</span></div></div>
      </div>
    </article>
  );
}
