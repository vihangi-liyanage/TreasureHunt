const STORE_KEY = Symbol.for("treasurehunt.rate-limit-store");
const buckets = globalThis[STORE_KEY] || new Map();
globalThis[STORE_KEY] = buckets;

export function takeRateLimit(key, { limit = 8, windowMs = 60_000, now = Date.now() } = {}) {
  if (buckets.size > 1_000) {
    for (const [storedKey, bucket] of buckets) {
      if (bucket.resetAt <= now || buckets.size > 900) buckets.delete(storedKey);
      if (buckets.size <= 900) break;
    }
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count, retryAfterSeconds: 0 };
}

export function getRequestRateLimitKey(request, action) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${action}:${address}`;
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
