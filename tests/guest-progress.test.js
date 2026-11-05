import { describe, expect, it } from "vitest";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { completeGuestWorld, deriveWorldStates, getJourneyProgress, GUEST_PROGRESS_KEY } from "@/lib/progress/guest-progress";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("guest world progression", () => {
  it("starts with only Emerald Jungle current and unlocked", () => {
    const states = deriveWorldStates(WORLD_CONFIGS, []);
    expect(states.map(({ locked, current, completed }) => ({ locked, current, completed }))).toEqual([
      { locked: false, current: true, completed: false },
      { locked: true, current: false, completed: false },
      { locked: true, current: false, completed: false },
    ]);
  });

  it("unlocks each world only after the preceding completion", () => {
    const afterWorldOne = deriveWorldStates(WORLD_CONFIGS, ["emerald-jungle"]);
    expect(afterWorldOne[0].completed).toBe(true);
    expect(afterWorldOne[1]).toMatchObject({ current: true, locked: false });
    expect(afterWorldOne[2].locked).toBe(true);

    const afterWorldTwo = deriveWorldStates(WORLD_CONFIGS, ["emerald-jungle", "sunset-ruins"]);
    expect(afterWorldTwo[2]).toMatchObject({ current: true, locked: false });
    expect(getJourneyProgress(WORLD_CONFIGS, afterWorldTwo.filter((world) => world.completed).map((world) => world.id))).toBe(100);
  });

  it("rejects out-of-order completions", () => {
    const states = deriveWorldStates(WORLD_CONFIGS, ["crystal-cavern"]);
    expect(states[0].current).toBe(true);
    expect(states[2].locked).toBe(true);
  });

  it("stores a valid current-world completion locally", () => {
    const storage = createMemoryStorage();
    const progress = completeGuestWorld(WORLD_CONFIGS, "emerald-jungle", storage);
    expect(progress.completedWorldIds).toEqual(["emerald-jungle"]);
    expect(JSON.parse(storage.getItem(GUEST_PROGRESS_KEY))).toMatchObject({ version: 1, completedWorldIds: ["emerald-jungle"] });
  });

  it("keeps World 2 unlocked when World 1 is replayed and completed again", () => {
    const storage = createMemoryStorage();
    completeGuestWorld(WORLD_CONFIGS, "emerald-jungle", storage);
    const replayCompletion = completeGuestWorld(WORLD_CONFIGS, "emerald-jungle", storage);
    const states = deriveWorldStates(WORLD_CONFIGS, replayCompletion.completedWorldIds);
    expect(replayCompletion.completedWorldIds).toEqual(["emerald-jungle"]);
    expect(states[0]).toMatchObject({ completed:true, current:false });
    expect(states[1]).toMatchObject({ locked:false, current:true });
  });
});
