import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, deriveAchievementKeys, getAchievementProgress } from "@/lib/game/achievements";

describe("fantasy treasure achievements", () => {
  it("preserves all six original keys and adds three supported collectible milestones", () => {
    expect(Object.keys(ACHIEVEMENTS)).toEqual(expect.arrayContaining([
      "first_gem", "five_gems", "first_fish_power", "world_1_compass", "world_2_compass", "world_3_treasure",
      "gem_treasure_chest", "gold_treasure_chest", "crystal_collector",
    ]));
    expect(Object.keys(ACHIEVEMENTS)).toHaveLength(9);
  });

  it("unlocks treasure milestones only at their real cumulative thresholds", () => {
    expect(deriveAchievementKeys({ gems: 9, coins: 49 })).not.toEqual(expect.arrayContaining(["gem_treasure_chest", "gold_treasure_chest", "crystal_collector"]));
    expect(deriveAchievementKeys({ gems: 10, coins: 50 })).toEqual(expect.arrayContaining(["gem_treasure_chest", "gold_treasure_chest"]));
    expect(deriveAchievementKeys({ gems: 20 })).toEqual(expect.arrayContaining(["gem_treasure_chest", "crystal_collector"]));
  });

  it("derives truthful capped progress from persisted profile totals", () => {
    expect(getAchievementProgress(ACHIEVEMENTS.gem_treasure_chest, { total_gems: 7 })).toEqual({ current: 7, target: 10 });
    expect(getAchievementProgress(ACHIEVEMENTS.gold_treasure_chest, { total_coins: 80 })).toEqual({ current: 50, target: 50 });
    expect(getAchievementProgress(ACHIEVEMENTS.world_3_treasure, { completed_worlds: 2 })).toEqual({ current: 2, target: 3 });
  });

  it("keeps awards inside service-role verified RPCs with idempotent persistence", () => {
    const migration = readFileSync(new URL("../supabase/migrations/202611180001_add_treasure_achievement_milestones.sql", import.meta.url), "utf8");
    expect(migration).toContain("record_game_run_event_admin");
    expect(migration).toContain("complete_verified_game_run_admin");
    expect(migration).toContain("on conflict (user_id, achievement_key) do nothing");
    expect(migration).toContain("grant execute on function public.record_game_run_event_admin");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("where total_gems >= 10");
    expect(migration).toContain("where total_coins >= 50");
  });
});
