import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import { withTopLoading } from '../core/loading'
import { typesListCache } from '../core/cache'
import {
  createAuthHeaders,
  getUserInfo,
  checkLoginRequired,
  checkApiAuthError,
  handleAuthError,
} from '../core/auth-session'
import type { VideoParams, SearchParams } from '../types'

export const fetchVideoDetail = async (
  vodId: string | number,
  options?: { loading?: boolean },
) => {
  return withTopLoading(async () => {
    if (!vodId) {
      throw new Error('视频ID不能为空')
    }

    console.log(`正在获取视频详情，ID: ${vodId}`)

    // 获取用户信息（游客用户也可以获取视频详情）
    const userInfo = getUserInfo()

    // 构建请求URL，如果有用户信息则添加用户参数
    let requestUrl = `${BASE_URL}/index.php/ajax/details.html?vod_id=${vodId}`

    if (userInfo) {
      // 兼容游客用户和正式用户的数据结构
      const userId = userInfo.user_id || userInfo.id
      const token = userInfo.token

      if (userId && token) {
        requestUrl += `&uid=${userId}&token=${token}`
      }
    }

    // 获取包含时间戳的请求头
    const headers = createAuthHeaders(false)

    // 发起GET请求
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    return await response.json()
  }, options?.loading ?? true)
}

