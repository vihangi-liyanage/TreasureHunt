import { checkRequestLimit } from "@/lib/auth/request-guard";
import { createFishChallenge } from "@/lib/fish/challenge-repository";
import { isUuid } from "@/lib/fish/challenge-identity";
import { resolveFishChallengeOwner } from "@/lib/fish/challenge-owner";
import { FishServiceError, requestFishChallenge } from "@/lib/fish/fish-service";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";
import { getWorldConfig } from "@/game/config/worlds";

export async function POST(request) {
  const rate = checkRequestLimit(request, "fish-challenge-create", { limit: 5, windowMs: 10 * 60_000 });
  if (!rate.allowed) return jsonNoStore({ error: "Too many Fish challenge requests. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const values = await readJsonObject(request);
  if (!values || !isUuid(values.runAttemptId) || !getWorldConfig(values.worldId)) {
    return jsonNoStore({ error: "Invalid Fish challenge request." }, { status: 400 });
  }

  let owner;
  try {
    owner = await resolveFishChallengeOwner(request, values.mode);
  } catch {
    return jsonNoStore({ error: "Fish revival is not configured." }, { status: 503 });
  }
  if (owner.error) return jsonNoStore({ error: owner.error }, { status: owner.status });

  try {
    const upstream = await requestFishChallenge();
    const record = await createFishChallenge({
      ownerKey: owner.ownerKey,
      runAttemptId: values.runAttemptId,
      worldId: values.worldId,
      solution: upstream.fish,
    });
    const imageUrl = upstream.encoding === "base64-png" ? `data:image/png;base64,${upstream.question}` : upstream.question;
    const response = jsonNoStore({ challenge: { id: record.id, imageUrl, expiresAt: record.expiresAt } }, { status: 201 });
    if (owner.setCookie) response.headers.append("Set-Cookie", owner.setCookie);
    return response;
  } catch (error) {
    const upstreamFailure = error instanceof FishServiceError;
    return jsonNoStore({ error: upstreamFailure ? "The Fish puzzle service is temporarily unavailable." : "The Fish challenge could not be prepared." }, { status: 503 });
  }
}
