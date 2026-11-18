import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("audio preferences", () => {
  it("persists music and effects independently", async () => {
    const stored = new Map();
    const browserWindow = new EventTarget();
    browserWindow.localStorage = {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    };
    vi.stubGlobal("window", browserWindow);
    vi.stubGlobal("CustomEvent", class extends Event { constructor(type) { super(type); } });
    const { getAudioPreferences, hydrateAudioPreferences, setAudioPreference } = await import("@/lib/audio/audio-player");

    hydrateAudioPreferences();
    setAudioPreference("music", false);
    expect(getAudioPreferences()).toEqual({ music: false, effects: true, volume: 70 });
    setAudioPreference("effects", false);
    expect(JSON.parse(stored.get("treasurehunt.audio.v1"))).toEqual({ music: false, effects: false, volume: 70 });
  });

  it("clamps and persists the shared volume percentage", async () => {
    const stored = new Map();
    const browserWindow = new EventTarget();
    browserWindow.localStorage = { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
    vi.stubGlobal("window", browserWindow);
    vi.stubGlobal("CustomEvent", class extends Event { constructor(type) { super(type); } });
    const { getAudioPreferences, setAudioVolume } = await import("@/lib/audio/audio-player");

    setAudioVolume(115);
    expect(getAudioPreferences().volume).toBe(100);
    setAudioVolume(-5);
    expect(getAudioPreferences().volume).toBe(0);
    setAudioVolume(63.6);
    expect(JSON.parse(stored.get("treasurehunt.audio.v1")).volume).toBe(64);
  });

  it("contains no browser audio playback implementation", async () => {
    const audioPreferences = await import("@/lib/audio/audio-player");
    expect(audioPreferences).not.toHaveProperty("audioService");
    expect(audioPreferences).not.toHaveProperty("AUDIO_TRACKS");
  });
});
