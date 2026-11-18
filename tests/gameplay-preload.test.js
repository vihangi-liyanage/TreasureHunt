import { describe, expect, it, vi } from "vitest";
import { createGameplayPreloader, getGameplayAssetUrls } from "@/game/preload-gameplay";
import { getLevelConfig } from "@/game/config/levels";
import { loadGameAssets } from "@/game/render/load-assets";

describe("selected-world gameplay preload", () => {
  it("contains only the shared hunter and selected world's required textures", () => {
    const emerald = getGameplayAssetUrls(getLevelConfig("emerald-jungle"));
    expect(emerald).toEqual([
      "/art/gameplay/hunter-atlas.png",
      "/art/gameplay/emerald-jungle-panorama.png",
      "/art/gameplay/jungle-objects-atlas.png",
      "/art/gameplay/jungle-terrain-atlas.png",
    ]);
    expect(emerald.some((url) => url.includes("sunset"))).toBe(false);
  });

  it("deduplicates concurrent runtime and asset requests across repeated launches", async () => {
    const loadRuntime = vi.fn(async () => ({ createTreasureHuntGame: vi.fn() }));
    const loadImage = vi.fn(async (url) => url);
    const preloader = createGameplayPreloader({ loadRuntime, loadImage });

    const [first] = await Promise.all([
      preloader.preloadWorld("emerald-jungle"),
      preloader.preloadWorld("emerald-jungle"),
    ]);
    expect(first.assetUrls["/art/gameplay/emerald-jungle-panorama.png"]).toBe("/art/gameplay/emerald-jungle-panorama.png");
    expect(preloader.isWorldPreloaded("emerald-jungle")).toBe(true);
    expect(preloader.isWorldPreloaded("sunset-ruins")).toBe(false);
    await preloader.preloadWorld("sunset-ruins");

    expect(loadRuntime).toHaveBeenCalledTimes(1);
    expect(loadImage).toHaveBeenCalledTimes(7);
    expect(loadImage.mock.calls.filter(([url]) => url.endsWith("hunter-atlas.png"))).toHaveLength(1);
  });

  it("evicts a failed asset request so a real retry can succeed", async () => {
    let attempts = 0;
    const loadImage = vi.fn(async (url) => {
      if (url.endsWith("sunset-terrain-atlas.png") && attempts++ === 0) throw new Error("network unavailable");
      return url;
    });
    const preloader = createGameplayPreloader({
      loadRuntime: async () => ({ createTreasureHuntGame: vi.fn() }),
      loadImage,
    });

    await expect(preloader.preloadWorld("sunset-ruins")).rejects.toThrow("network unavailable");
    expect(preloader.isWorldPreloaded("sunset-ruins")).toBe(false);
    await expect(preloader.preloadWorld("sunset-ruins")).resolves.toHaveProperty("createTreasureHuntGame");
    expect(preloader.isWorldPreloaded("sunset-ruins")).toBe(true);
    expect(loadImage.mock.calls.filter(([url]) => url.endsWith("sunset-terrain-atlas.png"))).toHaveLength(2);
  });

  it("rejects unknown worlds rather than faking readiness", async () => {
    const preloader = createGameplayPreloader({ loadRuntime: vi.fn(), loadImage: vi.fn() });
    await expect(preloader.preloadWorld("unknown-world")).rejects.toThrow("No playable level");
  });

  it("passes prepared resource URLs into Phaser's normal texture loader", () => {
    const image = vi.fn();
    const spritesheet = vi.fn();
    const art = getLevelConfig("emerald-jungle").art;
    const prepared = {
      "/art/gameplay/emerald-jungle-panorama.png": "blob:prepared-panorama",
      "/art/gameplay/hunter-atlas.png": "blob:prepared-hunter",
      "/art/gameplay/jungle-objects-atlas.png": "blob:prepared-objects",
      "/art/gameplay/jungle-terrain-atlas.png": "blob:prepared-terrain",
    };
    loadGameAssets({ load: { image, spritesheet } }, art, prepared);
    expect(image).toHaveBeenCalledWith("world-panorama", "blob:prepared-panorama");
    expect(spritesheet.mock.calls.map(([, url]) => url)).toEqual(["blob:prepared-hunter", "blob:prepared-objects", "blob:prepared-terrain"]);
  });
});
