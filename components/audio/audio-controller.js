"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { audioService, getTrackForPath, hydrateAudioPreferences, subscribeAudioPreferences } from "@/lib/audio/audio-service";

export function AudioController() {
  const pathname = usePathname();

  useEffect(() => {
    hydrateAudioPreferences();
    const unlock = () => audioService.unlock();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    const unsubscribe = subscribeAudioPreferences(() => audioService.applyPreferences());
    return () => {
      unsubscribe();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      audioService.destroy();
    };
  }, []);

  useEffect(() => {
    audioService.setGamePaused(false);
    audioService.setMusic(getTrackForPath(pathname));
  }, [pathname]);

  return null;
}
