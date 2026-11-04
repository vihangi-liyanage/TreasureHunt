const DEFAULT_BASE_URL = "https://marcconrad.com/uob/fish/api.php";
const DEFAULT_TIMEOUT_MS = 5_000;

export class FishServiceError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "FishServiceError";
    this.code = code;
  }
}
export function parseFishChallenge(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new FishServiceError("INVALID_RESPONSE", "Fish API returned a non-object response.");
  }

  const { question, fish, chest } = payload;
  const isRemoteImage = typeof question === "string" && /^https:\/\//i.test(question);
  const isBase64Png = typeof question === "string" && question.startsWith("iVBORw0KGgo");

  if (!isRemoteImage && !isBase64Png) {
    throw new FishServiceError("INVALID_RESPONSE", "Fish API question is not a supported image value.");
  }
  if (!Number.isInteger(fish) || fish < 0 || !Number.isInteger(chest) || chest < 0) {
    throw new FishServiceError("INVALID_RESPONSE", "Fish API solution fields are not non-negative integers.");
  }

  return Object.freeze({ question, fish, chest, encoding: isBase64Png ? "base64-png" : "url" });
}

export async function requestFishChallenge({ fetchImpl = fetch, signal } = {}) {
  const baseUrl = process.env.FISH_API_BASE_URL || DEFAULT_BASE_URL;
  const configuredTimeout = Number.parseInt(process.env.FISH_API_TIMEOUT_MS || "", 10);
  const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_TIMEOUT_MS;

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("out", "json");
    url.searchParams.set("base64", "no");
    response = await fetchImpl(url, {
      cache: "no-store",
      headers: { Accept: "application/json, text/plain;q=0.9" },
      signal: requestSignal,
    });
  } catch (error) {
    throw new FishServiceError("UNAVAILABLE", "Fish API could not be reached.", { cause: error });
  }

  if (!response.ok) {
    throw new FishServiceError("UPSTREAM_ERROR", `Fish API returned HTTP ${response.status}.`);
  }

  try {
    return parseFishChallenge(JSON.parse(await response.text()));
  } catch (error) {
    if (error instanceof FishServiceError) throw error;
    throw new FishServiceError("INVALID_RESPONSE", "Fish API returned invalid JSON.", { cause: error });
  }
}
