export const INPUT_CONTROLS = Object.freeze(["left", "right", "jump", "shoot"]);

export class InputState {
  constructor() {
    this.sources = new Map(INPUT_CONTROLS.map((control) => [control, new Set()]));
    this.justPressed = new Set();
  }

  set(control, pressed, source = "default") {
    const activeSources = this.sources.get(control);
    if (!activeSources) return false;
    const wasDown = activeSources.size > 0;
    if (pressed) activeSources.add(source);
    else activeSources.delete(source);
    if (!wasDown && activeSources.size > 0) this.justPressed.add(control);
    return true;
  }

  isDown(control) {
    return (this.sources.get(control)?.size ?? 0) > 0;
  }

  consumePress(control) {
    const pressed = this.justPressed.has(control);
    this.justPressed.delete(control);
    return pressed;
  }

  releaseSource(source) {
    for (const activeSources of this.sources.values()) activeSources.delete(source);
  }

  reset() {
    for (const activeSources of this.sources.values()) activeSources.clear();
    this.justPressed.clear();
  }
}
