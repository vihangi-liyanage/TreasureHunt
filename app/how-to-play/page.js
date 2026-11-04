import { Gamepad2, Heart, Sparkles, Timer, Trophy } from "lucide-react";
import { AuthFormShell } from "@/components/auth/auth-form-shell";

const tips = [
  [Gamepad2,"Move and leap","Use A/D or arrow keys to run, Space to jump, and Escape to pause."],
  [Heart,"Protect three lives","Stomp enemies from above and avoid hazards or unsafe contact."],
  [Sparkles,"Harness fish power","Collect the magical fish to unlock projectiles for exactly 8 seconds."],
  [Timer,"Beat each clock","Emerald Jungle gives 120s, Sunset Ruins 105s, and Crystal Cavern 90s."],
  [Trophy,"Claim the treasure","Reach two safe checkpoints, then collect the treasure in World 3."],
];

export default function HowToPlayPage() {
  return (
    <AuthFormShell eyebrow="Explorer field guide" title="How to play" description="Master the core rules before entering the Emerald Jungle.">
      <ol className="space-y-3">{tips.map(([Icon,title,description]) => <li className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.045] p-4" key={title}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-200/10 text-amber-300"><Icon size={19} /></span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-stone-300/62">{description}</p></div></li>)}</ol>
    </AuthFormShell>
  );
}
