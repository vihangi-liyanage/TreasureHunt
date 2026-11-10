import { describe, expect, it } from "vitest";
import { FishServiceError, parseFishChallenge, requestFishChallenge } from "@/lib/fish/fish-service";

describe("Fish API adapter", () => {
  it("normalises the observed live response shape", () => {
    expect(parseFishChallenge({ question: "https://www.sanfoh.com/uob/fish/data/challenge.png", fish: 9, chest: 1 })).toEqual({
      question: "https://www.sanfoh.com/uob/fish/data/challenge.png",
      fish: 9,
      chest: 1,
      encoding: "url",
    });
  });

  it("accepts a genuine zero-fish solution without substituting the chest count", () => {
    const challenge = parseFishChallenge({ question: "https://www.sanfoh.com/uob/fish/data/zero.png", fish: 0, chest: 12 });
    expect(challenge.fish).toBe(0);
    expect(challenge.chest).toBe(12);
  });

  it("rejects invented or malformed response fields", () => {
    expect(() => parseFishChallenge({ image: "challenge.png", answer: 1 })).toThrow(FishServiceError);
    expect(() => parseFishChallenge({ question: "https://www.sanfoh.com/uob/fish/data/challenge.png", fish: -1, chest: 2 })).toThrow(/non-negative integers/);
    expect(() => parseFishChallenge({ question: "https://", fish: 1, chest: 2 })).toThrow(/supported image/);
    expect(() => parseFishChallenge({ question: "http://example.test/challenge.png", fish: 1, chest: 2 })).toThrow(/supported image/);
    expect(() => parseFishChallenge({ question: "https://untrusted.test/challenge.png", fish: 1, chest: 2 })).toThrow(/supported image/);
  });

  it("parses JSON text even when the upstream content type is inaccurate", async () => {
    let requestedUrl;
    const fetchImpl = async (url) => {
      requestedUrl = url;
      return new Response(
        JSON.stringify({ question: "iVBORw0KGgoAAAANSUhEUg==", fish: 4, chest: 7 }),
        { status: 200, headers: { "Content-Type": "text/html" } },
      );
    };

    await expect(requestFishChallenge({ fetchImpl })).resolves.toMatchObject({ fish: 4, chest: 7, encoding: "base64-png" });
    expect(requestedUrl.searchParams.get("out")).toBe("json");
    expect(requestedUrl.searchParams.get("base64")).toBe("yes");
  });

  it("maps upstream connectivity failures to an optional-service error", async () => {
    const fetchImpl = async () => { throw new Error("offline"); };
    await expect(requestFishChallenge({ fetchImpl })).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});
