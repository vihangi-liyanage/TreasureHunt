const STORAGE_KEY = "treasurehunt.audio.v1";
const PREFERENCE_EVENT = "treasurehunt:audio-preferences";
const DEFAULT_PREFERENCES = Object.freeze({ music: true, effects: true, volume: 70 });
const MAX_CONCURRENT_EFFECTS = 8;
const EFFECT_COOLDOWN_MS = 45;
const CLIENT_CACHE_PREFIX = "treasurehunt.audio-catalog.v1.";
const CLIENT_CACHE_TTL_MS = 15 * 60_000;
const catalogRequests = new Map();

let preferenceSnapshot = DEFAULT_PREFERENCES;
let preferencesHydrated = false;

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
  const existing = catalogRequests.get(slot);
  if (existing) return existing;
  const request = fetch(`/api/audio/catalog?slot=${encodeURIComponent(slot)}`)
    .then(async (response) => response.ok ? response.json() : null)
    .then((body) => body?.catalog ?? null)
    .then((catalog) => { if (catalog) writeSessionCatalog(slot, catalog); return catalog; })
    .catch(() => null)
    .finally(() => { if (catalogRequests.get(slot) === request) catalogRequests.delete(slot); });
  catalogRequests.set(slot, request);
  return request;
}

function normalizePreferences(value) {
  return Object.freeze({
    music: typeof value?.music === "boolean" ? value.music : true,
    effects: typeof value?.effects === "boolean" ? value.effects : true,
    volume: Number.isFinite(Number(value?.volume)) ? Math.min(100, Math.max(0, Math.round(Number(value.volume)))) : 70,
  });
}

export function hydrateAudioPreferences() {
  if (preferencesHydrated || typeof window === "undefined") return preferenceSnapshot;
  preferencesHydrated = true;
  try { preferenceSnapshot = normalizePreferences(JSON.parse(window.localStorage.getItem(STORAGE_KEY))); }
  catch { preferenceSnapshot = DEFAULT_PREFERENCES; }
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT));
  return preferenceSnapshot;
}

export function getAudioPreferences() { return preferenceSnapshot; }
export function getServerAudioPreferences() { return DEFAULT_PREFERENCES; }
export function subscribeAudioPreferences(listener) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PREFERENCE_EVENT, listener);
  hydrateAudioPreferences();
  return () => window.removeEventListener(PREFERENCE_EVENT, listener);
}
export function setAudioPreference(name, enabled) {
  if (!["music", "effects"].includes(name) || typeof window === "undefined") return;
  preferenceSnapshot = normalizePreferences({ ...hydrateAudioPreferences(), [name]: Boolean(enabled) });
  persistPreferences();
}
export function setAudioVolume(volume) {
  if (typeof window === "undefined") return;
  preferenceSnapshot = normalizePreferences({ ...hydrateAudioPreferences(), volume });
  persistPreferences();
}
function persistPreferences() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferenceSnapshot));
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT));
}

function selectPreview(audio, previews) {
  const formats = [["preview-hq-ogg", "audio/ogg"], ["preview-hq-mp3", "audio/mpeg"], ["preview-lq-ogg", "audio/ogg"], ["preview-lq-mp3", "audio/mpeg"]];
  const supported = formats.find(([key, mime]) => previews?.[key] && audio.canPlayType?.(mime));
  return supported?.[0] ? previews[supported[0]] : previews?.["preview-hq-mp3"] || previews?.["preview-hq-ogg"] || null;
}

