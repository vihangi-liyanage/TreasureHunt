import { Clock3, Coins, Crown, Medal, Trophy } from "lucide-react";

function RankMark({ rank }) {
  if (Number(rank) === 1) return <span className="rank-mark"><Trophy size={22} aria-hidden="true" /><b>1</b></span>;
  if (Number(rank) === 2) return <span className="rank-mark"><Medal size={21} aria-hidden="true" /><b>2</b></span>;
  if (Number(rank) === 3) return <span className="rank-mark"><Medal size={21} aria-hidden="true" /><b>3</b></span>;
  return <span className="rank-mark"><b>{rank}</b></span>;
}

export function LeaderboardPanel({ mode, entries = [], status = "ready" }) {
  if (status === "unavailable") return <div className="empty-game-state"><Medal size={34} /><h3>Rankings unavailable</h3><p>Your adventure progress is safe, but verified rankings could not be loaded. Try opening the leaderboard again later.</p></div>;
  if (!entries.length) return <div className="empty-game-state"><Medal size={34} /><h3>No eligible ranked runs yet</h3><p>Rankings require a signed-in World 3 mission issued and securely submitted as a ranked run. Account creation and saved world progress do not create a score.</p></div>;

  const topEntries = entries.filter((entry) => Number(entry.rank) <= 10);
  const currentEntry = entries.find((entry) => entry.is_current);
  const currentOutsideTop = currentEntry && Number(currentEntry.rank) > 10;
  return (
    <div className="leaderboard-table">
      <div className="leaderboard-banner"><span><Crown size={23} /></span><div><small>Verified World 3 runs</small><strong>Hall of Explorers</strong></div><p>{topEntries.length} ranked {topEntries.length === 1 ? "explorer" : "explorers"}</p></div>
      <div className="leaderboard-heading" aria-hidden="true"><span>Rank</span><span>Explorer</span><span>Completed run</span><span>Best score</span></div>
      <ol className="leaderboard-list" aria-label="Top explorers">
        {topEntries.map((entry) => <li className={`rank-${Math.min(Number(entry.rank), 4)} ${entry.is_current ? "is-current-player" : ""}`} key={entry.run_id}>
          <RankMark rank={entry.rank} />
          <div className="leaderboard-player"><strong>{entry.username}</strong>{entry.is_current ? <small>You</small> : null}</div>
          <div className="leaderboard-run"><span><Trophy size={13} />World {entry.world_reached}</span><span><Coins size={13} />{entry.coins} coins</span><span><Clock3 size={13} />{entry.duration_seconds}s</span></div>
          <b className="leaderboard-score">{Number(entry.score).toLocaleString()}<small>points</small></b>
        </li>)}
      </ol>
      {currentOutsideTop ? <div className="leaderboard-current" aria-label="Your leaderboard position"><small>Your best</small><span>#{currentEntry.rank}</span><strong>{currentEntry.username}</strong><b>{Number(currentEntry.score).toLocaleString()}</b><p>{currentEntry.coins} coins · {currentEntry.duration_seconds}s</p></div> : null}
      {mode === "guest" ? <p className="leaderboard-guest-note">Guest view only. Sign in to submit a verified World 3 score.</p> : null}
    </div>
  );
}
