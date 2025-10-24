// 使用原生 fetch API 实现的请求方法
import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
} from '@/utils/config'
import { showTopLoading, hideTopLoading } from '@/utils/topLoading'

// 定义参数接口
interface VideoParams {
  mid?: number | string
  limit?: number | string
  page?: number | string
  tid?: number | string
  [key: string]: string | number | undefined
}

// 定义搜索参数接口
interface SearchParams {
  mid?: number | string // 模型mid，如1影片、2文章等
  wd?: string // 关键词
  limit?: number | string // 获取数量
  page?: number | string // 页码
  [key: string]: any // 允许其他属性
}

// 定义注册参数接口
interface RegisterParams {
  country_code: number // 固定为86
  user_login: string // 用户名
  user_pass: string // 密码
  user_pass2: string // 确认密码
  rec_code?: string // 推荐码（可选）
  [key: string]: string | number | undefined // 添加索引签名
}

// 类型数据接口
export interface TypeItem {
  type_id: number
  type_name: string
}

// 视频详情数据接口
export interface VideoDetail {
  vod_id: number
  vod_name: string
  vod_pic: string
  vod_pic_thumb?: string
  vod_class?: string
  vod_duration?: string
  vod_time?: string
  vod_time_add?: string
  vod_play_url?: string
  vod_pubdate?: string
  vod_copyright?: string | number
  vod_points_play?: number | string // 观看所需积分
  vod_actors?: string
  vod_director?: string
  vod_remarks?: string
  vod_content?: string
  [key: string]: any
}

// 定义标签接口返回的数据类型
export interface TagItem {
  tag_id: number
  tag_name: string
  tag_img?: string
}

/**
 * API请求包装器，自动处理顶部loading效果
 * @param apiFunction 要执行的API函数
 * @param showLoading 是否显示loading效果，默认为true
 */
const withTopLoading = async <T>(
  apiFunction: () => Promise<T>,
  showLoading: boolean = true,
): Promise<T> => {
  if (showLoading) {
    showTopLoading()
  }

  try {
    const result = await apiFunction()
    return result
  } finally {
    if (showLoading) {
      hideTopLoading()
    }
  }
}

/**
 * 获取视频详情
 * @param vodId 视频ID
 */
export const fetchVideoDetail = async (vodId: string | number) => {
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
  })
}

/**
 * 获取栏目列表
 */
export const fetchTypesList = async () => {
  console.log('正在获取栏目列表...')

  // 获取包含时间戳的请求头（栏目列表不强制要求登录）
  const headers = createAuthHeaders(false)

  // 发起GET请求
  const response = await fetch(`${BASE_URL}/index.php/ajax/types.html`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  return await response.json()
}

/**
 * 原生fetch方法获取推荐视频
 */
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

// 搜索接口方法（使用原生fetch）
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

/**
 * 用户注册接口
 */
export const registerUser = async (params: RegisterParams) => {
  // 构建表单数据
  const formData = new URLSearchParams()
  formData.append('service', 'login.userReg')
  formData.append('country_code', String(params.country_code))
  formData.append('user_login', params.user_login)
  formData.append('user_pass', params.user_pass)
  formData.append('user_pass2', params.user_pass2)

  // 如果有推荐码，添加到表单数据
  if (params.rec_code) {
    formData.append('rec_code', params.rec_code)
  }

  console.log('正在发送注册表单请求到:', NEW_API_BASE_URL, '数据:', formData.toString())

  // 获取基础请求头，设置为表单格式
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  // 发起POST请求到新的接口地址，使用表单数据
  const response = await fetch(NEW_API_BASE_URL, {
    method: 'POST',
    body: formData.toString(),
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('注册接口原始返回:', result)

  // 新接口格式: { ret: 200, data: { code: 0, msg: "操作成功", info: [1] } }
  // 转换为原有格式: { code: 1, data: {...}, msg: "" }
  let adaptedResult

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    // 注册成功
    adaptedResult = {
      code: 1,
      data: result.data.info, // 返回 [1] 表示成功
      msg: result.data.msg || '注册成功',
    }
  } else {
    // 注册失败
    adaptedResult = {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '注册失败，请重试',
    }
  }

  return adaptedResult
}

/**
 * 获取详情页的推荐视频
 * @param params 可选参数对象
 */
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

/**
 * 更新视频播放次数
 * @param params 必需参数：mid(模型ID)和id(视频ID)，可选参数：type(默认为update)
 */
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

  return await response.json()
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

  // 创建 FormData 对象
  const formData = new FormData()
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

  return await response.json()
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

  return await response.json()
}

// 用户信息存储管理
export interface UserInfo {
  user_id: number
  user_name: string
  token: string
  user_portrait?: string
  user_points?: number
  coin?: number // 钻石余额
  group_id?: number
  group_name?: string
  user_nick_name?: string
  rec_code?: string
  // 🔥 新增：完整的用户信息字段
  sex?: string // 性别：0=保密, 1=男, 2=女
  birthday?: string // 生日：格式 YYYY-MM-DD
  signature?: string // 个性签名
  province?: string // 省份
  city?: string // 城市
  avatar_thumb?: string // 头像缩略图
  [key: string]: any // 添加索引签名
}

// 本地存储的键名
const TOKEN_KEY = 'user_token'
const USER_INFO_KEY = 'user_info'
const TOKEN_EXPIRE_KEY = 'token_expire_time'

// TOKEN过期时间（12小时，以毫秒为单位）
const TOKEN_EXPIRE_DURATION = 12 * 60 * 60 * 1000 // 12小时

// 设置用户信息到本地存储
export const setUserInfo = (userInfo: UserInfo) => {
  const expireTime = Date.now() + TOKEN_EXPIRE_DURATION

  // 清理重复的用户信息键（如果存在）
  if (localStorage.getItem('userInfo')) {
    console.log('🧹 检测到重复的userInfo键，正在清理...')
    localStorage.removeItem('userInfo')
  }

  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
  localStorage.setItem(TOKEN_KEY, userInfo.token)
  localStorage.setItem(TOKEN_EXPIRE_KEY, expireTime.toString())

  console.log(`TOKEN已保存，将在${new Date(expireTime).toLocaleString()}过期`)
}

// 从本地存储获取用户信息
export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY)
  if (!userInfoStr) return null

  try {
    return JSON.parse(userInfoStr) as UserInfo
  } catch (e) {
    console.error('解析用户信息失败:', e)
    return null
  }
}

