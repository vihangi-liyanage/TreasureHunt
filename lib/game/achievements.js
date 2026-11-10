export const ACHIEVEMENTS = Object.freeze({
  first_gem: Object.freeze({ title: "First Spark", description: "Collect your first gem." }),
  five_gems: Object.freeze({ title: "Gem Seeker", description: "Collect five gems." }),
  first_fish_power: Object.freeze({ title: "Tidecaller", description: "Collect your first fish power-up." }),
  world_1_compass: Object.freeze({ title: "Emerald Bearing", description: "Collect the Emerald Jungle compass." }),
  world_2_compass: Object.freeze({ title: "Sunset Bearing", description: "Collect the Sunset Ruins compass." }),
  world_3_treasure: Object.freeze({ title: "Legendary Discovery", description: "Discover the Crystal Cavern treasure." }),
});

export function getAchievement(key) {
  return ACHIEVEMENTS[key] ?? null;
}

export function deriveAchievementKeys({ gems = 0, fishPowerUps = 0, completedWorldIds = [] }) {
  const completed = new Set(completedWorldIds);
  return [
    gems >= 1 && "first_gem",
    gems >= 5 && "five_gems",
    fishPowerUps >= 1 && "first_fish_power",
    completed.has("emerald-jungle") && "world_1_compass",
    completed.has("sunset-ruins") && "world_2_compass",
    completed.has("crystal-cavern") && "world_3_treasure",
  ].filter(Boolean);
}
