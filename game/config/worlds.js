export const WORLD_CONFIGS = Object.freeze([
  Object.freeze({
    id: "emerald-jungle",
    number: 1,
    name: "Emerald Jungle",
    description: "Sunlit temple paths hidden beneath a living emerald canopy.",
    difficulty: "Explorer",
    timerSeconds: 120,
    goal: "Reach the jungle checkpoint",
    completion: "checkpoint",
    nextWorldId: "sunset-ruins",
  }),
  Object.freeze({
    id: "sunset-ruins",
    number: 2,
    name: "Sunset Ruins",
    description: "Cross crumbling bridges while the ancient city burns gold.",
    difficulty: "Adventurer",
    timerSeconds: 105,
    goal: "Reach the ruins checkpoint",
    completion: "checkpoint",
    nextWorldId: "crystal-cavern",
  }),
  Object.freeze({
    id: "crystal-cavern",
    number: 3,
    name: "Crystal Cavern",
    description: "Descend through luminous depths to claim the final treasure.",
    difficulty: "Legendary",
    timerSeconds: 90,
    goal: "Collect the legendary treasure",
    completion: "treasure",
    nextWorldId: null,
  }),
]);

export const RUN_RULES = Object.freeze({
  startingLives: 3,
  fishPowerDurationMs: 8_000,
  maxFishRevives: 1,
});

export function getWorldConfig(worldId) {
  return WORLD_CONFIGS.find((world) => world.id === worldId) ?? null;
}