// 从本地存储获取token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

// 检查TOKEN是否过期
export const isTokenExpired = (): boolean => {
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY)
  if (!expireTimeStr) {
    return true // 没有过期时间，认为已过期
  }

  const expireTime = parseInt(expireTimeStr)
  const now = Date.now()

  if (now >= expireTime) {
    console.log('TOKEN已过期')
    return true
  }

  return false
}

// 获取TOKEN剩余时间（以分钟为单位）
export const getTokenRemainingTime = (): number => {
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY)
  if (!expireTimeStr) {
    return 0
  }

  const expireTime = parseInt(expireTimeStr)
  const now = Date.now()
  const remainingMs = expireTime - now

  if (remainingMs <= 0) {
    return 0
  }

  return Math.floor(remainingMs / (1000 * 60)) // 转换为分钟
}

// 获取TOKEN过期时间格式化字符串
export const getTokenExpireTimeString = (): string => {
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY)
  if (!expireTimeStr) {
    return '未知'
  }

  const expireTime = parseInt(expireTimeStr)
  return new Date(expireTime).toLocaleString()
}

// 清除用户登录信息和所有缓存
export const clearUserInfo = () => {
  console.log('🗑️ clearUserInfo 被调用，调用堆栈:', new Error().stack)
  localStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRE_KEY)
  localStorage.removeItem('isGuest') // 清除游客标记
  localStorage.removeItem('deviceIMEI') // 清除设备IMEI（可选，保留可以避免重复生成）

  // 清理重复的用户信息键
  localStorage.removeItem('userInfo') // 清除重复的userInfo键
}

// 清除所有本地缓存数据
export const clearAllCache = () => {
  console.log('清除所有本地缓存...')

  // 清除用户信息
  clearUserInfo()

  // 清除首页相关缓存
  localStorage.removeItem('lastActiveTabId')
  localStorage.removeItem('inviteCode')

  // 清除首页弹窗状态
  sessionStorage.removeItem('homePopupShownThisSession')
  sessionStorage.removeItem('pageSessionActive')

  // 清除首页标签状态缓存
  sessionStorage.removeItem('tabStates')

  // 清除其他可能的缓存
  sessionStorage.removeItem('homeScrollPosition')

  console.log('所有缓存已清除')
}

// 检查是否已登录且TOKEN未过期（非强制性检查）
export const isLoggedIn = (): boolean => {
  const token = getToken()
  if (!token) {
    return false
  }

  if (isTokenExpired()) {
    console.log('TOKEN已过期，但不自动清除缓存（允许继续浏览公开内容）')
    return false
  }

  return true
}

// 检查登录状态，如果过期则清除缓存（用于需要强制登录的场景）
export const checkLoginRequired = (): boolean => {
  const token = getToken()
  if (!token) {
    console.log('用户未登录，需要登录')
    return false
  }

  if (isTokenExpired()) {
    console.log('TOKEN已过期，清除缓存并要求重新登录')
    clearAllCache()
    return false
  }

  return true
}

// 强制用户重新登录
export const forceLogin = () => {
  console.log('TOKEN已过期，强制重新登录')

  // 获取当前路径
  const currentPath = window.location.hash.replace('#', '')

  // 如果当前已经在登录页面或者注册页面，则只清除缓存，不跳转
  if (
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath.startsWith('/login') ||
    currentPath.startsWith('/register')
  ) {
    console.log('当前在登录/注册页面，只清除缓存')
    clearAllCache()
    return
  }

  // 清除所有缓存
  clearAllCache()

  // 跳转到登录页面
  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`

  // 使用原生跳转到登录页面
  window.location.href = `${window.location.origin}${window.location.pathname}#${loginUrl}`
}

// 友好地提示用户登录（不强制跳转）
export const promptLogin = (message: string = '此操作需要登录') => {
  console.log('提示用户登录:', message)

  if (typeof window !== 'undefined') {
    const shouldLogin = confirm(`${message}，是否前往登录页面？`)
    if (shouldLogin) {
      // 保存当前页面路径，登录后可以返回
      const currentPath = window.location.hash || '#/'
      localStorage.setItem('redirect_after_login', currentPath)

      window.location.hash = '#/login'
      return true
    }
  }

  return false
}

// 创建带有认证信息的请求头
export const createAuthHeaders = (requireAuth: boolean = false): HeadersInit => {
  const token = getToken()
  const reqTime = Date.now().toString() // 13位毫秒时间戳

  const headers: HeadersInit = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    reqTime: reqTime, // 所有请求都包含时间戳
  }

  // 如果有token且没有过期，添加到请求头
  if (token && !isTokenExpired()) {
    headers['token'] = token
  } else if (requireAuth) {
    // 只有在明确需要认证的请求中才处理TOKEN过期
    console.log('需要认证的请求检测到TOKEN无效')
    if (isTokenExpired()) {
      console.log('TOKEN已过期，建议用户重新登录')
      // 可以在这里触发登录提示，但不强制跳转
    }
  }

  return headers
}

/**
 * 用户登录接口
 * @param params 必需参数：user_name(用户名)、user_pwd(密码)
 * @returns 登录结果
 */
