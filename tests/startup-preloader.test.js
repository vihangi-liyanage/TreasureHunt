import { describe, expect, it, vi } from "vitest";
import { createStartupPreloader, STARTUP_AUDIO_SLOTS, STARTUP_IMAGES, STARTUP_WORLDS } from "@/lib/startup-preloader";

const selectedIds = Object.freeze({ welcome: 477602, "emerald-jungle": 573973, "sunset-ruins": 686838, "crystal-cavern": 611095, jump: 350906, coin: 402767, gem: 876169, "fish-power-up": 220173, projectile: 459145, damage: 878323 });
const candidate = (id) => Object.freeze({ id, previews: Object.freeze({ "preview-hq-mp3": `https://cdn.freesound.org/previews/${id}.mp3` }) });
const welcomeCandidate = candidate(selectedIds.welcome);

function catalog(slot) {
  return { candidates: selectedIds[slot] ? [candidate(selectedIds[slot])] : [] };
}

describe("startup asset preloader", () => {
  it("reports progress only as real preload work settles", async () => {
    const progress = [];
    const preloadImage = vi.fn(async () => true);
    const preloadWorld = vi.fn(async () => true);
    const loadCatalog = vi.fn(async (slot) => catalog(slot));
    const prepareWelcomeMusic = vi.fn(async () => true);
    const prepareWorldMusic = vi.fn(async () => true);
    const warmEffect = vi.fn(async () => true);
    const preload = createStartupPreloader({ preloadImage, preloadWorld, loadCatalog, prepareWelcomeMusic, prepareWorldMusic, warmEffect, timeoutMs: 1_000 });

    const result = await preload({ onProgress: (state) => progress.push(state) });

    expect(result.timedOut).toBe(false);
    expect(result.requiredFailures).toEqual([]);
    expect(progress.at(-1)).toMatchObject({ completed: 15, total: 15, progress: 1, status: "Adventure ready!" });
    expect(preloadImage).toHaveBeenCalledTimes(STARTUP_IMAGES.length);
    expect(preloadWorld).toHaveBeenCalledTimes(STARTUP_WORLDS.length);
    expect(loadCatalog.mock.calls.slice(0, STARTUP_AUDIO_SLOTS.length)).toHaveLength(STARTUP_AUDIO_SLOTS.length);
    expect(prepareWelcomeMusic).toHaveBeenCalledWith(welcomeCandidate);
    expect(prepareWorldMusic).toHaveBeenCalledTimes(3);
    expect(warmEffect).toHaveBeenCalledTimes(6);
  });

  it("reports required artwork failures instead of inventing readiness", async () => {
    const preload = createStartupPreloader({
      preloadImage: vi.fn(async (url) => { if (url.includes("worlds-atlas")) throw new Error("offline"); }),
      preloadWorld: vi.fn(async () => true),
      loadCatalog: vi.fn(async (slot) => catalog(slot)),
      prepareWelcomeMusic: vi.fn(async () => true),
      prepareWorldMusic: vi.fn(async () => true),
      warmEffect: vi.fn(async () => true),
      timeoutMs: 1_000,
    });
    const result = await preload();
    expect(result.requiredFailures).toEqual(["image:/art/worlds-atlas.png"]);
    expect(result.results.get("image:/art/worlds-atlas.png")).toBe("failed");
  });

  it("returns deferred work at the bounded timeout without hanging", async () => {
    const never = new Promise(() => {});
    const preload = createStartupPreloader({
      preloadImage: vi.fn(() => never),
      preloadWorld: vi.fn(() => never),
      loadCatalog: vi.fn(() => never),
      prepareWelcomeMusic: vi.fn(() => never),
      prepareWorldMusic: vi.fn(() => never),
      warmEffect: vi.fn(() => never),
      timeoutMs: 5,
    });
    const result = await preload();
    expect(result.timedOut).toBe(true);
    expect(result.deferred.length).toBeGreaterThan(0);
    expect(result.results.size).toBe(0);
  });
});
