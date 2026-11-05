import { beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeToGuestProgress } from "@/components/worlds/use-guest-world-progress";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { completeGuestWorld, startGuestAdventure } from "@/lib/progress/guest-progress";

describe("guest progress in-memory events", () => {
  beforeEach(() => startGuestAdventure({ removeItem: vi.fn() }));

  it("publishes active-adventure changes and stops after unsubscribe", () => {
    const onProgress = vi.fn();
    const unsubscribe = subscribeToGuestProgress(onProgress);

    expect(onProgress).toHaveBeenLastCalledWith([]);
    completeGuestWorld(WORLD_CONFIGS, "emerald-jungle");
    expect(onProgress).toHaveBeenLastCalledWith(["emerald-jungle"]);

    unsubscribe();
    completeGuestWorld(WORLD_CONFIGS, "sunset-ruins");
    expect(onProgress).toHaveBeenCalledTimes(2);
  });
});
