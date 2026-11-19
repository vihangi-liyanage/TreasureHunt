"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Award, CalendarDays, Check, Coins, Compass, Crown, Fish, Flag, LockKeyhole, LogOut, Mail, Pencil, Save, ShieldCheck, Trophy, UserRound, X } from "lucide-react";
import { postJson } from "@/lib/auth/client-api";
import { validateUsername } from "@/lib/validation/auth";
import { ACHIEVEMENTS, getAchievementProgress } from "@/lib/game/achievements";

const ACHIEVEMENT_TOTAL = Object.keys(ACHIEVEMENTS).length;

function RewardArtwork({ type }) {
  const diamond = <Image className="profile-diamond" src="/art/gameplay/blue-diamond.png" width={46} height={46} alt="" aria-hidden="true" />;
  const icons = { emerald: diamond, sapphire: diamond, crystal: diamond, fish: <Fish size={38} />, compass: <Compass size={38} />, "legendary-chest": <Crown size={36} /> };
  if (type === "gem-chest" || type === "gold-chest") {
    return <span className={`reward-chest is-${type}`} aria-hidden="true"><span className="chest-light" /><span className="chest-lid">{type === "gem-chest" ? <Image className="chest-diamond" src="/art/gameplay/blue-diamond.png" width={28} height={28} alt="" /> : <Coins size={24} />}</span><span className="chest-lock" /></span>;
  }
  return <span className={`reward-art is-${type}`} aria-hidden="true">{icons[type] || <Award size={36} />}</span>;
}

function AchievementCard({ achievementKey, earnedAchievement, progress }) {
  const definition = ACHIEVEMENTS[achievementKey];
  const earned = Boolean(earnedAchievement);
  const milestone = getAchievementProgress(definition, progress);
  return (
    <article className={`treasure-achievement ${earned ? "is-earned" : "is-locked"}`} aria-label={`${definition.title}, ${earned ? "earned" : "locked"}`}>
      <div className="treasure-artwork"><RewardArtwork type={definition.artwork} /><span className="treasure-state" aria-hidden="true">{earned ? <Check size={14} /> : <LockKeyhole size={13} />}</span></div>
      <div className="treasure-copy"><strong>{definition.title}</strong><p>{definition.description}</p></div>
      <div className="treasure-condition"><small>{earned ? `Earned ${String(earnedAchievement.earned_at).slice(0, 10)}` : definition.requirement}</small>{!earned && milestone ? <><span className="achievement-progress"><i style={{ width: `${(milestone.current / milestone.target) * 100}%` }} /></span><b>{milestone.current} / {milestone.target}</b></> : <b>{earned ? "Unlocked" : "Locked"}</b>}</div>
    </article>
  );
}

function StatCard({ className, icon, value, label }) {
  return <span className={`profile-stat ${className}`}>{icon}<span><strong>{value}</strong><small>{label}</small></span></span>;
}

