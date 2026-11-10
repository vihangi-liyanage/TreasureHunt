import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const FISH_CHALLENGE_LIFETIME_MS = 5 * 60_000;

export async function createFishChallenge({ ownerKey, runAttemptId, worldId, solution, now = Date.now(), admin = createAdminClient() }) {
  const expiresAt = new Date(now + FISH_CHALLENGE_LIFETIME_MS).toISOString();
  const { data, error } = await admin
    .from("fish_challenges")
    .insert({ owner_key: ownerKey, run_attempt_id: runAttemptId, world_id: worldId, solution, expires_at: expiresAt })
    .select("id, expires_at")
    .single();
  if (error) throw new Error("Fish challenge persistence failed.", { cause: error });
  return { id: data.id, expiresAt: data.expires_at };
}

export async function verifyFishChallenge({ challengeId, ownerKey, runAttemptId, answer, admin = createAdminClient() }) {
  const { data, error } = await admin.rpc("verify_fish_challenge_admin", {
    p_challenge_id: challengeId,
    p_owner_key: ownerKey,
    p_run_attempt_id: runAttemptId,
    p_answer: answer,
  });
  if (error) throw new Error("Fish challenge verification failed.", { cause: error });
  return data;
}
