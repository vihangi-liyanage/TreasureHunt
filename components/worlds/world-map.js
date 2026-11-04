"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Compass, LockKeyhole, Settings, Trophy } from "lucide-react";
import { GameOverlay } from "@/components/overlays/game-overlay";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { deriveWorldStates, getJourneyProgress, GUEST_PROGRESS_KEY, readGuestProgress } from "@/lib/progress/guest-progress";

function NodeStatus({ world }) {
  if (world.completed) return <span className="node-status is-completed"><Check size={14} />Completed</span>;
  if (world.current) return <span className="node-status is-current"><Compass size={14} />Current</span>;
  if (world.locked) return <span className="node-status"><LockKeyhole size={14} />Locked</span>;
  return <span className="node-status">Unlocked</span>;
}

export function WorldMap({ worlds }) {
  const [completedWorldIds, setCompletedWorldIds] = useState([]);
  const [selectedId, setSelectedId] = useState(worlds[0].id);
  const [overlay, setOverlay] = useState(null);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  useEffect(() => {
    const syncProgress = () => {
      const completed = readGuestProgress().completedWorldIds;
      const current = deriveWorldStates(worlds, completed).find((world) => world.current);
      setCompletedWorldIds(completed);
      if (current) setSelectedId(current.id);
    };
    const initialFrame = window.requestAnimationFrame(syncProgress);
    const syncStorage = (event) => { if (event.key === GUEST_PROGRESS_KEY) syncProgress(); };
    window.addEventListener("storage", syncStorage);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("storage", syncStorage);
    };
  }, [worlds]);

  const states = useMemo(() => deriveWorldStates(worlds, completedWorldIds), [worlds, completedWorldIds]);
  const journeyProgress = useMemo(() => getJourneyProgress(worlds, completedWorldIds), [worlds, completedWorldIds]);
  const selectedWorld = states.find((world) => world.id === selectedId && !world.locked) || states.find((world) => world.current) || states[0];

  return (
    <main className="world-map-screen">
      <div className="map-shade" aria-hidden="true" />
      <div className="map-controls">
        <Link className="screen-control" href="/welcome"><ArrowLeft size={18} />Back</Link>
        <div className="map-actions">
          <button className="icon-control" type="button" onClick={() => setOverlay("leaderboard")} aria-label="Leaderboard"><Trophy size={20} /></button>
          <button className="icon-control" type="button" onClick={() => setOverlay("settings")} aria-label="Settings"><Settings size={20} /></button>
        </div>
      </div>

      <h1 className="map-title font-display">World Map</h1>
      <section className="journey-stage" aria-label="World journey">
        <svg className="journey-trail" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <path className="trail-shadow" pathLength="100" d="M 145 360 C 270 40 430 55 510 205 S 750 500 860 245" />
          <path className="trail-base" pathLength="100" d="M 145 360 C 270 40 430 55 510 205 S 750 500 860 245" />
          <path className="trail-progress" pathLength="100" style={{ strokeDasharray: `${journeyProgress} 100` }} d="M 145 360 C 270 40 430 55 510 205 S 750 500 860 245" />
        </svg>

        {states.map((world, index) => (
          <button
            className={`world-node world-node-${index + 1} ${selectedWorld.id === world.id ? "is-selected" : ""}`}
            data-completed={world.completed}
            data-current={world.current}
            data-locked={world.locked}
            disabled={world.locked}
            key={world.id}
            type="button"
            onClick={() => setSelectedId(world.id)}
            aria-label={`${world.name}, ${world.completed ? "completed" : world.current ? "current world" : world.locked ? "locked" : "unlocked"}`}
          >
            <span className="world-node-ring"><span className={`world-node-art world-art-${index + 1}`} /></span>
            <strong>{world.name}</strong>
            <NodeStatus world={world} />
          </button>
        ))}
      </section>

      <aside className="world-detail" aria-live="polite">
        <span>World {selectedWorld.number}</span>
        <div><h2 className="font-display">{selectedWorld.name}</h2><p>{selectedWorld.description}</p></div>
        <strong>{selectedWorld.difficulty}</strong>
      </aside>

      <GameOverlay title="Settings" open={overlay === "settings"} onClose={closeOverlay}><SettingsPanel /></GameOverlay>
      <GameOverlay title="Leaderboard" open={overlay === "leaderboard"} onClose={closeOverlay}>
        <div className="empty-game-state"><Trophy size={34} /><h3>Rankings await</h3><p>Guest scores stay local. Shared rankings connect with player accounts in Phase 2B.</p></div>
      </GameOverlay>
    </main>
  );
}
