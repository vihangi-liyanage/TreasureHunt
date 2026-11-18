import { getAudioCatalogSlot, listAudioCatalogSlots } from "@/lib/audio/audio-catalog";
import { discoverFreesoundCandidates, FreesoundServiceError } from "@/lib/audio/freesound-server";
import { checkRequestLimit } from "@/lib/auth/request-guard";
import { jsonNoStore } from "@/lib/http/responses";

export async function GET(request) {
  const rate = checkRequestLimit(request, "audio-catalog", { limit: 20, windowMs: 5 * 60_000 });
  if (!rate.allowed) {
    return jsonNoStore({ error: "Too many audio catalog requests. Please try again later." }, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  }

  const slot = new URL(request.url).searchParams.get("slot");
  if (!getAudioCatalogSlot(slot)) {
    return jsonNoStore({ error: "Invalid audio catalog slot.", slots: listAudioCatalogSlots() }, { status: 400 });
  }

  try {
    return jsonNoStore({ catalog: await discoverFreesoundCandidates(slot) });
  } catch (error) {
    if (error instanceof FreesoundServiceError && error.code === "NOT_CONFIGURED") {
      return jsonNoStore({ error: "Audio discovery is not configured." }, { status: 503 });
    }
    if (error instanceof FreesoundServiceError && error.code === "RATE_LIMITED") {
      return jsonNoStore({ error: "The audio provider is temporarily rate limited." }, { status: 503 });
    }
    return jsonNoStore({ error: "The audio catalog is temporarily unavailable." }, { status: 503 });
  }
}
