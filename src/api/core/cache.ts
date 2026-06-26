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
    clear() {
      entry = null
      inflight = null
    },
  }
}

export const typesListCache = createTtlCache<any>()
const adsCache = new Map<string, ReturnType<typeof createTtlCache<any>>>()

/** 视频详情 / 详情推荐缓存 TTL（2 分钟） */
export const VIDEO_DETAIL_TTL_MS = 2 * 60 * 1000

export function createTtlCacheWithTtl<T>(ttlMs: number) {
  let entry: TtlCacheEntry<T> | null = null
  let inflight: Promise<T> | null = null

  return {
    getIfValid(): T | null {
      if (!entry) return null
      if (Date.now() - entry.cachedAt >= ttlMs) {
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
    clear() {
      entry = null
      inflight = null
    },
  }
}

const videoDetailCaches = new Map<string, ReturnType<typeof createTtlCacheWithTtl<any>>>()
const detailRecommendCaches = new Map<string, ReturnType<typeof createTtlCacheWithTtl<any>>>()

export const getVideoDetailCache = (key: string) => {
  let cache = videoDetailCaches.get(key)
  if (!cache) {
    cache = createTtlCacheWithTtl<any>(VIDEO_DETAIL_TTL_MS)
    videoDetailCaches.set(key, cache)
  }
  return cache
}

export const getDetailRecommendCache = (key: string) => {
  let cache = detailRecommendCaches.get(key)
  if (!cache) {
    cache = createTtlCacheWithTtl<any>(VIDEO_DETAIL_TTL_MS)
    detailRecommendCaches.set(key, cache)
  }
  return cache
}

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

/** 登出 / token 失效时清空所有内存 API 缓存 */
export const invalidateAllApiCaches = () => {
  typesListCache.clear()
  adsCache.clear()
  videoDetailCaches.clear()
  detailRecommendCaches.clear()
}
