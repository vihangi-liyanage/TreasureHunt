import { createHmac, timingSafeEqual } from "node:crypto";

export const FISH_GUEST_COOKIE = "treasurehunt.fish-guest";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function signature(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function getFishChallengeSecret() {
  const secret = process.env.FISH_CHALLENGE_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!secret || secret.length < 24) throw new Error("Fish challenge signing is not configured.");
  return secret;
}

export function createSignedGuestIdentity(id, secret = getFishChallengeSecret()) {
  if (!UUID_PATTERN.test(id)) throw new Error("Invalid guest identity.");
  return `${id}.${signature(id, secret)}`;
}

export function readSignedGuestIdentity(value, secret = getFishChallengeSecret()) {
  if (typeof value !== "string") return null;
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const id = value.slice(0, separator);
  const supplied = value.slice(separator + 1);
  if (!UUID_PATTERN.test(id)) return null;
  const expected = signature(id, secret);
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  if (expectedBytes.length !== suppliedBytes.length || !timingSafeEqual(expectedBytes, suppliedBytes)) return null;
  return id;
}

export function serializeFishGuestCookie(value) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${FISH_GUEST_COOKIE}=${encodeURIComponent(value)}; Path=/api/fish; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`;
}

export function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
