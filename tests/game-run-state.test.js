import { describe, expect, it } from "vitest";
import { RunState } from "@/game/core/run-state";
import { createGameBridge } from "@/game/core/game-bridge";

describe("Emerald Jungle run state", () => {
  it("scores collectibles once and applies completion time bonus", () => {
    const run = new RunState({ lives: 3, timerSeconds: 120 });
    expect(run.collectCoin("coin-1")).toBe(true); expect(run.collectCoin("coin-1")).toBe(false);
    expect(run.stompEnemy("enemy-1")).toBe(true); run.tick(); expect(run.complete()).toBe(true);
    expect(run.snapshot()).toEqual({ score:1540, coins:1, lives:3, timeLeft:119, status:"completed" });
  });
  it("guards damage with invulnerability and ends at zero lives", () => {
    const run = new RunState({ lives:3, timerSeconds:120 });
    expect(run.damage(100)).toBe(true); expect(run.damage(200)).toBe(false);
    expect(run.damage(1400)).toBe(true); expect(run.damage(2700)).toBe(true);
    expect(run.snapshot().status).toBe("game-over");
  });
  it("ends when the timer expires", () => {
    const run = new RunState({ lives:3, timerSeconds:1 }); run.tick();
    expect(run.snapshot()).toMatchObject({ timeLeft:0, status:"game-over" });
  });
  it("creates a clean replay after a completed run", () => {
    const firstRun = new RunState({ lives:3, timerSeconds:120 });
    firstRun.collectCoin("coin-1"); firstRun.damage(0); firstRun.complete();
    const replay = new RunState({ lives:3, timerSeconds:120 });
    expect(replay.snapshot()).toEqual({ score:0, coins:0, lives:3, timeLeft:120, status:"playing" });
    expect(replay.collectCoin("coin-1")).toBe(true);
    expect(replay.stompEnemy("enemy-1")).toBe(true);
  });
});

describe("React–Phaser bridge", () => {
  it("publishes through small subscriptions and cleans them up", () => {
    const bridge = createGameBridge(); const messages = [];
    const unsubscribe = bridge.on("state", (payload) => messages.push(payload));
    bridge.emit("state", { lives:3 }); unsubscribe(); bridge.emit("state", { lives:2 });
    expect(messages).toEqual([{ lives:3 }]);
  });
});
