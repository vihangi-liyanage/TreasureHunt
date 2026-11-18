import "server-only";
import { getAudioCatalogSlot } from "./audio-catalog.js";

const SEARCH_ENDPOINT = "https://freesound.org/apiv2/search/";
const FIELDS = "id,name,username,license,duration,previews,url,tags,loopable";
const PREVIEW_KEYS = Object.freeze(["preview-hq-mp3", "preview-hq-ogg", "preview-lq-mp3", "preview-lq-ogg"]);
const CC0_URL = /^https?:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/?$/i;
const DEFAULT_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 15 * 60_000;
const cache = new Map();

export class FreesoundServiceError extends Error {
  constructor(code, message, options) { super(message, options); this.name = "FreesoundServiceError"; this.code = code; }
}

export function isCc0License(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return /^creative commons 0(?: 1\.0)?$/i.test(normalized) || CC0_URL.test(normalized);
}

function safeHttpsUrl(value, allowedHosts, extensionPattern) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    return allowedHosts(url.hostname.toLowerCase()) && extensionPattern.test(url.pathname) ? url.href : null;
  } catch { return null; }
}

function normalizePreviewUrls(previews) {
  if (!previews || typeof previews !== "object" || Array.isArray(previews)) return null;
  const normalized = {};
  for (const key of PREVIEW_KEYS) {
    const extension = key.endsWith("mp3") ? /\.mp3$/i : /\.ogg$/i;
    const url = safeHttpsUrl(previews[key], (host) => host === "freesound.org" || host.endsWith(".freesound.org"), extension);
    if (url) normalized[key] = url;
  }
  return Object.keys(normalized).length ? Object.freeze(normalized) : null;
}

export function normalizeFreesoundRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  const id = Number(record.id); const name = typeof record.name === "string" ? record.name.trim() : "";
  const creator = typeof record.username === "string" ? record.username.trim() : ""; const duration = Number(record.duration);
  const previews = normalizePreviewUrls(record.previews);
  const sourceUrl = Number.isInteger(id) && id > 0
    ? safeHttpsUrl(record.url, (host) => host === "freesound.org" || host === "www.freesound.org", new RegExp(`/sounds/${id}/?$`)) : null;
  if (!Number.isInteger(id) || id <= 0 || !name || !creator || !Number.isFinite(duration) || duration <= 0) return null;
  if (!isCc0License(record.license) || !previews || !sourceUrl) return null;
  return Object.freeze({
    id, name, creator, license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", duration, previews, sourceUrl,
    tags: Object.freeze(Array.isArray(record.tags) ? record.tags.filter((tag) => typeof tag === "string" && tag.trim()).slice(0, 24).map((tag) => tag.trim()) : []),
    loopable: record.loopable === true,
  });
}

export function parseFreesoundSearchResponse(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !Array.isArray(payload.results)) return null;
  return payload.results.map(normalizeFreesoundRecord).filter(Boolean);
}

export function buildFreesoundSearchRequest(definition, apiKey) {
  if (!definition || typeof apiKey !== "string" || !apiKey.trim()) throw new FreesoundServiceError("NOT_CONFIGURED", "Freesound discovery is not configured.");
  const selectedIdFilter = definition.selectedIds?.length ? ` id:(${definition.selectedIds.join(" OR ")})` : "";
  const params = new URLSearchParams({
    query: definition.query,
    filter: `license:"Creative Commons 0" duration:[${definition.duration[0]} TO ${definition.duration[1]}]${selectedIdFilter}`,
    fields: FIELDS, page_size: "20", sort: "score", group_by_pack: "1",
  });
  return Object.freeze({
    url: new URL(`?${params.toString()}`, SEARCH_ENDPOINT),
    options: Object.freeze({ cache: "no-store", headers: Object.freeze({ Accept: "application/json", Authorization: `Token ${apiKey.trim()}` }) }),
  });
}

function mapStatus(status) {
  if (status === 401 || status === 403) return "AUTHENTICATION_FAILED";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "UPSTREAM_UNAVAILABLE";
  return "UPSTREAM_ERROR";
}

export async function discoverFreesoundCandidates(slot, { fetchImpl = fetch, apiKey = process.env.FREESOUND_API_KEY, signal, now = Date.now() } = {}) {
  const definition = getAudioCatalogSlot(slot);
  if (!definition) throw new FreesoundServiceError("INVALID_SLOT", "Unknown audio catalog slot.");
  const cached = cache.get(slot); if (cached && cached.expiresAt > now) return cached.value;
  const request = buildFreesoundSearchRequest(definition, apiKey);
  const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS); const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  let response;
  try { response = await fetchImpl(request.url, { ...request.options, signal: requestSignal }); }
  catch (error) {
    const code = error?.name === "TimeoutError" || timeoutSignal.aborted ? "TIMEOUT" : "UNAVAILABLE";
    throw new FreesoundServiceError(code, "Freesound could not be reached.", { cause: error });
  }
  if (!response.ok) throw new FreesoundServiceError(mapStatus(response.status), `Freesound returned HTTP ${response.status}.`);
  let payload;
  try { payload = await response.json(); }
  catch (error) { throw new FreesoundServiceError("INVALID_RESPONSE", "Freesound returned invalid JSON.", { cause: error }); }
  const candidates = parseFreesoundSearchResponse(payload);
  if (!candidates) throw new FreesoundServiceError("INVALID_RESPONSE", "Freesound returned malformed search metadata.");
  const value = Object.freeze({
    slot, label: definition.label, kind: definition.kind, providerStatus: response.status,
    providerResultCount: Number.isInteger(payload.count) && payload.count >= 0 ? payload.count : candidates.length,
    candidates: Object.freeze(candidates.slice(0, definition.limit)),
  });
  cache.set(slot, { expiresAt: now + CACHE_TTL_MS, value }); return value;
}

export function resetFreesoundCacheForTests() { cache.clear(); }
