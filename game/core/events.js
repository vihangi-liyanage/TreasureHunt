export const GAME_EVENTS = Object.freeze({
  READY: "game:ready",
  COIN_COLLECTED: "coin:collected",
  PLAYER_DAMAGED: "player:damaged",
  ENEMY_STOMPED: "enemy:stomped",
  POWER_STARTED: "power:started",
  POWER_EXPIRED: "power:expired",
  WORLD_COMPLETED: "world:completed",
  RUN_ENDED: "run:ended",
  STATE_CHANGED: "state:changed",
});

export const GAME_COMMANDS = Object.freeze({
  INPUT: "input:changed",
  PAUSE: "game:pause",
  RESUME: "game:resume",
  RESTART: "game:restart",
});
