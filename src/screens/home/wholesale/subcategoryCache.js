const SUBCATEGORY_CACHE_TTL_MS = 10 * 60 * 1000;
const subcategoryCache = new Map();

export function getCachedSubcategoryFlag(cacheKey) {
  const cached = subcategoryCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.ts > SUBCATEGORY_CACHE_TTL_MS) return null;
  return cached.has;
}

export function setCachedSubcategoryFlag(cacheKey, has) {
  subcategoryCache.set(cacheKey, { has, ts: Date.now() });
}

export function makeSubcategoryCacheKey(mode, categoryId) {
  return `${mode}:${categoryId}`;
}
