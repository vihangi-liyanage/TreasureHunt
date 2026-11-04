import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GameLogo } from "@/components/ui/game-logo";

export function SiteHeader({ backHref, backLabel = "Back" }) {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <GameLogo compact />
      {backHref ? <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/12 bg-black/15 px-4 text-sm font-bold text-white/80 backdrop-blur-md transition hover:border-amber-200/35 hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> {backLabel}</Link> : null}
    </header>
  );
}
