"use client";
import { ArrowLeft, ArrowRight, ArrowUp, Sparkles } from "lucide-react";
import { GAME_COMMANDS } from "@/game/core/events";
function ControlButton({ bridge, control, label, children, className = "", disabled = false }) {
  const send = (pressed, pointerId) => bridge.emit(GAME_COMMANDS.INPUT, { control, pressed, pointerId: `touch-${pointerId}` });
  return <button className={`touch-control ${className}`} type="button" aria-label={label} disabled={disabled}
    onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); send(true, event.pointerId); }}
    onPointerUp={(event) => send(false, event.pointerId)} onPointerCancel={(event) => send(false, event.pointerId)}
    onLostPointerCapture={(event) => send(false, event.pointerId)}>{children}</button>;
}

export function MobileControls({ bridge, powered }) {
  return <div className="mobile-game-controls" aria-label="Touch game controls">
    <div className="movement-pad"><ControlButton bridge={bridge} control="left" label="Move left"><ArrowLeft /></ControlButton><ControlButton bridge={bridge} control="right" label="Move right"><ArrowRight /></ControlButton></div>
    <div className="action-pad"><ControlButton bridge={bridge} control="shoot" label={powered ? "Shoot magic orb" : "Collect the fish to shoot"} className="shoot-control" disabled={!powered}><Sparkles /><span>Shoot</span></ControlButton><ControlButton bridge={bridge} control="jump" label="Jump" className="jump-control"><ArrowUp /><span>Jump</span></ControlButton></div>
  </div>;
}
