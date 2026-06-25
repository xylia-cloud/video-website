import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import { getAdsCache, getAdsCacheKey } from '../core/cache'
import { createAuthHeaders, checkLoginRequired, getUserInfo } from '../core/auth-session'

export const fetchAds = async (params: {
  ad_pos: number | string // 位置 1:首页; 3:列表页; 4:详情页/搜索页
  ad_type?: number | string // 广告类型 1:轮播图; 2:单图
}) => {
  if (!params.ad_pos) {
    throw new Error('广告位置(ad_pos)不能为空')
  }

  const cacheKey = getAdsCacheKey(params)
  const cache = getAdsCache(cacheKey)
  const cached = cache.getIfValid()
  if (cached) {
    console.log(`使用广告缓存，位置: ${params.ad_pos}, 类型: ${params.ad_type || '所有类型'}`)
    return cached
  }

  const inflight = cache.getInflight()
  if (inflight) {
    return inflight
  }

  const request = (async () => {
    console.log(`正在获取广告数据，位置: ${params.ad_pos}, 类型: ${params.ad_type || '所有类型'}`)

    const queryParams = new URLSearchParams()
    queryParams.append('ad_pos', String(params.ad_pos))

    if (params.ad_type) {
      queryParams.append('ad_type', String(params.ad_type))
    }

    const headers = createAuthHeaders(false)

    try {
      const fullUrl = `${BASE_URL}/index.php/ajax/ads.html?${queryParams.toString()}`
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
      })

      const responseText = await response.text()
      console.log('广告API原始响应:', responseText)

      if (!response.ok) {
        console.error(`获取广告数据失败: ${response.status}`, responseText)
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${responseText}`)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error('广告API返回的JSON解析失败:', e)
        throw new Error('广告API返回的数据格式不正确')
      }

      console.log('获取广告数据结果:', result)

      if (result.list) {
        result = {
          code: 1,
          data: result.list,
        }
      }

      cache.set(result)
      return result
    } catch (error) {
      console.error('获取广告数据请求错误:', error)
      throw error
    }
  })()

  cache.setInflight(request)

  try {
    return await request
  } finally {
    cache.setInflight(null)
  }
}

// 获取标签列表
export const fetchTags = async () => {
  console.log('获取标签列表')

  // 获取包含时间戳的请求头（标签列表不强制要求登录）
  const headers = createAuthHeaders(false)

  try {
    // 发起GET请求
    const response = await fetch(`${BASE_URL}/index.php/ajax/tags.html`, {
      method: 'GET',
      headers,
    })

    const responseText = await response.text()
    console.log('标签API原始响应:', responseText)

    if (!response.ok) {
      console.error(`获取标签列表失败: ${response.status}`, responseText)
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${responseText}`)
    }

    // 尝试解析JSON
    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('标签API返回的JSON解析失败:', e)
      throw new Error('标签API返回的数据格式不正确')
    }

    console.log('获取标签列表结果:', result)

    // 如果返回的数据中有data字段，则使用data字段的值
    if (result.data) {
      return result
    }

    return result
  } catch (error) {
    console.error('获取标签列表请求错误:', error)
    throw error
  }
}

export const fetchGameRecord = async (params: { p?: number } = {}) => {
  if (!checkLoginRequired()) {
    throw new Error('请先登录')
  }

  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 兼容游客用户和正式用户的数据结构
  const userId = userInfo.user_id || userInfo.id
  const token = userInfo.token

  if (!userId || !token) {
    throw new Error('用户信息不完整')
  }

  console.log('正在获取游戏记录...')

  // 构建请求参数
  const queryParams = new URLSearchParams({
    service: 'Gameapi.Getrecord',
    lang: 'zh_cn',
    uid: String(userId),
    token: token,
    p: String(params.p || 1),
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  try {
    const response = await fetch(buildNewApiUrl(queryParams), {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    console.log('游戏记录返回:', result)

    if (result && result.ret === 200 && result.data) {
      if (result.data.code === 0) {
        return {
          code: 1,
          data: {
            list: result.data.info.data || [],
            total: parseInt(result.data.info.total || '0'),
          },
          msg: result.data.msg || '获取成功',
        }
      } else {
        return {
          code: 0,
          data: { list: [], total: 0 },
          msg: result.data.msg || '获取失败',
        }
      }
    } else {
      return {
        code: 0,
        data: { list: [], total: 0 },
        msg: result?.msg || '获取失败',
      }
    }
  } catch (error) {
    console.error('获取游戏记录失败:', error)
    throw error
  }
}

export const fetchNotices = async () => {
  console.log('正在获取公告...')

  // 构建请求参数
  const queryParams = new URLSearchParams({
    service: 'home.getNotice',
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  try {
    const response = await fetch(buildNewApiUrl(queryParams), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    console.log('公告返回:', result)

    if (result && result.ret === 200 && result.data) {
      if (result.data.code === 0) {
        return {
          code: 1,
          data: result.data.info || [],
          msg: result.data.msg || '获取成功',
        }
      } else {
        return {
          code: 0,
          data: [],
          msg: result.data.msg || '获取失败',
        }
      }
    } else {
      return {
        code: 0,
        data: [],
        msg: result?.msg || '获取失败',
      }
    }
  } catch (error) {
    console.error('获取公告失败:', error)
    throw error
  }
}