export const userLogin = async (params: {
  user_name: string
  user_pwd: string
  country_code?: number
}) => {
  if (!params.user_name) {
    throw new Error('用户名不能为空')
  }

  if (!params.user_pwd) {
    throw new Error('密码不能为空')
  }

  console.log('正在登录...')

  // 构建表单数据
  const formData = new URLSearchParams()
  formData.append('service', 'login.userLogin')
  formData.append('user_login', params.user_name)
  formData.append('user_pass', params.user_pwd)
  formData.append('country_code', String(params.country_code || 86))

  console.log('正在发送登录表单请求到:', NEW_API_BASE_URL, '数据:', formData.toString())

  // 获取基础请求头，设置为表单格式
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  // 发起POST请求到新接口，使用表单数据
  const response = await fetch(NEW_API_BASE_URL, {
    method: 'POST',
    body: formData.toString(),
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()

  // 适配新接口的返回格式
  // 新接口格式: { ret: 200, data: { code: 0, msg: "", info: {...} } }
  // 转换为原有格式: { code: 1, data: {...}, msg: "" }
  let adaptedResult

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    // 登录成功，转换数据格式，保存所有用户信息
    const userInfo: UserInfo = {
      user_id: parseInt(result.data.info.id),
      user_name: params.user_name, // 使用登录时的用户名
      token: result.data.info.token,
      user_portrait: result.data.info.avatar,
      user_points: parseInt(result.data.info.score || '0'),
      coin: parseInt(result.data.info.coin || '0'), // 钻石余额
      group_id: parseInt(result.data.info.level || '1'),
      group_name: `等级${result.data.info.level || '1'}`,
      user_nick_name: result.data.info.user_nicename,
      rec_code: result.data.info.rec_code,
      // 🔥 新增：保存完整的用户信息
      sex: result.data.info.sex || '0',
      birthday: result.data.info.birthday || '',
      signature: result.data.info.signature || '',
      province: result.data.info.province || '',
      city: result.data.info.city || '',
      avatar_thumb: result.data.info.avatar_thumb || '',
    }

    console.log('💾 正在保存完整的用户信息到localStorage:', userInfo)

    // 保存到本地存储
    setUserInfo(userInfo)

    // 转换为原有的返回格式
    adaptedResult = {
      code: 1,
      data: userInfo,
      msg: '登录成功',
    }
  } else {
    // 登录失败，转换错误格式
    adaptedResult = {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '登录失败，请检查用户名和密码',
    }
  }

  return adaptedResult
}

/**
 * 游客登录接口
 * @param imei 设备IMEI号
 * @returns 游客登录结果
 */
export const touristLogin = async (imei: string) => {
  return withTopLoading(async () => {
    if (!imei) {
      throw new Error('IMEI不能为空')
    }

    console.log('正在进行游客登录...')

    // 🔥 service参数在URL中，IMEI参数在表单body中（目标API只支持表单格式）
    const url = `${NEW_API_BASE_URL}?service=Login.TouristLogin`

    // 构建表单数据（目标API不支持JSON，必须使用表单格式）
    const formData = new URLSearchParams()
    formData.append('IMEI', imei)

    console.log('正在发送游客登录请求到:', url)
    console.log('表单body数据:', formData.toString())

    // 获取基础请求头，设置为表单格式
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    // 发起POST请求，body为表单格式
    const response = await fetch(url, {
      method: 'POST',
      body: formData.toString(),
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const responseText = await response.text()
    console.log('游客登录API原始响应:', responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('游客登录API返回的JSON解析失败:', e)
      throw new Error('游客登录API返回的数据格式不正确')
    }

    console.log('游客登录结果:', result)

    // 处理游客登录结果
    if (result.ret === 200 && result.data && result.data.info) {
      const apiUserInfo = result.data.info

      // 🔥 统一游客用户字段：将 user_nicename 映射为 user_nick_name
      const userInfo = {
        ...apiUserInfo,
        // 统一昵称字段名（API返回的是user_nicename，统一为user_nick_name）
        user_nick_name: apiUserInfo.user_nicename || apiUserInfo.user_nick_name || '',
        user_id: parseInt(apiUserInfo.id) || 0,
        user_name: apiUserInfo.user_nicename || apiUserInfo.id || '',
        user_portrait: apiUserInfo.avatar || apiUserInfo.avatar_thumb || '',
        token: apiUserInfo.token,
        sex: apiUserInfo.sex || '0',
        birthday: apiUserInfo.birthday || '',
        signature: apiUserInfo.signature || '',
        province: apiUserInfo.province || '',
        city: apiUserInfo.city || '',
        avatar: apiUserInfo.avatar || '',
        avatar_thumb: apiUserInfo.avatar_thumb || '',
        user_points: parseInt(apiUserInfo.score || '0'),
        coin: parseFloat(apiUserInfo.coin || '0'),
        rec_code: apiUserInfo.rec_code || '',
      }

      console.log('📋 游客登录API返回:', {
        原始昵称字段: apiUserInfo.user_nicename,
        统一后昵称字段: userInfo.user_nick_name,
      })

      // 保存游客用户信息到本地存储，包括过期时间
      const expireTime = Date.now() + TOKEN_EXPIRE_DURATION
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
      localStorage.setItem(TOKEN_KEY, userInfo.token)
      localStorage.setItem(TOKEN_EXPIRE_KEY, expireTime.toString())
      localStorage.setItem('isGuest', 'true') // 标记为游客用户

      console.log('💾 游客登录成功，已保存统一格式的用户信息到localStorage')
      console.log('⏰ Token过期时间:', new Date(expireTime).toLocaleString())

      return {
        code: 1,
        data: userInfo,
        msg: '游客登录成功',
      }
    } else {
      // 游客登录失败
      return {
        code: 0,
        data: null,
        msg: result?.msg || '游客登录失败',
      }
    }
  })
}

/**
 * 用户退出登录
 */
export const userLogout = async () => {
  try {
    console.log('正在退出登录...')

    // 获取当前用户信息
    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.token) {
      console.log('没有用户信息，直接清除缓存')
      clearAllCache()
      return true
    }

    // 兼容游客用户和正式用户的数据结构
    const uid = userInfo.user_id || userInfo.id
    if (!uid) {
      console.log('用户ID不存在，直接清除缓存')
      clearAllCache()
      return true
    }

    // 构建表单数据
    const formData = new URLSearchParams()
    formData.append('service', 'login.logout')
    formData.append('uid', String(uid))
    formData.append('token', userInfo.token)

    console.log('正在发送退出登录表单请求到:', NEW_API_BASE_URL, '数据:', formData.toString())

    // 发起退出登录请求
    const response = await fetch(NEW_API_BASE_URL, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`退出登录请求失败: ${response.status}`, errorText)
    } else {
      const result = await response.json()
      console.log('退出登录结果:', result)

      // 检查退出登录结果
      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0) {
          console.log('退出登录成功:', result.data.msg || '操作成功')
        } else if (result.data.code === 700) {
          console.log('登录状态已失效，直接清除本地缓存:', result.data.msg)
        } else {
          console.warn('退出登录接口返回异常:', result)
        }
      } else {
        console.warn('退出登录接口返回格式异常:', result)
      }
    }

    // 无论接口是否成功，都清除所有缓存
    clearAllCache()
    console.log('用户已退出登录，所有缓存已清除')

    return true
  } catch (error) {
    console.error('退出登录请求错误:', error)
    // 发生错误时也清除所有缓存
    clearAllCache()
    return false
  }
}

