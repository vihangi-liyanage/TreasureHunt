import { beforeEach, describe, expect, it, vi } from "vitest";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import {
  completeGuestWorld,
  deriveWorldStates,
  getJourneyProgress,
  GUEST_PROGRESS_KEY,
  readGuestProgress,
  recordGuestCollectible,
  startGuestAdventure,
} from "@/lib/progress/guest-progress";

function createMemoryStorage(values = {}) {
  const entries = new Map(Object.entries(values));
  return {
    removeItem: vi.fn((key) => entries.delete(key)),
    snapshot: () => Object.fromEntries(entries),
  };
}

describe("guest adventure progression", () => {
  beforeEach(() => startGuestAdventure(createMemoryStorage()));

  it("starts every guest entry with only Emerald Jungle current", () => {
    completeGuestWorld(WORLD_CONFIGS, "emerald-jungle");
    const storage = createMemoryStorage({
      [GUEST_PROGRESS_KEY]: JSON.stringify({ completedWorldIds: ["emerald-jungle"] }),
      "unrelated.preference": "keep-me",
    });

    expect(startGuestAdventure(storage)).toEqual({ completedWorldIds: [], gems: 0, fishPowerUps: 0, achievementKeys: [] });
    expect(storage.removeItem).toHaveBeenCalledWith(GUEST_PROGRESS_KEY);
    expect(storage.snapshot()).toEqual({ "unrelated.preference": "keep-me" });
    expect(deriveWorldStates(WORLD_CONFIGS, readGuestProgress().completedWorldIds).map(({ locked, current }) => ({ locked, current }))).toEqual([
      { locked: false, current: true },
      { locked: true, current: false },
      { locked: true, current: false },
    ]);
  });

  it("unlocks worlds sequentially during one active guest adventure", () => {
    expect(completeGuestWorld(WORLD_CONFIGS, "emerald-jungle").completedWorldIds).toEqual(["emerald-jungle"]);
    expect(completeGuestWorld(WORLD_CONFIGS, "sunset-ruins").completedWorldIds).toEqual(["emerald-jungle", "sunset-ruins"]);
    const states = deriveWorldStates(WORLD_CONFIGS, readGuestProgress().completedWorldIds);
    expect(states[2]).toMatchObject({ current: true, locked: false });
    expect(getJourneyProgress(WORLD_CONFIGS, readGuestProgress().completedWorldIds)).toBe(100);
    expect(completeGuestWorld(WORLD_CONFIGS, "crystal-cavern").completedWorldIds).toEqual([
      "emerald-jungle", "sunset-ruins", "crystal-cavern",
    ]);
    expect(deriveWorldStates(WORLD_CONFIGS, readGuestProgress().completedWorldIds).every((world) => world.completed && !world.current)).toBe(true);
  });

  it("rejects out-of-order and duplicate guest completions", () => {
    expect(completeGuestWorld(WORLD_CONFIGS, "sunset-ruins").completedWorldIds).toEqual([]);
    completeGuestWorld(WORLD_CONFIGS, "emerald-jungle");
    expect(completeGuestWorld(WORLD_CONFIGS, "emerald-jungle").completedWorldIds).toEqual(["emerald-jungle"]);
  });

  it("keeps authenticated progress independent across guest transitions", () => {
    const registeredCompletedWorldIds = Object.freeze(["emerald-jungle", "sunset-ruins"]);
    completeGuestWorld(WORLD_CONFIGS, "emerald-jungle");
    startGuestAdventure(createMemoryStorage());

    expect(readGuestProgress().completedWorldIds).toEqual([]);
    expect(deriveWorldStates(WORLD_CONFIGS, registeredCompletedWorldIds)[2]).toMatchObject({ current: true, locked: false });
    expect(registeredCompletedWorldIds).toEqual(["emerald-jungle", "sunset-ruins"]);
  });

  it("keeps guest achievement stats temporary and awards thresholds once", () => {
    expect(recordGuestCollectible("gem").unlockedAchievementKeys).toEqual(["first_gem"]);
    recordGuestCollectible("gem"); recordGuestCollectible("gem"); recordGuestCollectible("gem");
    expect(recordGuestCollectible("gem").unlockedAchievementKeys).toEqual(["five_gems"]);
    expect(recordGuestCollectible("fish").unlockedAchievementKeys).toEqual(["first_fish_power"]);
    expect(recordGuestCollectible("fish").unlockedAchievementKeys).toEqual([]);
    startGuestAdventure(createMemoryStorage());
    expect(readGuestProgress()).toMatchObject({ gems: 0, fishPowerUps: 0, achievementKeys: [] });
  });
});
