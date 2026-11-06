import { describe, expect, it } from "vitest";
import { parseRunResult, parseWorldCompletion } from "@/lib/game/run-validation";

describe("persistent game mutation validation", () => {
  it("accepts bounded world completion values", () => {
    expect(parseWorldCompletion({ world: 2, coins: 45 })).toEqual({ world: 2, coins: 45 });
    expect(parseWorldCompletion({ world: 3, coins: 33, userId: "ignored-client-id" })).toEqual({ world: 3, coins: 33 });
    expect(parseWorldCompletion({ world: 4, coins: 1 })).toBeNull();
    expect(parseWorldCompletion({ world: 1, coins: -1 })).toBeNull();
  });

  it("accepts a complete bounded run result", () => {
    expect(parseRunResult({
      userId: "untrusted-client-id",
      score: 1200,
      coins: 18,
      worldReached: 3,
      durationSeconds: 94,
      completed: true,
    })).toEqual({
      score: 1200,
      coins: 18,
      worldReached: 3,
      durationSeconds: 94,
      completed: true,
    });
  });

  it("rejects excessive, partial, and incorrectly typed results", () => {
    expect(parseRunResult({ score: 100_000_001, coins: 1, worldReached: 1, durationSeconds: 1, completed: true })).toBeNull();
    expect(parseRunResult({ score: 1, coins: 1, worldReached: 1, durationSeconds: 1, completed: "yes" })).toBeNull();
    expect(parseRunResult({ score: 1, coins: 1, worldReached: 2, durationSeconds: 30, completed: true })).toBeNull();
  });
});
