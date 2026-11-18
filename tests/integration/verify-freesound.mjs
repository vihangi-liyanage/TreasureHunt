import { AUDIO_CATALOG_SLOTS } from "../../lib/audio/audio-catalog.js";
import { discoverFreesoundCandidates } from "../../lib/audio/freesound-server.js";

const requested = process.argv.slice(2);
const slots = requested.length ? requested : Object.keys(AUDIO_CATALOG_SLOTS);
let missing = 0;

console.log(`Freesound verification: ${slots.length} predefined catalog slot(s)`);
for (const slot of slots) {
  if (!AUDIO_CATALOG_SLOTS[slot]) {
    console.error(`${slot}: unknown slot`);
    process.exitCode = 1;
    continue;
  }
  try {
    const catalog = await discoverFreesoundCandidates(slot);
    if (!catalog.candidates.length) {
      missing += 1;
      console.log(`${slot}: HTTP ${catalog.providerStatus}; no validated CC0 candidates found (${catalog.providerResultCount} upstream match(es))`);
      continue;
    }
    console.log(`${slot}: HTTP ${catalog.providerStatus}; ${catalog.candidates.length} validated CC0 candidate(s)`);
    for (const sound of catalog.candidates) {
      console.log(`  ${sound.id} | ${sound.name} | ${sound.creator} | ${sound.license} | ${sound.duration.toFixed(1)}s | loopable: ${sound.loopable ? "yes" : "no"} | preview: ${Object.keys(sound.previews).length > 0 ? "yes" : "no"}`);
    }
  } catch (error) {
    console.error(`${slot}: verification failed (${error?.code || "UNKNOWN"})`);
    process.exitCode = 1;
  }
}
console.log(`Slots still needing candidates: ${missing}`);
