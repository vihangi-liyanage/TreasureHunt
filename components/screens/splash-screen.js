"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameLogo } from "@/components/ui/game-logo";

export function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => router.replace("/welcome"), reducedMotion ? 220 : 1150);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <main className="adventure-shell grid min-h-svh place-items-center px-6 text-center">
      <div className="absolute inset-0 bg-[#04110e]/58" aria-hidden="true" />
      <div className="splash-reveal relative z-10 flex w-full max-w-md flex-col items-center">
        <GameLogo href={null} />
        <h1 className="font-display mt-8 text-5xl leading-none text-amber-50 sm:text-7xl">Awaken the adventure</h1>
        <p className="mt-4 text-sm uppercase tracking-[.28em] text-emerald-100/70">Charting a path to the lost treasure</p>
        <div className="mt-10 h-1.5 w-56 overflow-hidden rounded-full bg-white/10" aria-label="Loading adventure"><div className="loading-shimmer h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-100" /></div>
        <span className="mt-3 text-xs text-stone-300/60">Loading expedition…</span>
      </div>
    </main>
  );
}
