import { afterEach, describe, expect, it, vi } from "vitest";
import { postJsonWithRetry } from "@/lib/auth/client-api";

afterEach(() => vi.unstubAllGlobals());

describe("automatic JSON mutation retries", () => {
  it("retries transient failures and stops after success", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: "busy" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ saved: true }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(postJsonWithRetry("/api/runs/owned/complete", {}, { attempts: 3, delays: [0] }))
      .resolves.toMatchObject({ ok: true, saved: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a definitive validation rejection", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Run evidence did not satisfy completion rules." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(postJsonWithRetry("/api/runs/owned/complete", {}, { attempts: 3, delays: [0] }))
      .resolves.toMatchObject({ ok: false, status: 409 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
