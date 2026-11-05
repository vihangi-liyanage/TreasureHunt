import { beforeEach, describe, expect, it } from "vitest";
import { getPublicAuthError } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/redirects";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { resetRateLimitsForTests, takeRateLimit } from "@/lib/security/rate-limit";

describe("authentication security boundaries", () => {
  beforeEach(() => resetRateLimitsForTests());

  it("allows local return paths and rejects external or protocol-relative redirects", () => {
    expect(safeNextPath("/worlds?from=login")).toBe("/worlds?from=login");
    expect(safeNextPath("https://evil.test/steal")).toBe("/worlds");
    expect(safeNextPath("//evil.test/steal")).toBe("/worlds");
    expect(safeNextPath("/\\evil.test")).toBe("/worlds");
  });

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
});
