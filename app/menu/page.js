import { BookOpen, LogOut, Map, Play, RotateCcw, Settings, Trophy, UserRound } from "lucide-react";
import { AdventureShell } from "@/components/ui/adventure-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { PreviewBadge } from "@/components/ui/preview-badge";
import { MenuTile } from "@/components/menu/menu-tile";
import { requireDevelopmentPreview } from "@/lib/ui/preview";

export default function MainMenuPage() {
  requireDevelopmentPreview();
  return (
    <AdventureShell>
      <SiteHeader backHref="/welcome" backLabel="Welcome" />
      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-5 pb-12 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-10">
        <div className="max-w-xl py-4">
          <PreviewBadge />
          <p className="mt-8 text-xs font-black uppercase tracking-[.24em] text-amber-300">Expedition command</p>
          <h1 className="font-display mt-3 text-5xl leading-[.95] sm:text-7xl">Choose your next move.</h1>
          <p className="mt-5 max-w-lg leading-7 text-stone-100/68">Review the complete navigation shell before accounts and saved progress connect in Phase 2.</p>
          <div className="mt-8 rounded-2xl border border-amber-200/15 bg-black/25 p-4 backdrop-blur-md"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-emerald-400/15 text-emerald-200"><BookOpen size={20} /></span><div><p className="font-bold">Preview profile</p><p className="text-xs text-stone-300/55">Guest Explorer · No progress saved</p></div></div></div>
        </div>
        <div className="glass-panel rounded-[1.7rem] p-4 sm:p-6">
          <div className="menu-grid">
            <MenuTile icon={RotateCcw} title="Continue adventure" description="Available after saved progress is connected" disabled />
            <MenuTile href="/worlds" icon={Play} title="New game" description="Review the world-selection journey" />
            <MenuTile href="/worlds" icon={Map} title="World map" description="Explore all three destinations" />
            <MenuTile href="/preview/leaderboard" icon={Trophy} title="Leaderboard" description="Ranking screen placeholder" />
            <MenuTile href="/preview/profile" icon={UserRound} title="Profile" description="Identity screen placeholder" />
            <MenuTile href="/settings" icon={Settings} title="Settings" description="Accessibility and audio preview" />
          </div>
          <div className="mt-4 border-t border-white/10 pt-4"><button className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-stone-300/35" disabled aria-disabled="true"><LogOut size={17} /> Logout connects in Phase 2</button></div>
        </div>
      </section>
    </AdventureShell>
  );
}