export class AudioPlayer {
  constructor({ createAudio = () => new Audio(), now = () => Date.now() } = {}) {
    this.createAudio = createAudio;
    this.now = now;
    this.music = null;
    this.musicSlot = null;
    this.musicCandidates = [];
    this.musicIndex = -1;
    this.musicEnabled = true;
    this.effectsEnabled = true;
    this.volume = 0.7;
    this.pauseReasons = new Set();
    this.playPromise = null;
    this.autoplayBlocked = false;
    this.listeners = new Set();
    this.effectSources = new Map();
    this.effectGains = new Map();
    this.activeEffects = new Set();
    this.lastEffectAt = new Map();
    this.preparedMusic = new Map();
    this.onMusicError = () => this.useNextMusicCandidate();
  }

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  snapshot() { return Object.freeze({ autoplayBlocked: this.autoplayBlocked, slot: this.musicSlot, candidateId: this.musicCandidates[this.musicIndex]?.id ?? null }); }
  emit() { const state = this.snapshot(); for (const listener of this.listeners) listener(state); }

  applyPreferences({ music, effects, volume }) {
    this.musicEnabled = Boolean(music);
    this.effectsEnabled = Boolean(effects);
    this.setVolume(Number(volume) / 100);
    if (!this.musicEnabled) this.music?.pause(); else void this.playMusic();
    if (!this.effectsEnabled) this.stopEffects();
  }

  setVolume(volume) {
    this.volume = Math.min(1, Math.max(0, Number(volume) || 0));
    if (this.music) this.music.volume = this.volume * 0.72;
    for (const effect of this.activeEffects) effect.volume = this.volume * (this.effectGains.get(effect.dataset?.slot) ?? 0.82);
  }

  setTrack(slot, candidates = []) {
    const ids = candidates.map(({ id }) => id).join(",");
    if (this.musicSlot === slot && ids === this.musicCandidates.map(({ id }) => id).join(",")) return;
    this.releaseMusic();
    this.musicSlot = slot; this.musicCandidates = candidates; this.musicIndex = -1; this.autoplayBlocked = false;
    if (slot && candidates.length) this.useNextMusicCandidate(); else this.emit();
  }

  setPaused(reason, paused) {
    if (paused) this.pauseReasons.add(reason); else this.pauseReasons.delete(reason);
    if (this.pauseReasons.size) this.music?.pause(); else void this.playMusic();
  }

  async playMusic() {
    if (!this.music || !this.musicEnabled || this.pauseReasons.size || !this.music.paused || this.playPromise) return;
    const promise = this.music.play(); this.playPromise = promise;
    try { await promise; if (this.autoplayBlocked) { this.autoplayBlocked = false; this.emit(); } }
    catch (error) {
      if (error?.name === "NotAllowedError") { if (!this.autoplayBlocked) { this.autoplayBlocked = true; this.emit(); } }
      else if (error?.name !== "AbortError") this.useNextMusicCandidate();
    } finally { if (this.playPromise === promise) this.playPromise = null; }
  }

  retryAfterInteraction() { if (this.autoplayBlocked) void this.playMusic(); }

  prepareMusicCandidate(candidate) {
    if (!candidate?.id) return Promise.resolve(false);
    const existing = this.preparedMusic.get(candidate.id);
    if (existing) return existing.ready;
    const music = this.createAudio();
    const preview = selectPreview(music, candidate.previews);
    if (!preview) return Promise.resolve(false);
    let settle;
    let settled = false;
    const ready = new Promise((resolve) => { settle = resolve; });
    const finish = (value) => {
      if (settled) return;
      settled = true;
      music.removeEventListener("canplay", onReady);
      music.removeEventListener("error", onError);
      settle(value);
    };
    const onReady = () => finish(true);
    const onError = () => { this.preparedMusic.delete(candidate.id); finish(false); this.releaseEffect(music); };
    this.preparedMusic.set(candidate.id, { music, preview, ready, consume: () => finish(true), cancel: () => finish(false) });
    music.preload = "auto";
    music.addEventListener("canplay", onReady, { once: true });
    music.addEventListener("error", onError, { once: true });
    music.src = preview;
    music.load?.();
    return ready;
  }

