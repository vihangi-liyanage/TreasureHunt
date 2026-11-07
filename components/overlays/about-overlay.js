"use client";

import { useState } from "react";
import { Coins, Fish, Gamepad2, ScrollText, ShieldAlert } from "lucide-react";
import { HowToPlay } from "@/components/game/how-to-play";

const sections = [
  { id: "story", label: "Story", icon: ScrollText, title: "The compass of three realms", body: "A long-silent explorer's compass has awakened, tracing one path through the Emerald Jungle's flooded temples, the wind-worn bridges of Sunset Ruins, and the luminous depths of Crystal Cavern. Two Compass Shrines guard the road. Beyond them waits the legendary treasure—and the truth behind the compass's final call." },
  { id: "play", label: "How to play", icon: Gamepad2, title: "Explorer field guide", body: "" },
  { id: "controls", label: "Controls", icon: Gamepad2, title: "Keyboard and touch", body: "Move with A/D or the arrow keys, jump with Space or Up, fire magic with F while fish-powered, and pause with Escape. Touch screens provide separate movement, Jump and powered Shoot buttons." },
  { id: "items", label: "Items", icon: Coins, title: "Magic and danger", body: "Compass coins raise your score. A magical fish grants exactly eight seconds of glowing orb shots—no gun required. Enemies can be stomped, but side contact, hazards and falls cost one of your three lives." },
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
        {active.body ? <p>{active.body}</p> : null}
        {activeId === "play" ? <HowToPlay /> : null}
        {activeId === "items" ? <div className="item-strip" aria-label="Game items"><span><Coins size={18} /> Coins</span><span><Fish size={18} /> Fish power</span><span><ShieldAlert size={18} /> Enemies</span></div> : null}
      </div>
    </div>
  );
}
