import Link from "next/link";
import { LockKeyhole, Medal } from "lucide-react";

export function LeaderboardPanel({ mode, entries = [] }) {
  if (mode === "guest") {
    return (
      <div className="leaderboard-signin">
        <span><LockKeyhole size={28} /></span>
        <h3>Join the explorers</h3>
        <p>Sign in to view global rankings and submit future game scores. Guest progress stays safely on this device.</p>
        <Link className="game-button game-button-primary" href="/login">Player Login</Link>
      </div>
    );
  }

  if (!entries.length) {
    return <div className="empty-game-state"><Medal size={34} /><h3>No completed missions yet</h3><p>The leaderboard will fill when authenticated players complete game runs.</p></div>;
  }

  return (
    <ol className="leaderboard-list" aria-label="Top explorers">
      {entries.slice(0, 5).map((entry, index) => (
        <li key={entry.run_id}>
          <span>{index + 1}</span>
          <strong>{entry.username}</strong>
          <small>World {entry.world_reached}</small>
          <b>{Number(entry.score).toLocaleString()}</b>
        </li>
      ))}
    </ol>
  );
}
