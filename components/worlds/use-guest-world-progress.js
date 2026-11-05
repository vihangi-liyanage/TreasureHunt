"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deriveWorldStates,
  getJourneyProgress,
  GUEST_PROGRESS_KEY,
  readGuestProgress,
} from "@/lib/progress/guest-progress";

export function subscribeToGuestProgress(onProgress, {
  eventTarget = window,
  storage = window.localStorage,
  requestFrame = window.requestAnimationFrame,
  cancelFrame = window.cancelAnimationFrame,
} = {}) {
  const syncProgress = () => onProgress(readGuestProgress(storage).completedWorldIds);
  const initialFrame = requestFrame(syncProgress);
  const syncStorage = (event) => {
    if (event.key === GUEST_PROGRESS_KEY) syncProgress();
  };

  eventTarget.addEventListener("storage", syncStorage);
  return () => {
    cancelFrame(initialFrame);
    eventTarget.removeEventListener("storage", syncStorage);
  };
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
