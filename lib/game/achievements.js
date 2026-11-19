export const ACHIEVEMENTS = Object.freeze({
  first_gem: Object.freeze({ title: "First Spark", description: "Collect your first gem.", requirement: "Collect 1 gem", artwork: "emerald", progress: Object.freeze({ stat: "gems", target: 1 }) }),
  five_gems: Object.freeze({ title: "Gem Seeker", description: "Gather five gems from your adventures.", requirement: "Collect 5 gems", artwork: "sapphire", progress: Object.freeze({ stat: "gems", target: 5 }) }),
  first_fish_power: Object.freeze({ title: "Tidecaller", description: "Collect your first magical fish power-up.", requirement: "Collect 1 fish power-up", artwork: "fish", progress: Object.freeze({ stat: "fishPowerUps", target: 1 }) }),
  world_1_compass: Object.freeze({ title: "Emerald Bearing", description: "Activate the Emerald Jungle Compass Shrine.", requirement: "Complete Emerald Jungle", artwork: "compass", progress: Object.freeze({ stat: "worlds", target: 1 }) }),
  world_2_compass: Object.freeze({ title: "Sunset Bearing", description: "Activate the Sunset Ruins Compass Shrine.", requirement: "Complete Sunset Ruins", artwork: "compass", progress: Object.freeze({ stat: "worlds", target: 2 }) }),
  world_3_treasure: Object.freeze({ title: "Legendary Discovery", description: "Discover the legendary Crystal Cavern treasure.", requirement: "Complete Crystal Cavern", artwork: "legendary-chest", progress: Object.freeze({ stat: "worlds", target: 3 }) }),
  gem_treasure_chest: Object.freeze({ title: "Gem Treasure Chest", description: "Fill an explorer chest with ten sparkling gems.", requirement: "Collect 10 gems", artwork: "gem-chest", progress: Object.freeze({ stat: "gems", target: 10 }) }),
  gold_treasure_chest: Object.freeze({ title: "Golden Treasure Chest", description: "Secure fifty verified coins from completed expeditions.", requirement: "Save 50 coins", artwork: "gold-chest", progress: Object.freeze({ stat: "coins", target: 50 }) }),
  crystal_collector: Object.freeze({ title: "Crystal Collector", description: "Build a legendary collection of twenty magical gems.", requirement: "Collect 20 gems", artwork: "crystal", progress: Object.freeze({ stat: "gems", target: 20 }) }),
});

export function getAchievement(key) {
  return ACHIEVEMENTS[key] ?? null;
}

export function deriveAchievementKeys({ gems = 0, coins = 0, fishPowerUps = 0, completedWorldIds = [] }) {
  const completed = new Set(completedWorldIds);
  return [
    gems >= 1 && "first_gem",
    gems >= 5 && "five_gems",
    fishPowerUps >= 1 && "first_fish_power",
    completed.has("emerald-jungle") && "world_1_compass",
    completed.has("sunset-ruins") && "world_2_compass",
    completed.has("crystal-cavern") && "world_3_treasure",
    gems >= 10 && "gem_treasure_chest",
    coins >= 50 && "gold_treasure_chest",
    gems >= 20 && "crystal_collector",
  ].filter(Boolean);
}

export function getAchievementProgress(definition, progress = {}) {
  const values = {
    gems: Number(progress.total_gems) || 0,
    coins: Number(progress.total_coins) || 0,
    fishPowerUps: Number(progress.fish_powerups_collected) || 0,
    worlds: Number(progress.completed_worlds) || 0,
  };
  const target = definition?.progress?.target;
  if (!target) return null;
  return Object.freeze({ current: Math.min(target, Math.max(0, values[definition.progress.stat] || 0)), target });
}
