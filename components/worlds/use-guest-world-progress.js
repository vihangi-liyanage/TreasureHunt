"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearLegacyGuestProgress,
  deriveWorldStates,
  getJourneyProgress,
  subscribeGuestProgress,
} from "@/lib/progress/guest-progress";

export function subscribeToGuestProgress(onProgress) {
  clearLegacyGuestProgress();
  return subscribeGuestProgress(onProgress);
}

export function useGuestWorldProgress(worlds, enabled = true) {
  const [completedWorldIds, setCompletedWorldIds] = useState([]);

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribeToGuestProgress(setCompletedWorldIds);
  }, [enabled]);

  return useMemo(() => ({
    states: deriveWorldStates(worlds, completedWorldIds),
    journeyProgress: getJourneyProgress(worlds, completedWorldIds),
  }), [worlds, completedWorldIds]);
}
