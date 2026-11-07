import { Coins, Fish, Gamepad2, Heart, ShieldAlert, Timer, Trophy } from "lucide-react";

const controls = [
  ["A/D · ←/→", "Move"], ["Space · ↑", "Jump"], ["F", "Shoot"], ["Esc", "Pause"],
];

export function HowToPlay({ compact = false }) {
  return (
    <div className={`how-to-play ${compact ? "is-compact" : ""}`}>
      <div className="control-key-grid" aria-label="Keyboard controls">
        {controls.map(([key, action]) => <span key={key}><kbd>{key}</kbd><small>{action}</small></span>)}
      </div>
      {compact ? <div className="briefing-rules">
        <span><Coins size={19} /><strong>Coins</strong> raise score</span>
        <span><Fish size={19} /><strong>Fish magic</strong> refreshes 8s shooting</span>
        <span><ShieldAlert size={19} /><strong>Danger</strong> costs one of 3 lives</span>
      </div> : <div className="adventure-rules">
        <article><Coins size={21} /><div><strong>Collect coins</strong><p>Optional upper routes hold more compass coins and reward skilled movement.</p></div></article>
        <article><Trophy size={21} /><div><strong>Defeat enemies</strong><p>Stomp from above or use fish-powered magical orbs.</p></div></article>
        <article><Fish size={21} /><div><strong>Use fish magic</strong><p>Each fish refreshes shooting to exactly 8 seconds; durations never stack.</p></div></article>
        <article><ShieldAlert size={21} /><div><strong>Avoid danger</strong><p>Enemy side-contact, thorns and falling into gaps cost a life.</p></div></article>
        <article><Heart size={21} /><div><strong>Three lives</strong><p>The adventure ends when all three lives are lost.</p></div></article>
        <article><Timer size={21} /><div><strong>Beat the clock</strong><p>Activate two Compass Shrines, then discover the World 3 treasure before time expires.</p></div></article>
      </div>}
      <p className="touch-hint"><Gamepad2 size={18} /> Touch controls provide Move, Jump and powered Shoot.</p>
    </div>
  );
}
