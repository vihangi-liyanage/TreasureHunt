import { afterEach, describe, expect, it, vi } from "vitest";
import { requestAudioCatalog } from "@/lib/audio/audio-player";

afterEach(() => vi.unstubAllGlobals());

describe("audio catalog startup cache", () => {
  it("deduplicates simultaneous metadata requests for the same slot", async () => {
    let resolveResponse;
    const fetchMock = vi.fn(() => new Promise((resolve) => { resolveResponse = resolve; }));
    vi.stubGlobal("fetch", fetchMock);

    const first = requestAudioCatalog("welcome");
    const second = requestAudioCatalog("welcome");
    expect(first).toBe(second);
    expect(fetchMock).toHaveBeenCalledOnce();

    resolveResponse({ ok: true, json: async () => ({ catalog: { candidates: [] } }) });
    await expect(first).resolves.toEqual({ candidates: [] });
  });
});
