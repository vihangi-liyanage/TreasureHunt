"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { EFFECT_SLOTS, getAudioCatalogSlot, getMusicSlotForPath, selectConfiguredCandidates } from "@/lib/audio/audio-catalog";
import { audioPlayer, getAudioPreferences, getServerAudioPreferences, subscribeAudioPreferences } from "@/lib/audio/audio-player";

const CLIENT_CACHE_PREFIX = "treasurehunt.audio-catalog.v1.";
const CLIENT_CACHE_TTL_MS = 15 * 60_000;
const catalogCache = new Map();

function isSafePreview(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "freesound.org" || url.hostname.endsWith(".freesound.org"));
  } catch { return false; }
}

function readSessionCatalog(slot, now = Date.now()) {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(`${CLIENT_CACHE_PREFIX}${slot}`));
    if (!cached || cached.expiresAt <= now || !Array.isArray(cached.catalog?.candidates)) return null;
    const safe = cached.catalog.candidates.every((candidate) => {
      const previews = Object.values(candidate?.previews || {});
      return Number.isInteger(candidate?.id) && previews.length > 0 && previews.every(isSafePreview);
    });
    return safe ? cached.catalog : null;
  } catch { return null; }
}

function writeSessionCatalog(slot, catalog, now = Date.now()) {
  if (typeof window === "undefined" || !catalog) return;
  try { window.sessionStorage.setItem(`${CLIENT_CACHE_PREFIX}${slot}`, JSON.stringify({ expiresAt: now + CLIENT_CACHE_TTL_MS, catalog })); }
  catch { /* Metadata caching is an optional optimization. */ }
}

export function requestAudioCatalog(slot) {
  const sessionCatalog = readSessionCatalog(slot);
  if (sessionCatalog) return Promise.resolve(sessionCatalog);
  const existing = catalogCache.get(slot);
  if (existing) return existing;
  const request = fetch(`/api/audio/catalog?slot=${encodeURIComponent(slot)}`)
    .then(async (response) => response.ok ? response.json() : null)
    .then((body) => body?.catalog ?? null)
    .then((catalog) => { if (catalog) writeSessionCatalog(slot, catalog); return catalog; })
    .catch(() => null)
    .finally(() => { if (catalogCache.get(slot) === request) catalogCache.delete(slot); });
  catalogCache.set(slot, request);
  return request;
}

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
