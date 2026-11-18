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

async function loadBrowserAsset(url) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Gameplay asset could not be loaded: ${url}`);
  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Gameplay asset could not be decoded: ${url}`));
      image.src = objectUrl;
    });
    return objectUrl;
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export function createGameplayPreloader({
  loadRuntime = () => import("@/game/create-game"),
  loadImage = loadBrowserAsset,
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
    const urls = getGameplayAssetUrls(level);
    const [gameModule, ...preparedUrls] = await Promise.all([
      runtime(),
      ...urls.map(asset),
    ]);
    preloadedWorlds.add(worldId);
    return Object.freeze({ ...gameModule, assetUrls: Object.freeze(Object.fromEntries(urls.map((url, index) => [url, preparedUrls[index]]))) });
  }

  return Object.freeze({
    preloadWorld,
    isWorldPreloaded: (worldId) => preloadedWorlds.has(worldId),
  });
}

export const gameplayPreloader = createGameplayPreloader();
