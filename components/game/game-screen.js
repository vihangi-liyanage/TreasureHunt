"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Award, Coins, Fish, Gem, Heart, Map, Pause, Play, RotateCcw, Timer, Trophy } from "lucide-react";
import { createGameBridge } from "@/game/core/game-bridge";
import { GAME_COMMANDS, GAME_EVENTS } from "@/game/core/events";
import { getLevelConfig } from "@/game/config/levels";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { beginGuestRun, completeGuestWorld, deriveWorldStates, readGuestProgress, recordGuestCollectible } from "@/lib/progress/guest-progress";
import { getAchievement } from "@/lib/game/achievements";
import { postJson, postJsonWithRetry } from "@/lib/auth/client-api";
import { gameplayPreloader } from "@/game/preload-gameplay";
import { MobileControls } from "./mobile-controls";
import { getNextResumeStep, getNextWorld, RESUME_COUNTDOWN_STEPS, shouldShowWorldIntroduction } from "./game-flow";
import { HowToPlay } from "./how-to-play";
import { FishChallengePanel } from "./fish-challenge-panel";

const initialState = (timerSeconds, status = "loading") => ({ score: 0, coins: 0, gems: 0, fishPowerUps: 0, lives: 3, timeLeft: timerSeconds, status, paused: false, powered: false, powerRemainingMs: 0, revivesUsed: 0 });

