import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getNextResumeStep, getNextWorld, RESUME_COUNTDOWN_STEPS, shouldShowWorldIntroduction } from "@/components/game/game-flow";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { shouldAdvanceRun } from "@/game/core/run-state";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("gameplay UI flow", () => {
  it("prepares a paused first frame behind the requested World 1 introduction", () => {
    expect(shouldShowWorldIntroduction(WORLD_CONFIGS[0], true)).toBe(true);
    expect(shouldShowWorldIntroduction(WORLD_CONFIGS[1], true)).toBe(false);
    expect(shouldShowWorldIntroduction(WORLD_CONFIGS[0], false)).toBe(false);
    const screen = source("components/game/game-screen.js");
    expect(screen).not.toContain("if (!started) return undefined");
    expect(screen).toContain("startPaused: needsIntroduction");
    expect(screen).toContain("GAME_EVENTS.FRAME_READY");
    expect(screen).toContain("if (startRequestedRef.current) revealAdventure()");
    expect(screen).toContain("if (frameReadyRef.current) revealAdventure()");
    expect(screen).toMatch(/const revealAdventure[\s\S]*?bridge\.emit\(GAME_COMMANDS\.RESUME\);[\s\S]*?setStarted\(true\)/);
    expect(screen).toContain("Start Adventure");
  });

  it("emits first-frame readiness after Phaser post-render without duplicating the game", () => {
    const scene = source("game/scenes/world-scene.js");
    const createGame = source("game/create-game.js");
    const events = source("game/core/events.js");
    expect(events).toContain('FRAME_READY: "game:frame-ready"');
    expect(scene).toContain("Phaser.Core.Events.POST_RENDER");
    expect(scene).toContain("this.physics.pause()");
    expect(scene).toContain("if (!this.isPaused) this.cameras.main.fadeIn");
    expect(scene).toContain("this.game.events.off(Phaser.Core.Events.POST_RENDER");
    expect(createGame.match(/new Phaser\.Game/g)).toHaveLength(1);
    expect(createGame).toContain("startPaused=false");
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
    expect(screen).toContain('resumeStep === "GO!" ? "countdown-go" : "countdown"');
    expect(styles).not.toContain(".resume-countdown");
    expect(styles).toContain(".resume-canvas-countdown");
  });

  it("uses the functional startup Splash screen without a fixed-delay redirect", () => {
    const home = source("app/page.js");
    const styles = source("app/globals.css");
    const splash = source("components/screens/splash-screen.js");
    expect(home).toContain("<SplashScreen />");
    expect(splash).toContain("preloadStartup");
    expect(splash).toContain('router.replace("/welcome")');
    expect(splash).not.toContain("setTimeout");
    expect(styles).toContain(".splash-screen");
  });

  it("offers a next world for checkpoints but never after the final treasure", () => {
    expect(getNextWorld(WORLD_CONFIGS, "emerald-jungle")?.id).toBe("sunset-ruins");
    expect(getNextWorld(WORLD_CONFIGS, "sunset-ruins")?.id).toBe("crystal-cavern");
    expect(getNextWorld(WORLD_CONFIGS, "crystal-cavern")).toBeNull();
  });

  it("opens the existing leaderboard from a saved World 3 completion", () => {
    const screen = source("components/game/game-screen.js");
    const map = source("components/worlds/world-map.js");
    expect(screen).toContain('"/worlds?leaderboard=1"');
    expect(screen).toContain("saveState.status === \"saved\"");
    expect(screen).toContain("<Trophy size={18} />Leaderboard");
    expect(screen).toContain('missionComplete ? "mission-actions"');
    expect(map).toContain("useState(initialOverlay)");
    expect(map).toContain('<GameOverlay title="Leaderboard"');
  });

  it("skips the World Map preparing state for a world completed by startup preload", () => {
    const map = source("components/worlds/world-map.js");
    const screen = source("components/game/game-screen.js");
    expect(map).toContain("if (!gameplayPreloader.isWorldPreloaded(selectedWorld.id))");
    expect(screen).toContain("createTreasureHuntGame(parentRef.current, {");
    expect(screen).toContain("world, level, bridge, assetUrls, startPaused: needsIntroduction");
  });

  it("presents checkpoint semantics as Compass Shrines without changing the domain contract", () => {
    const scene = source("game/scenes/world-scene.js");
    const screen = source("components/game/game-screen.js");
    expect(WORLD_CONFIGS.slice(0, 2).every((world) => world.completion === "checkpoint")).toBe(true);
    expect(scene).toContain('"COLLECT THE COMPASS"');
    expect(screen).toContain('checkpointComplete ? "Shrine Activated"');
    expect(screen).toContain("saveState.status !== \"saved\"");
    expect(screen).not.toContain("Retry Save");
    expect(screen).not.toContain("Saving...");
    expect(screen).toContain("postJsonWithRetry");
  });

  it("keeps audio settings visible while gameplay sound effects remain disconnected", () => {
    const settings = source("components/settings/settings-panel.js");
    const screen = source("components/game/game-screen.js");
    const events = source("game/core/events.js");
    expect(settings).toContain('label: "Music"');
    expect(settings).toContain('label: "Sound Effects"');
    expect(settings).not.toContain('id: "motion"');
    expect(settings).not.toContain('id: "contrast"');
    expect(settings).toContain("setAudioPreference");
    expect(settings).toContain('type="range"');
    expect(settings).toContain("setAudioVolume");
    expect(screen).not.toContain("audioService");
    expect(events).toContain('PLAYER_DAMAGED: "player:damaged"');
    for (const event of ["COIN_COLLECTED", "STATE_CHANGED", "RUN_ENDED", "RUN_REVIVED", "WORLD_COMPLETED"]) {
      expect(events).toContain(`${event}:`);
    }
  });

  it("connects route music through the internal catalog without exposing Freesound credentials", () => {
    const controller = source("components/audio/audio-controller.js");
    const player = source("lib/audio/audio-player.js");
    expect(player).toContain("/api/audio/catalog?slot=");
    expect(controller).toContain("subscribeAudioPreferences");
    expect(controller).toContain("visibilitychange");
    expect(controller).not.toContain("FREESOUND_API_KEY");
    expect(player).toContain("new Audio()");
    expect(player).not.toContain("AudioContext");
  });

  it("maps existing gameplay events to sound effects exactly once per subscription", () => {
    const screen = source("components/game/game-screen.js");
    const mappings = {
      PLAYER_JUMPED: "jump", COIN_COLLECTED: "coin", GEM_COLLECTED: "gem", FISH_COLLECTED: "fish-power-up",
      PROJECTILE_FIRED: "projectile", PLAYER_DAMAGED: "damage", RUN_ENDED: "game-over", RUN_REVIVED: "revival",
    };
    for (const [event, effect] of Object.entries(mappings)) {
      expect(screen).toContain(`GAME_EVENTS.${event}`);
      expect(screen).toContain(`audioPlayer.playEffect("${effect}")`);
    }
    expect(screen.match(/bridge\.on\(GAME_EVENTS\.COIN_COLLECTED/g)).toHaveLength(1);
  });

  it("owns completion effects in the scene and explicitly cleans them up", () => {
    const scene = source("game/scenes/world-scene.js");
    expect(scene).toContain("createGoalCelebration");
    expect(scene).toContain("prefers-reduced-motion: reduce");
    expect(scene).toContain("this.tweens.killTweensOf(object)");
    expect(scene).toContain("for (const object of [...this.effectObjects])");
  });

  it("shows final Game Over statistics and grants revival only through the bridge", () => {
    const screen = source("components/game/game-screen.js");
    const challenge = source("components/game/fish-challenge-panel.js");
    const scene = source("game/scenes/world-scene.js");
    const styles = source("app/globals.css");
    expect(screen).toContain("Final score");
    expect(screen).toContain("Coins collected");
    expect(screen).toContain("Time elapsed");
    expect(screen).toContain("Time remaining");
    expect(screen).toContain("Solve a Puzzle to Revive");
    expect(challenge).toContain("revivalGranted !== true");
    expect(challenge).not.toContain("Begin 10-Second Puzzle");
    expect(challenge).not.toContain('role="timer"');
    expect(challenge).not.toContain("setInterval");
    expect((challenge.match(/postJson\("\/api\/fish\/challenges"/g) || [])).toHaveLength(1);
    expect(challenge).toContain('response.code === "incorrect"');
    expect(challenge).toContain('setMessage("Incorrect answer! Try again.")');
    expect(challenge).toContain("window.setTimeout(onClose, 1_500)");
    expect(challenge).toContain("window.clearTimeout(timer)");
    expect(styles).toContain(".fish-challenge-panel { position: relative; display: grid;");
    expect(styles).toContain("overflow: hidden;");
    expect(styles).toContain("height: clamp(9rem,30svh,13.5rem)");
    expect(screen).toContain("setResumeStep(RESUME_COUNTDOWN_STEPS[0])");
    expect(screen).toContain("bridge.emit(GAME_COMMANDS.REVIVE)");
    expect(scene).toContain("this.run.revive(this.runClockMs)");
    expect(scene).toContain("this.isPaused = true");
  });
});

describe("identity-backed panels", () => {
  it("keeps authentication forms accessible while preserving real server actions", () => {
    const login = source("components/auth/login-form.js");
    const register = source("components/auth/register-form.js");
    const password = source("components/auth/password-input.js");
    const shell = source("components/auth/auth-form-shell.js");
    expect(login).toContain('aria-busy={pending}');
    expect(login).not.toContain("Continue with Google");
    expect(login).toContain("Need an account?");
    expect(login).toContain("Sign Up");
    expect(register).not.toContain("verification code");
    expect(register).toContain("Already have an account?");
    expect(register).toContain("Log In");
    expect(register).toContain('username: "", email: "", password: "", confirmPassword: ""');
    expect(register).toContain("Confirm Password");
    expect(login).toContain("Account created successfully!");
    expect(login).toContain("Please log in to start your adventure.");
    expect(password).toContain("aria-pressed={visible}");
    expect(shell).toContain('aria-labelledby="auth-title"');
  });

  it("renders real profile progress, inline identity editing, treasure rewards and Sign Out", () => {
    const profile = source("components/profile/profile-panel.js");
    expect(profile).toContain("completed_worlds");
    expect(profile).toContain("Object.keys(ACHIEVEMENTS)");
    expect(profile).toContain("earnedAchievement.earned_at");
    expect(profile).toContain('role="tablist"');
    expect(profile).toContain('aria-label="Edit explorer username"');
    expect(profile).toContain("profile-inline-editor");
    expect(profile).toContain("cancelEditing");
    expect(profile).toContain("getAchievementProgress");
    expect(profile).toContain("reward-chest");
    expect(profile).toContain("Sign Out");
    expect(profile).not.toContain(">Logout<");
    expect(profile).not.toContain("profile-editor");
  });

  it("uses genuine leaderboard data and an accurate guest sign-in state", () => {
    const leaderboard = source("components/leaderboard/leaderboard-panel.js");
    expect(leaderboard).toContain("entry.coins");
    expect(leaderboard).toContain("entry.duration_seconds");
    expect(leaderboard).toContain("Guest view only");
    expect(leaderboard).toContain("No eligible ranked runs yet");
    expect(leaderboard).toContain("Account creation and saved world progress do not create a score");
    expect(leaderboard).toContain("Rankings unavailable");
    expect(leaderboard).toContain("RankMark");
    expect(leaderboard).toContain("entry.is_current");
    const worldsPage = source("app/worlds/page.js");
    expect(worldsPage).toContain("Promise.allSettled");
    expect(worldsPage).toContain('leaderboardStatus = "unavailable"');
  });

  it("keeps ranked-run ownership at verified server endpoints", () => {
    const startRoute = source("app/api/runs/start/route.js");
    const completeRoute = source("app/api/runs/[runId]/complete/route.js");
    expect(startRoute).toContain("p_user_id: identity.id");
    expect(completeRoute).toContain("p_user_id: identity.id");
    expect(completeRoute).toContain('admin.rpc("complete_verified_game_run_admin"');
    expect(completeRoute).toContain("validateStoredRunCompletion");
    expect(completeRoute).toContain("run.submitted_at && run.completed");
    expect(completeRoute).not.toContain("values.userId");
    expect(completeRoute).not.toContain("values.score");
  });
});
