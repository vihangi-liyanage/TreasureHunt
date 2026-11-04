import { describe, expect, it, vi } from "vitest";
import { subscribeToGuestProgress } from "@/components/worlds/use-guest-world-progress";
import { GUEST_PROGRESS_KEY } from "@/lib/progress/guest-progress";

describe("guest progress browser events", () => {
  it("syncs relevant storage changes and removes every scheduled resource", () => {
    const listeners = new Map();
    const eventTarget = {
      addEventListener: vi.fn((name, listener) => listeners.set(name, listener)),
      removeEventListener: vi.fn((name, listener) => {
        if (listeners.get(name) === listener) listeners.delete(name);
      }),
    };
    const storage = {
      getItem: vi.fn(() => JSON.stringify({ completedWorldIds: ["emerald-jungle"] })),
    };
    const onProgress = vi.fn();
    const cancelFrame = vi.fn();
    let initialSync;

    const unsubscribe = subscribeToGuestProgress(onProgress, {
      eventTarget,
      storage,
      requestFrame: (callback) => { initialSync = callback; return 42; },
      cancelFrame,
    });

    initialSync();
    listeners.get("storage")({ key: "unrelated" });
    listeners.get("storage")({ key: GUEST_PROGRESS_KEY });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith(["emerald-jungle"]);

    unsubscribe();
    expect(cancelFrame).toHaveBeenCalledWith(42);
    expect(listeners.has("storage")).toBe(false);
  });
});
