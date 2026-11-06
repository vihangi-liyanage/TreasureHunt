"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Fish, Heart, Map, Pause, Play, RotateCcw, Timer, Trophy } from "lucide-react";
import { createGameBridge } from "@/game/core/game-bridge";
import { GAME_COMMANDS, GAME_EVENTS } from "@/game/core/events";
import { getLevelConfig } from "@/game/config/levels";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { beginGuestRun, completeGuestWorld, deriveWorldStates, readGuestProgress } from "@/lib/progress/guest-progress";
import { postJson } from "@/lib/auth/client-api";
import { gameplayPreloader } from "@/game/preload-gameplay";
import { MobileControls } from "./mobile-controls";
import { getNextResumeStep, getNextWorld, RESUME_COUNTDOWN_STEPS, shouldShowWorldIntroduction } from "./game-flow";
import { HowToPlay } from "./how-to-play";

const initialState = (timerSeconds, status = "loading") => ({ score: 0, coins: 0, lives: 3, timeLeft: timerSeconds, status, paused: false, powered: false, powerRemainingMs: 0 });

export function GameScreen({ world, mode, alreadyCompleted = false, showInstructions = false }) {
  const router = useRouter();
  const needsIntroduction = shouldShowWorldIntroduction(world, showInstructions);
  const parentRef = useRef(null);
  const completionRef = useRef(null);
  const [bridge] = useState(createGameBridge);
  const [started, setStarted] = useState(!needsIntroduction);
  const [gameState, setGameState] = useState(() => initialState(world.timerSeconds, needsIntroduction ? "awaiting-start" : "loading"));
  const [terminal, setTerminal] = useState(null);
  const [saveState, setSaveState] = useState({ status: "idle", message: "" });
  const [resumeStep, setResumeStep] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [warmStart] = useState(() => gameplayPreloader.isWorldPreloaded(world.id));
  const mapHref = mode === "guest" ? "/worlds?mode=guest" : "/worlds";
  const nextWorld = getNextWorld(WORLD_CONFIGS, world.id);

  useEffect(() => {
    if (!started || warmStart || gameState.status !== "loading" || loadError) return undefined;
    const timer = window.setTimeout(() => setShowLoading(true), 250);
    return () => window.clearTimeout(timer);
  }, [gameState.status, loadError, started, warmStart]);

  const persistCompletion = useCallback(async (result) => {
    completionRef.current = result;
    const finalMission = world.completion === "treasure";
    if (alreadyCompleted) {
      setSaveState({ status: "saved", message: `World ${world.number} was already saved.` });
      return;
    }
    if (mode === "guest") {
      completeGuestWorld(WORLD_CONFIGS, world.id);
      setSaveState({ status: "saved", message: finalMission ? "Legendary treasure secured for this guest adventure." : "Checkpoint reached. The next world is unlocked for this adventure." });
      return;
    }
    setSaveState({ status: "saving", message: finalMission ? "Saving mission..." : "Saving checkpoint..." });
    const response = await postJson("/api/progress", { world: world.number, coins: result.coins }, "PATCH");
    setSaveState(response.ok
      ? { status: "saved", message: finalMission ? "Mission saved to your explorer profile." : "Checkpoint saved. The next world is unlocked." }
      : { status: "error", message: response.error || (finalMission ? "Mission could not be saved." : "Checkpoint could not be saved. Retry before continuing.") });
  }, [alreadyCompleted, mode, world]);

  useEffect(() => {
    if (!started) return undefined;
    let active = true; let game;
    const cleanups = [
      bridge.on(GAME_EVENTS.READY, () => { if (!active) return; setShowLoading(false); setLoadError(""); setGameState((state) => ({ ...state, status: "playing" })); }),
      bridge.on(GAME_EVENTS.LOAD_FAILED, () => { if (!active) return; setShowLoading(false); setLoadError("The adventure artwork could not be loaded."); }),
      bridge.on(GAME_EVENTS.STATE_CHANGED, (state) => active && setGameState(state)),
      bridge.on(GAME_EVENTS.RUN_ENDED, (result) => { if (active) { setResumeStep(null); setTerminal({ type: "game-over", result }); } }),
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
  }, [bridge, mapHref, mode, persistCompletion, router, started, world]);

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
    setResumeStep(null); setTerminal(null); completionRef.current = null; setSaveState({ status: "idle", message: "" });
    setShowLoading(false); setGameState(initialState(world.timerSeconds)); bridge.emit(GAME_COMMANDS.RESTART);
  }
  function goToNextWorld() {
    if (!nextWorld || saveState.status !== "saved") return;
    const query = mode === "guest" ? `?mode=guest&attempt=${beginGuestRun()}` : "";
    router.push(`/game/${nextWorld.id}${query}`);
  }

  const checkpointComplete = terminal?.type === "completed" && world.completion === "checkpoint";
  const missionComplete = terminal?.type === "completed" && world.completion === "treasure";

  return <main className={`gameplay-screen ${!started ? "is-awaiting-start" : ""}`} data-game-status={gameState.status} data-powered={gameState.powered ? "true" : "false"}>
    <div ref={parentRef} className="phaser-stage" aria-label={`${world.name} playable game canvas`} />
    {!started ? <section className="adventure-intro" role="dialog" aria-modal="true" aria-labelledby="adventure-intro-title">
      <div className="adventure-intro-panel">
        <span className="state-kicker">World 1 field briefing</span><h1 id="adventure-intro-title">How to Play</h1>
        <p className="intro-lead">Learn the expedition controls before the clock begins. The level remains completely paused until you start.</p>
        <HowToPlay />
        <div className="intro-actions"><Link className="game-button game-button-ghost" href={mapHref}><Map size={18} />World Map</Link><button autoFocus className="game-button game-button-primary" type="button" onClick={startAdventure}><Play size={18} />Start Adventure</button></div>
      </div>
    </section> : null}
    {started ? <header className="game-hud" aria-label="Game status"><div className="hud-world"><span>World {world.number}</span><strong>{world.name}</strong></div><div className="hud-cluster"><div className="hud-stats"><span><Trophy size={18} />{gameState.score.toLocaleString()}</span><span><Coins size={18} />{gameState.coins}</span><span className={gameState.lives <= 1 ? "is-danger" : ""}><Heart size={18} />{gameState.lives}</span><span className={gameState.timeLeft <= 20 ? "is-danger" : ""}><Timer size={18} />{gameState.timeLeft}</span></div>{gameState.powered ? <div className="power-meter" role="status"><Fish size={18} /><div><strong>Magic Shot</strong><span style={{ "--power-progress": `${Math.min(100, (gameState.powerRemainingMs / 8000) * 100)}%` }} /></div><b>{(gameState.powerRemainingMs / 1000).toFixed(1)}s</b></div> : null}</div><button className="hud-pause" type="button" onClick={() => bridge.emit(GAME_COMMANDS.PAUSE)} aria-label="Pause game"><Pause size={20} /></button></header> : null}
    {showLoading && !loadError ? <div className="game-loading" role="status"><span className="loading-spinner" /><strong>Preparing {world.name}...</strong></div> : null}
    {loadError ? <section className="game-state-overlay" role="alert"><div className="game-state-panel is-defeat"><span className="state-kicker">Loading interrupted</span><h1>Adventure unavailable</h1><p>{loadError}</p><div className="state-actions"><button className="game-button game-button-primary" type="button" onClick={() => window.location.reload()}><RotateCcw size={18} />Retry</button><Link className="game-button game-button-secondary" href={mapHref}><Map size={18} />World Map</Link></div></div></section> : null}
    {started ? <MobileControls bridge={bridge} powered={gameState.powered} /> : null}
    {gameState.paused && !terminal ? <section className="game-state-overlay" role="dialog" aria-modal="true" aria-label={resumeStep === null ? "Game paused" : "Resuming game"}><div className="game-state-panel pause-panel">{resumeStep === null ? <><span className="state-kicker">Adventure paused</span><h1>Take a breath, explorer.</h1><p>Your position, lives, timer, enemies and fish power are frozen.</p><div className="state-actions"><button autoFocus className="game-button game-button-primary" type="button" onClick={beginResume}><Play size={18} />Resume</button><button className="game-button game-button-secondary" type="button" onClick={restart}><RotateCcw size={18} />Restart</button><Link className="game-button game-button-ghost" href={mapHref}><Map size={18} />World Map</Link></div></> : <><div className="resume-countdown" role="status" aria-live="assertive"><span>Get ready</span><strong key={resumeStep}>{resumeStep}</strong><p>The run resumes after GO!</p></div><div className="countdown-actions"><button className="game-button game-button-secondary" type="button" onClick={restart}><RotateCcw size={18} />Restart</button><Link className="game-button game-button-ghost" href={mapHref}><Map size={18} />World Map</Link></div></>}</div></section> : null}
    {terminal ? <section className="game-state-overlay" role="dialog" aria-modal="true" aria-label={missionComplete ? "Mission complete" : checkpointComplete ? "World complete" : "Game over"}><div className={`game-state-panel ${terminal.type === "completed" ? "is-victory" : "is-defeat"}`}><span className="state-kicker">{missionComplete ? "Treasure Discovered" : checkpointComplete ? "Checkpoint Reached" : "The adventure ended"}</span><h1>{missionComplete ? "Mission Complete" : checkpointComplete ? "World Complete" : "Game Over"}</h1><p>{terminal.type === "completed" ? `Score ${terminal.result.score.toLocaleString()} · ${terminal.result.coins} coins · ${terminal.result.timeLeft}s left · ${terminal.result.lives} lives` : terminal.result.reason === "timer" ? `Time ran out before the ${world.completion === "treasure" ? "treasure" : "checkpoint"}.` : "Your explorer is out of lives."}</p>{saveState.message ? <small className={saveState.status === "error" ? "is-save-error" : ""} role="status">{saveState.message}</small> : null}<div className="state-actions terminal-actions">{checkpointComplete ? <><button className="game-button game-button-primary" type="button" onClick={goToNextWorld} disabled={saveState.status !== "saved"}><ArrowRight size={18} />{saveState.status === "saving" ? "Saving..." : `Next: ${nextWorld?.name}`}</button>{saveState.status === "error" ? <button className="game-button game-button-secondary" type="button" onClick={() => persistCompletion(completionRef.current)}><RotateCcw size={18} />Retry Save</button> : null}<Link className="game-button game-button-secondary" href={mapHref}><Map size={18} />World Map</Link></> : <><button className="game-button game-button-primary" type="button" onClick={restart}><RotateCcw size={18} />{missionComplete ? "Replay World" : "Play Again"}</button><Link className="game-button game-button-secondary" href={mapHref}><Map size={18} />World Map</Link></>}</div></div></section> : null}
  </main>;
}
