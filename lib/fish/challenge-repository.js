import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const NO_ANSWER_DEADLINE = "9999-12-31T23:59:59.999Z";

export async function createFishChallenge({ ownerKey, runAttemptId, worldId, solution, admin = createAdminClient() }) {
  const { data, error } = await admin
    .from("fish_challenges")
    .insert({ owner_key: ownerKey, run_attempt_id: runAttemptId, world_id: worldId, solution, expires_at: NO_ANSWER_DEADLINE })
    .select("id")
    .single();
  if (error) throw new Error("Fish challenge persistence failed.", { cause: error });
  return { id: data.id };
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