export function ProfilePanel({ profile, initialView = "overview" }) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  const [savedUsername, setSavedUsername] = useState(profile.username);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [view, setView] = useState(initialView);
  const progress = profile.progress;
  const completedWorlds = progress?.completed_worlds || 0;
  const achievements = profile.achievements || [];
  const achievementsByKey = new Map(achievements.map((achievement) => [achievement.achievement_key, achievement]));
  const compassCount = Number(achievementsByKey.has("world_1_compass")) + Number(achievementsByKey.has("world_2_compass"));

  function beginEditing() { setUsername(savedUsername); setNotice(""); setEditing(true); }
  function cancelEditing() { setUsername(savedUsername); setNotice(""); setEditing(false); }

  async function saveProfile(event) {
    event.preventDefault();
    const error = validateUsername(username);
    if (error) { setNotice(error); return; }
    setPending(true);
    const result = await postJson("/api/profile", { username }, "PATCH");
    setPending(false);
    if (!result.ok) { setNotice(result.error || result.errors?.username || "Profile could not be updated."); return; }
    setSavedUsername(result.profile.username); setUsername(result.profile.username); setEditing(false); setNotice("Explorer name saved."); router.refresh();
  }

  async function logout() {
    setPending(true);
    const result = await postJson("/api/auth/logout", {});
    if (!result.ok) { setPending(false); setNotice(result.error || "Could not sign out."); return; }
    router.replace("/welcome"); router.refresh();
  }

  return (
    <div className={`profile-panel is-${view}-view`}>
      <section className="explorer-card" aria-label="Explorer identity">
        <div className="explorer-avatar" aria-hidden="true"><UserRound size={31} /><span><Compass size={14} /></span></div>
        <div className="explorer-copy">
          <small><ShieldCheck size={12} />Registered Explorer</small>
          {editing ? <form className="profile-inline-editor" onSubmit={saveProfile}><label className="sr-only" htmlFor="profile-username">Explorer username</label><input className="form-field" id="profile-username" value={username} onChange={(event) => { setUsername(event.target.value); setNotice(""); }} maxLength={24} autoComplete="username" autoFocus /><button type="submit" disabled={pending} aria-label="Save username"><Save size={17} /></button><button type="button" onClick={cancelEditing} disabled={pending} aria-label="Cancel username edit"><X size={17} /></button></form> : <div className="explorer-name"><strong>{savedUsername}</strong><button type="button" onClick={beginEditing} aria-label="Edit explorer username"><Pencil size={15} /></button></div>}
          <p><Mail size={13} />{profile.email}</p>{profile.createdAt ? <p><CalendarDays size={13} />Explorer since {String(profile.createdAt).slice(0, 10)}</p> : null}
          {notice ? <p className="profile-notice" role="status">{notice}</p> : null}
        </div>
        <div className="explorer-rank"><Trophy size={20} /><small>Leaderboard</small><strong>{profile.bestRun ? `#${profile.bestRun.rank}` : "—"}</strong><span>{profile.bestRun ? "Personal rank" : "Not ranked"}</span></div>
      </section>
      <div className="profile-view-switch" role="tablist" aria-label="Profile sections">
        <button id="profile-overview-tab" type="button" role="tab" aria-selected={view === "overview"} aria-controls="profile-overview" onClick={() => setView("overview")}><UserRound size={15} />Overview</button>
        <button id="profile-achievements-tab" type="button" role="tab" aria-selected={view === "achievements"} aria-controls="profile-achievements" onClick={() => setView("achievements")}><Award size={15} />Achievements <span>{achievements.length}/{ACHIEVEMENT_TOTAL}</span></button>
      </div>
      {view === "overview" ? <div className="profile-overview" id="profile-overview" role="tabpanel" aria-labelledby="profile-overview-tab">
        <div className="profile-progress-grid" aria-label="Saved adventure progress">
          <StatCard className="is-worlds" icon={<Flag size={22} />} value={`${completedWorlds}/3`} label="Completed worlds" /><StatCard className="is-compass" icon={<Compass size={22} />} value={`${compassCount}/2`} label="Compass Shrines" /><StatCard className="is-gems" icon={<Image className="stat-diamond" src="/art/gameplay/blue-diamond.png" width={26} height={26} alt="" aria-hidden="true" />} value={progress?.total_gems || 0} label="Collected gems" /><StatCard className="is-fish" icon={<Fish size={22} />} value={progress?.fish_powerups_collected || 0} label="Fish power-ups" /><StatCard className="is-coins" icon={<Coins size={22} />} value={progress?.total_coins || 0} label="Saved coins" /><StatCard className="is-best" icon={<Trophy size={22} />} value={profile.bestRun ? Number(profile.bestRun.score).toLocaleString() : "—"} label="Personal best" />
        </div>
        <div className="profile-best-run"><Crown size={23} /><div><small>Best ranked expedition</small><strong>{profile.bestRun ? `${Number(profile.bestRun.score).toLocaleString()} points` : "No completed ranked mission"}</strong></div><span>{profile.bestRun ? `World ${profile.bestRun.world_reached} · Rank #${profile.bestRun.rank}` : "Complete World 3 to enter the leaderboard"}</span></div>
      </div> : <section className="profile-achievements" id="profile-achievements" role="tabpanel" aria-labelledby="profile-achievements-tab">
        <div className="achievement-heading"><div><small>Fantasy treasure gallery</small><h3>Explorer Rewards</h3></div><strong>{achievements.length}<span>/{ACHIEVEMENT_TOTAL} earned</span></strong></div>
        <div className="achievement-grid">{Object.keys(ACHIEVEMENTS).map((achievementKey) => <AchievementCard key={achievementKey} achievementKey={achievementKey} earnedAchievement={achievementsByKey.get(achievementKey)} progress={progress} />)}</div>
      </section>}
      <button className="game-button game-button-secondary profile-signout" type="button" onClick={logout} disabled={pending}><LogOut size={18} />Sign Out</button>
    </div>
  );
}
