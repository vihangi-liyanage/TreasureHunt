import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicAuthError } from "@/lib/auth/errors";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { getLeaderboard, getPlayerProgress } from "@/lib/data/player-repository";
import { resetRateLimitsForTests, takeRateLimit } from "@/lib/security/rate-limit";

describe("authentication security boundaries", () => {
  beforeEach(() => resetRateLimitsForTests());

  it("returns safe public messages rather than upstream details", () => {
    expect(getPublicAuthError({ code: "invalid_credentials" })).toMatch(/incorrect/i);
    expect(getPublicAuthError({ code: "database_error", message: "private detail" })).not.toContain("private detail");
  });

  it("enforces a bounded request window", () => {
    expect(takeRateLimit("login:ip", { limit: 2, windowMs: 1_000, now: 100 }).allowed).toBe(true);
    expect(takeRateLimit("login:ip", { limit: 2, windowMs: 1_000, now: 200 }).allowed).toBe(true);
    expect(takeRateLimit("login:ip", { limit: 2, windowMs: 1_000, now: 300 })).toMatchObject({ allowed: false, retryAfterSeconds: 1 });
    expect(takeRateLimit("login:ip", { limit: 2, windowMs: 1_000, now: 1_101 }).allowed).toBe(true);
  });

  it("derives identity only from verified claims", async () => {
    const trusted = { auth: { getClaims: async () => ({ data: { claims: { sub: "user-1", email: "player@example.com" } }, error: null }) } };
    const rejected = { auth: { getClaims: async () => ({ data: null, error: new Error("invalid") }) } };
    await expect(getVerifiedIdentity(trusted)).resolves.toEqual({ id: "user-1", email: "player@example.com" });
    await expect(getVerifiedIdentity(rejected)).resolves.toBeNull();
  });

  it("loads registered progression by the verified account id rather than guest state", async () => {
    const savedProgress = { completed_worlds: 2, current_world: 3 };
    const maybeSingle = vi.fn(async () => ({ data: savedProgress, error: null }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const supabase = { from: vi.fn(() => ({ select })) };

    await expect(getPlayerProgress(supabase, "account-7")).resolves.toBe(savedProgress);
    expect(supabase.from).toHaveBeenCalledWith("player_progress");
    expect(eq).toHaveBeenCalledWith("user_id", "account-7");
  });

  it("reads the server-ranked projection without exposing player ids", async () => {
    const entries = [{ run_id: "run-1", username: "Explorer", score: 900, duration_seconds: 70 }];
    const admin = { rpc: vi.fn(async () => ({ data: entries, error: null })) };

    await expect(getLeaderboard(admin, "account-7")).resolves.toEqual(entries);
    expect(admin.rpc).toHaveBeenCalledWith("get_leaderboard_admin", { p_user_id: "account-7" });
  });

  it("supports a read-only guest leaderboard projection", async () => {
    const admin = { rpc: vi.fn(async () => ({ data: [], error: null })) };
    await expect(getLeaderboard(admin, null)).resolves.toEqual([]);
    expect(admin.rpc).toHaveBeenCalledWith("get_leaderboard_admin", { p_user_id: null });
  });
});
