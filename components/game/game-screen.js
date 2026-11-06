"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins,Fish,Heart,Map,Pause,Play,RotateCcw,Timer,Trophy } from "lucide-react";
import { createGameBridge } from "@/game/core/game-bridge";
import { GAME_COMMANDS,GAME_EVENTS } from "@/game/core/events";
import { getLevelConfig } from "@/game/config/levels";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { completeGuestWorld,deriveWorldStates,readGuestProgress } from "@/lib/progress/guest-progress";
import { postJson } from "@/lib/auth/client-api";
import { MobileControls } from "./mobile-controls";
import { gameplayPreloader } from "@/game/preload-gameplay";
const initialState=(timerSeconds)=>({score:0,coins:0,lives:3,timeLeft:timerSeconds,status:"loading",paused:false,powered:false,powerRemainingMs:0});
export function GameScreen({world,mode,alreadyCompleted=false}){
  const router=useRouter();const parentRef=useRef(null);const[bridge]=useState(createGameBridge);const[gameState,setGameState]=useState(()=>initialState(world.timerSeconds));const[terminal,setTerminal]=useState(null);const[saveNotice,setSaveNotice]=useState("");const[showLoading,setShowLoading]=useState(false);const[loadError,setLoadError]=useState("");const[warmStart]=useState(()=>gameplayPreloader.isWorldPreloaded(world.id));
  useEffect(()=>{if(warmStart||gameState.status!=="loading"||loadError)return;const timer=window.setTimeout(()=>setShowLoading(true),250);return()=>window.clearTimeout(timer);},[gameState.status,loadError,warmStart]);
  useEffect(()=>{let active=true,game;const cleanups=[
    bridge.on(GAME_EVENTS.READY,()=>{if(!active)return;setShowLoading(false);setLoadError("");setGameState((state)=>({...state,status:"playing"}));}),
    bridge.on(GAME_EVENTS.LOAD_FAILED,()=>{if(!active)return;setShowLoading(false);setLoadError("The adventure artwork could not be loaded.");}),
    bridge.on(GAME_EVENTS.STATE_CHANGED,(state)=>active&&setGameState(state)),
    bridge.on(GAME_EVENTS.RUN_ENDED,(result)=>active&&setTerminal({type:"game-over",result})),
    bridge.on(GAME_EVENTS.WORLD_COMPLETED,async(result)=>{if(!active)return;setTerminal({type:"completed",result});const finalMission=world.completion==="treasure";if(alreadyCompleted){setSaveNotice(`World ${world.number} was already saved.`);return;}if(mode==="guest"){completeGuestWorld(WORLD_CONFIGS,world.id);setSaveNotice(finalMission?"Legendary treasure secured for this guest adventure.":"Next world unlocked for this guest adventure.");return;}const response=await postJson("/api/progress",{world:world.number,coins:result.coins},"PATCH");if(active)setSaveNotice(response.ok?(finalMission?"Mission saved to your explorer profile.":"Checkpoint saved to your explorer profile."):response.error||(finalMission?"Mission could not be saved.":"Checkpoint could not be saved."));}),
  ];
  async function boot(){
    if(mode==="guest"){
      const guestWorld=deriveWorldStates(WORLD_CONFIGS,readGuestProgress().completedWorldIds).find((entry)=>entry.id===world.id);
      if(!guestWorld||guestWorld.locked){router.replace("/worlds?mode=guest");return;}
    }
    const level=getLevelConfig(world.id);if(!level){router.replace(mode==="guest"?"/worlds?mode=guest":"/worlds");return;}
    try{const{createTreasureHuntGame}=await gameplayPreloader.preloadWorld(world.id);if(active&&parentRef.current)game=createTreasureHuntGame(parentRef.current,{world,level,bridge});}
    catch{if(active){setShowLoading(false);setLoadError("The game could not be prepared. Check your connection and try again.");}}
  }boot();
  const release=()=>bridge.emit(GAME_COMMANDS.INPUT_RELEASE_ALL);window.addEventListener("pointerup",release);window.addEventListener("blur",release);
  return()=>{active=false;window.removeEventListener("pointerup",release);window.removeEventListener("blur",release);cleanups.forEach((cleanup)=>cleanup());game?.destroy(true);bridge.destroy();};},[alreadyCompleted,bridge,mode,router,world]);
  function restart(){setTerminal(null);setSaveNotice("");setShowLoading(false);setGameState(initialState(world.timerSeconds));bridge.emit(GAME_COMMANDS.RESTART);}
  const mapHref=mode==="guest"?"/worlds?mode=guest":"/worlds";
  return <main className="gameplay-screen" data-game-status={gameState.status} data-powered={gameState.powered ? "true" : "false"}><div ref={parentRef} className="phaser-stage" aria-label={`${world.name} playable game canvas`}/>
    <header className="game-hud" aria-label="Game status"><div className="hud-world"><span>World {world.number}</span><strong>{world.name}</strong></div><div className="hud-cluster"><div className="hud-stats"><span><Trophy size={18}/>{gameState.score.toLocaleString()}</span><span><Coins size={18}/>{gameState.coins}</span><span className={gameState.lives<=1?"is-danger":""}><Heart size={18}/>{gameState.lives}</span><span className={gameState.timeLeft<=20?"is-danger":""}><Timer size={18}/>{gameState.timeLeft}</span></div>{gameState.powered?<div className="power-meter" role="status"><Fish size={18}/><div><strong>Magic Shot</strong><span style={{"--power-progress":`${Math.min(100,(gameState.powerRemainingMs/8000)*100)}%`}}/></div><b>{(gameState.powerRemainingMs/1000).toFixed(1)}s</b></div>:null}</div><button className="hud-pause" type="button" onClick={()=>bridge.emit(GAME_COMMANDS.PAUSE)} aria-label="Pause game"><Pause size={20}/></button></header>
    {showLoading&&!loadError?<div className="game-loading" role="status"><span className="loading-spinner"/><strong>Preparing {world.name}...</strong></div>:null}{loadError?<section className="game-state-overlay" role="alert"><div className="game-state-panel is-defeat"><span className="state-kicker">Loading interrupted</span><h1>Adventure unavailable</h1><p>{loadError}</p><div className="state-actions"><button className="game-button game-button-primary" type="button" onClick={()=>window.location.reload()}><RotateCcw size={18}/>Retry</button><Link className="game-button game-button-secondary" href={mapHref}><Map size={18}/>World Map</Link></div></div></section>:null}<MobileControls bridge={bridge} powered={gameState.powered}/>
    {gameState.paused&&!terminal?<section className="game-state-overlay" role="dialog" aria-modal="true" aria-label="Game paused"><div className="game-state-panel"><span className="state-kicker">Adventure paused</span><h1>Take a breath, explorer.</h1><div className="state-actions"><button className="game-button game-button-primary" type="button" onClick={()=>bridge.emit(GAME_COMMANDS.RESUME)}><Play size={18}/>Resume</button><button className="game-button game-button-secondary" type="button" onClick={restart}><RotateCcw size={18}/>Restart</button><Link className="game-button game-button-ghost" href={mapHref}><Map size={18}/>World Map</Link></div></div></section>:null}
    {terminal?<section className="game-state-overlay" role="dialog" aria-modal="true" aria-label={terminal.type==="completed"?(world.completion==="treasure"?"Mission complete":"World complete"):"Game over"}><div className={`game-state-panel ${terminal.type==="completed"?"is-victory":"is-defeat"}`}><span className="state-kicker">{terminal.type==="completed"?(world.completion==="treasure"?"Treasure Discovered":"Checkpoint Reached"):"The adventure ended"}</span><h1>{terminal.type==="completed"?(world.completion==="treasure"?"Mission Complete":"World Complete"):"Game Over"}</h1><p>{terminal.type==="completed"?`Score ${terminal.result.score.toLocaleString()} · ${terminal.result.coins} coins · ${terminal.result.timeLeft}s left · ${terminal.result.lives} lives`:terminal.result.reason==="timer"?`Time ran out before the ${world.completion==="treasure"?"treasure":"checkpoint"}.`:"Your explorer is out of lives."}</p>{saveNotice?<small role="status">{saveNotice}</small>:null}<div className="state-actions"><button className="game-button game-button-primary" type="button" onClick={restart}><RotateCcw size={18}/>Play Again</button><Link className="game-button game-button-secondary" href={mapHref}><Map size={18}/>World Map</Link></div></div></section>:null}
  </main>;
}
