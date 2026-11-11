"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, CalendarDays, CheckCircle2, Coins, Compass, Crown, Fish, Flag, Gem, LockKeyhole, LogOut, Mail, Medal, Save, Sparkles, Trophy, UserRound } from "lucide-react";
import { postJson } from "@/lib/auth/client-api";
import { validateUsername } from "@/lib/validation/auth";
import { ACHIEVEMENTS } from "@/lib/game/achievements";

const BADGE_ICONS = Object.freeze({ first_gem: Gem, five_gems: Sparkles, first_fish_power: Fish, world_1_compass: Compass, world_2_compass: Medal, world_3_treasure: Crown });

function AchievementBadge({ achievementKey, achievement, active, onSelect }) {
  const definition = ACHIEVEMENTS[achievementKey];
  const Icon = BADGE_ICONS[achievementKey] || Award;
  const earned = Boolean(achievement);
  return (
    <button className={`achievement-badge ${earned ? "is-earned" : "is-locked"} ${active ? "is-active" : ""}`} type="button" onClick={onSelect} aria-expanded={active} aria-label={`${definition.title}, ${earned ? "earned" : "locked"}. ${definition.description}`}>
      <span className="achievement-emblem" aria-hidden="true"><Icon size={25} /><span className="achievement-state-icon">{earned ? <CheckCircle2 size={13} /> : <LockKeyhole size={13} />}</span></span>
      <strong>{definition.title}</strong>
      <small>{earned ? "Earned" : "Locked"}</small>
    </button>
  );
}

export function ProfilePanel({ profile, initialView = "overview" }) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  const [savedUsername, setSavedUsername] = useState(profile.username);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [view, setView] = useState(initialView);
  const [selectedAchievement, setSelectedAchievement] = useState("first_gem");
  const progress = profile.progress;
  const completedWorlds = progress?.completed_worlds || 0;
  const completedCheckpoints = Math.min(completedWorlds, 2);
  const achievements = profile.achievements || [];
  const achievementsByKey = new Map(achievements.map((achievement) => [achievement.achievement_key, achievement]));
  const compassCount = Number(achievementsByKey.has("world_1_compass")) + Number(achievementsByKey.has("world_2_compass"));
  const selectedDefinition = ACHIEVEMENTS[selectedAchievement];
  const selectedEarned = achievementsByKey.get(selectedAchievement);

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
    <div className={`profile-panel is-${view}-view`}>
      <section className="explorer-card" aria-label="Explorer identity">
        <div className="explorer-avatar" aria-hidden="true"><UserRound size={30} /><span><Compass size={13} /></span></div>
        <div className="explorer-copy"><small>Registered Explorer</small><strong>{savedUsername}</strong><p><Mail size={13} />{profile.email}</p>{profile.createdAt ? <p><CalendarDays size={13} />Explorer since {String(profile.createdAt).slice(0, 10)}</p> : null}</div>
        <div className="explorer-rank"><Trophy size={18} /><small>Rank</small><strong>{profile.bestRun ? `#${profile.bestRun.rank}` : "—"}</strong></div>
      </section>
      <div className="profile-view-switch" role="tablist" aria-label="Profile sections">
        <button type="button" role="tab" aria-selected={view === "overview"} onClick={() => setView("overview")}><UserRound size={15} />Overview</button>
        <button type="button" role="tab" aria-selected={view === "achievements"} onClick={() => setView("achievements")}><Award size={15} />Achievements <span>{achievements.length}/6</span></button>
      </div>
      {view === "overview" ? <div className="profile-overview" role="tabpanel">
        <div className="profile-progress-grid" aria-label="Saved adventure progress">
          <span><Flag size={19} /><strong>{completedWorlds}/3</strong><small>Worlds</small></span><span><Compass size={19} /><strong>{compassCount || completedCheckpoints}/2</strong><small>Compasses</small></span><span><Gem size={19} /><strong>{progress?.total_gems || 0}</strong><small>Gems</small></span><span><Fish size={19} /><strong>{progress?.fish_powerups_collected || 0}</strong><small>Fish powers</small></span><span><Coins size={19} /><strong>{progress?.total_coins || 0}</strong><small>Saved coins</small></span>
        </div>
        <div className="profile-best-run"><Trophy size={22} /><div><small>Personal best</small><strong>{profile.bestRun ? `${Number(profile.bestRun.score).toLocaleString()} points` : "No completed ranked mission"}</strong></div><span>{profile.bestRun ? `World ${profile.bestRun.world_reached} · Rank #${profile.bestRun.rank}` : "Complete World 3 to rank"}</span></div>
        <form className="profile-editor" onSubmit={saveProfile}><label htmlFor="profile-username">Explorer username</label><div className="profile-edit-row"><input className="form-field" id="profile-username" value={username} onChange={(event) => { setUsername(event.target.value); setNotice(""); }} maxLength={24} autoComplete="username" /><button className="round-control" type="submit" disabled={pending} aria-label="Save username"><Save size={18} /></button></div></form>
      </div> : <section className="profile-achievements" role="tabpanel" aria-labelledby="achievement-title">
        <div className="achievement-heading"><div><small>Adventure collection</small><h3 id="achievement-title">Achievement badges</h3></div><strong>{achievements.length}<span>/6 earned</span></strong></div>
        <div className="achievement-grid">{Object.keys(ACHIEVEMENTS).map((achievementKey) => <AchievementBadge key={achievementKey} achievementKey={achievementKey} achievement={achievementsByKey.get(achievementKey)} active={selectedAchievement === achievementKey} onSelect={() => setSelectedAchievement(achievementKey)} />)}</div>
        <div className={`achievement-detail ${selectedEarned ? "is-earned" : "is-locked"}`} role="status"><div><strong>{selectedDefinition.title}</strong><p>{selectedDefinition.description}</p></div><small>{selectedEarned ? `Earned ${String(selectedEarned.earned_at).slice(0, 10)}` : "Locked · Keep exploring"}</small></div>
      </section>}
      {notice ? <p className="profile-notice" role="status">{notice}</p> : null}
      <button className="game-button game-button-secondary profile-signout" type="button" onClick={logout} disabled={pending}><LogOut size={18} />Sign Out</button>
    </div>
  );
}
