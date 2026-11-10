const STORAGE_KEY = "treasurehunt.audio.v1";
const PREFERENCE_EVENT = "treasurehunt:audio-preferences";
const DEFAULT_PREFERENCES = Object.freeze({ music: true, effects: true });

export const AUDIO_TRACKS = Object.freeze({
  welcome: Object.freeze({ bpm: 76, wave: "sine", melody: [0, 4, 7, 11, 7, 4, 2, 7], bass: [0, 5], root: 220 }),
  "emerald-jungle": Object.freeze({ bpm: 104, wave: "triangle", melody: [0, 7, 4, 9, 7, 12, 9, 4], bass: [0, 5], root: 196 }),
  "sunset-ruins": Object.freeze({ bpm: 92, wave: "sawtooth", melody: [0, 3, 7, 10, 7, 3, -2, 3], bass: [0, -2], root: 174.61 }),
  "crystal-cavern": Object.freeze({ bpm: 68, wave: "sine", melody: [0, 7, 12, 15, 12, 7, 5, 12], bass: [0, 3], root: 207.65 }),
});

let preferenceSnapshot = DEFAULT_PREFERENCES;
let preferencesHydrated = false;

function normalizePreferences(value) {
  return Object.freeze({
    music: typeof value?.music === "boolean" ? value.music : true,
    effects: typeof value?.effects === "boolean" ? value.effects : true,
  });
}

export function hydrateAudioPreferences() {
  if (preferencesHydrated || typeof window === "undefined") return preferenceSnapshot;
  preferencesHydrated = true;
  try {
    preferenceSnapshot = normalizePreferences(JSON.parse(window.localStorage.getItem(STORAGE_KEY)));
  } catch {
    preferenceSnapshot = DEFAULT_PREFERENCES;
  }
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT));
  return preferenceSnapshot;
}

export function getAudioPreferences() {
  return preferenceSnapshot;
}

export function getServerAudioPreferences() {
  return DEFAULT_PREFERENCES;
}

export function subscribeAudioPreferences(listener) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PREFERENCE_EVENT, listener);
  return () => window.removeEventListener(PREFERENCE_EVENT, listener);
}

export function setAudioPreference(name, enabled) {
  if (!(name in DEFAULT_PREFERENCES) || typeof window === "undefined") return;
  preferenceSnapshot = normalizePreferences({ ...hydrateAudioPreferences(), [name]: Boolean(enabled) });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferenceSnapshot));
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT));
}

export function getTrackForPath(pathname) {
  if (pathname === "/welcome") return "welcome";
  const match = /^\/game\/([^/?]+)/.exec(pathname || "");
  return match && AUDIO_TRACKS[match[1]] ? match[1] : null;
}

class AudioService {
  constructor() {
    this.context = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.trackId = null;
    this.musicTimer = null;
    this.musicNodes = new Set();
    this.unlocked = false;
    this.gamePaused = false;
  }

  ensureContext() {
    if (this.context || typeof window === "undefined") return this.context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.context = new AudioContextClass();
    this.musicGain = this.context.createGain();
    this.effectsGain = this.context.createGain();
    this.musicGain.gain.value = 0.055;
    this.effectsGain.gain.value = 0.16;
    this.musicGain.connect(this.context.destination);
    this.effectsGain.connect(this.context.destination);
    return this.context;
  }

  async unlock() {
    const context = this.ensureContext();
    if (!context) return;
    if (context.state === "suspended") await context.resume().catch(() => undefined);
    this.unlocked = context.state === "running";
    if (this.unlocked) this.startMusic();
  }

  setMusic(trackId) {
    if (this.trackId === trackId) return;
    this.stopMusic();
    this.trackId = AUDIO_TRACKS[trackId] ? trackId : null;
    this.startMusic();
  }

  setGamePaused(paused) {
    this.gamePaused = Boolean(paused);
    if (this.gamePaused) this.stopScheduledMusic();
    else this.startMusic();
  }

  applyPreferences() {
    const preferences = getAudioPreferences();
    if (!preferences.music) this.stopScheduledMusic();
    else this.startMusic();
  }

  startMusic() {
    if (!this.unlocked || this.gamePaused || !this.trackId || !getAudioPreferences().music || this.musicTimer) return;
    const context = this.ensureContext();
    if (!context || context.state !== "running") return;
    const track = AUDIO_TRACKS[this.trackId];
    const beat = 60 / track.bpm;
    const start = context.currentTime + 0.04;
    track.melody.forEach((semitone, index) => {
      this.scheduleTone({
        frequency: track.root * (2 ** (semitone / 12)),
        start: start + index * beat * 0.5,
        duration: beat * 0.42,
        type: track.wave,
        volume: track.wave === "sawtooth" ? 0.12 : 0.18,
        destination: this.musicGain,
      });
    });
    track.bass.forEach((semitone, index) => {
      this.scheduleTone({
        frequency: (track.root / 2) * (2 ** (semitone / 12)),
        start: start + index * beat * 2,
        duration: beat * 1.7,
        type: "sine",
        volume: 0.16,
        destination: this.musicGain,
      });
    });
    const loopMs = beat * 4 * 1_000;
    this.musicTimer = window.setTimeout(() => {
      this.musicTimer = null;
      this.startMusic();
    }, Math.max(100, loopMs - 80));
  }

  scheduleTone({ frequency, start, duration, type, volume, destination, endFrequency = null }) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.035, duration / 3));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    if (destination === this.musicGain) {
      this.musicNodes.add(oscillator);
      oscillator.addEventListener("ended", () => this.musicNodes.delete(oscillator), { once: true });
    }
  }

  playEffect(name) {
    if (!getAudioPreferences().effects) return;
    const context = this.ensureContext();
    if (!this.unlocked || !context || context.state !== "running") return;
    const now = context.currentTime;
    const tone = (frequency, delay, duration, type = "sine", endFrequency = null, volume = 0.35) => this.scheduleTone({
      frequency, start: now + delay, duration, type, endFrequency, volume, destination: this.effectsGain,
    });
    if (name === "coin") {
      tone(740, 0, 0.08, "sine", 980); tone(980, 0.07, 0.11, "sine", 1_280, 0.28);
    } else if (name === "gem") {
      tone(523.25, 0, 0.16, "triangle"); tone(659.25, 0.07, 0.18, "triangle"); tone(783.99, 0.14, 0.24, "sine");
    } else if (name === "fish") {
      tone(330, 0, 0.12, "sine", 520); tone(440, 0.1, 0.16, "triangle", 700); tone(660, 0.2, 0.2, "sine", 880, 0.25);
    } else if (name === "gameover") {
      tone(392, 0, 0.3, "triangle", 330); tone(330, 0.24, 0.36, "triangle", 247); tone(247, 0.52, 0.55, "sine", 146.83, 0.3);
    }
  }

  stopScheduledMusic() {
    if (this.musicTimer) window.clearTimeout(this.musicTimer);
    this.musicTimer = null;
    for (const node of this.musicNodes) {
      try { node.stop(); } catch { /* The node may already have ended. */ }
    }
    this.musicNodes.clear();
  }

  stopMusic() {
    this.stopScheduledMusic();
  }

  destroy() {
    this.stopMusic();
    this.context?.close().catch(() => undefined);
    this.context = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.unlocked = false;
  }
}

export const audioService = new AudioService();
