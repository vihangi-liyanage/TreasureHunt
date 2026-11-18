import { describe, expect, it } from "vitest";
import { isCc0License, normalizeFreesoundRecord, parseFreesoundSearchResponse } from "@/lib/audio/freesound-server";

function validRecord(overrides = {}) {
  return {
    id: 12345,
    name: "Forest Loop",
    username: "field-recorder",
    license: "Creative Commons 0",
    duration: 42.5,
    previews: {
      "preview-hq-mp3": "https://cdn.freesound.org/previews/12/12345_1-hq.mp3",
      "preview-hq-ogg": "https://cdn.freesound.org/previews/12/12345_1-hq.ogg",
    },
    url: "https://freesound.org/people/field-recorder/sounds/12345/",
    tags: ["forest", "loop"],
    loopable: true,
    ...overrides,
  };
}

describe("Freesound metadata validation", () => {
  it("accepts official textual and URL CC0 representations only", () => {
    expect(isCc0License("Creative Commons 0")).toBe(true);
    expect(isCc0License("CC0")).toBe(false);
    expect(isCc0License("https://creativecommons.org/publicdomain/zero/1.0/")).toBe(true);
    expect(isCc0License("http://creativecommons.org/publicdomain/zero/1.0/")).toBe(true);
    expect(isCc0License("Attribution 4.0")).toBe(false);
    expect(isCc0License("https://creativecommons.org/licenses/by-nc/4.0/")).toBe(false);
    expect(isCc0License(undefined)).toBe(false);
  });

  it("normalizes traceable CC0 metadata and supported previews", () => {
    expect(normalizeFreesoundRecord(validRecord())).toEqual({
      id: 12345,
      name: "Forest Loop",
      creator: "field-recorder",
      license: "CC0 1.0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      duration: 42.5,
      previews: {
        "preview-hq-mp3": "https://cdn.freesound.org/previews/12/12345_1-hq.mp3",
        "preview-hq-ogg": "https://cdn.freesound.org/previews/12/12345_1-hq.ogg",
      },
      sourceUrl: "https://freesound.org/people/field-recorder/sounds/12345/",
      tags: ["forest", "loop"],
      loopable: true,
    });
  });

  it("rejects missing fields, non-CC0 records, and unsafe preview URLs", () => {
    expect(normalizeFreesoundRecord(validRecord({ name: "" }))).toBeNull();
    expect(normalizeFreesoundRecord(validRecord({ license: "Attribution 4.0" }))).toBeNull();
    expect(normalizeFreesoundRecord(validRecord({ previews: { "preview-hq-mp3": "http://cdn.freesound.org/file.mp3" } }))).toBeNull();
    expect(normalizeFreesoundRecord(validRecord({ previews: { "preview-hq-mp3": "https://evil.example/file.mp3" } }))).toBeNull();
    expect(normalizeFreesoundRecord(validRecord({ url: "https://evil.example/sounds/12345/" }))).toBeNull();
  });

  it("rejects malformed envelopes and filters invalid records", () => {
    expect(parseFreesoundSearchResponse({ sounds: [] })).toBeNull();
    expect(parseFreesoundSearchResponse({ results: [validRecord(), validRecord({ id: "bad" })] })).toHaveLength(1);
  });
});
