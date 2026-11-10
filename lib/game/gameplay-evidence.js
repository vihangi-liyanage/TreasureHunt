import { getLevelConfig } from "@/game/config/levels";
import { getWorldConfig } from "@/game/config/worlds";

const EVENT_COLLECTIONS = Object.freeze({
  coin: "coins",
  gem: "gems",
  fish: "fishPowerUps",
  enemy: "enemies",
});

export function parseRunStart(value) {
  const world = getWorldConfig(value?.worldId);
  return world ? { worldId: world.id, worldNumber: world.number } : null;
}

export function parseGameplayEvent(value) {
  const world = getWorldConfig(value?.worldId);
  const level = world ? getLevelConfig(world.id) : null;
  const type = typeof value?.type === "string" ? value.type : "";
  const id = typeof value?.id === "string" ? value.id : "";
  if (!world || !level || !id) return null;

  if (type === "objective") {
    const expectedObjective = level.goal.type === "treasure" ? "treasure" : "compass";
    if (id !== world.id || value?.objective !== expectedObjective) return null;
    return { worldId: world.id, worldNumber: world.number, type, id, objective: expectedObjective };
  }

  const collection = EVENT_COLLECTIONS[type];
  if (!collection || !level[collection]?.some((entry) => entry.id === id)) return null;
  return { worldId: world.id, worldNumber: world.number, type, id };
}

export function parseRunCompletion(value) {
  const durationSeconds = value?.durationSeconds;
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 120) return null;
  return { durationSeconds };
}

export function validateStoredRunCompletion({ run, events, durationSeconds, now = Date.now() }) {
  const world = getWorldConfigByNumber(run?.world_number);
  const level = world ? getLevelConfig(world.id) : null;
  const startedAt = Date.parse(run?.started_at);
  if (!world || !level || run?.submitted_at || !Number.isFinite(startedAt)) return null;

  const wallSeconds = Math.max(0, Math.floor((now - startedAt) / 1_000));
  const minimumTraversalSeconds = Math.max(1, Math.floor(
    ((level.goal.x - level.playerStart.x) / level.motion.moveSpeed) * 0.65,
  ));
  if (now < startedAt || wallSeconds > 30 * 60 || durationSeconds < minimumTraversalSeconds
      || durationSeconds > world.timerSeconds || durationSeconds > wallSeconds + 5) return null;

  const storedEvents = Array.isArray(events) ? events : [];
  const uniqueEvents = new Set();
  let objectiveCount = 0;
  for (const event of storedEvents) {
    const key = `${event.event_type}:${event.event_id}`;
    if (uniqueEvents.has(key)) return null;
    uniqueEvents.add(key);
    const objective = level.goal.type === "treasure" ? "treasure" : "compass";
    const parsed = parseGameplayEvent({
      worldId: world.id,
      type: event.event_type,
      id: event.event_id,
      objective: event.event_type === "objective" ? objective : undefined,
    });
    if (!parsed) return null;
    if (event.event_type === "objective") objectiveCount += 1;
  }

  const lastEvent = storedEvents.at(-1);
  if (objectiveCount !== 1 || lastEvent?.event_type !== "objective" || lastEvent.event_id !== world.id) return null;
  return { worldId: world.id, worldNumber: world.number, minimumTraversalSeconds };
}

function getWorldConfigByNumber(worldNumber) {
  return ["emerald-jungle", "sunset-ruins", "crystal-cavern"]
    .map(getWorldConfig)
    .find((world) => world?.number === worldNumber) ?? null;
}
