import type { RefreshUserPointsResult } from '../types'

export const USER_POINTS_TTL_MS = 30_000
export const userPointsCache: {
  result: RefreshUserPointsResult | null
  cachedAt: number
} = {
  result: null,
  cachedAt: 0,
}
export const userPointsInflight = {
  current: null as Promise<RefreshUserPointsResult> | null,
}

export const invalidateUserPointsCache = () => {
  userPointsCache.result = null
  userPointsCache.cachedAt = 0
  userPointsInflight.current = null
}
