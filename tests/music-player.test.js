import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayer } from "@/lib/audio/audio-player";

class FakeAudio extends EventTarget {
  constructor(play = vi.fn().mockResolvedValue(undefined)) {
    super();
    this.play = play;
    this.pause = vi.fn(() => { this.paused = true; });
    this.load = vi.fn();
    this.removeAttribute = vi.fn();
    this.canPlayType = vi.fn(() => "probably");
    this.paused = true;
    this.volume = 1;
    this.loop = false;
    this.src = "";
    this.dataset = {};
  }
}

const candidate = (id, suffix = "mp3") => ({
  id,
  previews: { [`preview-hq-${suffix}`]: `https://cdn.freesound.org/previews/${id}.${suffix}` },
});

let audios;
let player;

beforeEach(() => {
  audios = [];
  player = new AudioPlayer({ createAudio: () => {
    const audio = new FakeAudio();
    audios.push(audio);
    return audio;
  } });
});

describe("HTML audio music player", () => {
  it("reuses a prepared Welcome media element instead of downloading it again", async () => {
    const ready = player.prepareMusicCandidate(candidate(1));
    expect(audios).toHaveLength(1);
    audios[0].dispatchEvent(new Event("canplay"));
    await expect(ready).resolves.toBe(true);
    player.setTrack("welcome", [candidate(1)]);
    expect(audios).toHaveLength(1);
    expect(audios[0].play).toHaveBeenCalledOnce();
  });

  it("warms an effect preview without playing it", async () => {
    const ready = player.warmEffectCandidate(candidate(9));
    const audio = audios[0];
    expect(audio.play).not.toHaveBeenCalled();
    audio.dispatchEvent(new Event("canplay"));
    await expect(ready).resolves.toBe(true);
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.removeAttribute).toHaveBeenCalledWith("src");
  });

  it("creates no duplicate playback for the same route and candidates", async () => {
    player.setTrack("welcome", [candidate(1)]);
    player.setTrack("welcome", [candidate(1)]);
    await Promise.resolve();
    expect(audios).toHaveLength(1);
    expect(audios[0].play).toHaveBeenCalledOnce();
    expect(audios[0].loop).toBe(false);
  });

  it("switches tracks without overlap and cleans released media", () => {
    player.setTrack("welcome", [candidate(1)]);
    const first = audios[0];
    player.setTrack("emerald-jungle", [candidate(2)]);
    expect(first.pause).toHaveBeenCalled();
    expect(first.removeAttribute).toHaveBeenCalledWith("src");
    expect(audios).toHaveLength(2);
    expect(player.snapshot()).toMatchObject({ slot: "emerald-jungle", candidateId: 2 });
  });

  it("applies music toggle, volume, pause, and resume immediately", async () => {
    player.setTrack("welcome", [candidate(1)]);
    const audio = audios[0];
    player.setVolume(0.42);
    player.applyPreferences({ music: false, effects: true, volume: 42 });
    expect(audio.volume).toBeCloseTo(0.3024);
    expect(audio.pause).toHaveBeenCalled();
    player.applyPreferences({ music: true, effects: true, volume: 42 });
    player.setPaused("gameplay", true);
    player.setPaused("gameplay", false);
    await Promise.resolve();
    expect(audio.play.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("reports autoplay rejection and retries only after interaction", async () => {
    const play = vi.fn()
      .mockRejectedValueOnce(new DOMException("blocked", "NotAllowedError"))
      .mockResolvedValueOnce(undefined);
    player = new AudioPlayer({ createAudio: () => new FakeAudio(play) });
    const states = [];
    player.subscribe((state) => states.push(state));
    player.setTrack("welcome", [candidate(1)]);
    await Promise.resolve(); await Promise.resolve();
    expect(states.at(-1).autoplayBlocked).toBe(true);
    player.retryAfterInteraction();
    await Promise.resolve(); await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(2);
    expect(states.at(-1).autoplayBlocked).toBe(false);
  });

  it("uses the approved fallback after a media loading failure", () => {
    player.setTrack("welcome", [candidate(1), candidate(2, "ogg")]);
    audios[0].dispatchEvent(new Event("error"));
    expect(audios).toHaveLength(2);
    expect(player.snapshot().candidateId).toBe(2);
    expect(audios[1].src).toBe("https://cdn.freesound.org/previews/2.ogg");
  });

  it("fails silently after all candidates and removes listeners on destroy", () => {
    player.setTrack("welcome", [candidate(1)]);
    const first = audios[0];
    first.dispatchEvent(new Event("error"));
    expect(player.snapshot().candidateId).toBeNull();
    player.destroy();
    first.dispatchEvent(new Event("error"));
    expect(audios).toHaveLength(1);
    expect(player.snapshot().slot).toBeNull();
  });

  it("plays effects, applies the effects toggle, and uses a failed preview fallback", async () => {
    player.setEffectCandidates("coin", [candidate(10), candidate(11, "ogg")]);
    expect(player.playEffect("coin")).toBe(true);
    const effect = audios.at(-1);
    expect(effect.src).toBe("https://cdn.freesound.org/previews/10.mp3");
    effect.dispatchEvent(new Event("error"));
    expect(effect.src).toBe("https://cdn.freesound.org/previews/11.ogg");
    player.applyPreferences({ music: true, effects: false, volume: 70 });
    expect(effect.pause).toHaveBeenCalled();
    expect(player.playEffect("coin")).toBe(false);
  });

  it("applies per-effect gain so frequent projectile audio stays below ordinary effects", () => {
    player.setEffectCandidates("projectile", [candidate(12)], { gain: 0.48 });
    player.setVolume(0.7);
    expect(player.playEffect("projectile")).toBe(true);
    expect(audios.at(-1).volume).toBeCloseTo(0.336);
    player.setVolume(0.5);
    expect(audios.at(-1).volume).toBeCloseTo(0.24);
  });

  it("rate-limits rapid repeated effects and bounds concurrent voices", () => {
    let now = 100;
    player = new AudioPlayer({ now: () => now, createAudio: () => new FakeAudio() });
    for (let index = 0; index < 9; index += 1) player.setEffectCandidates(`effect-${index}`, [candidate(index + 20)]);
    expect(player.playEffect("effect-0")).toBe(true);
    expect(player.playEffect("effect-0")).toBe(false);
    now += 50;
    expect(player.playEffect("effect-0")).toBe(true);
    for (let index = 1; index < 7; index += 1) expect(player.playEffect(`effect-${index}`)).toBe(true);
    expect(player.playEffect("effect-7")).toBe(false);
  });
});
