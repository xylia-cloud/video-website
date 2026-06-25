const STATIC_DATA_TTL_MS = 5 * 60 * 1000

interface TtlCacheEntry<T> {
  data: T
  cachedAt: number
}

function createTtlCache<T>() {
  let entry: TtlCacheEntry<T> | null = null
  let inflight: Promise<T> | null = null

  return {
    getIfValid(): T | null {
      if (!entry) return null
      if (Date.now() - entry.cachedAt >= STATIC_DATA_TTL_MS) {
        entry = null
        return null
      }
      return entry.data
    },
    set(data: T) {
      entry = { data, cachedAt: Date.now() }
    },
    getInflight() {
      return inflight
    },
    setInflight(promise: Promise<T> | null) {
      inflight = promise
    },
  }
}

export const typesListCache = createTtlCache<any>()
const adsCache = new Map<string, ReturnType<typeof createTtlCache<any>>>()

export const getAdsCacheKey = (params: { ad_pos: number | string; ad_type?: number | string }) =>
  `${params.ad_pos}:${params.ad_type ?? 'all'}`

export const getAdsCache = (key: string) => {
  let cache = adsCache.get(key)
  if (!cache) {
    cache = createTtlCache<any>()
    adsCache.set(key, cache)
  }
  return cache
}
