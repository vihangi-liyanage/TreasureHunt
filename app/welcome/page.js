"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BookOpen, LogIn, Play, Settings } from "lucide-react";
import { AdventureShell } from "@/components/ui/adventure-shell";
import { GameOverlay } from "@/components/overlays/game-overlay";
import { AboutOverlay } from "@/components/overlays/about-overlay";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default function WelcomePage() {
  const [overlay, setOverlay] = useState(null);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  return (
    <AdventureShell className="welcome-screen">
      <section className="welcome-menu" aria-labelledby="game-title">
        <h1 className="game-title menu-title" id="game-title">Treasure<span>Hunt</span></h1>
        <div className="primary-menu" aria-label="Main game menu">
          <Link className="menu-option menu-option-primary menu-enter-1" href="/worlds?mode=guest"><Play size={20} fill="currentColor" />Play as Guest</Link>
          <Link className="menu-option menu-enter-2" href="/login"><LogIn size={20} />Player Login</Link>
          <button className="menu-option menu-enter-3" type="button" onClick={() => setOverlay("settings")}><Settings size={20} />Settings</button>
          <button className="menu-option menu-enter-4" type="button" onClick={() => setOverlay("about")}><BookOpen size={20} />About the Game</button>
        </div>
      </section>

      <GameOverlay title="Settings" open={overlay === "settings"} onClose={closeOverlay}><SettingsPanel /></GameOverlay>
      <GameOverlay title="About the Game" open={overlay === "about"} onClose={closeOverlay} size="wide"><AboutOverlay /></GameOverlay>
    </AdventureShell>
  );
}
