import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getNextResumeStep, getNextWorld, RESUME_COUNTDOWN_STEPS, shouldShowWorldIntroduction } from "@/components/game/game-flow";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { shouldAdvanceRun } from "@/game/core/run-state";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("gameplay UI flow", () => {
  it("gates only a requested World 1 introduction before Phaser can start", () => {
    expect(shouldShowWorldIntroduction(WORLD_CONFIGS[0], true)).toBe(true);
    expect(shouldShowWorldIntroduction(WORLD_CONFIGS[1], true)).toBe(false);
    expect(shouldShowWorldIntroduction(WORLD_CONFIGS[0], false)).toBe(false);
    const screen = source("components/game/game-screen.js");
    expect(screen).toContain("if (!started) return undefined");
    expect(screen).toContain("Start Adventure");
  });

  it("orders one guarded resume countdown and advances the run only after it ends", () => {
    expect(RESUME_COUNTDOWN_STEPS).toEqual([3, 2, 1, "GO!"]);
    expect(RESUME_COUNTDOWN_STEPS.map(getNextResumeStep)).toEqual([2, 1, "GO!", null]);
    expect(shouldAdvanceRun({ paused: true, status: "playing" })).toBe(false);
    expect(shouldAdvanceRun({ paused: false, status: "playing" })).toBe(true);
    expect(shouldAdvanceRun({ paused: false, status: "completed" })).toBe(false);
    const screen = source("components/game/game-screen.js");
    const styles = source("app/globals.css");
    expect(screen).toContain('className="resume-canvas-layer"');
    expect(screen).toContain("window.clearTimeout(timer)");
    expect(styles).not.toContain(".resume-countdown");
    expect(styles).toContain(".resume-canvas-countdown");
  });

  it("offers a next world for checkpoints but never after the final treasure", () => {
    expect(getNextWorld(WORLD_CONFIGS, "emerald-jungle")?.id).toBe("sunset-ruins");
    expect(getNextWorld(WORLD_CONFIGS, "sunset-ruins")?.id).toBe("crystal-cavern");
    expect(getNextWorld(WORLD_CONFIGS, "crystal-cavern")).toBeNull();
  });

  it("presents checkpoint semantics as Compass Shrines without changing the domain contract", () => {
    const scene = source("game/scenes/world-scene.js");
    const screen = source("components/game/game-screen.js");
    expect(WORLD_CONFIGS.slice(0, 2).every((world) => world.completion === "checkpoint")).toBe(true);
    expect(scene).toContain('"COMPASS SHRINE"');
    expect(screen).toContain('checkpointComplete ? "Shrine Activated"');
    expect(screen).toContain("saveState.status !== \"saved\"");
  });

  it("owns completion effects in the scene and explicitly cleans them up", () => {
    const scene = source("game/scenes/world-scene.js");
    expect(scene).toContain("createGoalCelebration");
    expect(scene).toContain("prefers-reduced-motion: reduce");
    expect(scene).toContain("this.tweens.killTweensOf(object)");
    expect(scene).toContain("for (const object of [...this.effectObjects])");
  });
});

describe("identity-backed panels", () => {
  it("keeps authentication forms accessible while preserving real server actions", () => {
    const login = source("components/auth/login-form.js");
    const register = source("components/auth/register-form.js");
    const password = source("components/auth/password-input.js");
    const shell = source("components/auth/auth-form-shell.js");
    expect(login).toContain('aria-busy={pending}');
    expect(login).toContain("Google Login");
    expect(register).toContain("Check Your Email");
    expect(register).toContain("Go to Player Login");
    expect(register).toContain('password: "", confirmPassword: ""');
    expect(password).toContain("aria-pressed={visible}");
    expect(shell).toContain('aria-labelledby="auth-title"');
  });

  it("renders real profile progress, empty achievements and Sign Out", () => {
    const profile = source("components/profile/profile-panel.js");
    expect(profile).toContain("completed_worlds");
    expect(profile).toContain("No achievements earned yet");
    expect(profile).toContain("Sign Out");
    expect(profile).not.toContain(">Logout<");
  });

  it("uses genuine leaderboard data and an accurate guest sign-in state", () => {
    const leaderboard = source("components/leaderboard/leaderboard-panel.js");
    expect(leaderboard).toContain("entry.coins");
    expect(leaderboard).toContain("entry.duration_seconds");
    expect(leaderboard).toContain("cannot submit leaderboard runs");
    expect(leaderboard).toContain("No eligible ranked runs yet");
    expect(leaderboard).toContain("Account creation and saved world progress do not create a score");
    expect(leaderboard).toContain("Rankings unavailable");
    const worldsPage = source("app/worlds/page.js");
    expect(worldsPage).toContain("Promise.allSettled");
    expect(worldsPage).toContain('leaderboardStatus = "unavailable"');
  });

  it("keeps ranked-run ownership at verified server endpoints", () => {
    const startRoute = source("app/api/runs/start/route.js");
    const completeRoute = source("app/api/runs/[runId]/complete/route.js");
    expect(startRoute).toContain("user_id: identity.id");
    expect(completeRoute).toContain("p_user_id: identity.id");
    expect(completeRoute).toContain('admin.rpc("complete_game_run_admin"');
    expect(completeRoute).not.toContain("values.userId");
  });
});
