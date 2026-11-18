import { beforeEach, describe, expect, it, vi } from "vitest";

const discover = vi.hoisted(() => vi.fn());
vi.mock("@/lib/audio/freesound-server", async (loadOriginal) => {
  const original = await loadOriginal();
  return { ...original, discoverFreesoundCandidates: discover };
});

import { GET } from "@/app/api/audio/catalog/route";
import { FreesoundServiceError } from "@/lib/audio/freesound-server";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";

function request(slot = "coin", address = "127.0.0.40") {
  return new Request(`http://localhost:3000/api/audio/catalog?slot=${encodeURIComponent(slot)}`, {
    headers: { "x-forwarded-for": address },
  });
}

beforeEach(() => {
  discover.mockReset();
  resetRateLimitsForTests();
});

describe("audio catalog route", () => {
  it("rejects arbitrary slots without calling the provider", async () => {
    const response = await GET(request("https://evil.example/proxy"));
    expect(response.status).toBe(400);
    expect(discover).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid audio catalog slot.", slots: expect.any(Array) });
  });

  it("returns only the sanitized catalog contract", async () => {
    discover.mockResolvedValue({ slot: "coin", label: "Coin Collection", kind: "effect", candidates: [] });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ catalog: { slot: "coin", label: "Coin Collection", kind: "effect", candidates: [] } });
  });

  it("does not expose credentials or upstream error details", async () => {
    discover.mockRejectedValue(new FreesoundServiceError("AUTHENTICATION_FAILED", "HTTP 401 secret-key"));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toMatch(/secret-key|401/);
  });

  it("rate limits repeated catalog requests", async () => {
    discover.mockResolvedValue({ slot: "coin", label: "Coin Collection", kind: "effect", candidates: [] });
    for (let index = 0; index < 20; index += 1) expect((await GET(request())).status).toBe(200);
    const response = await GET(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
  });
});