export function GameScreen({ world, mode, showInstructions = false }) {
  const router = useRouter();
  const needsIntroduction = shouldShowWorldIntroduction(world, showInstructions);
  const parentRef = useRef(null);
  const reviveCommandSentRef = useRef(false);
  const runStartPromiseRef = useRef(Promise.resolve(""));
  const eventQueueRef = useRef(Promise.resolve());
  const objectiveEvidenceRef = useRef(null);
  const [bridge] = useState(createGameBridge);
  const [started, setStarted] = useState(!needsIntroduction);
  const [gameState, setGameState] = useState(() => initialState(world.timerSeconds, needsIntroduction ? "awaiting-start" : "loading"));
  const [terminal, setTerminal] = useState(null);
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });
  const [resumeStep, setResumeStep] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [fishChallengeOpen, setFishChallengeOpen] = useState(false);
  const [runAttemptId, setRunAttemptId] = useState("");
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [warmStart] = useState(() => gameplayPreloader.isWorldPreloaded(world.id));
  const mapHref = mode === "guest" ? "/worlds?mode=guest" : "/worlds";
  const leaderboardHref = mode === "guest" ? "/worlds?mode=guest&leaderboard=1" : "/worlds?leaderboard=1";
  const nextWorld = getNextWorld(WORLD_CONFIGS, world.id);

  const announceAchievements = useCallback((keys = []) => {
    const valid = keys.filter((key) => getAchievement(key));
    if (valid.length) setAchievementQueue((queue) => [...queue, ...valid.filter((key) => !queue.includes(key))]);
  }, []);

  const beginVerifiedRun = useCallback(() => {
    eventQueueRef.current = Promise.resolve();
    if (mode === "guest") {
      runStartPromiseRef.current = Promise.resolve("");
      return runStartPromiseRef.current;
    }
    runStartPromiseRef.current = postJson("/api/runs/start", { worldId: world.id })
      .then((response) => response.ok ? response.run.id : "");
    return runStartPromiseRef.current;
  }, [mode, world.id]);

  const recordEvidence = useCallback((event) => {
    if (event.type === "objective") objectiveEvidenceRef.current = event;
    if (mode === "guest") {
      if (event.type === "gem" || event.type === "fish") {
        announceAchievements(recordGuestCollectible(event.type).unlockedAchievementKeys);
      }
      return;
    }
    eventQueueRef.current = eventQueueRef.current.then(async () => {
      const runId = await runStartPromiseRef.current;
      if (!runId) return;
      const response = await postJsonWithRetry(`/api/runs/${runId}/events`, { ...event, worldId: world.id });
      if (response.ok) announceAchievements(response.unlockedAchievementKeys);
    }).catch(() => undefined);
  }, [announceAchievements, mode, world.id]);

  useEffect(() => {
    if (!achievementQueue.length) return undefined;
    const timer = window.setTimeout(() => setAchievementQueue((queue) => queue.slice(1)), 2_800);
    return () => window.clearTimeout(timer);
  }, [achievementQueue]);

  useEffect(() => {
    if (!started || warmStart || gameState.status !== "loading" || loadError) return undefined;
    const timer = window.setTimeout(() => setShowLoading(true), 250);
    return () => window.clearTimeout(timer);
  }, [gameState.status, loadError, started, warmStart]);

  const persistCompletion = useCallback(async (result) => {
    if (mode === "guest") {
      const progress = completeGuestWorld(WORLD_CONFIGS, world.id);
      announceAchievements(progress.unlockedAchievementKeys);
      setSaveState({ status: "saved", error: "" });
      return;
    }
    setSaveState({ status: "saving", error: "" });
    await eventQueueRef.current;
    const runId = await runStartPromiseRef.current;
    let response = { ok: false, error: "This gameplay run could not be verified." };
    if (runId && objectiveEvidenceRef.current) {
      const objectiveResponse = await postJsonWithRetry(`/api/runs/${runId}/events`, { ...objectiveEvidenceRef.current, worldId: world.id });
      if (objectiveResponse.ok) {
        response = await postJsonWithRetry(`/api/runs/${runId}/complete`, { durationSeconds: Math.max(1, world.timerSeconds - result.timeLeft) });
      } else response = { ok: false, error: objectiveResponse.error || "The collected objective could not be verified." };
    }
    if (response.ok) announceAchievements(response.unlockedAchievementKeys);
    setSaveState(response.ok
      ? { status: "saved", error: "" }
      : { status: "error", error: "We couldn't save this completed world after several attempts. Please replay the world when your connection is stable." });
  }, [announceAchievements, mode, world]);

  useEffect(() => {
    if (!started) return undefined;
    let active = true; let game;
    const cleanups = [
      bridge.on(GAME_EVENTS.READY, () => { if (!active) return; setShowLoading(false); setLoadError(""); setGameState((state) => ({ ...state, status: "playing" })); }),
      bridge.on(GAME_EVENTS.LOAD_FAILED, () => { if (!active) return; setShowLoading(false); setLoadError("The adventure artwork could not be loaded."); }),
      bridge.on(GAME_EVENTS.STATE_CHANGED, (state) => active && setGameState(state)),
      bridge.on(GAME_EVENTS.COIN_COLLECTED, ({ id }) => recordEvidence({ type: "coin", id })),
      bridge.on(GAME_EVENTS.GEM_COLLECTED, ({ id }) => recordEvidence({ type: "gem", id })),
      bridge.on(GAME_EVENTS.FISH_COLLECTED, ({ id }) => recordEvidence({ type: "fish", id })),
      bridge.on(GAME_EVENTS.ENEMY_STOMPED, ({ id }) => recordEvidence({ type: "enemy", id })),
      bridge.on(GAME_EVENTS.ENEMY_DEFEATED, ({ id }) => recordEvidence({ type: "enemy", id })),
      bridge.on(GAME_EVENTS.OBJECTIVE_COLLECTED, ({ id, objective }) => recordEvidence({ type: "objective", id, objective })),
      bridge.on(GAME_EVENTS.RUN_ENDED, (result) => { if (active) { setResumeStep(null); setFishChallengeOpen(false); setTerminal({ type: "game-over", result }); } }),
      bridge.on(GAME_EVENTS.RUN_REVIVED, () => { if (active) { setFishChallengeOpen(false); setTerminal(null); setResumeStep(RESUME_COUNTDOWN_STEPS[0]); } }),
      bridge.on(GAME_EVENTS.WORLD_COMPLETED, (result) => { if (active) { setResumeStep(null); setTerminal({ type: "completed", result }); persistCompletion(result); } }),
    ];
    async function boot() {
      if (mode === "guest") {
        const guestWorld = deriveWorldStates(WORLD_CONFIGS, readGuestProgress().completedWorldIds).find((entry) => entry.id === world.id);
        if (!guestWorld || guestWorld.locked) { router.replace("/worlds?mode=guest"); return; }
      }
      const level = getLevelConfig(world.id);
      if (!level) { router.replace(mapHref); return; }
      try {
        beginVerifiedRun();
        const { createTreasureHuntGame } = await gameplayPreloader.preloadWorld(world.id);
        if (active && parentRef.current) game = createTreasureHuntGame(parentRef.current, { world, level, bridge });
      } catch {
        if (active) { setShowLoading(false); setLoadError("The game could not be prepared. Check your connection and try again."); }
      }
    }
    boot();
    const release = () => bridge.emit(GAME_COMMANDS.INPUT_RELEASE_ALL);
    window.addEventListener("pointerup", release); window.addEventListener("blur", release);
    return () => {
      active = false; window.removeEventListener("pointerup", release); window.removeEventListener("blur", release);
      cleanups.forEach((cleanup) => cleanup()); game?.destroy(true); bridge.destroy();
    };
  }, [beginVerifiedRun, bridge, mapHref, mode, persistCompletion, recordEvidence, router, started, world]);

  useEffect(() => {
    if (resumeStep === null) return undefined;
    const timer = window.setTimeout(() => {
      const nextStep = getNextResumeStep(resumeStep);
      if (nextStep === null) { setResumeStep(null); bridge.emit(GAME_COMMANDS.RESUME); }
      else setResumeStep(nextStep);
    }, resumeStep === "GO!" ? 450 : 700);
    return () => window.clearTimeout(timer);
  }, [bridge, resumeStep]);

  function startAdventure() { setGameState(initialState(world.timerSeconds)); setStarted(true); }
  function beginResume() { if (resumeStep === null && gameState.paused && !terminal) setResumeStep(RESUME_COUNTDOWN_STEPS[0]); }
  function restart() {
    setResumeStep(null); setTerminal(null); setFishChallengeOpen(false); setRunAttemptId(""); objectiveEvidenceRef.current = null; reviveCommandSentRef.current = false; setSaveState({ status: "idle", error: "" });
    setShowLoading(false); setGameState(initialState(world.timerSeconds)); beginVerifiedRun(); bridge.emit(GAME_COMMANDS.RESTART);
  }
  function openFishChallenge() {
    if (!runAttemptId) setRunAttemptId(globalThis.crypto.randomUUID());
    setFishChallengeOpen(true);
  }
  function applyApprovedRevival() {
    if (reviveCommandSentRef.current) return;
    reviveCommandSentRef.current = true;
    bridge.emit(GAME_COMMANDS.REVIVE);
  }
  function goToNextWorld() {
    if (!nextWorld || saveState.status !== "saved") return;
    const query = mode === "guest" ? `?mode=guest&attempt=${beginGuestRun()}` : "";
    router.push(`/game/${nextWorld.id}${query}`);
  }

  const checkpointComplete = terminal?.type === "completed" && world.completion === "checkpoint";
  const missionComplete = terminal?.type === "completed" && world.completion === "treasure";
  const gameOver = terminal?.type === "game-over";
  const canRevive = gameOver && terminal.result.reason === "lives" && terminal.result.revivesUsed < 1;
  const elapsedSeconds = gameOver ? Math.max(0, world.timerSeconds - terminal.result.timeLeft) : 0;

  return <main className={`gameplay-screen ${!started ? "is-awaiting-start" : ""}`} data-game-status={gameState.status} data-powered={gameState.powered ? "true" : "false"}>
    <div ref={parentRef} className="phaser-stage" aria-label={`${world.name} playable game canvas`} />
    {!started ? <section className="adventure-intro" role="dialog" aria-modal="true" aria-labelledby="adventure-intro-title">
      <div className="adventure-intro-panel">
        <span className="state-kicker">Explorer briefing</span><h1 id="adventure-intro-title">Ready for the Jungle?</h1>
        <p className="intro-lead">The 120-second clock begins only when you start.</p>
        <HowToPlay compact />
        <div className="intro-actions"><Link className="game-button game-button-ghost" href={mapHref}><Map size={18} />World Map</Link><button autoFocus className="game-button game-button-primary" type="button" onClick={startAdventure}><Play size={18} />Start Adventure</button></div>
      </div>
    </section> : null}
    {started ? <header className="game-hud" aria-label="Game status"><div className="hud-world"><span>World {world.number}</span><strong>{world.name}</strong></div><div className="hud-cluster"><div className="hud-stats"><span><Trophy size={18} />{gameState.score.toLocaleString()}</span><span><Coins size={18} />{gameState.coins}</span><span><Gem size={18} />{gameState.gems}</span><span className={gameState.lives <= 1 ? "is-danger" : ""}><Heart size={18} />{gameState.lives}</span><span className={gameState.timeLeft <= 20 ? "is-danger" : ""}><Timer size={18} />{gameState.timeLeft}</span></div>{gameState.powered ? <div className="power-meter" role="status"><Fish size={18} /><div><strong>Magic Shot</strong><span style={{ "--power-progress": `${Math.min(100, (gameState.powerRemainingMs / 8000) * 100)}%` }} /></div><b>{(gameState.powerRemainingMs / 1000).toFixed(1)}s</b></div> : null}</div><button className="hud-pause" type="button" onClick={() => bridge.emit(GAME_COMMANDS.PAUSE)} aria-label="Pause game"><Pause size={20} /></button></header> : null}
    {achievementQueue.length ? <aside className="achievement-toast" role="status" aria-live="polite"><span><Award size={22} /></span><div><small>Achievement unlocked</small><strong>{getAchievement(achievementQueue[0]).title}</strong><p>{getAchievement(achievementQueue[0]).description}</p></div></aside> : null}
    {showLoading && !loadError ? <div className="game-loading" role="status"><span className="loading-spinner" /><strong>Preparing {world.name}...</strong></div> : null}
    {loadError ? <section className="game-state-overlay" role="alert"><div className="game-state-panel is-defeat"><span className="state-kicker">Loading interrupted</span><h1>Adventure unavailable</h1><p>{loadError}</p><div className="state-actions"><button className="game-button game-button-primary" type="button" onClick={() => window.location.reload()}><RotateCcw size={18} />Retry</button><Link className="game-button game-button-secondary" href={mapHref}><Map size={18} />World Map</Link></div></div></section> : null}
    {started ? <MobileControls bridge={bridge} powered={gameState.powered} /> : null}
    {gameState.paused && !terminal && resumeStep === null ? <section className="game-state-overlay" role="dialog" aria-modal="true" aria-label="Game paused"><div className="game-state-panel pause-panel"><span className="state-kicker">Adventure paused</span><h1>Take a breath, explorer.</h1><p>Your position, lives, timer, enemies and fish power are frozen.</p><div className="state-actions"><button autoFocus className="game-button game-button-primary" type="button" onClick={beginResume}><Play size={18} />Resume</button><button className="game-button game-button-secondary" type="button" onClick={restart}><RotateCcw size={18} />Restart</button><Link className="game-button game-button-ghost" href={mapHref}><Map size={18} />World Map</Link></div></div></section> : null}
    {gameState.paused && !terminal && resumeStep !== null ? <section className="resume-canvas-layer" aria-label="Resuming game"><div className="resume-canvas-countdown" role="status" aria-live="assertive" aria-atomic="true"><span>Get ready</span><strong key={resumeStep}>{resumeStep}</strong><small>Adventure resumes after GO!</small></div><div className="resume-canvas-actions"><button className="game-button game-button-secondary" type="button" onClick={restart}><RotateCcw size={18} />Restart</button><Link className="game-button game-button-ghost" href={mapHref}><Map size={18} />World Map</Link></div></section> : null}
    {terminal ? <section className={`game-state-overlay terminal-overlay ${terminal.type === "completed" ? "is-victory-overlay" : ""}`} role="dialog" aria-modal="true" aria-label={missionComplete ? "Mission complete" : checkpointComplete ? "World complete" : "Game over"}><div className={`game-state-panel ${terminal.type === "completed" ? "is-victory" : "is-defeat"}`}><span className="state-kicker">{missionComplete ? "Treasure Discovered" : checkpointComplete ? "Shrine Activated" : "The adventure ended"}</span><h1>{missionComplete ? "Mission Complete" : checkpointComplete ? "World Complete" : "Game Over"}</h1>{gameOver ? <><p>{terminal.result.reason === "timer" ? `Time ran out before the ${world.completion === "treasure" ? "treasure" : "Compass Shrine"}.` : "Your explorer is out of lives."}</p><div className="game-over-stats" aria-label="Final run statistics"><span><Trophy size={18} /><small>Final score</small><strong>{terminal.result.score.toLocaleString()}</strong></span><span><Coins size={18} /><small>Coins collected</small><strong>{terminal.result.coins}</strong></span><span><Timer size={18} /><small>Time elapsed</small><strong>{elapsedSeconds}s</strong></span><span><Timer size={18} /><small>Time remaining</small><strong>{terminal.result.timeLeft}s</strong></span></div></> : <p>{`Score ${terminal.result.score.toLocaleString()} · ${terminal.result.coins} coins · ${terminal.result.timeLeft}s left · ${terminal.result.lives} lives`}</p>}{saveState.error ? <small className="is-save-error" role="alert">{saveState.error}</small> : null}<div className={`state-actions terminal-actions ${missionComplete ? "mission-actions" : ""}`}>{checkpointComplete ? <><button className="game-button game-button-primary" type="button" onClick={goToNextWorld} disabled={saveState.status !== "saved"}><ArrowRight size={18} />{`Next: ${nextWorld?.name}`}</button>{saveState.status === "saved" ? <Link className="game-button game-button-secondary" href={mapHref}><Map size={18} />World Map</Link> : <button className="game-button game-button-secondary" type="button" disabled><Map size={18} />World Map</button>}</> : <>{gameOver ? <button className="game-button fish-revive-button" type="button" onClick={openFishChallenge} disabled={!canRevive}><Fish size={19} />{canRevive ? "Solve a Puzzle to Revive" : terminal.result.revivesUsed >= 1 ? "Revival Already Used" : "Revival Requires Remaining Time"}</button> : null}<button className="game-button game-button-primary" type="button" onClick={restart}><RotateCcw size={18} />{missionComplete ? "Replay World" : "Play Again"}</button>{missionComplete ? saveState.status === "saved" ? <Link className="game-button game-button-secondary" href={leaderboardHref}><Trophy size={18} />Leaderboard</Link> : <button className="game-button game-button-secondary" type="button" disabled><Trophy size={18} />Leaderboard</button> : null}{!missionComplete || saveState.status === "saved" ? <Link className="game-button game-button-secondary" href={mapHref}><Map size={18} />World Map</Link> : <button className="game-button game-button-secondary" type="button" disabled><Map size={18} />World Map</button>}</>}</div></div></section> : null}
    {fishChallengeOpen && canRevive && runAttemptId ? <FishChallengePanel mode={mode} runAttemptId={runAttemptId} worldId={world.id} onClose={() => setFishChallengeOpen(false)} onApproved={applyApprovedRevival} /> : null}
  </main>;
}
