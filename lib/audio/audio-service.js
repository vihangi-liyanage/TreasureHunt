const STORAGE_KEY = "treasurehunt.audio.v1";
const PREFERENCE_EVENT = "treasurehunt:audio-preferences";
const DEFAULT_PREFERENCES = Object.freeze({ music: true, effects: true, volume: 70 });

export const AUDIO_TRACKS = Object.freeze({
  welcome: Object.freeze({
    bpm: 88, root: 146.83, lead: "triangle", pad: "sine",
    melody: [0, 3, 7, 10, 12, 15, 14, 10, 7, 10, 15, 19, 18, 15, 10, 6],
    chords: [[0, 3, 7], [-2, 3, 6], [3, 7, 10], [-1, 3, 7]], bass: [0, -2, 3, -1],
  }),
  "emerald-jungle": Object.freeze({
    bpm: 112, root: 196, lead: "triangle", pad: "triangle",
    melody: [0, 7, 12, 9, 7, 4, 9, 12, 14, 12, 9, 7, 4, 7, 9, 4],
    chords: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]], bass: [0, 5, 9, 7],
  }),
  "sunset-ruins": Object.freeze({
    bpm: 96, root: 174.61, lead: "sawtooth", pad: "triangle",
    melody: [0, 3, 7, 10, 12, 10, 7, 3, -2, 3, 7, 8, 7, 3, 0, -2],
    chords: [[0, 3, 7], [-2, 3, 7], [3, 7, 10], [-2, 2, 7]], bass: [0, -2, 3, -2],
  }),
  "crystal-cavern": Object.freeze({
    bpm: 72, root: 207.65, lead: "sine", pad: "sine",
    melody: [0, 7, 12, 15, 19, 15, 12, 7, 5, 12, 17, 15, 12, 10, 7, 3],
    chords: [[0, 3, 7], [5, 7, 12], [3, 7, 10], [0, 5, 10]], bass: [0, 5, 3, 0],
  }),
});

