export const WORLD_CONFIGS = Object.freeze([
  Object.freeze({
    id: "emerald-jungle",
    number: 1,
    name: "Emerald Jungle",
    timerSeconds: 120,
    goal: "Reach the jungle checkpoint",
    completion: "checkpoint",
    nextWorldId: "sunset-ruins",
  }),
  Object.freeze({
    id: "sunset-ruins",
    number: 2,
    name: "Sunset Ruins",
    timerSeconds: 105,
    goal: "Reach the ruins checkpoint",
    completion: "checkpoint",
    nextWorldId: "crystal-cavern",
  }),
  Object.freeze({
    id: "crystal-cavern",
    number: 3,
    name: "Crystal Cavern",
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
