import { describe, expect, it } from "vitest";
import { parseGameplayEvent, parseRunCompletion, parseRunStart, validateStoredRunCompletion } from "@/lib/game/gameplay-evidence";

describe("persistent game mutation validation", () => {
  it("accepts only configured worlds and collision evidence", () => {
    expect(parseRunStart({ worldId: "crystal-cavern" })).toEqual({ worldId: "crystal-cavern", worldNumber: 3 });
    expect(parseGameplayEvent({ worldId: "emerald-jungle", type: "gem", id: "gem-1" })).toMatchObject({ worldNumber: 1, type: "gem", id: "gem-1" });
    expect(parseGameplayEvent({ worldId: "sunset-ruins", type: "objective", id: "sunset-ruins", objective: "compass" })).toMatchObject({ worldNumber: 2, type: "objective" });
  });

  it("rejects invented entities and accepts only a bounded duration", () => {
    expect(parseGameplayEvent({ worldId: "emerald-jungle", type: "gem", id: "gem-99" })).toBeNull();
    expect(parseGameplayEvent({ worldId: "crystal-cavern", type: "objective", id: "crystal-cavern", objective: "compass" })).toBeNull();
    expect(parseRunCompletion({ durationSeconds: 90, score: 99_999_999 })).toEqual({ durationSeconds: 90 });
    expect(parseRunCompletion({ durationSeconds: 121 })).toBeNull();
    expect(parseRunCompletion({ durationSeconds: "90" })).toBeNull();
  });

  it("accepts an owned run stream only when its configured objective is last and timing is plausible", () => {
    const now = Date.parse("2026-11-10T10:01:00.000Z");
    const run = { world_number: 1, started_at: "2026-11-10T10:00:00.000Z", submitted_at: null };
    const events = [
      { id: 1, event_type: "gem", event_id: "gem-1" },
      { id: 2, event_type: "coin", event_id: "coin-1" },
      { id: 3, event_type: "objective", event_id: "emerald-jungle" },
    ];
    expect(validateStoredRunCompletion({ run, events, durationSeconds: 55, now })).toMatchObject({ worldNumber: 1 });
    expect(validateStoredRunCompletion({ run, events, durationSeconds: 2, now })).toBeNull();
    expect(validateStoredRunCompletion({ run, events: [events[2], events[0]], durationSeconds: 55, now })).toBeNull();
    expect(validateStoredRunCompletion({ run, events: [...events, events[0]], durationSeconds: 55, now })).toBeNull();
    expect(validateStoredRunCompletion({ run: { ...run, submitted_at: run.started_at }, events, durationSeconds: 55, now })).toBeNull();
  });
});
