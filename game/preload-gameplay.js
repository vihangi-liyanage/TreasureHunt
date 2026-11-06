import { getLevelConfig } from "@/game/config/levels";

const GAMEPLAY_ASSET_ROOT = "/art/gameplay";

export function getGameplayAssetUrls(level) {
  if (!level?.art) return [];
  return [
    `${GAMEPLAY_ASSET_ROOT}/hunter-atlas.png`,
    `${GAMEPLAY_ASSET_ROOT}/${level.art.panorama}`,
    `${GAMEPLAY_ASSET_ROOT}/${level.art.objects}`,
    `${GAMEPLAY_ASSET_ROOT}/${level.art.terrain}`,
  ];
}

function loadBrowserImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try { await image.decode?.(); } catch { /* A loaded image remains usable if eager decode is unavailable. */ }
      resolve(url);
    };
    image.onerror = () => reject(new Error(`Gameplay asset could not be loaded: ${url}`));
    image.src = url;
  });
}

export function createGameplayPreloader({
  loadRuntime = () => import("@/game/create-game"),
  loadImage = loadBrowserImage,
} = {}) {
  let runtimeRequest = null;
  const assetRequests = new Map();
  const preloadedWorlds = new Set();

  function runtime() {
    if (!runtimeRequest) {
      runtimeRequest = Promise.resolve().then(loadRuntime).catch((error) => {
        runtimeRequest = null;
        throw error;
      });
    }
    return runtimeRequest;
  }

  function asset(url) {
    if (!assetRequests.has(url)) {
      const request = Promise.resolve().then(() => loadImage(url)).catch((error) => {
        assetRequests.delete(url);
        throw error;
      });
      assetRequests.set(url, request);
    }
    return assetRequests.get(url);
  }

  async function preloadWorld(worldId) {
    const level = getLevelConfig(worldId);
    if (!level) throw new Error(`No playable level is configured for ${worldId}.`);
    const [gameModule] = await Promise.all([
      runtime(),
      ...getGameplayAssetUrls(level).map(asset),
    ]);
    preloadedWorlds.add(worldId);
    return gameModule;
  }

  return Object.freeze({
    preloadWorld,
    isWorldPreloaded: (worldId) => preloadedWorlds.has(worldId),
  });
}

export const gameplayPreloader = createGameplayPreloader();
