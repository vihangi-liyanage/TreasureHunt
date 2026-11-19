import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getGameplayAssetUrls } from "@/game/preload-gameplay";
import { getLevelConfig } from "@/game/config/levels";

const migrationDirectory = new URL("../supabase/migrations/", import.meta.url);

describe("migration organization and blue diamond asset", () => {
  it("keeps unique ordered migration versions with descriptive filenames", () => {
    const filenames = readdirSync(migrationDirectory).filter((name) => name.endsWith(".sql")).sort();
    const versions = filenames.map((name) => name.slice(0, 12));
    expect(new Set(versions).size).toBe(versions.length);
    expect(filenames).toEqual([
      "202611050001_create_auth_profiles_progress_and_runs.sql",
      "202611100001_add_fish_revival_challenges.sql",
      "202611100002_add_verified_run_events_achievements_and_rankings.sql",
      "202611100003_enforce_run_submission_expiry.sql",
      "202611100004_use_current_profile_names_in_leaderboard.sql",
      "202611100005_make_run_completion_idempotent.sql",
      "202611180001_add_treasure_achievement_milestones.sql",
    ]);
  });

  it("provides a transparent PNG diamond with valid dimensions to every world preload", () => {
    const diamond = readFileSync(new URL("../public/art/gameplay/blue-diamond.png", import.meta.url));
    expect(diamond.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(diamond.readUInt32BE(16)).toBe(48);
    expect(diamond.readUInt32BE(20)).toBe(50);
    expect(diamond[25]).toBe(6);
    const worldScene = readFileSync(new URL("../game/scenes/world-scene.js", import.meta.url), "utf8");
    expect(worldScene).toContain("setDisplaySize(42, 44).setCircle(20, 4, 4)");
    for (const worldId of ["emerald-jungle", "sunset-ruins", "crystal-cavern"]) {
      expect(getGameplayAssetUrls(getLevelConfig(worldId))).toContain("/art/gameplay/blue-diamond.png");
    }
  });
});
