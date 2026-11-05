import { getRequestRateLimitKey, takeRateLimit } from "@/lib/security/rate-limit";

export function checkRequestLimit(request, action, options) {
  return takeRateLimit(getRequestRateLimitKey(request, action), options);
}
