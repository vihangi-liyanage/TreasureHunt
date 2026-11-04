"use client";

import { useState } from "react";
import { Moon, Music2, Sparkles, Volume2 } from "lucide-react";

const rows = [
  { id: "music", label: "Music", description: "Adventure soundtrack", icon: Music2 },
  { id: "effects", label: "Sound effects", description: "Coins, jumps, and discoveries", icon: Volume2 },
  { id: "motion", label: "Ambient motion", description: "Decorative particles and transitions", icon: Sparkles },
  { id: "contrast", label: "High contrast", description: "Stronger interface separation", icon: Moon },
];

export function SettingsPanel() {
  const [enabled, setEnabled] = useState({ music: true, effects: true, motion: true, contrast: false });
  return (
    <div className="space-y-3">
      {rows.map(({ id,label,description,icon: Icon }) => (
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.045] p-4" key={id}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-200/10 text-amber-300"><Icon size={19} /></span>
          <div className="min-w-0 flex-1"><p className="font-bold">{label}</p><p className="text-xs leading-5 text-stone-300/55">{description}</p></div>
          <button type="button" role="switch" aria-checked={enabled[id]} aria-label={`${label}: ${enabled[id] ? "on" : "off"}`} onClick={() => setEnabled((current) => ({ ...current, [id]: !current[id] }))} className={`relative h-7 w-12 shrink-0 rounded-full border transition ${enabled[id] ? "border-emerald-300/40 bg-emerald-500" : "border-white/15 bg-black/35"}`}><span className={`absolute top-1 size-[18px] rounded-full bg-white shadow transition ${enabled[id] ? "left-[25px]" : "left-1"}`} /></button>
        </div>
      ))}
      <p className="pt-2 text-xs leading-5 text-stone-300/45">Preview settings reset when this page reloads. Persistent preferences arrive with Phase 2.</p>
    </div>
  );
}
