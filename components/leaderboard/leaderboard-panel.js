import Link from "next/link";
import { LockKeyhole, Medal } from "lucide-react";

export function LeaderboardPanel({ mode, entries = [] }) {
  if (mode === "guest") {
    return (
      <div className="leaderboard-signin">
        <span><LockKeyhole size={28} /></span>
        <h3>Join the explorers</h3>
        <p>Sign in to view verified mission rankings. Guest adventures remain separate and cannot submit leaderboard runs.</p>
        <Link className="game-button game-button-primary" href="/login">Player Login</Link>
      </div>
    );
  }

  if (!entries.length) {
    return <div className="empty-game-state"><Medal size={34} /><h3>No completed missions yet</h3><p>The leaderboard will fill when authenticated players complete game runs.</p></div>;
  }

  return (
    <div className="leaderboard-table">
      <div className="leaderboard-heading" aria-hidden="true"><span>Rank</span><span>Explorer</span><span>Mission</span><span>Score</span></div>
      <ol className="leaderboard-list" aria-label="Top explorers">
      {entries.slice(0, 10).map((entry, index) => (
        <li key={entry.run_id}>
          <span>{index + 1}</span>
          <strong>{entry.username}</strong>
          <small>World {entry.world_reached} · {entry.coins} coins · {entry.duration_seconds}s</small>
          <b>{Number(entry.score).toLocaleString()}</b>
        </li>
      ))}
      </ol>
    </div>
  );
}
