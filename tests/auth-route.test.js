import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));
const adminRpc = vi.hoisted(() => vi.fn());
const refreshClaims = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth })),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: adminRpc }),
}));
vi.mock("@/lib/supabase/config", () => ({
  hasSupabaseConfig: () => true,
  getSupabaseConfig: () => ({ url: "https://project.test", publishableKey: "public-key" }),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url, _key, options) => ({
    auth: {
      getClaims: async () => {
        options.cookies.setAll([{ name: "sb-session", value: "refreshed", options: { path: "/" } }], {});
        return refreshClaims();
      },
    },
  }),
}));

import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";

function jsonRequest(path, body) {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.12" },
    body: JSON.stringify(body),
  });
}

describe("basic email/password authentication routes", () => {
  beforeEach(() => {
    Object.values(auth).forEach((mock) => mock.mockReset());
    adminRpc.mockReset();
    refreshClaims.mockReset();
    resetRateLimitsForTests();
  });

  it("registers through Supabase Auth and requires the returned session", async () => {
    adminRpc.mockResolvedValue({ data: false, error: null });
    auth.signUp.mockResolvedValue({ data: { session: { access_token: "session" } }, error: null });
    auth.signOut.mockResolvedValue({ error: null });

    const response = await register(jsonRequest("/api/auth/register", {
      username: "JungleFox", email: "explorer@example.com", password: "trailpass9", confirmPassword: "trailpass9",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, redirectTo: "/login?registered=1" });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "explorer@example.com",
      password: "trailpass9",
      options: { data: { username: "JungleFox" } },
    });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rejects a signup when Supabase email confirmation prevents a session", async () => {
    adminRpc.mockResolvedValue({ data: false, error: null });
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });

    const response = await register(jsonRequest("/api/auth/register", {
      username: "JungleFox", email: "explorer@example.com", password: "trailpass9", confirmPassword: "trailpass9",
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringMatching(/Disable Confirm email/i) });
  });

  it("logs in with email and password and signs out the local session", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    auth.signOut.mockResolvedValue({ error: null });

    const loginResponse = await login(jsonRequest("/api/auth/login", {
      email: "explorer@example.com", password: "trailpass9",
    }));
    const logoutResponse = await logout();

    expect(loginResponse.status).toBe(200);
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "explorer@example.com", password: "trailpass9" });
    expect(logoutResponse.status).toBe(200);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("refreshes the Supabase session cookie through the application proxy", async () => {
    refreshClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });
    const response = await refreshSupabaseSession(new NextRequest("http://localhost:3000/worlds"));

    expect(refreshClaims).toHaveBeenCalledOnce();
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
  });
});
