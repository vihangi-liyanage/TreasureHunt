import { describe, expect, it } from "vitest";
import { FishServiceError, parseFishChallenge, requestFishChallenge } from "@/lib/fish/fish-service";

describe("Fish API adapter", () => {
  it("normalises the observed live response shape", () => {
    expect(parseFishChallenge({ question: "https://example.test/challenge.png", fish: 9, chest: 1 })).toEqual({
      question: "https://example.test/challenge.png",
      fish: 9,
      chest: 1,
      encoding: "url",
    });
  });

  it("rejects invented or malformed response fields", () => {
    expect(() => parseFishChallenge({ image: "challenge.png", answer: 1 })).toThrow(FishServiceError);
    expect(() => parseFishChallenge({ question: "https://example.test/challenge.png", fish: -1, chest: 2 })).toThrow(/non-negative integers/);
  });

  it("parses JSON text even when the upstream content type is inaccurate", async () => {
    const fetchImpl = async () => new Response(
      JSON.stringify({ question: "https://example.test/challenge.png", fish: 4, chest: 7 }),
      { status: 200, headers: { "Content-Type": "text/html" } },
    );

    await expect(requestFishChallenge({ fetchImpl })).resolves.toMatchObject({ fish: 4, chest: 7 });
  });

  it("maps upstream connectivity failures to an optional-service error", async () => {
    const fetchImpl = async () => { throw new Error("offline"); };
    await expect(requestFishChallenge({ fetchImpl })).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});
