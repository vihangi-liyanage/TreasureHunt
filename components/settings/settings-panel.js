"use client";

import { useSyncExternalStore } from "react";
import { Music2, Volume2 } from "lucide-react";
import { getAudioPreferences, getServerAudioPreferences, setAudioPreference, subscribeAudioPreferences } from "@/lib/audio/audio-service";

const rows = [
  { id: "music", label: "Music", description: "Adventure soundtrack", icon: Music2 },
  { id: "effects", label: "Sound Effects", description: "Coins, gems, fish power-ups, and Game Over", icon: Volume2 },
];

export function SettingsPanel() {
  const enabled = useSyncExternalStore(subscribeAudioPreferences, getAudioPreferences, getServerAudioPreferences);
  return (
    <div className="settings-list space-y-3">
      {rows.map(({ id,label,description,icon: Icon }) => (
        <div className="settings-row flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.045] p-4" key={id}>
          <span className="settings-icon grid size-10 shrink-0 place-items-center rounded-xl bg-amber-200/10 text-amber-300"><Icon size={19} /></span>
          <div className="settings-copy min-w-0 flex-1"><p className="font-bold">{label}</p><p className="settings-description text-xs leading-5 text-stone-300/55">{description}</p></div>
          <button type="button" role="switch" aria-checked={enabled[id]} aria-label={`${label}: ${enabled[id] ? "on" : "off"}`} onClick={() => setAudioPreference(id, !enabled[id])} className={`relative h-7 w-12 shrink-0 rounded-full border transition ${enabled[id] ? "border-emerald-300/40 bg-emerald-500" : "border-white/15 bg-black/35"}`}><span className={`absolute top-1 size-[18px] rounded-full bg-white shadow transition ${enabled[id] ? "left-[25px]" : "left-1"}`} /></button>
        </div>
      ))}
    </div>
  );
}
