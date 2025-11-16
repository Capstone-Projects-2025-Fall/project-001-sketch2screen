// frontend/src/utils/cacheUtils.ts
/**
 * Utilities for caching component variations
 */

export type CacheKey = string;

export type VariationCache = {
  auto: Record<CacheKey, {
    variations: string[];
    timestamp: number;
  }>;
  custom: Record<CacheKey, Record<string, {
    variations: string[];
    timestamp: number;
  }>>;
};

/**
 * Generates a cache key from element HTML
 * Normalizes HTML by removing dynamic attributes
 */
export function generateCacheKey(elementHtml: string): CacheKey {
  const normalized = elementHtml
    .replace(/data-element-id="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Simple hash using btoa
  return btoa(normalized).slice(0, 32);
}

/**
 * Checks if a cache entry is still valid
 */
export function isCacheValid(timestamp: number, maxAge: number): boolean {
  return Date.now() - timestamp < maxAge;
}

/**
 * Creates an empty cache structure
 */
export function createEmptyCache(): VariationCache {
  return {
    auto: {},
    custom: {}
  };
}

/**
 * Prunes old cache entries to keep cache size manageable
 */
export function pruneCache(
  cache: VariationCache,
  maxSize: number
): VariationCache {
  const autoKeys = Object.keys(cache.auto);
  const customKeys = Object.keys(cache.custom);
  
  if (autoKeys.length + customKeys.length <= maxSize) {
    return cache;
  }
  
  // Sort by timestamp and keep most recent
  const autoEntries = autoKeys
    .map(key => ({ key, timestamp: cache.auto[key].timestamp }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, Math.floor(maxSize / 2));
  
  const newAuto: typeof cache.auto = {};
  autoEntries.forEach(({ key }) => {
    newAuto[key] = cache.auto[key];
  });
  
  return {
    auto: newAuto,
    custom: {} // Reset custom cache if pruning needed
  };
}