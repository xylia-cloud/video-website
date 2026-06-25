import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import { withTopLoading } from '../core/loading'
import {
  USER_POINTS_TTL_MS,
  userPointsCache,
  userPointsInflight,
} from '../core/points-cache'
import {
  checkApiAuthError,
  getUserInfo,
  handleAuthError,
  isGuestUser,
  setUserInfo,
} from '../core/auth-session'
import type { RefreshUserPointsResult, UserInfo, UserPointsData } from '../types'

const fetchUserPointsRaw = async (): Promise<RefreshUserPointsResult> => {
  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  const userId = userInfo.user_id || userInfo.id
  const token = userInfo.token

  if (!userId || !token) {
    throw new Error('用户信息不完整')
  }

  console.log('正在获取用户积分信息...')

  const queryParams = new URLSearchParams()
  queryParams.append('service', 'User.GetPoints')
  queryParams.append('uid', String(userId))
  queryParams.append('token', token)
  queryParams.append('lang', 'zh_cn')

  if (isGuestUser()) {
    queryParams.append('isyouke', '1')
  }

  const requestUrl = buildNewApiUrl(queryParams)

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取积分信息返回:', result)

  if (checkApiAuthError(result) || (result.data && checkApiAuthError(result.data))) {
    handleAuthError('登录已过期，请重新登录')
    throw new Error('认证失败，请重新登录')
  }

  if (result && result.ret === 200 && result.data) {
    if (result.data.code === 0) {
      return {
        code: 1,
        data: {
          points: result.data.info.points,
          coin: result.data.info.coin || '0',
          video_nums: result.data.info.video_nums,
          is_vip: result.data.info.is_vip,
          endtime: result.data.info.endtime,
        },
        msg: result.data.msg || '获取成功',
      }
    }

    return {
      code: 0,
      data: null,
      msg: result.data.msg || '获取失败',
    }
  }

  return {
    code: 0,
    data: null,
    msg: result?.msg || '获取失败',
  }
}

const mergePointsIntoUserInfo = (data: UserPointsData): UserInfo | null => {
  const currentUserInfo = getUserInfo()
  if (!currentUserInfo) return null

  const updatedUserInfo: UserInfo = {
    ...currentUserInfo,
    coin: parseFloat(String(data.coin || '0')),
    user_points: parseFloat(String(data.points || '0')),
    points: data.points,
    video_nums: data.video_nums,
    is_vip: data.is_vip,
  }

  if (data.endtime) {
    updatedUserInfo.endtime = data.endtime
  }

  return updatedUserInfo
}

/**
 * 刷新用户积分/VIP/余额并写入 localStorage（带去重与 30s 缓存）
 */
export const refreshUserPoints = async (options?: {
  force?: boolean
  loading?: boolean
}): Promise<RefreshUserPointsResult> => {
  const force = options?.force ?? false
  const now = Date.now()

  if (!force && userPointsCache.result?.code === 1 && now - userPointsCache.cachedAt < USER_POINTS_TTL_MS) {
    return userPointsCache.result
  }

  if (userPointsInflight.current && !force) {
    return userPointsInflight.current!
  }

  const run = async (): Promise<RefreshUserPointsResult> => {
    try {
      const result = options?.loading
        ? await withTopLoading(() => fetchUserPointsRaw())
        : await fetchUserPointsRaw()

      if (result.code === 1 && result.data) {
        const updatedUserInfo = mergePointsIntoUserInfo(result.data)
        if (updatedUserInfo) {
          setUserInfo(updatedUserInfo)
        }
        userPointsCache.result = result
        userPointsCache.cachedAt = Date.now()
      }

      return result
    } catch (error) {
      console.error('刷新用户积分失败:', error)
      throw error
    } finally {
      userPointsInflight.current = null
    }
  }

  userPointsInflight.current = run()
  return userPointsInflight.current!
}

export const fetchUserPoints = async () => {
  return withTopLoading(() => fetchUserPointsRaw())
}

/**
 * 获取用户余额（统一走 User.GetPoints，与 refreshUserPoints 一致）
 */
export const fetchUserBalance = async () => {
  try {
    const result = await refreshUserPoints({ force: true })

    if (result.code === 1 && result.data) {
      return {
        code: 1 as const,
        data: {
          coin: parseFloat(String(result.data.coin || '0')),
          score: parseInt(String(result.data.points || '0'), 10),
        },
        msg: result.msg || '获取成功',
      }
    }

    return {
      code: 0 as const,
      data: null,
      msg: result.msg || '获取失败',
    }
  } catch (error) {
    console.error('获取用户余额失败:', error)
    throw error
  }
}