/**
 * 获取用户基本信息接口
 * @param params 包含uid和token的参数
 * @returns 用户信息
 */
export const fetchUserBaseInfo = async (params: { uid: number; token: string }) => {
  if (!params.uid) {
    throw new Error('用户ID不能为空')
  }

  if (!params.token) {
    throw new Error('用户token不能为空')
  }

  console.log('正在获取用户基本信息...')

  // 创建查询参数对象
  const queryParams = new URLSearchParams()
  queryParams.append('service', 'user.getBaseInfo')
  queryParams.append('uid', params.uid.toString())
  queryParams.append('token', params.token)

  // 获取基础请求头
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  // 发起POST请求到新接口
  const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取用户基本信息结果:', result)

  return result
}

/**
 * 修改用户头像接口
 * @param params 头像参数，支持file文件对象或imgdata base64编码
 * @returns 接口返回结果
 */
export const updateUserPortrait = async (params: { file?: File; imgdata?: string }) => {
  if (!params.file && !params.imgdata) {
    throw new Error('文件对象或base64编码数据不能为空')
  }

  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再修改头像')
  }

  console.log('正在更新用户头像...')

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

  // 创建查询参数对象 - 基础参数放在URL中
  const queryParams = new URLSearchParams()
  queryParams.append('service', 'user.updateAvatar')
  queryParams.append('uid', uid.toString())
  queryParams.append('token', userInfo.token)

  // 创建 FormData 对象用于文件上传
  const formData = new FormData()

  // 添加头像文件参数
  if (params.file) {
    formData.append('file', params.file)
    console.log('使用文件上传模式，参数名: file，文件名:', params.file.name)
  } else if (params.imgdata) {
    formData.append('file', params.imgdata)
    console.log('使用base64上传模式，参数名: file，数据长度:', params.imgdata.length)
  }

  // 获取基础请求头
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    // 注意：不设置Content-Type，让浏览器自动设置带boundary的值
  }

  try {
    // 发起POST请求到新接口 - 基础参数在URL中，文件在FormData中
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'POST',
      body: formData,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`更新用户头像失败: ${response.status}`, errorText)
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    console.log('头像上传响应:', result)

    // 如果更新成功且返回了新的头像路径，更新本地存储的用户信息
    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      // 获取当前用户信息
      const currentUserInfo = getUserInfo()

      if (currentUserInfo) {
        // 更新头像路径
        const updatedUserInfo = {
          ...currentUserInfo,
          user_portrait: result.data.avatar || result.data.info?.avatar,
        }

        // 保存到本地存储
        setUserInfo(updatedUserInfo)
      }

      return {
        code: 1,
        data: { user_portrait: result.data.avatar || result.data.info?.avatar },
        msg: '头像更新成功',
      }
    } else {
      return {
        code: 0,
        data: null,
        msg: result?.data?.msg || result?.msg || '头像更新失败',
      }
    }
  } catch (error) {
    console.error('更新用户头像请求错误:', error)
    throw error
  }
}

/**
 * 修改用户信息接口（包括昵称和密码）
 * @param params 用户信息参数
 * @returns 接口返回结果
 */
