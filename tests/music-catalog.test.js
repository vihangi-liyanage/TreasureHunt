import { describe, expect, it } from "vitest";
import { AUDIO_CATALOG_SLOTS, getMusicSlotForPath, selectConfiguredCandidates } from "@/lib/audio/audio-catalog";

describe("background music configuration", () => {
  it("maps only the welcome page and three playable worlds", () => {
    expect(getMusicSlotForPath("/welcome")).toBe("welcome");
    expect(getMusicSlotForPath("/game/emerald-jungle")).toBe("emerald-jungle");
    expect(getMusicSlotForPath("/game/sunset-ruins")).toBe("sunset-ruins");
    expect(getMusicSlotForPath("/game/crystal-cavern")).toBe("crystal-cavern");
    expect(getMusicSlotForPath("/worlds")).toBeNull();
    expect(getMusicSlotForPath("/login")).toBeNull();
  });

  it("keeps traceable primary and fallback IDs in one configuration", () => {
    expect(AUDIO_CATALOG_SLOTS.welcome.selectedIds).toEqual([477602, 520192]);
    expect(AUDIO_CATALOG_SLOTS["emerald-jungle"].selectedIds).toEqual([573973, 548002]);
    expect(AUDIO_CATALOG_SLOTS["sunset-ruins"].selectedIds).toEqual([686838, 734130]);
    expect(AUDIO_CATALOG_SLOTS["crystal-cavern"].selectedIds).toEqual([611095, 770064]);
    expect(AUDIO_CATALOG_SLOTS.projectile.selectedIds).toEqual([459145, 478215]);
    expect(AUDIO_CATALOG_SLOTS.countdown.selectedIds).toEqual([515317, 391650]);
    expect(AUDIO_CATALOG_SLOTS["countdown-go"].selectedIds).toEqual([368691, 758957]);
    expect(AUDIO_CATALOG_SLOTS["game-over"].selectedIds).toEqual([404743, 848654]);
    expect(AUDIO_CATALOG_SLOTS.projectile.gain).toBeLessThan(AUDIO_CATALOG_SLOTS.coin.gain);
  });

  it("returns configured candidates in approved order and omits missing IDs", () => {
    const candidates = [{ id: 520192 }, { id: 999 }, { id: 477602 }];
    expect(selectConfiguredCandidates("welcome", candidates).map(({ id }) => id)).toEqual([477602, 520192]);
    expect(selectConfiguredCandidates("coin", candidates)).toEqual([]);
  });
});
