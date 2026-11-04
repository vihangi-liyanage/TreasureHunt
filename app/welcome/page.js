import { BookOpen, LogIn, Play, Settings, Sparkles, UserPlus } from "lucide-react";
import { AdventureShell } from "@/components/ui/adventure-shell";
import { GameButton } from "@/components/ui/game-button";
import { GameLogo } from "@/components/ui/game-logo";
import { PreviewBadge } from "@/components/ui/preview-badge";

export default function WelcomePage() {
  const previewEnabled = process.env.NODE_ENV === "development";
  return (
    <AdventureShell>
      <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-14">
        <nav className="flex items-center justify-between">
          <GameLogo href={null} />
          <div className="hidden gap-2 sm:flex">
            <GameButton href="/settings" variant="ghost" className="!min-h-11 !px-4"><Settings size={17} /> Settings</GameButton>
            <GameButton href="/how-to-play" variant="ghost" className="!min-h-11 !px-4"><BookOpen size={17} /> How to play</GameButton>
          </div>
        </nav>
        <div className="flex flex-1 items-end py-10 sm:items-center lg:py-16">
          <div className="max-w-2xl">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.25em] text-amber-300"><Sparkles size={15} /> A legendary path awaits</span>
              {previewEnabled ? <PreviewBadge /> : null}
            </div>
            <h1 className="font-display text-6xl leading-[.87] text-amber-50 drop-shadow-2xl sm:text-8xl lg:text-[7.5rem]">Find what<br /><span className="text-amber-300">history hid.</span></h1>
            <div className="gold-rule my-7" />
            <p className="max-w-xl text-base leading-7 text-stone-100/76 sm:text-lg">Cross three forgotten worlds, outwit ancient guardians, and uncover the treasure glowing beyond the last cavern.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {previewEnabled ? <GameButton href="/menu"><Play size={19} fill="currentColor" /> Preview adventure UI</GameButton> : <GameButton href="/login"><Play size={19} fill="currentColor" /> Play game</GameButton>}
              <GameButton href="/login" variant="secondary"><LogIn size={18} /> Login</GameButton>
              <GameButton href="/register" variant="ghost"><UserPlus size={18} /> Register</GameButton>
            </div>
            <div className="mt-4 flex gap-2 sm:hidden">
              <GameButton href="/settings" variant="ghost" className="!min-h-11 flex-1 !px-3"><Settings size={16} /> Settings</GameButton>
              <GameButton href="/how-to-play" variant="ghost" className="!min-h-11 flex-1 !px-3"><BookOpen size={16} /> Guide</GameButton>
            </div>
          </div>
        </div>
        <footer className="relative z-10 flex items-center justify-between border-t border-white/10 py-4 text-xs text-white/45"><span>Emerald Jungle · Sunset Ruins · Crystal Cavern</span><span className="hidden sm:block">3 lives · One treasure</span></footer>
      </div>
    </AdventureShell>
  );
}
