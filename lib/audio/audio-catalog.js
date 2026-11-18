const music = (label, query, selectedIds) => Object.freeze({
  label,
  kind: "music",
  query,
  duration: Object.freeze([20, 300]),
  limit: 3,
  selectedIds: Object.freeze(selectedIds),
});
const effect = (label, query, maxDuration, selectedIds, gain = 0.82) => Object.freeze({
  label,
  kind: "effect",
  query,
  duration: Object.freeze([0.05, maxDuration]),
  limit: 3,
  selectedIds: Object.freeze(selectedIds),
  gain,
});

export const AUDIO_CATALOG_SLOTS = Object.freeze({
  welcome: music("Welcome Page", "adventure music", [477602, 520192]),
  "emerald-jungle": music("Emerald Jungle", "tropical music", [573973, 548002]),
  "sunset-ruins": music("Sunset Ruins", "desert ambient", [686838, 734130]),
  "crystal-cavern": music("Crystal Cavern", "magic music", [611095, 770064]),
  jump: effect("Player Jump", "game jump", 3, [350906, 404793]),
  coin: effect("Coin Collection", "coin collect", 3, [402767, 402766]),
  gem: effect("Gem Collection", "magic chime", 4, [876169, 879801]),
  "fish-power-up": effect("Fish Power-up", "power up", 5, [220173, 843330]),
  projectile: effect("Projectile", "pew", 1, [459145, 478215], 0.48),
  "enemy-defeat": effect("Enemy Defeat", "enemy defeat", 5, [394466, 868641]),
  damage: effect("Player Damage", "player damage", 4, [878323, 515624]),
  shrine: effect("Compass Shrine Activation", "magic activation", 8, [635332]),
  countdown: effect("Countdown Tick", "countdown beep", 1, [515317, 391650], 0.58),
  "countdown-go": effect("Countdown Go", "arcade start", 3, [368691, 758957], 0.68),
  "game-over": effect("Game Over", "game fail", 4, [404743, 848654], 0.66),
  revival: effect("Fish Challenge Revival", "magic success", 8, [715067, 615099]),
  "world-complete": effect("World Completion", "level complete", 10, [528958, 258142]),
  treasure: effect("Final Treasure Discovery", "treasure victory", 10, [456965]),
});

export function getAudioCatalogSlot(slot) {
  return typeof slot === "string" ? AUDIO_CATALOG_SLOTS[slot] ?? null : null;
}

export function listAudioCatalogSlots() {
  return Object.entries(AUDIO_CATALOG_SLOTS).map(([id, definition]) => Object.freeze({
    id,
    label: definition.label,
    kind: definition.kind,
  }));
}

export function getMusicSlotForPath(pathname) {
  if (pathname === "/welcome") return "welcome";
  const match = /^\/game\/([^/?]+)/.exec(pathname || "");
  return match && AUDIO_CATALOG_SLOTS[match[1]]?.kind === "music" ? match[1] : null;
}

export function selectConfiguredCandidates(slot, candidates) {
  const definition = getAudioCatalogSlot(slot);
  if (!definition || !Array.isArray(candidates)) return [];
  const byId = new Map(candidates.map((candidate) => [candidate?.id, candidate]));
  return definition.selectedIds.map((id) => byId.get(id)).filter(Boolean);
}

export const EFFECT_SLOTS = Object.freeze(Object.keys(AUDIO_CATALOG_SLOTS)
  .filter((slot) => AUDIO_CATALOG_SLOTS[slot].kind === "effect"));
