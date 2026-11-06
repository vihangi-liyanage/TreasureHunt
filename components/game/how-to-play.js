import { Coins, Fish, Gamepad2, Heart, ShieldAlert, Timer, Trophy } from "lucide-react";

const controls = [
  ["A / D", "Move"], ["← / →", "Move"], ["Space / ↑", "Jump"], ["F", "Magic shot"], ["Esc", "Pause"],
];

export function HowToPlay({ compact = false }) {
  return (
    <div className={`how-to-play ${compact ? "is-compact" : ""}`}>
      <div className="control-key-grid" aria-label="Keyboard controls">
        {controls.map(([key, action]) => <span key={key}><kbd>{key}</kbd><small>{action}</small></span>)}
      </div>
      <div className="adventure-rules">
        <article><Coins size={21} /><div><strong>Collect coins</strong><p>Gather compass coins to increase your score.</p></div></article>
        <article><Trophy size={21} /><div><strong>Defeat enemies</strong><p>Land on enemies from above to stomp them.</p></div></article>
        <article><Fish size={21} /><div><strong>Use fish magic</strong><p>A fish grants exactly 8 seconds of glowing orb shots. Press F or use Shoot on touch screens.</p></div></article>
        <article><ShieldAlert size={21} /><div><strong>Avoid danger</strong><p>Enemy side-contact, crystal thorns and falling into gaps cost a life.</p></div></article>
        <article><Heart size={21} /><div><strong>Three lives</strong><p>The adventure ends when all three lives are lost.</p></div></article>
        <article><Timer size={21} /><div><strong>Beat the clock</strong><p>Reach the World 1 and 2 checkpoints, then discover the World 3 treasure before time expires.</p></div></article>
      </div>
      <p className="touch-hint"><Gamepad2 size={18} /> On mobile, use the on-screen movement, Jump and powered Shoot controls.</p>
    </div>
  );
}
