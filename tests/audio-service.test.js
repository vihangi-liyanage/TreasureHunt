import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("audio preferences and soundtrack routing", () => {
  it("selects four distinct project-original soundtracks", async () => {
    const { AUDIO_TRACKS, getTrackForPath } = await import("@/lib/audio/audio-service");
    expect(getTrackForPath("/welcome")).toBe("welcome");
    expect(getTrackForPath("/game/emerald-jungle")).toBe("emerald-jungle");
    expect(getTrackForPath("/game/sunset-ruins?mode=guest")).toBe("sunset-ruins");
    expect(getTrackForPath("/game/crystal-cavern")).toBe("crystal-cavern");
    expect(getTrackForPath("/worlds")).toBeNull();
    expect(new Set(Object.values(AUDIO_TRACKS).map((track) => track.bpm)).size).toBe(4);
  });

  it("persists music and effects independently", async () => {
    const stored = new Map();
    const browserWindow = new EventTarget();
    browserWindow.localStorage = {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    };
    vi.stubGlobal("window", browserWindow);
    vi.stubGlobal("CustomEvent", class extends Event { constructor(type) { super(type); } });
    const { getAudioPreferences, hydrateAudioPreferences, setAudioPreference } = await import("@/lib/audio/audio-service");

    hydrateAudioPreferences();
    setAudioPreference("music", false);
    expect(getAudioPreferences()).toEqual({ music: false, effects: true, volume: 70 });
    setAudioPreference("effects", false);
    expect(JSON.parse(stored.get("treasurehunt.audio.v1"))).toEqual({ music: false, effects: false, volume: 70 });
  });

  it("synthesizes only the four requested effect cues", async () => {
    const oscillators = [];
    class FakeAudioContext {
      constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; }
      createGain() { return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      createDynamicsCompressor() { return { threshold: {}, knee: {}, ratio: {}, attack: {}, release: {}, connect() {} }; }
      createOscillator() {
        const oscillator = {
          frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {}, start() {}, stop() {}, addEventListener() {},
        };
        oscillators.push(oscillator);
        return oscillator;
      }
      resume() { return Promise.resolve(); }
      close() { return Promise.resolve(); }
    }
    const browserWindow = new EventTarget();
    browserWindow.AudioContext = FakeAudioContext;
    browserWindow.localStorage = { getItem: () => null, setItem() {} };
    vi.stubGlobal("window", browserWindow);
    vi.stubGlobal("CustomEvent", class extends Event { constructor(type) { super(type); } });
    const { audioService, hydrateAudioPreferences } = await import("@/lib/audio/audio-service");

    hydrateAudioPreferences();
    await audioService.unlock();
    ["coin", "gem", "fish", "gameover"].forEach((effect) => audioService.playEffect(effect));
    expect(oscillators).toHaveLength(13);
    audioService.playEffect("jump");
    expect(oscillators).toHaveLength(13);
    ["damage", "damage", "extra-life", "countdown", "countdown-go"].forEach((effect) => audioService.playEffect(effect));
    expect(oscillators).toHaveLength(24);
  });

  it("clamps and persists the shared volume percentage", async () => {
    const stored = new Map();
    const browserWindow = new EventTarget();
    browserWindow.localStorage = { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
    vi.stubGlobal("window", browserWindow);
    vi.stubGlobal("CustomEvent", class extends Event { constructor(type) { super(type); } });
    const { getAudioPreferences, setAudioVolume } = await import("@/lib/audio/audio-service");

    setAudioVolume(115);
    expect(getAudioPreferences().volume).toBe(100);
    setAudioVolume(-5);
    expect(getAudioPreferences().volume).toBe(0);
    setAudioVolume(63.6);
    expect(JSON.parse(stored.get("treasurehunt.audio.v1")).volume).toBe(64);
  });

  it("gives the welcome screen a distinct minor treasure-hunt theme", async () => {
    const { AUDIO_TRACKS } = await import("@/lib/audio/audio-service");
    expect(AUDIO_TRACKS.welcome.root).toBeLessThan(160);
    expect(AUDIO_TRACKS.welcome.chords[0]).toEqual([0, 3, 7]);
    expect(AUDIO_TRACKS.welcome.melody).toContain(6);
  });
});