  warmEffectCandidate(candidate) {
    if (!candidate?.id) return Promise.resolve(false);
    const audio = this.createAudio();
    const preview = selectPreview(audio, candidate.previews);
    if (!preview) return Promise.resolve(false);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ready) => {
        if (settled) return;
        settled = true;
        audio.removeEventListener("canplay", onReady);
        audio.removeEventListener("error", onError);
        this.releaseEffect(audio);
        resolve(ready);
      };
      const onReady = () => finish(true);
      const onError = () => finish(false);
      audio.preload = "auto";
      audio.addEventListener("canplay", onReady, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.src = preview;
      audio.load?.();
    });
  }

  useNextMusicCandidate() {
    this.releaseMusic(); this.musicIndex += 1;
    const candidate = this.musicCandidates[this.musicIndex];
    if (!candidate) { this.emit(); return; }
    const prepared = this.preparedMusic.get(candidate.id);
    const music = prepared?.music ?? this.createAudio();
    const preview = prepared?.preview ?? selectPreview(music, candidate.previews);
    if (!preview) { this.useNextMusicCandidate(); return; }
    prepared?.consume();
    this.preparedMusic.delete(candidate.id);
    this.music = music; music.preload = "auto"; music.loop = false; music.volume = this.volume * 0.72;
    music.addEventListener("error", this.onMusicError, { once: true }); music.src = preview; music.load?.(); this.emit(); void this.playMusic();
  }

  setEffectCandidates(slot, candidates = [], { gain = 0.82 } = {}) {
    const probe = this.createAudio();
    const sources = candidates.map(({ previews }) => selectPreview(probe, previews)).filter(Boolean);
    this.effectSources.set(slot, sources);
    this.effectGains.set(slot, Math.min(1, Math.max(0, Number(gain) || 0)));
  }

  playEffect(slot) {
    if (!this.effectsEnabled || this.activeEffects.size >= MAX_CONCURRENT_EFFECTS) return false;
    const sources = this.effectSources.get(slot); if (!sources?.length) return false;
    const now = this.now(); if (now - (this.lastEffectAt.get(slot) ?? -Infinity) < EFFECT_COOLDOWN_MS) return false;
    this.lastEffectAt.set(slot, now);
    const effect = this.createAudio(); effect.preload = "auto"; effect.volume = this.volume * (this.effectGains.get(slot) ?? 0.82); effect.src = sources[0];
    if (effect.dataset) effect.dataset.slot = slot;
    const finish = () => { effect.removeEventListener("ended", finish); effect.removeEventListener("error", onError); this.activeEffects.delete(effect); this.releaseEffect(effect); };
    const onError = () => {
      const fallback = sources[1]; if (!fallback || effect.src === fallback) { finish(); return; }
      effect.src = fallback; effect.addEventListener("error", onError, { once: true }); effect.load?.(); void effect.play().catch(finish);
    };
    effect.addEventListener("ended", finish, { once: true }); effect.addEventListener("error", onError, { once: true }); this.activeEffects.add(effect);
    void effect.play().catch(finish); return true;
  }

  stopEffects() { for (const effect of [...this.activeEffects]) this.releaseEffect(effect); this.activeEffects.clear(); }
  releaseEffect(effect) { effect.pause?.(); effect.removeAttribute?.("src"); effect.load?.(); }
  releaseMusic() {
    if (!this.music) return;
    this.music.removeEventListener("error", this.onMusicError); this.music.pause(); this.music.removeAttribute?.("src"); this.music.load?.(); this.music = null; this.playPromise = null;
  }
  destroy() {
    this.releaseMusic(); this.stopEffects();
    for (const prepared of this.preparedMusic.values()) { prepared.cancel(); this.releaseEffect(prepared.music); }
    this.preparedMusic.clear(); this.effectSources.clear(); this.effectGains.clear(); this.musicSlot = null; this.musicCandidates = []; this.musicIndex = -1; this.pauseReasons.clear(); this.listeners.clear(); this.autoplayBlocked = false;
  }
}

export const audioPlayer = new AudioPlayer();
