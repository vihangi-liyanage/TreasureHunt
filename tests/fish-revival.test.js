import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createSignedGuestIdentity, readSignedGuestIdentity } from "@/lib/fish/challenge-identity";
import { createFishChallenge, verifyFishChallenge } from "@/lib/fish/challenge-repository";

describe("Fish revival server contracts", () => {
  it("signs guest virtual identities and rejects tampering", () => {
    const id = randomUUID();
    const token = createSignedGuestIdentity(id, "a-dedicated-test-secret-that-is-long");
    expect(readSignedGuestIdentity(token, "a-dedicated-test-secret-that-is-long")).toBe(id);
    expect(readSignedGuestIdentity(`${randomUUID()}.${token.split(".")[1]}`, "a-dedicated-test-secret-that-is-long")).toBeNull();
  });

  it("stores the upstream solution only in the server repository", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: randomUUID() }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const admin = { from: vi.fn(() => ({ insert })) };
    const record = await createFishChallenge({ ownerKey:`guest:${randomUUID()}`, runAttemptId:randomUUID(), worldId:"emerald-jungle", solution:7, admin });
    expect(insert.mock.calls[0][0]).toMatchObject({ solution:7, world_id:"emerald-jungle", expires_at:"9999-12-31T23:59:59.999Z" });
    expect(record).not.toHaveProperty("solution");
    expect(record).not.toHaveProperty("expiresAt");
  });

  it("delegates single-use answer verification to the atomic database function", async () => {
    const admin = { rpc: vi.fn().mockResolvedValue({ data:"correct", error:null }) };
    const values = { challengeId:randomUUID(), ownerKey:`auth:${randomUUID()}`, runAttemptId:randomUUID(), answer:8, admin };
    await expect(verifyFishChallenge(values)).resolves.toBe("correct");
    expect(admin.rpc).toHaveBeenCalledWith("verify_fish_challenge_admin", expect.objectContaining({ p_answer:8, p_owner_key:values.ownerKey }));
  });

  it("preserves zero as a valid Fish API solution", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: randomUUID() }, error: null });
    const insert = vi.fn(() => ({ select: () => ({ single }) }));
    const admin = { from: vi.fn(() => ({ insert })) };
    await createFishChallenge({ ownerKey:`guest:${randomUUID()}`, runAttemptId:randomUUID(), worldId:"emerald-jungle", solution:0, admin });
    expect(insert.mock.calls[0][0].solution).toBe(0);
  });
});
