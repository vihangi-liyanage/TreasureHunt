"use client";

import { useState } from "react";
import { Coins, Fish, Gamepad2, ScrollText, ShieldAlert } from "lucide-react";

const sections = [
  { id: "story", label: "Story", icon: ScrollText, title: "The lost compass", body: "An ancient compass has awakened, pointing through three forgotten kingdoms toward a treasure no explorer has ever returned with." },
  { id: "play", label: "How to play", icon: Gamepad2, title: "Reach the final vault", body: "Run, jump, collect coins, stomp enemies, survive each world timer, and cross two checkpoints before claiming the Crystal Cavern treasure." },
  { id: "controls", label: "Controls", icon: Gamepad2, title: "Keyboard controls", body: "Move with A/D or the arrow keys. Press Space to jump, F to fire while fish-powered, and Escape to pause." },
  { id: "items", label: "Items", icon: Coins, title: "Treasures and threats", body: "Coins raise your score. Magical fish grant 8 seconds of shooting. Enemies can be stomped from above, but side contact and hazards cost a life." },
];

export function AboutOverlay() {
  const [activeId, setActiveId] = useState("story");
  const active = sections.find((section) => section.id === activeId);
  const ActiveIcon = active.icon;

  return (
    <div className="about-layout">
      <div className="about-tabs" role="tablist" aria-label="About TreasureHunt">
        {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeId === id} className="about-tab" onClick={() => setActiveId(id)}><Icon size={17} />{label}</button>)}
      </div>
      <div className="about-content" role="tabpanel">
        <span className="about-emblem" aria-hidden="true"><ActiveIcon size={28} /></span>
        <h3>{active.title}</h3>
        <p>{active.body}</p>
        {activeId === "items" ? <div className="item-strip" aria-label="Game items"><span><Coins size={18} /> Coins</span><span><Fish size={18} /> Fish power</span><span><ShieldAlert size={18} /> Enemies</span></div> : null}
      </div>
    </div>
  );
}
