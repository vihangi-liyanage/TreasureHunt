import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildFreesoundSearchRequest, discoverFreesoundCandidates, resetFreesoundCacheForTests } from "@/lib/audio/freesound-server";
import { getAudioCatalogSlot } from "@/lib/audio/audio-catalog";

function payload() {
  return {
    count: 1,
    results: [{
      id: 9876,
      name: "Magic Chime",
      username: "sound-author",
      license: "Creative Commons 0",
      duration: 1.25,
      previews: { "preview-hq-mp3": "https://cdn.freesound.org/previews/9/9876_hq.mp3" },
      url: "https://freesound.org/people/sound-author/sounds/9876/",
      tags: ["magic", "chime"],
      loopable: false,
    }],
  };
}

beforeEach(() => resetFreesoundCacheForTests());

describe("Freesound service adapter", () => {
  it("builds the official HTTPS search request and token header", () => {
    const request = buildFreesoundSearchRequest(getAudioCatalogSlot("coin"), "secret-token");
    expect(request.url.origin + request.url.pathname).toBe("https://freesound.org/apiv2/search/");
    expect(request.url.searchParams.get("query")).toBe("coin collect");
    expect(request.url.searchParams.get("filter")).toContain('license:"Creative Commons 0"');
    expect(request.url.searchParams.get("fields")).toBe("id,name,username,license,duration,previews,url,tags,loopable");
    expect(request.options.headers.Authorization).toBe("Token secret-token");
    expect(request.url.href).not.toContain("secret-token");
    const musicRequest = buildFreesoundSearchRequest(getAudioCatalogSlot("welcome"), "secret-token");
    expect(musicRequest.url.searchParams.get("filter")).toContain("id:(477602 OR 520192)");
  });

  it("fails safely when server configuration is missing", async () => {
    await expect(discoverFreesoundCandidates("coin", { apiKey: "" })).rejects.toMatchObject({ code: "NOT_CONFIGURED" });
  });

  it("parses validated JSON and caches repeated slot requests", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload()), { status: 200 }));
    const first = await discoverFreesoundCandidates("coin", { apiKey: "key", fetchImpl, now: 100 });
    const second = await discoverFreesoundCandidates("coin", { apiKey: "key", fetchImpl, now: 200 });
    expect(first).toMatchObject({ providerStatus: 200, providerResultCount: 1 });
    expect(first.candidates[0]).toMatchObject({ id: 9876, creator: "sound-author", license: "CC0 1.0" });
    expect(second).toBe(first);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("rejects malformed JSON structures", async () => {
    const invalidJson = vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError("bad json"); } });
    const malformed = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sounds: [] }), { status: 200 }));
    await expect(discoverFreesoundCandidates("coin", { apiKey: "key", fetchImpl: invalidJson })).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    await expect(discoverFreesoundCandidates("coin", { apiKey: "key", fetchImpl: malformed })).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it.each([[401, "AUTHENTICATION_FAILED"], [403, "AUTHENTICATION_FAILED"], [429, "RATE_LIMITED"], [503, "UPSTREAM_UNAVAILABLE"]])(
    "maps HTTP %i without exposing upstream response bodies",
    async (status, code) => {
      const fetchImpl = vi.fn().mockResolvedValue(new Response("sensitive upstream text", { status }));
      await expect(discoverFreesoundCandidates("coin", { apiKey: "key", fetchImpl })).rejects.toMatchObject({ code });
    },
  );

  it("maps network and timeout failures", async () => {
    const offline = vi.fn().mockRejectedValue(new Error("offline"));
    const timedOut = vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    await expect(discoverFreesoundCandidates("coin", { apiKey: "key", fetchImpl: offline })).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await expect(discoverFreesoundCandidates("coin", { apiKey: "key", fetchImpl: timedOut })).rejects.toMatchObject({ code: "TIMEOUT" });
  });
});
