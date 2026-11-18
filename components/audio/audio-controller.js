"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { EFFECT_SLOTS, getAudioCatalogSlot, getMusicSlotForPath, selectConfiguredCandidates } from "@/lib/audio/audio-catalog";
import { audioPlayer, getAudioPreferences, getServerAudioPreferences, requestAudioCatalog, subscribeAudioPreferences } from "@/lib/audio/audio-player";

export function AudioController() {
  const pathname = usePathname();
  const preferences = useSyncExternalStore(subscribeAudioPreferences, getAudioPreferences, getServerAudioPreferences);
  const musicSlot = getMusicSlotForPath(pathname);
  const isGameRoute = pathname.startsWith("/game/");

  useEffect(() => { audioPlayer.applyPreferences(preferences); }, [preferences]);

  useEffect(() => {
    const controller = new AbortController();
    if (!musicSlot) { audioPlayer.setTrack(null); return () => controller.abort(); }
    audioPlayer.setTrack(musicSlot);
    void requestAudioCatalog(musicSlot).then((catalog) => {
      if (!controller.signal.aborted) audioPlayer.setTrack(musicSlot, selectConfiguredCandidates(musicSlot, catalog?.candidates));
    });
    return () => controller.abort();
  }, [musicSlot]);

  useEffect(() => {
    if (!isGameRoute) { audioPlayer.stopEffects(); return undefined; }
    let active = true;
    void requestAudioCatalog(musicSlot).then(() => Promise.all(EFFECT_SLOTS.map(async (slot) => {
      const catalog = await requestAudioCatalog(slot);
      if (active) audioPlayer.setEffectCandidates(slot, selectConfiguredCandidates(slot, catalog?.candidates), { gain: getAudioCatalogSlot(slot).gain });
    })));
    return () => { active = false; };
  }, [isGameRoute, musicSlot]);

  useEffect(() => {
    const slots = pathname === "/welcome" ? ["emerald-jungle"] : pathname === "/worlds" ? ["emerald-jungle", "sunset-ruins", "crystal-cavern"] : [];
    if (!slots.length) return undefined;
    let active = true;
    void (musicSlot ? requestAudioCatalog(musicSlot) : Promise.resolve()).then(() => {
      if (active) for (const slot of slots) void requestAudioCatalog(slot);
    });
    return () => { active = false; };
  }, [musicSlot, pathname]);

  useEffect(() => {
    const onVisibilityChange = () => audioPlayer.setPaused("document-hidden", document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange); onVisibilityChange();
    return () => { document.removeEventListener("visibilitychange", onVisibilityChange); audioPlayer.setPaused("document-hidden", false); };
  }, []);

  useEffect(() => {
    let listening = false;
    const retry = () => audioPlayer.retryAfterInteraction();
    const removeListeners = () => {
      if (!listening) return; listening = false;
      window.removeEventListener("pointerdown", retry); window.removeEventListener("keydown", retry);
    };
    const unsubscribe = audioPlayer.subscribe(({ autoplayBlocked }) => {
      if (autoplayBlocked && !listening) {
        listening = true; window.addEventListener("pointerdown", retry, { passive: true }); window.addEventListener("keydown", retry);
      } else if (!autoplayBlocked) removeListeners();
    });
    return () => { unsubscribe(); removeListeners(); audioPlayer.destroy(); };
  }, []);

  return null;
}
