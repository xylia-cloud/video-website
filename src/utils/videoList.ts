/** 列表广告插入位置：17 条视频 + 3 条广告 = 20 条 */
export const LIST_AD_POSITIONS = [3, 6, 11] as const
export const VIDEOS_BEFORE_ADS = 17

interface VideoListApiResponse {
  data?: { list?: unknown[] } | unknown[] | null
  list?: unknown[]
}

export function parseVideoListResponse(result: VideoListApiResponse): unknown[] {
  if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
    const nested = result.data as { list?: unknown[] }
    if (nested.list) return nested.list
  }
  if (Array.isArray(result.data)) return result.data
  if (result.list) return result.list
  return []
}

export function trimVideosForAdSlots<T>(videos: T[]): T[] {
  if (videos.length >= 20) {
    return videos.slice(0, VIDEOS_BEFORE_ADS)
  }
  return videos
}

export function insertListAds<T>(videos: T[], ads: T[]): T[] {
  const result = [...videos]
  const adsToUse = ads.slice(0, LIST_AD_POSITIONS.length)

  for (let i = 0; i < Math.min(LIST_AD_POSITIONS.length, adsToUse.length); i++) {
    const position = LIST_AD_POSITIONS[i]
    if (position <= result.length) {
      result.splice(position, 0, adsToUse[i])
    }
  }

  return result
}

/** 第一页列表：裁剪视频条数并插入广告 */
export function applyFirstPageListAds<T>(videos: T[], ads: T[], page: number): T[] {
  if (page !== 1 || ads.length === 0) {
    return videos
  }

  return insertListAds(trimVideosForAdSlots([...videos]), ads)
}