export const updateUserInfo = async (params: {
  user_nick_name?: string
  user_login?: string // 🔥 添加游客账号字段
  sex?: string
  birthday?: string
  user_pwd?: string
  user_pwd1?: string
  user_pwd2?: string
  user_qq?: string
  user_email?: string
  user_phone?: string
  [key: string]: string | undefined
}) => {
  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再修改个人信息')
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

  console.log('正在更新用户信息...')

  // 判断是修改个人信息还是修改密码
  const isChangingPassword = params.user_pwd && params.user_pwd1 && params.user_pwd2

  if (isChangingPassword) {
    // 修改密码接口
    const queryParams = new URLSearchParams()
    queryParams.append('service', 'user.updatePass')
    queryParams.append('uid', uid.toString())
    queryParams.append('token', userInfo.token)
    queryParams.append('oldpass', params.user_pwd!)
    queryParams.append('pass', params.user_pwd1!)
    queryParams.append('pass2', params.user_pwd2!)

    // 获取基础请求头
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    try {
      // 发起POST请求到新接口
      const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`修改密码失败: ${response.status}`, errorText)
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('修改密码响应:', result)

      // 转换新接口返回格式为原有格式
      if (result && result.ret === 200 && result.data && result.data.code === 0) {
        return {
          code: 1,
          data: null,
          msg: '密码修改成功',
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.data?.msg || result?.msg || '密码修改失败',
        }
      }
    } catch (error) {
      console.error('修改密码请求错误:', error)
      throw error
    }
  } else {
    // 修改个人信息接口
    const queryParams = new URLSearchParams()
    queryParams.append('service', 'user.updateFields')
    queryParams.append('uid', uid.toString())
    queryParams.append('token', userInfo.token)

    // 🔥 如果本地存储 isGuest 为 true（游客用户），则添加 isyouke=1 参数
    const isGuestUser = localStorage.getItem('isGuest') === 'true'
    if (isGuestUser) {
      queryParams.append('isyouke', '1')
      console.log('🎯 检测到游客用户，添加 isyouke=1 查询参数')
    }

    // 构建fields JSON字符串，包含所有字段
    const fields: any = {
      user_nicename: params.user_nick_name || '',
      avatar: '', // 头像通过单独接口上传
      sex: params.sex || '0',
      signature: '', // 个性签名，暂时为空
      birthday: params.birthday || '',
      location: '', // 位置，暂时为空
      province: '', // 省份，暂时为空
      city: '', // 城市，暂时为空
    }

    // 🔥 如果传入了 user_login 字段（游客账号），则添加到 fields 中
    if (params.user_login !== undefined) {
      fields.user_login = params.user_login
    }

    // 保留旧字段的兼容性
    if (params.user_qq !== undefined) {
      fields.user_qq = params.user_qq
    }
    if (params.user_email !== undefined) {
      fields.user_email = params.user_email
    }
    if (params.user_phone !== undefined) {
      fields.user_phone = params.user_phone
    }

    console.log('🔍 updateUserInfo - fields 对象:', fields)
    queryParams.append('fields', JSON.stringify(fields))

    // 🔍 调试：显示完整的查询参数
    console.log('🔍 updateUserInfo - 完整查询参数:', queryParams.toString())

    // 获取基础请求头
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    try {
      // 发起POST请求到新接口
      const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`更新用户信息失败: ${response.status}`, errorText)
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('更新用户信息响应:', result)

      // 转换新接口返回格式为原有格式
      if (result && result.ret === 200 && result.data && result.data.code === 0) {
        // 如果更新成功，更新本地存储的用户信息
        const currentUserInfo = getUserInfo()
        if (currentUserInfo) {
          // 合并新的用户信息（游客和正式用户已统一使用 user_nick_name）
          const updatedUserInfo = {
            ...currentUserInfo,
            user_nick_name: params.user_nick_name || currentUserInfo.user_nick_name,
            sex: params.sex || currentUserInfo.sex,
            birthday: params.birthday || currentUserInfo.birthday,
            user_qq: params.user_qq || currentUserInfo.user_qq,
            user_email: params.user_email || currentUserInfo.user_email,
            user_phone: params.user_phone || currentUserInfo.user_phone,
          }

          // 🔥 如果是游客用户且传入了 user_login，则更新账号字段
          if (params.user_login !== undefined) {
            updatedUserInfo.user_name = params.user_login
            // 使用类型断言来添加 user_login 字段
            ;(updatedUserInfo as any).user_login = params.user_login
          }

          console.log('💾 更新本地用户信息:', {
            old_user_nick_name: currentUserInfo.user_nick_name,
            new_user_nick_name: updatedUserInfo.user_nick_name,
            old_user_name: currentUserInfo.user_name,
            new_user_name: updatedUserInfo.user_name,
            user_login_updated: params.user_login !== undefined,
          })

          // 保存到本地存储
          setUserInfo(updatedUserInfo)
        }

        return {
          code: 1,
          data: fields,
          msg: '个人信息更新成功',
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.data?.msg || result?.msg || '个人信息更新失败',
        }
      }
    } catch (error) {
      console.error('更新用户信息请求错误:', error)
      throw error
    }
  }
}

/**
 * 获取广告接口
 * @param params 广告位置和类型参数
 * @returns 广告数据
 */
