"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AdventureShell } from "@/components/ui/adventure-shell";
import { GameOverlay } from "@/components/overlays/game-overlay";
import { AboutOverlay } from "@/components/overlays/about-overlay";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { startGuestAdventure } from "@/lib/progress/guest-progress";

export default function WelcomePage() {
  const [overlay, setOverlay] = useState(null);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  return (
    <AdventureShell className="welcome-screen">
      <section className="welcome-menu" aria-labelledby="game-title">
        <h1 className="game-title menu-title" id="game-title"><span className="welcome-prefix">Welcome to</span><span className="welcome-name">TreasureHunt</span></h1>
        <p className="menu-subtitle">Three worlds. One legendary treasure.</p>
        <div className="primary-menu" aria-label="Main game menu">
          <Link className="menu-option menu-option-primary menu-enter-1" href="/worlds?mode=guest" onClick={() => startGuestAdventure()}>Play as Guest</Link>
          <Link className="menu-option menu-enter-2" href="/login">Player Login</Link>
          <button className="menu-option menu-enter-3" type="button" onClick={() => setOverlay("settings")}>Settings</button>
          <button className="menu-option menu-enter-4" type="button" onClick={() => setOverlay("about")}>About the Game</button>
        </div>
      </section>

      <GameOverlay title="Settings" open={overlay === "settings"} onClose={closeOverlay}><SettingsPanel /></GameOverlay>
      <GameOverlay title="About the Game" open={overlay === "about"} onClose={closeOverlay} size="wide"><AboutOverlay /></GameOverlay>
    </AdventureShell>
  );
}
