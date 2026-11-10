import { checkRequestLimit } from "@/lib/auth/request-guard";
import { verifyFishChallenge } from "@/lib/fish/challenge-repository";
import { isUuid } from "@/lib/fish/challenge-identity";
import { resolveFishChallengeOwner } from "@/lib/fish/challenge-owner";
import { jsonNoStore, readJsonObject } from "@/lib/http/responses";

const RESULT_RESPONSES = Object.freeze({
  incorrect: { status: 400, error: "That count is not correct. Check the image and try again." },
  expired: { status: 410, error: "This Fish challenge expired. Request a new puzzle." },
  used: { status: 409, error: "This Fish challenge has already been used." },
  already_revived: { status: 409, error: "This run has already used its Fish revival." },
  locked: { status: 429, error: "Too many incorrect answers. Request a new puzzle." },
  invalid: { status: 404, error: "This Fish challenge is not available for this run." },
});

export async function POST(request, { params }) {
  const rate = checkRequestLimit(request, "fish-challenge-answer", { limit: 12, windowMs: 10 * 60_000 });
  if (!rate.allowed) return jsonNoStore({ error: "Too many Fish answer attempts. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const { challengeId } = await params;
  const values = await readJsonObject(request);
  if (!isUuid(challengeId) || !values || !isUuid(values.runAttemptId) || !Number.isInteger(values.answer) || values.answer < 0 || values.answer > 1_000) {
    return jsonNoStore({ error: "Enter a whole-number fish count." }, { status: 400 });
  }

  let owner;
  try {
    owner = await resolveFishChallengeOwner(request, values.mode);
  } catch {
    return jsonNoStore({ error: "Fish revival is not configured." }, { status: 503 });
  }
  if (owner.error) return jsonNoStore({ error: owner.error }, { status: owner.status });

  try {
    const result = await verifyFishChallenge({ challengeId, ownerKey: owner.ownerKey, runAttemptId: values.runAttemptId, answer: values.answer });
    if (result === "correct") return jsonNoStore({ revivalGranted: true });
    const failure = RESULT_RESPONSES[result] || RESULT_RESPONSES.invalid;
    return jsonNoStore({ error: failure.error }, { status: failure.status });
  } catch {
    return jsonNoStore({ error: "The Fish answer could not be verified. Please try again." }, { status: 503 });
  }
}