let preferenceSnapshot = DEFAULT_PREFERENCES;
let preferencesHydrated = false;

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
  if (!(["music", "effects"].includes(name)) || typeof window === "undefined") return;
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
    this.masterGain = null;
    this.limiter = null;
    this.trackId = null;
    this.musicTimer = null;
    this.musicNodes = new Set();
    this.unlocked = false;
    this.gamePaused = false;
    this.lastDamageAt = -Infinity;
  }

  ensureContext() {
    if (this.context || typeof window === "undefined") return this.context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.context = new AudioContextClass();
    this.musicGain = this.context.createGain();
    this.effectsGain = this.context.createGain();
    this.masterGain = this.context.createGain();
    this.limiter = this.context.createDynamicsCompressor?.() ?? null;
    this.musicGain.gain.value = 0.32;
    this.effectsGain.gain.value = 0.52;
    this.musicGain.connect(this.masterGain);
    this.effectsGain.connect(this.masterGain);
    if (this.limiter) {
      this.limiter.threshold.value = -12;
      this.limiter.knee.value = 12;
      this.limiter.ratio.value = 4;
      this.limiter.attack.value = 0.004;
      this.limiter.release.value = 0.24;
      this.masterGain.connect(this.limiter);
      this.limiter.connect(this.context.destination);
    } else this.masterGain.connect(this.context.destination);
    this.updateMasterVolume();
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
    this.updateMasterVolume();
    if (!preferences.music) this.stopScheduledMusic();
    else this.startMusic();
  }

  updateMasterVolume() {
    if (!this.masterGain || !this.context) return;
    const level = getAudioPreferences().volume / 100;
    if (this.masterGain.gain.setTargetAtTime) this.masterGain.gain.setTargetAtTime(level, this.context.currentTime, 0.02);
    else this.masterGain.gain.value = level;
  }

  startMusic() {
    if (!this.unlocked || this.gamePaused || !this.trackId || !getAudioPreferences().music || this.musicTimer) return;
    const context = this.ensureContext();
    if (!context || context.state !== "running") return;
    const track = AUDIO_TRACKS[this.trackId];
    const beat = 60 / track.bpm;
    const start = context.currentTime + 0.05;
    track.melody.forEach((semitone, index) => {
      this.scheduleTone({
        frequency: track.root * (2 ** (semitone / 12)),
        start: start + index * beat * 0.5,
        duration: beat * 0.44,
        type: track.lead,
        volume: track.lead === "sawtooth" ? 0.14 : 0.2,
        destination: this.musicGain,
      });
      if (index % 2 === 1) this.scheduleTone({
        frequency: track.root * 2 * (2 ** (semitone / 12)),
        start: start + index * beat * 0.5 + beat * 0.12,
        duration: beat * 0.28,
        type: "sine",
        volume: 0.055,
        destination: this.musicGain,
      });
    });
    track.chords.forEach((chord, index) => chord.forEach((semitone) => this.scheduleTone({
      frequency: (track.root / 2) * (2 ** (semitone / 12)),
      start: start + index * beat * 2,
      duration: beat * 1.82,
      type: track.pad,
      volume: 0.052,
      destination: this.musicGain,
    })));
    track.bass.forEach((semitone, index) => {
      this.scheduleTone({
        frequency: (track.root / 2) * (2 ** (semitone / 12)),
        start: start + index * beat * 2,
        duration: beat * 1.55,
        type: "sine",
        volume: 0.15,
        destination: this.musicGain,
      });
    });
    const loopMs = beat * 8 * 1_000;
    this.musicTimer = window.setTimeout(() => {
      this.musicTimer = null;
      this.startMusic();
    }, Math.max(100, loopMs - 100));
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
    if (name === "damage" && now - this.lastDamageAt < 0.12) return;
    if (name === "damage") this.lastDamageAt = now;
    const tone = (frequency, delay, duration, type = "sine", endFrequency = null, volume = 0.45) => this.scheduleTone({
      frequency, start: now + delay, duration, type, endFrequency, volume, destination: this.effectsGain,
    });
    if (name === "coin") {
      tone(740, 0, 0.09, "sine", 1_040, 0.5); tone(1_040, 0.07, 0.14, "triangle", 1_420, 0.38);
    } else if (name === "gem") {
      tone(523.25, 0, 0.18, "triangle", null, 0.48); tone(659.25, 0.07, 0.2, "triangle", null, 0.44); tone(783.99, 0.14, 0.28, "sine", 1_046.5, 0.4);
    } else if (name === "fish") {
      tone(330, 0, 0.14, "sine", 520, 0.48); tone(440, 0.1, 0.2, "triangle", 700, 0.44); tone(660, 0.21, 0.26, "sine", 990, 0.38);
    } else if (name === "gameover") {
      tone(392, 0.16, 0.34, "triangle", 330, 0.52); tone(196, 0.16, 0.42, "sine", 164.81, 0.36);
      tone(330, 0.41, 0.42, "triangle", 246.94, 0.5); tone(246.94, 0.72, 0.7, "sine", 123.47, 0.48);
      tone(98, 0.72, 0.82, "sine", 65.41, 0.34);
    } else if (name === "damage") {
      tone(190, 0, 0.16, "sawtooth", 92, 0.46); tone(120, 0.02, 0.2, "triangle", 70, 0.38); tone(65, 0, 0.14, "sine", 48, 0.32);
    } else if (name === "extra-life") {
      tone(392, 0, 0.2, "sine", 523.25, 0.42); tone(523.25, 0.1, 0.24, "triangle", 659.25, 0.42);
      tone(659.25, 0.21, 0.28, "triangle", 783.99, 0.4); tone(783.99, 0.34, 0.4, "sine", 1_046.5, 0.38);
    } else if (name === "countdown") {
      tone(440, 0, 0.13, "triangle", 392, 0.42);
    } else if (name === "countdown-go") {
      tone(523.25, 0, 0.2, "triangle", 659.25, 0.44); tone(659.25, 0.06, 0.24, "triangle", 783.99, 0.42); tone(783.99, 0.12, 0.32, "sine", 1_046.5, 0.4);
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
    this.masterGain = null;
    this.limiter = null;
    this.unlocked = false;
    this.lastDamageAt = -Infinity;
  }
}

export const audioService = new AudioService();
