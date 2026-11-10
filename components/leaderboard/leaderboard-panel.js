import { Medal } from "lucide-react";

export function LeaderboardPanel({ mode, entries = [], status = "ready" }) {
  if (status === "unavailable") {
    return <div className="empty-game-state"><Medal size={34} /><h3>Rankings unavailable</h3><p>Your adventure progress is safe, but verified rankings could not be loaded. Try opening the leaderboard again later.</p></div>;
  }

  if (!entries.length) {
    return <div className="empty-game-state"><Medal size={34} /><h3>No eligible ranked runs yet</h3><p>Rankings require a signed-in World 3 mission issued and securely submitted as a ranked run. Account creation and saved world progress do not create a score.</p></div>;
  }

  const topEntries = entries.filter((entry) => Number(entry.rank) <= 10);
  const currentEntry = entries.find((entry) => entry.is_current);
  const currentOutsideTop = currentEntry && Number(currentEntry.rank) > 10;
  return (
    <div className="leaderboard-table">
      <div className="leaderboard-heading" aria-hidden="true"><span>Rank</span><span>Explorer</span><span>Mission</span><span>Score</span></div>
      <ol className="leaderboard-list" aria-label="Top explorers">
      {topEntries.map((entry) => (
        <li className={entry.is_current ? "is-current-player" : ""} key={entry.run_id}>
          <span>{entry.rank}</span>
          <strong>{entry.username}</strong>
          <small>World {entry.world_reached} · {entry.coins} coins · {entry.duration_seconds}s</small>
          <b>{Number(entry.score).toLocaleString()}</b>
        </li>
      ))}
      </ol>
      {currentOutsideTop ? <div className="leaderboard-current" aria-label="Your leaderboard position"><small>Your best</small><span>#{currentEntry.rank}</span><strong>{currentEntry.username}</strong><b>{Number(currentEntry.score).toLocaleString()}</b><p>{currentEntry.coins} coins · {currentEntry.duration_seconds}s</p></div> : null}
      {mode === "guest" ? <p className="leaderboard-guest-note">Guest view only. Sign in to submit a verified World 3 score.</p> : null}
    </div>
  );
}
