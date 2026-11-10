import "server-only";
import { randomUUID } from "node:crypto";
import { getRouteSession } from "@/lib/auth/route-session";
import {
  createSignedGuestIdentity,
  FISH_GUEST_COOKIE,
  getFishChallengeSecret,
  readSignedGuestIdentity,
  serializeFishGuestCookie,
} from "./challenge-identity";

export async function resolveFishChallengeOwner(request, mode) {
  if (mode === "authenticated") {
    const { configured, identity } = await getRouteSession();
    if (!configured) return { error: "Authentication is not configured.", status: 503 };
    if (!identity) return { error: "Sign in to request a Fish challenge.", status: 401 };
    return { ownerKey: `auth:${identity.id}`, setCookie: null };
  }
  if (mode !== "guest") return { error: "Invalid game mode.", status: 400 };

  const secret = getFishChallengeSecret();
  const supplied = request.cookies.get(FISH_GUEST_COOKIE)?.value;
  const existingId = readSignedGuestIdentity(supplied, secret);
  const id = existingId || randomUUID();
  return {
    ownerKey: `guest:${id}`,
    setCookie: existingId ? null : serializeFishGuestCookie(createSignedGuestIdentity(id, secret)),
  };
}
