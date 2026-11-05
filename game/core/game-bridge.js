export function createGameBridge() {
  const listeners = new Map();
  return Object.freeze({
    on(eventName, handler) {
      const eventListeners = listeners.get(eventName) || new Set();
      eventListeners.add(handler);
      listeners.set(eventName, eventListeners);
      return () => {
        eventListeners.delete(handler);
        if (!eventListeners.size) listeners.delete(eventName);
      };
    },
    emit(eventName, payload) {
      for (const handler of [...(listeners.get(eventName) || [])]) handler(payload);
    },
    destroy() { listeners.clear(); },
  });
}