export const fetchTypesList = async () => {
  const cached = typesListCache.getIfValid()
  if (cached) {
    console.log('使用栏目列表缓存')
    return cached
  }

  const inflight = typesListCache.getInflight()
  if (inflight) {
    return inflight
  }

  const request = (async () => {
    console.log('正在获取栏目列表...')

    const headers = createAuthHeaders(false)
    const response = await fetch(`${BASE_URL}/index.php/ajax/types.html`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    typesListCache.set(result)
    return result
  })()

  typesListCache.setInflight(request)

  try {
    return await request
  } finally {
    typesListCache.setInflight(null)
  }
}

export const fetchRecommendVideos = async (params: VideoParams = {}) => {
  // 默认参数
  const defaultParams: VideoParams = {
    mid: 1, // 默认影片类型 1
    limit: DEFAULT_PAGE_SIZE, // 默认每页条数
    page: 1, // 默认第1页
    tid: VIDEO_CATEGORIES.ALL, // 默认分类id
  }

  // 合并参数
  const mergedParams = { ...defaultParams, ...params }

  // 创建 FormData 对象
  const formData = new FormData()
  for (const key in mergedParams) {
    formData.append(key, String(mergedParams[key]))
  }

  console.log(`正在通过原生fetch请求代理... 页码: ${mergedParams.page}`)

  // 获取包含时间戳的请求头（推荐视频不强制要求登录）
  const headers = createAuthHeaders(false)

  // 发起POST请求 - 使用本地代理而不是直接请求外部URL
  const response = await fetch(`${BASE_URL}/index.php/ajax/data.html`, {
    method: 'POST',
    body: formData,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  return await response.json()
}

export const fetchSearchVideos = async (params: SearchParams = {}) => {
  // 默认参数
  const defaultParams: SearchParams = {
    mid: 1, // 默认搜索影片
    limit: DEFAULT_PAGE_SIZE, // 默认每页条数
    wd: '', // 搜索关键词
  }

  // 合并参数
  const mergedParams = { ...defaultParams, ...params }

  // 验证必须的搜索词
  if (!mergedParams.wd) {
    throw new Error('搜索关键词不能为空')
  }

  // 创建 FormData 对象
  const formData = new FormData()
  for (const key in mergedParams) {
    formData.append(key, String(mergedParams[key]))
  }

  console.log(`正在搜索: ${mergedParams.wd}`)

  // 获取包含时间戳的请求头（搜索不强制要求登录）
  const headers = createAuthHeaders(false)

  // 发起POST请求
  const response = await fetch(`${BASE_URL}/index.php/ajax/suggest`, {
    method: 'POST',
    body: formData,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  return await response.json()
}

export const fetchDetailRecommend = async (params: { [key: string]: any } = {}) => {
  console.log('正在获取详情页推荐视频...')

  // 构建查询参数
  const queryParams = new URLSearchParams()
  for (const key in params) {
    queryParams.append(key, String(params[key]))
  }

  // 构建URL
  const url = `${BASE_URL}/index.php/ajax/recommend.html${queryParams.toString() ? '?' + queryParams.toString() : ''}`

  // 获取包含时间戳的请求头
  const headers = createAuthHeaders()

  // 发起GET请求
  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  return await response.json()
}

export const updateVideoHits = async (params: {
  mid: number | string
  id: number | string
  type?: string
}) => {
  if (!params.mid) {
    throw new Error('模型ID(mid)不能为空')
  }

  if (!params.id) {
    throw new Error('视频ID(id)不能为空')
  }

  console.log(`正在更新视频播放次数，ID: ${params.id}`)

  // 创建 FormData 对象
  const formData = new FormData()
  formData.append('mid', String(params.mid))
  formData.append('id', String(params.id))

  // 如果有type参数，添加到请求中
  if (params.type) {
    formData.append('type', params.type)
  } else {
    formData.append('type', 'update') // 默认为update
  }

  // 获取包含token和时间戳的请求头
  const headers = createAuthHeaders()

  // 发起POST请求
  const response = await fetch(`${BASE_URL}/index.php/ajax/hits.html`, {
    method: 'POST',
    body: formData,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  return await response.json()
}

/**
 * 视频点赞功能
 * @param params 必需参数：mid(模型ID)、id(视频ID)和type(固定为up)
 * @returns 点赞结果
 */
export const updateVideoDigg = async (params: {
  mid: number | string
  id: number | string
  type: string
}) => {
  if (!params.mid) {
    throw new Error('模型ID(mid)不能为空')
  }

  if (!params.id) {
    throw new Error('视频ID(id)不能为空')
  }

  if (!params.type) {
    throw new Error('操作类型(type)不能为空')
  }

  console.log(`正在更新视频点赞状态，ID: ${params.id}, 操作: ${params.type}`)

  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再进行点赞操作')
  }

  // 创建 FormData 对象
  const formData = new FormData()
  formData.append('mid', String(params.mid))
  formData.append('id', String(params.id))
  formData.append('type', params.type) // 通常是 'up'

  // 获取包含token和时间戳的请求头（强制要求认证）
  const headers = createAuthHeaders(true)

  // 发起POST请求
  const response = await fetch(`${BASE_URL}/index.php/ajax/digg.html`, {
    method: 'POST',
    body: formData,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  
  // 检查是否是认证错误
  if (checkApiAuthError(result)) {
    handleAuthError('登录已过期，请重新登录后再进行点赞')
    throw new Error('认证失败，请重新登录')
  }
  
  return result
}

/**
 * 用户记录接口 - 用于记录播放历史、收藏等
 * @param params 必需参数：mid(模型ID)、id(内容ID)、type(操作类型)、ac(动作类型set/del)
 * @returns 接口返回结果
 */
export const updateUserLog = async (params: {
  mid: number | string
  id: number | string
  type: number | string
  ac: string
}) => {
  if (!params.mid) {
    throw new Error('模型ID(mid)不能为空')
  }

  if (!params.id) {
    throw new Error('内容ID(id)不能为空')
  }

  if (!params.type) {
    throw new Error('操作类型(type)不能为空')
  }

  if (!params.ac) {
    throw new Error('动作类型(ac)不能为空')
  }

  console.log(`正在更新用户记录，ID: ${params.id}, 操作: ${params.type}, 动作: ${params.ac}`)

  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再进行收藏或播放记录操作')
  }

  // 获取用户信息
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.token) {
    throw new Error('用户信息不完整，请重新登录')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在，请重新登录')
  }

  // 创建 FormData 对象
  const formData = new FormData()
  formData.append('uid', String(uid))
  formData.append('token', userInfo.token)
  formData.append('mid', String(params.mid))
  formData.append('id', String(params.id))
  formData.append('type', String(params.type))
  formData.append('ac', params.ac) // set 或 del

  // 获取认证请求头（强制要求认证）
  const headers = createAuthHeaders(true)

  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/user/ulog`, {
    method: 'POST',
    body: formData,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  
  // 检查是否是认证错误
  if (checkApiAuthError(result)) {
    handleAuthError('登录已过期，请重新登录后再进行操作')
    throw new Error('认证失败，请重新登录')
  }
  
  return result
}

/**
 * 获取用户记录列表
 * @param params type: 1=浏览、2=收藏、3=想看、4=播放、5=下载
 */
export const fetchUserLogList = async (params: { type: number | string }) => {
  if (!params.type) {
    throw new Error('记录类型(type)不能为空')
  }

  console.log(`正在获取用户记录列表，类型: ${params.type}`)

  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再查看个人记录')
  }

  // 创建 FormData 对象
  const formData = new FormData()
  formData.append('type', String(params.type))
  formData.append('ac', 'list') // 添加必要参数，ac=list表示获取列表
  formData.append('mid', '1') // 添加必要参数，ac=list表示获取列表

  // 获取认证请求头（强制要求认证）
  const headers = createAuthHeaders(true)

  // 发起POST请求
  const response = await fetch(`${API_PREFIX}/index.php/user/ulog`, {
    method: 'POST',
    body: formData,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  
  // 检查是否是认证错误
  if (checkApiAuthError(result)) {
    handleAuthError('登录已过期，请重新登录')
    throw new Error('认证失败，请重新登录')
  }
  
  return result
}
