"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, CheckCircle2, Flag, LogOut, Save, UserRound } from "lucide-react";
import { postJson } from "@/lib/auth/client-api";
import { validateUsername } from "@/lib/validation/auth";

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
        <span><CheckCircle2 size={18} /><strong>{completedCheckpoints}/2</strong><small>Shrines</small></span>
        <span><Award size={18} /><strong>{progress?.total_coins || 0}</strong><small>Saved coins</small></span>
      </div>
      <section className="profile-achievements" aria-labelledby="achievement-title">
        <h3 id="achievement-title">Achievements</h3>
        {achievements.length ? <ul>{achievements.map((achievement) => <li key={achievement.achievement_key}><Award size={16} /><span><strong>{achievement.achievement_key.replaceAll("_", " ")}</strong><small>Earned {String(achievement.earned_at).slice(0, 10)}</small></span></li>)}</ul> : <div className="profile-empty"><Award size={20} /><p>No achievements earned yet. Optional Fish challenges and achievement awards are still planned.</p></div>}
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
