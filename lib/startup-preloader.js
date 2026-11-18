import { gameplayPreloader } from "@/game/preload-gameplay";
import { EFFECT_SLOTS, selectConfiguredCandidates } from "@/lib/audio/audio-catalog";
import { audioPlayer, requestAudioCatalog } from "@/lib/audio/audio-player";

export const STARTUP_TIMEOUT_MS = 15_000;
export const STARTUP_WORLDS = Object.freeze(["emerald-jungle", "sunset-ruins", "crystal-cavern"]);
export const STARTUP_IMAGES = Object.freeze(["/art/treasurehunt-hero.png", "/art/worlds-atlas.png"]);
export const STARTUP_AUDIO_SLOTS = Object.freeze([
  "welcome", ...STARTUP_WORLDS, "jump", "coin", "gem", "fish-power-up", "projectile", "damage",
]);
export const STARTUP_TASK_COUNT = STARTUP_IMAGES.length + STARTUP_WORLDS.length + STARTUP_AUDIO_SLOTS.length;

const optionalEffectSlots = EFFECT_SLOTS.filter((slot) => !STARTUP_AUDIO_SLOTS.includes(slot));
const imageRequests = new Map();

function loadImage(url) {
  if (imageRequests.has(url)) return imageRequests.get(url);
  const request = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try { await image.decode?.(); } catch { /* The browser can still reuse a loaded image. */ }
      resolve(url);
    };
    image.onerror = () => reject(new Error(`Startup image could not be loaded: ${url}`));
    image.src = url;
  }).catch((error) => { imageRequests.delete(url); throw error; });
  imageRequests.set(url, request);
  return request;
}

async function runBounded(tasks, concurrency, execute) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (cursor < tasks.length) await execute(tasks[cursor++]);
  });
  await Promise.all(workers);
}

export function createStartupPreloader({
  preloadImage = loadImage,
  preloadWorld = (worldId) => gameplayPreloader.preloadWorld(worldId),
  loadCatalog = requestAudioCatalog,
  prepareWelcomeMusic = (candidate) => audioPlayer.prepareMusicCandidate(candidate),
  prepareWorldMusic = (candidate) => audioPlayer.prepareMusicCandidate(candidate),
  warmEffect = (candidate) => audioPlayer.warmEffectCandidate(candidate),
  timeoutMs = STARTUP_TIMEOUT_MS,
} = {}) {
  return async function preloadStartup({ onProgress = () => {}, signal } = {}) {
    const audioTasks = STARTUP_AUDIO_SLOTS.map((slot) => ({
        id: `audio:${slot}`,
        category: slot === "welcome" ? "welcome-audio" : "audio-metadata",
        required: false,
        run: async () => {
          const catalog = await loadCatalog(slot);
          if (!catalog) throw new Error(`Audio metadata unavailable for ${slot}.`);
          const [candidate] = selectConfiguredCandidates(slot, catalog.candidates);
          const mediaReady = candidate && await (slot === "welcome"
            ? prepareWelcomeMusic(candidate)
            : STARTUP_WORLDS.includes(slot) ? prepareWorldMusic(candidate) : warmEffect(candidate));
          if (!mediaReady) throw new Error(`Primary audio preview was not ready for ${slot}.`);
          return catalog;
        },
      }));
    const tasks = [
      ...STARTUP_IMAGES.map((url) => ({ id: `image:${url}`, category: "artwork", required: true, run: () => preloadImage(url) })),
      audioTasks[0],
      ...STARTUP_WORLDS.map((worldId) => ({ id: `world:${worldId}`, category: "worlds", required: true, run: () => preloadWorld(worldId) })),
      ...audioTasks.slice(1),
    ];
    const results = new Map();
    let completed = 0;
    let acceptProgress = true;
    const publish = (status, task) => {
      if (acceptProgress && !signal?.aborted) onProgress(Object.freeze({ completed, total: tasks.length, progress: completed / tasks.length, status, task, results: new Map(results) }));
    };
    publish("Preparing adventure assets...", null);

    let timeoutId;
    const timeout = new Promise((resolve) => { timeoutId = setTimeout(() => resolve({ timedOut: true }), timeoutMs); });
    const work = runBounded(tasks, 3, async (task) => {
      if (signal?.aborted) return;
      publish(task.category === "worlds" ? "Loading world artwork..." : task.category.includes("audio") ? "Preparing game audio..." : "Preparing adventure assets...", task.id);
      try { await task.run(); results.set(task.id, "ready"); }
      catch { results.set(task.id, "failed"); }
      finally { completed += 1; publish("Preparing adventure assets...", task.id); }
    }).then(() => ({ timedOut: false }));

    const outcome = await Promise.race([work, timeout]);
    clearTimeout(timeoutId);
    const requiredFailures = tasks.filter((task) => task.required && results.get(task.id) === "failed").map((task) => task.id);
    const deferred = tasks.filter((task) => !results.has(task.id)).map((task) => task.id);
    if (!outcome.timedOut && !signal?.aborted) {
      publish("Adventure ready!", null);
      for (const slot of optionalEffectSlots) void loadCatalog(slot);
    }
    acceptProgress = false;
    return Object.freeze({ timedOut: outcome.timedOut, requiredFailures, deferred, results });
  };
}

export const preloadStartup = createStartupPreloader();
