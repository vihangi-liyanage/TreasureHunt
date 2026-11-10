"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, CheckCircle2, Fish, Flag, Gem, LogOut, Save, Trophy, UserRound } from "lucide-react";
import { postJson } from "@/lib/auth/client-api";
import { validateUsername } from "@/lib/validation/auth";
import { getAchievement } from "@/lib/game/achievements";

export function ProfilePanel({ profile }) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  const [savedUsername, setSavedUsername] = useState(profile.username);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const progress = profile.progress;
  const completedWorlds = progress?.completed_worlds || 0;
  const completedCheckpoints = Math.min(completedWorlds, 2);
  const achievements = profile.achievements || [];
  const earnedKeys = new Set(achievements.map((achievement) => achievement.achievement_key));
  const compassCount = Number(earnedKeys.has("world_1_compass")) + Number(earnedKeys.has("world_2_compass"));

  async function saveProfile(event) {
    event.preventDefault();
    const error = validateUsername(username);
    if (error) { setNotice(error); return; }
    setPending(true);
    const result = await postJson("/api/profile", { username }, "PATCH");
    setPending(false);
    if (!result.ok) { setNotice(result.error || result.errors?.username || "Profile could not be updated."); return; }
    setSavedUsername(result.profile.username);
    setUsername(result.profile.username);
    setNotice("Explorer name saved.");
    router.refresh();
  }

  async function logout() {
    setPending(true);
    const result = await postJson("/api/auth/logout", {});
    if (!result.ok) { setPending(false); setNotice(result.error || "Could not sign out."); return; }
    router.replace("/welcome");
    router.refresh();
  }

  return (
    <div className="profile-panel">
      <div className="profile-identity"><span><UserRound size={24} /></span><div><strong>{savedUsername}</strong><p>{profile.email}</p>{profile.createdAt ? <small>Explorer since {String(profile.createdAt).slice(0, 10)}</small> : null}</div></div>
      <div className="profile-progress-grid" aria-label="Saved adventure progress">
        <span><Flag size={18} /><strong>{completedWorlds}/3</strong><small>Worlds complete</small></span>
        <span><CheckCircle2 size={18} /><strong>{compassCount || completedCheckpoints}/2</strong><small>Compasses</small></span>
        <span><Gem size={18} /><strong>{progress?.total_gems || 0}</strong><small>Gems</small></span>
        <span><Fish size={18} /><strong>{progress?.fish_powerups_collected || 0}</strong><small>Fish power-ups</small></span>
        <span><Award size={18} /><strong>{progress?.total_coins || 0}</strong><small>Saved coins</small></span>
      </div>
      <div className="profile-best-run"><Trophy size={20} /><div><small>Best completed mission</small><strong>{profile.bestRun ? `${Number(profile.bestRun.score).toLocaleString()} points · Rank #${profile.bestRun.rank}` : "No ranked World 3 run yet"}</strong></div></div>
      <section className="profile-achievements" aria-labelledby="achievement-title">
        <h3 id="achievement-title">Achievements</h3>
        {achievements.length ? <ul>{achievements.map((achievement) => { const badge = getAchievement(achievement.achievement_key); return <li key={achievement.achievement_key}><Award size={16} /><span><strong>{badge?.title || achievement.achievement_key.replaceAll("_", " ")}</strong><small>{badge?.description} Earned {String(achievement.earned_at).slice(0, 10)}</small></span></li>; })}</ul> : <div className="profile-empty"><Award size={20} /><p>No achievement badges yet. Collect gems, fish power-ups, compasses, and the legendary treasure.</p></div>}
      </section>
      <form onSubmit={saveProfile}>
        <label htmlFor="profile-username">Username</label>
        <div className="profile-edit-row">
          <input className="form-field" id="profile-username" value={username} onChange={(event) => { setUsername(event.target.value); setNotice(""); }} maxLength={24} />
          <button className="round-control" type="submit" disabled={pending} aria-label="Save username"><Save size={18} /></button>
        </div>
      </form>
      {notice ? <p className="profile-notice" role="status">{notice}</p> : null}
      <button className="game-button game-button-secondary w-full" type="button" onClick={logout} disabled={pending}><LogOut size={18} />Sign Out</button>
    </div>
  );
}
