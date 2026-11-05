import { EMERALD_JUNGLE_LEVEL } from "@/game/config/emerald-jungle";
import { SUNSET_RUINS_LEVEL } from "@/game/config/sunset-ruins";

const LEVELS = Object.freeze({
  "emerald-jungle": EMERALD_JUNGLE_LEVEL,
  "sunset-ruins": SUNSET_RUINS_LEVEL,
});

export function getLevelConfig(worldId) {
  return LEVELS[worldId] ?? null;
}