export const fetchAds = async (params: {
  ad_pos: number | string // 位置 1:首页; 3:列表页; 4:详情页/搜索页
  ad_type?: number | string // 广告类型 1:轮播图; 2:单图
}) => {
  if (!params.ad_pos) {
    throw new Error('广告位置(ad_pos)不能为空')
  }

  console.log(`正在获取广告数据，位置: ${params.ad_pos}, 类型: ${params.ad_type || '所有类型'}`)

  // 构建查询参数
  const queryParams = new URLSearchParams()
  queryParams.append('ad_pos', String(params.ad_pos))

  if (params.ad_type) {
    queryParams.append('ad_type', String(params.ad_type))
  }

  // 获取包含时间戳的请求头（广告不强制要求登录）
  const headers = createAuthHeaders(false)

  try {
    // 构建完整的URL
    const fullUrl = `${BASE_URL}/index.php/ajax/ads.html?${queryParams.toString()}`

    // 发起GET请求
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

    // 尝试解析JSON
    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('广告API返回的JSON解析失败:', e)
      throw new Error('广告API返回的数据格式不正确')
    }

    console.log('获取广告数据结果:', result)

    // 处理不同的返回格式
    if (result.list) {
      // 如果API直接返回列表格式
      return {
        code: 1,
        data: result.list,
      }
    }

    return result
  } catch (error) {
    console.error('获取广告数据请求错误:', error)
    throw error
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

/**
 * 获取支付渠道列表
 * @returns 支付渠道数据
 */
export const fetchPayChannels = async () => {
  // 直接GET请求
  const response = await fetch(`${NEW_API_BASE_URL}/?service=charge.getqudao`, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }
  return await response.json()
}

/**
 * 获取充值规则
 * @param qudaoid 支付渠道ID (2:虚拟币; 3:银行卡; 4:微信; 5:支付宝)
 * @returns 充值规则数据
 */
export const fetchChargeRules = async (qudaoid: number) => {
  try {
    // 获取用户信息
    const userInfo = getUserInfo()
    const uid = userInfo?.user_id || 0
    const token = userInfo?.token || ''

    // 创建 FormData 对象
    const formData = new FormData()
    formData.append('uid', uid.toString())
    formData.append('token', token)
    formData.append('qudaoid', qudaoid.toString())

    const response = await fetch(`${NEW_API_BASE_URL}/?service=charge.getcharge_rules`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    console.log('充值规则响应:', result)
    return result
  } catch (error) {
    console.error('获取充值规则失败:', error)
    throw error
  }
}

/**
 * 创建充值订单
 * @param params 充值订单参数
 * @returns 充值订单数据，包含支付链接
 */
export const createChargeOrder = async (params: {
  qudaoid: number // 支付渠道ID
  money: string // 金额
  paytypecode: string // 支付通道代码
  moneylistid: number // 充值规则中的moneylist的id
}) => {
  try {
    // 获取用户信息
    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.token) {
      throw new Error('用户未登录，请先登录')
    }

    // 兼容游客用户和正式用户的数据结构
    const uid = userInfo.user_id || userInfo.id
    const token = userInfo.token

    if (!uid) {
      throw new Error('用户ID不存在，请重新登录')
    }

    console.log('创建充值订单参数:', { uid, token, ...params })

    // 创建 FormData 对象
    const formData = new FormData()
    formData.append('uid', uid.toString())
    formData.append('token', token)
    formData.append('qudaoid', params.qudaoid.toString())
    formData.append('money', params.money)
    formData.append('paytypecode', params.paytypecode)
    formData.append('moneylistid', params.moneylistid.toString())

    const response = await fetch(`${NEW_API_BASE_URL}/?service=charge.getchargeorders`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    console.log('创建充值订单响应:', result)
    return result
  } catch (error) {
    console.error('创建充值订单失败:', error)
    throw error
  }
}

// 获取积分明细
export const fetchPointsDetails = async (params: {
  limit?: number | string
  page?: number | string
}) => {
  console.log('获取积分明细')

  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再查看积分明细')
  }

  // 获取包含时间戳的请求头（强制要求认证）
  const headers = createAuthHeaders(true)

  // 默认参数
  const defaultParams = {
    limit: 20,
    page: 1,
    ...params,
  }

  // 构建查询字符串
  const queryParams = new URLSearchParams()
  Object.entries(defaultParams).forEach(([key, value]) => {
    queryParams.append(key, String(value))
  })

  try {
    // 发起GET请求
    const response = await fetch(
      `${API_PREFIX}/index.php/user/points.html?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取积分明细请求错误:', error)
    throw error
  }
}

// 获取用户观看数据
export const fetchUserDatas = async (params: { vod_id?: number | string } = {}) => {
  console.log('获取用户观看数据')

  // 获取用户信息（游客用户也可以查看观看数据）
  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 获取包含时间戳的请求头（不强制要求认证）
  const headers = createAuthHeaders(false)

  try {
    if (params.vod_id) {
      // 有vod_id时，使用POST+form-data
      const formData = new FormData()
      formData.append('vod_id', String(params.vod_id))
      const response = await fetch(`${API_PREFIX}/index.php/user/datas.html`, {
        method: 'POST',
        body: formData,
        headers,
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }
      const responseText = await response.text()
      try {
        return JSON.parse(responseText)
      } catch (e) {
        if (responseText.trim() === 'success') {
          return { code: 1, msg: 'success' }
        }
        throw new Error('API返回的数据格式不正确: ' + responseText)
      }
    } else {
      // 没有vod_id时，使用GET请求
      const response = await fetch(`${API_PREFIX}/index.php/user/datas.html`, {
        method: 'GET',
        headers,
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }
      const responseText = await response.text()
      try {
        return JSON.parse(responseText)
      } catch (e) {
        if (responseText.trim() === 'success') {
          return { code: 1, msg: 'success' }
        }
        throw new Error('API返回的数据格式不正确: ' + responseText)
      }
    }
  } catch (error) {
    console.error('获取用户观看数据请求错误:', error)
    throw error
  }
}

// ========== 提现相关接口 ==========

/**
 * 获取提现账户类型
 */
export const fetchWithdrawTypes = async () => {
  const queryParams = new URLSearchParams({
    service: 'home.getTixianType',
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取提现账户类型返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: result.data.info,
      msg: result.data.msg || '获取成功',
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '获取失败',
    }
  }
}

/**
 * 获取用户收益信息
 */
export const fetchUserProfit = async () => {
  if (!checkLoginRequired()) {
    throw new Error('请先登录')
  }

  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在')
  }

  const queryParams = new URLSearchParams({
    service: 'user.getProfit',
    uid: String(uid),
    token: userInfo.token,
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取用户收益返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: result.data.info[0] || {},
      msg: result.data.msg || '获取成功',
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '获取失败',
    }
  }
}

/**
 * 获取用户提现账号列表
 */
export const fetchUserAccountList = async () => {
  if (!checkLoginRequired()) {
    throw new Error('请先登录')
  }

  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在')
  }

  const queryParams = new URLSearchParams({
    service: 'user.getUserAccountList',
    uid: String(uid),
    token: userInfo.token,
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取提现账号列表返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: result.data.info || [],
      msg: result.data.msg || '获取成功',
    }
  } else {
    return {
      code: 0,
      data: [],
      msg: result?.data?.msg || result?.msg || '获取失败',
    }
  }
}

/**
 * 添加提现账号
 */
export const addUserAccount = async (params: {
  type: number
  account_bank: string
  account: string
  name: string
}) => {
  if (!checkLoginRequired()) {
    throw new Error('请先登录')
  }

  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在')
  }

  const queryParams = new URLSearchParams({
    service: 'user.setUserAccount',
    uid: String(uid),
    token: userInfo.token,
    type: String(params.type),
    account_bank: params.account_bank,
    account: params.account,
    name: params.name,
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('添加提现账号返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: result.data.info[0] || {},
      msg: result.data.msg || '添加成功',
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '添加失败',
    }
  }
}

/**
 * 删除提现账号
 */
export const deleteUserAccount = async (accountId: number) => {
  if (!checkLoginRequired()) {
    throw new Error('请先登录')
  }

  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在')
  }

  const queryParams = new URLSearchParams({
    service: 'user.delUserAccount',
    uid: String(uid),
    token: userInfo.token,
    id: String(accountId),
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('删除提现账号返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: null,
      msg: result.data.msg || '删除成功',
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '删除失败',
    }
  }
}

/**
 * 用户提现
 */
export const submitWithdraw = async (params: { accountid: number; cashvote: number }) => {
  if (!checkLoginRequired()) {
    throw new Error('请先登录')
  }

  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在')
  }

  const queryParams = new URLSearchParams({
    service: 'user.setCash',
    uid: String(uid),
    token: userInfo.token,
    accountid: String(params.accountid),
    cashvote: String(params.cashvote),
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('提现申请返回:', result)

  if (result && result.ret === 200 && result.data) {
    if (result.data.code === 0) {
      return {
        code: 1,
        data: result.data.info || {},
        msg: result.data.msg || '提现申请成功',
      }
    } else {
      return {
        code: 0,
        data: null,
        msg: result.data.msg || '提现申请失败',
      }
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.msg || '提现申请失败',
    }
  }
}

// ========== 游戏记录相关接口 ==========

/**
 * 游戏记录数据接口
 */
export interface GameRecord {
  aioid: string
  ref_no: string
  gameid: string
  start_time: string
  payout: string
  p_win: string
  status: string
  game_name: string
}

/**
 * 获取游戏记录列表
 * @param params 分页参数
 * @returns 游戏记录数据
 */
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
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
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

// ========== 公告相关接口 ==========

/**
 * 公告数据接口
 */
export interface Notice {
  id: string
  title: string
  content: string
  status: string
  type: string
  createtime: string
  updatetime: string | null
}

export interface NoticeGroup {
  id: number
  name: string
  list: Notice[]
}

/**
 * 获取公告列表
 * @returns 公告数据
 */
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
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
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

// ========== 账目明细相关接口 ==========

/**
 * 账目明细数据接口
 */
export interface AccountDetail {
  id: string
  type: string
  action: string
  uid: string
  totalcoin: string
}

/**
 * 获取账目明细列表
 * @returns 账目明细数据
 */
export const fetchAccountDetails = async () => {
  if (!checkLoginRequired()) {
    throw new Error('请先登录')
  }

  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在')
  }

  console.log('正在获取账目明细...')

  // 构建请求参数
  const queryParams = new URLSearchParams({
    service: 'user.details',
  })

  const formData = new URLSearchParams({
    uid: String(uid),
    token: userInfo.token,
  })

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  try {
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'POST',
      headers,
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    console.log('账目明细返回:', result)

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
    console.error('获取账目明细失败:', error)
    throw error
  }
}

// 关注列表相关接口和类型
export interface FollowItem {
  uid: string
  touid: string
  isattent: string // "0"表示未关注，"1"表示已关注
  user_name?: string
  user_portrait?: string
  user_nick_name?: string
}

export interface FollowListResponse {
  code: number
  info: FollowItem[]
  msg: string
}

// 获取关注列表
export const fetchFollowsList = async (params: {
  uid: string
  touid: string
  p?: number
  lang?: string
}): Promise<FollowListResponse> => {
  try {
    console.log('获取关注列表参数:', params)

    const formData = new URLSearchParams()
    formData.append('service', 'User.getFollowsList')
    formData.append('uid', params.uid)
    formData.append('touid', params.touid)
    formData.append('p', (params.p || 1).toString())
    if (params.lang) {
      formData.append('lang', params.lang)
    }

    const response = await fetch(NEW_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('关注列表API返回:', result)

    if (result && result.ret === 200 && result.data) {
      return {
        code: result.data.code || 1,
        info: result.data.info || [],
        msg: result.data.msg || '获取成功',
      }
    } else {
      return {
        code: 0,
        info: [],
        msg: result?.msg || '获取失败',
      }
    }
  } catch (error) {
    console.error('获取关注列表失败:', error)
    throw error
  }
}

/**
 * 获取用户积分信息
 * @returns 用户积分信息
 */
export const fetchUserPoints = async () => {
  return withTopLoading(async () => {
    // 获取用户信息
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

    console.log('正在获取用户积分信息...')

    // 🔧 完全模仿Gameapi.Getrecord的成功模式：POST请求，所有参数在URL中，body为空
    const queryParams = new URLSearchParams()
    queryParams.append('service', 'User.GetPoints')
    queryParams.append('uid', String(userId))
    queryParams.append('token', token)
    queryParams.append('lang', 'zh_cn')

    // 构建完整URL，模仿: /proxy.php?target=user/?service=User.GetPoints&uid=xxx&token=xxx&lang=zh_cn
    const separator = NEW_API_BASE_URL.includes('?') ? '&' : '?'
    const requestUrl = `${NEW_API_BASE_URL}${separator}${queryParams.toString()}`

    const headers = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    console.log('📝 获取积分请求 (模仿Gameapi.Getrecord):', {
      url: requestUrl,
      method: 'POST',
      contentLength: 0,
    })

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        // 不设置body，保持Content-Length: 0，完全模仿Gameapi.Getrecord
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('获取积分信息返回:', result)

      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0) {
          return {
            code: 1,
            data: {
              points: result.data.info.points,
              video_nums: result.data.info.video_nums,
              is_vip: result.data.info.is_vip,
              endtime: result.data.info.endtime,
            },
            msg: result.data.msg || '获取成功',
          }
        } else {
          return {
            code: 0,
            data: null,
            msg: result.data.msg || '获取失败',
          }
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.msg || '获取失败',
        }
      }
    } catch (error) {
      console.error('获取积分信息失败:', error)
      throw error
    }
  })
}

/**
 * 获取视频充值记录
 * @param params page: 页码 (可选，默认1), limit: 每页数量 (可选，默认10)
 */
export const fetchVideoChargeLog = async (params: { page?: number; limit?: number } = {}) => {
  return withTopLoading(async () => {
    // 获取用户信息
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

    console.log('正在获取视频充值记录...')

    // 构建请求参数
    const queryParams = new URLSearchParams({
      service: 'User.ChargeLog',
    })

    const formData = new URLSearchParams({
      uid: String(userId),
      token: token,
      page: String(params.page || 1),
      limit: String(params.limit || 10),
    })

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    try {
      const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
        method: 'POST',
        headers,
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('获取视频充值记录返回:', result)

      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0) {
          return {
            code: 1,
            data: result.data.info,
            msg: result.data.msg || '获取成功',
          }
        } else {
          return {
            code: 0,
            data: null,
            msg: result.data.msg || '获取失败',
          }
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.msg || '获取失败',
        }
      }
    } catch (error) {
      console.error('获取视频充值记录失败:', error)
      throw error
    }
  })
}

/**
 * 获取游戏充值记录
 * @param params page: 页码 (可选，默认1), limit: 每页数量 (可选，默认10)
 */
export const fetchGameChargeLog = async (params: { page?: number; limit?: number } = {}) => {
  return withTopLoading(async () => {
    // 获取用户信息
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

    console.log('正在获取游戏充值记录...')

    // 构建请求参数 - 使用正确的游戏充值记录接口
    const formData = new URLSearchParams({
      service: 'Charge.GetChargeList',
      lang: 'zh_cn',
      uid: String(userId),
      token: token,
      page: String(params.page || 1),
      pagesize: String(params.limit || 10),
    })

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    try {
      const response = await fetch(NEW_API_BASE_URL, {
        method: 'POST',
        headers,
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('获取游戏充值记录返回:', result)

      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0 && result.data.info) {
          // 游戏充值记录的数据结构：data.info.data 是数组，data.info.total 是总数
          return {
            code: 1,
            data: {
              list: result.data.info.data || [],
              total: parseInt(result.data.info.total || '0'),
              page: params.page || 1,
              // 计算总页数
              pagecount: Math.ceil(parseInt(result.data.info.total || '0') / (params.limit || 10)),
            },
            msg: result.data.msg || '获取成功',
          }
        } else {
          return {
            code: 0,
            data: null,
            msg: result.data.msg || '获取失败',
          }
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.msg || '获取失败',
        }
      }
    } catch (error) {
      console.error('获取游戏充值记录失败:', error)
      throw error
    }
  })
}

// ========== 代理相关接口 ==========

/**
 * 申请代理接口
 * @returns 申请代理结果
 */
export const applyAgent = async () => {
  return withTopLoading(async () => {
    // 检查是否需要登录
    if (!checkLoginRequired()) {
      throw new Error('请先登录再申请代理')
    }

    // 获取用户信息
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

    console.log('正在申请代理...')

    try {
      // 使用本地代理请求接口
      const response = await fetch(`${NEW_API_BASE_URL}?service=User.Dodaili`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        },
        body: new URLSearchParams({
          uid: String(userId),
          token: token,
        }).toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('申请代理返回:', result)

      // 根据用户提供的返回数据格式进行处理
      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 1) {
          return {
            code: 1,
            data: result.data.info || [],
            msg: result.data.msg || '申请成功',
          }
        } else {
          return {
            code: 0,
            data: null,
            msg: result.data.msg || '申请失败',
          }
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.msg || '申请失败',
        }
      }
    } catch (error) {
      console.error('申请代理失败:', error)
      throw error
    }
  })
}

// ========== 推广记录相关接口 ==========

/**
 * 推广记录数据接口
 */
export interface PromotionRecord {
  addtime: string
  user_login: string
}

/**
 * 获取推广记录列表
 * @param params p: 页码 (可选，默认1)
 * @returns 推广记录数据
 */
export const fetchPromotionRecord = async (params: { p?: number } = {}) => {
  return withTopLoading(async () => {
    // 检查是否需要登录
    if (!checkLoginRequired()) {
      throw new Error('请先登录')
    }

    // 获取用户信息
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

    console.log('正在获取推广记录...')

    try {
      // 构建请求参数
      const formData = new URLSearchParams({
        service: 'User.RecHistory',
        uid: String(userId),
        token: token,
        p: String(params.p || 1),
      })

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      }

      const response = await fetch(NEW_API_BASE_URL, {
        method: 'POST',
        headers,
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('推广记录返回:', result)

      // 根据提供的返回数据格式处理
      // { ret: 200, data: { code: 0, msg: "推广历史", info: { count: 1, data: [...], totalPage: 1 } } }
      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0 && result.data.info) {
          return {
            code: 1,
            data: {
              list: result.data.info.data || [],
              count: result.data.info.count || 0,
              totalPage: result.data.info.totalPage || 1,
            },
            msg: result.data.msg || '获取成功',
          }
        } else {
          return {
            code: 0,
            data: { list: [], count: 0, totalPage: 1 },
            msg: result.data.msg || '获取失败',
          }
        }
      } else {
        return {
          code: 0,
          data: { list: [], count: 0, totalPage: 1 },
          msg: result?.msg || '获取失败',
        }
      }
    } catch (error) {
      console.error('获取推广记录失败:', error)
      throw error
    }
  })
}
