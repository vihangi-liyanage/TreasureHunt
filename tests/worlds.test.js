import { describe, expect, it } from "vitest";
import { getWorldConfig, RUN_RULES, WORLD_CONFIGS } from "@/game/config/worlds";
import { getLevelConfig } from "@/game/config/levels";

describe("world configuration", () => {
  it("keeps the three authoritative timers and completion order", () => {
    expect(WORLD_CONFIGS.map(({ timerSeconds }) => timerSeconds)).toEqual([120, 105, 90]);
    expect(WORLD_CONFIGS.map(({ completion }) => completion)).toEqual(["checkpoint", "checkpoint", "treasure"]);
  });

  it("keeps fixed run rules in one reusable contract", () => {
    expect(RUN_RULES).toEqual({ startingLives: 3, fishPowerDurationMs: 8_000, maxFishRevives: 1 });
    expect(getWorldConfig("crystal-cavern")?.nextWorldId).toBeNull();
    expect(getWorldConfig("unknown")).toBeNull();
  });

  it("maps playable worlds to data-driven levels without duplicating scenes", () => {
    expect(getLevelConfig("emerald-jungle")?.goal.type).toBe("checkpoint");
    expect(getLevelConfig("sunset-ruins")?.goal.type).toBe("checkpoint");
    expect(getLevelConfig("crystal-cavern")?.goal.type).toBe("treasure");
    expect(getLevelConfig("sunset-ruins")?.fishPowerUps).toHaveLength(1);
    expect(getLevelConfig("crystal-cavern")?.fishPowerUps).toHaveLength(1);
  });
});
