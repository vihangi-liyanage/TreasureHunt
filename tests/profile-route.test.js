import { beforeEach, describe, expect, it, vi } from "vitest";

const getRouteSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/route-session", () => ({ getRouteSession }));

import { PATCH } from "@/app/api/profile/route";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";

function request(username, ip = "127.0.0.31") {
  return new Request("http://localhost:3000/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ username }),
  });
}

function updateClient(result) {
  const single = vi.fn(async () => result);
  const select = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  return { client: { from: vi.fn(() => ({ update })) }, update, eq };
}

describe("authenticated profile updates", () => {
  beforeEach(() => { getRouteSession.mockReset(); resetRateLimitsForTests(); });

  it("requires a verified identity before changing a username", async () => {
    getRouteSession.mockResolvedValue({ configured: true, supabase: {}, identity: null });
    const response = await PATCH(request("ForestScout"));
    expect(response.status).toBe(401);
  });

  it("rejects invalid usernames before persistence", async () => {
    const { client, update } = updateClient({ data: null, error: null });
    getRouteSession.mockResolvedValue({ configured: true, supabase: client, identity: { id: "player-1" } });
    const response = await PATCH(request("x", "127.0.0.32"));
    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("updates only the verified player's profile", async () => {
    const profile = { id: "player-1", username: "ForestScout", created_at: "2026-01-01" };
    const { client, update, eq } = updateClient({ data: profile, error: null });
    getRouteSession.mockResolvedValue({ configured: true, supabase: client, identity: { id: "player-1" } });
    const response = await PATCH(request(" ForestScout ", "127.0.0.33"));
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ username: "ForestScout" });
    expect(eq).toHaveBeenCalledWith("id", "player-1");
    await expect(response.json()).resolves.toEqual({ profile });
  });

  it("returns the existing duplicate-username conflict safely", async () => {
    const { client } = updateClient({ data: null, error: { code: "23505" } });
    getRouteSession.mockResolvedValue({ configured: true, supabase: client, identity: { id: "player-1" } });
    const response = await PATCH(request("TakenExplorer", "127.0.0.34"));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "That username is already taken." });
  });
});
