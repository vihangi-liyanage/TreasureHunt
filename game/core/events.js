export const GAME_EVENTS = Object.freeze({
  READY: "game:ready",
  LOAD_FAILED: "game:load-failed",
  COIN_COLLECTED: "coin:collected",
  PLAYER_DAMAGED: "player:damaged",
  ENEMY_STOMPED: "enemy:stomped",
  ENEMY_DEFEATED: "enemy:defeated",
  FISH_COLLECTED: "fish:collected",
  PROJECTILE_FIRED: "projectile:fired",
  POWER_STARTED: "power:started",
  POWER_EXPIRED: "power:expired",
  WORLD_COMPLETED: "world:completed",
  RUN_ENDED: "run:ended",
  STATE_CHANGED: "state:changed",
});

export const GAME_COMMANDS = Object.freeze({
  INPUT: "input:changed",
  INPUT_RELEASE_ALL: "input:release-all",
  PAUSE: "game:pause",
  RESUME: "game:resume",
  RESTART: "game:restart",
});
