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
    expect(getAudioPreferences()).toEqual({ music: false, effects: true });
    setAudioPreference("effects", false);
    expect(JSON.parse(stored.get("treasurehunt.audio.v1"))).toEqual({ music: false, effects: false });
  });

  it("synthesizes only the four requested effect cues", async () => {
    const oscillators = [];
    class FakeAudioContext {
      constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; }
      createGain() { return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
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
    expect(oscillators).toHaveLength(11);
    audioService.playEffect("jump");
    expect(oscillators).toHaveLength(11);
  });
});
