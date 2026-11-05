"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { Coins,Fish,Heart,Map,Pause,Play,RotateCcw,Timer,Trophy } from "lucide-react";
import { createGameBridge } from "@/game/core/game-bridge";
import { GAME_COMMANDS,GAME_EVENTS } from "@/game/core/events";
import { EMERALD_JUNGLE_LEVEL } from "@/game/config/emerald-jungle";
import { WORLD_CONFIGS } from "@/game/config/worlds";
import { completeGuestWorld } from "@/lib/progress/guest-progress";
import { postJson } from "@/lib/auth/client-api";
import { MobileControls } from "./mobile-controls";
const INITIAL_STATE=Object.freeze({score:0,coins:0,lives:3,timeLeft:120,status:"loading",paused:false,powered:false,powerRemainingMs:0});
export function GameScreen({world,mode,alreadyCompleted=false}){
  const parentRef=useRef(null);const[bridge]=useState(createGameBridge);const[gameState,setGameState]=useState(INITIAL_STATE);const[terminal,setTerminal]=useState(null);const[saveNotice,setSaveNotice]=useState("");
  useEffect(()=>{let active=true,game;const cleanups=[
    bridge.on(GAME_EVENTS.READY,()=>active&&setGameState((state)=>({...state,status:"playing"}))),
    bridge.on(GAME_EVENTS.STATE_CHANGED,(state)=>active&&setGameState(state)),
    bridge.on(GAME_EVENTS.RUN_ENDED,(result)=>active&&setTerminal({type:"game-over",result})),
    bridge.on(GAME_EVENTS.WORLD_COMPLETED,async(result)=>{if(!active)return;setTerminal({type:"completed",result});if(alreadyCompleted){setSaveNotice("World 1 was already saved.");return;}if(mode==="guest"){completeGuestWorld(WORLD_CONFIGS,world.id);setSaveNotice("Guest checkpoint saved on this device.");return;}const response=await postJson("/api/progress",{world:world.number,coins:result.coins},"PATCH");if(active)setSaveNotice(response.ok?"Checkpoint saved to your explorer profile.":response.error||"Checkpoint could not be saved.");}),
  ];
  async function boot(){const{createTreasureHuntGame}=await import("@/game/create-game");if(active&&parentRef.current)game=createTreasureHuntGame(parentRef.current,{world,level:EMERALD_JUNGLE_LEVEL,bridge});}boot();
  const release=()=>bridge.emit(GAME_COMMANDS.INPUT_RELEASE_ALL);window.addEventListener("pointerup",release);window.addEventListener("blur",release);
  return()=>{active=false;window.removeEventListener("pointerup",release);window.removeEventListener("blur",release);cleanups.forEach((cleanup)=>cleanup());game?.destroy(true);bridge.destroy();};},[alreadyCompleted,bridge,mode,world]);
  function restart(){setTerminal(null);setSaveNotice("");setGameState(INITIAL_STATE);bridge.emit(GAME_COMMANDS.RESTART);}
  const mapHref=mode==="guest"?"/worlds?mode=guest":"/worlds";
  return <main className="gameplay-screen" data-game-status={gameState.status} data-powered={gameState.powered ? "true" : "false"}><div ref={parentRef} className="phaser-stage" aria-label={`${world.name} playable game canvas`}/>
    <header className="game-hud" aria-label="Game status"><div className="hud-world"><span>World 1</span><strong>{world.name}</strong></div><div className="hud-cluster"><div className="hud-stats"><span><Trophy size={18}/>{gameState.score.toLocaleString()}</span><span><Coins size={18}/>{gameState.coins}</span><span className={gameState.lives<=1?"is-danger":""}><Heart size={18}/>{gameState.lives}</span><span className={gameState.timeLeft<=20?"is-danger":""}><Timer size={18}/>{gameState.timeLeft}</span></div>{gameState.powered?<div className="power-meter" role="status"><Fish size={18}/><div><strong>Magic Shot</strong><span style={{"--power-progress":`${Math.min(100,(gameState.powerRemainingMs/8000)*100)}%`}}/></div><b>{(gameState.powerRemainingMs/1000).toFixed(1)}s</b></div>:null}</div><button className="hud-pause" type="button" onClick={()=>bridge.emit(GAME_COMMANDS.PAUSE)} aria-label="Pause game"><Pause size={20}/></button></header>
    {gameState.status==="loading"?<div className="game-loading"><span className="loading-spinner"/><strong>Preparing Emerald Jungle...</strong></div>:null}<MobileControls bridge={bridge} powered={gameState.powered}/>
    {gameState.paused&&!terminal?<section className="game-state-overlay" role="dialog" aria-modal="true" aria-label="Game paused"><div className="game-state-panel"><span className="state-kicker">Adventure paused</span><h1>Take a breath, explorer.</h1><div className="state-actions"><button className="game-button game-button-primary" type="button" onClick={()=>bridge.emit(GAME_COMMANDS.RESUME)}><Play size={18}/>Resume</button><button className="game-button game-button-secondary" type="button" onClick={restart}><RotateCcw size={18}/>Restart</button><Link className="game-button game-button-ghost" href={mapHref}><Map size={18}/>World Map</Link></div></div></section>:null}
    {terminal?<section className="game-state-overlay" role="dialog" aria-modal="true" aria-label={terminal.type==="completed"?"World complete":"Game over"}><div className={`game-state-panel ${terminal.type==="completed"?"is-victory":"is-defeat"}`}><span className="state-kicker">{terminal.type==="completed"?"Checkpoint Reached":"The jungle prevailed"}</span><h1>{terminal.type==="completed"?"World Complete":"Game Over"}</h1><p>{terminal.type==="completed"?`Score ${terminal.result.score.toLocaleString()} · ${terminal.result.coins} coins`:terminal.result.reason==="timer"?"Time ran out before the jungle gate.":"Your explorer is out of lives."}</p>{saveNotice?<small role="status">{saveNotice}</small>:null}<div className="state-actions"><button className="game-button game-button-primary" type="button" onClick={restart}><RotateCcw size={18}/>Play Again</button><Link className="game-button game-button-secondary" href={mapHref}><Map size={18}/>World Map</Link></div></div></section>:null}
  </main>;
}
