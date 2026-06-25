import { showToast } from 'vant/es/toast'
import { notifyUserStoreHydrate } from '@/api/user-store-sync'
import { invalidateUserPointsCache } from './points-cache'
import type { UserInfo } from '../types'

// 本地存储的键名
const TOKEN_KEY = 'user_token'
const USER_INFO_KEY = 'user_info'
const TOKEN_EXPIRE_KEY = 'token_expire_time'

// TOKEN过期时间（12小时，以毫秒为单位）
const TOKEN_EXPIRE_DURATION = 12 * 60 * 60 * 1000 // 12小时

let tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null

const clearTokenExpiryTimer = () => {
  if (tokenExpiryTimer) {
    clearTimeout(tokenExpiryTimer)
    tokenExpiryTimer = null
  }
}

export const openGlobalAuthModal = (
  tab: 'login' | 'register' = 'login',
  message: string = '登录状态已失效，请重新登录',
) => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent('open-global-auth-modal', {
      detail: {
        tab,
        message,
      },
    }),
  )
}

export const syncTokenExpiryWatcher = () => {
  if (typeof window === 'undefined') {
    return
  }

  clearTokenExpiryTimer()

  const token = getToken()
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY)
  if (!token || !expireTimeStr) {
    return
  }

  const expireTime = parseInt(expireTimeStr, 10)
  if (Number.isNaN(expireTime)) {
    return
  }

  const delay = expireTime - Date.now()
  if (delay <= 0) {
    console.log('TOKEN到期监听检测到已过期，立即触发重新登录')
    forceLogin()
    return
  }

  tokenExpiryTimer = setTimeout(() => {
    console.log('TOKEN到期监听触发，自动要求重新登录')
    forceLogin()
  }, delay)
}


const GUEST_FLAG_KEY = 'isGuest'

export const isGuestUser = (): boolean => localStorage.getItem(GUEST_FLAG_KEY) === 'true'

// 设置用户信息到本地存储
export const setUserInfo = (userInfo: UserInfo, options?: { isGuest?: boolean }) => {
  const expireTime = Date.now() + TOKEN_EXPIRE_DURATION

  // 清理重复的用户信息键（如果存在）
  if (localStorage.getItem('userInfo')) {
    console.log('🧹 检测到重复的userInfo键，正在清理...')
    localStorage.removeItem('userInfo')
  }

  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
  localStorage.setItem(TOKEN_KEY, userInfo.token)
  localStorage.setItem(TOKEN_EXPIRE_KEY, expireTime.toString())

  if (options?.isGuest === true) {
    localStorage.setItem(GUEST_FLAG_KEY, 'true')
    invalidateUserPointsCache()
  } else if (options?.isGuest === false) {
    localStorage.removeItem(GUEST_FLAG_KEY)
    invalidateUserPointsCache()
  }

  syncTokenExpiryWatcher()

  notifyUserStoreHydrate()

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

// 检查API响应是否表示TOKEN过期或需要重新登录
export const checkApiAuthError = (result: any): boolean => {
  // 检查常见的认证失败响应格式
  if (!result) return false
  
  // 格式1: 视频站接口 - 直接判断 code: 700
  if (result.code === 700) {
    console.warn('⚠️ 检测到code=700，TOKEN已失效')
    return true
  }
  
  // 格式2: 直播站接口 - code在第二层 (result.data.code === 700)
  if (result.data && result.data.code === 700) {
    console.warn('⚠️ 检测到data.code=700，TOKEN已失效')
    return true
  }
  
  // 格式3: 其他认证失败响应 (code: 0, -1 且包含登录相关关键词)
  if (result.code === 0 || result.code === -1) {
    const msg = result.msg || result.message || ''
    const authErrorKeywords = ['登录', '超时', '过期', 'token', 'TOKEN', '认证', '授权', 'login', 'expired', 'unauthorized']
    
    if (authErrorKeywords.some(keyword => msg.includes(keyword))) {
      console.warn('⚠️ API返回认证错误:', msg)
      return true
    }
  }
  
  // 格式4: HTTP状态码 401/403
  if (result.ret === 401 || result.ret === 403) {
    console.warn('⚠️ API返回认证错误，状态码:', result.ret)
    return true
  }
  
  return false
}

// 处理认证错误，提示用户重新登录
let isShowingAuthError = false // 防止重复弹窗
export const handleAuthError = (message: string = '登录已过期，请重新登录') => {
  if (isShowingAuthError) {
    return // 已经在显示错误提示，避免重复
  }
  
  isShowingAuthError = true
  
  showToast({
    message,
    duration: 3000,
    onClose: () => {
      isShowingAuthError = false
      // 清除过期的用户信息
      clearAllCache()
      // 跳转到登录页
      const currentPath = window.location.hash.replace('#', '')
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        forceLogin()
      }
    }
  })
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
  clearTokenExpiryTimer()
  localStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRE_KEY)
  localStorage.removeItem(GUEST_FLAG_KEY) // 清除游客标记
  invalidateUserPointsCache()
  localStorage.removeItem('deviceIMEI') // 清除设备IMEI（可选，保留可以避免重复生成）

  // 清理重复的用户信息键
  localStorage.removeItem('userInfo') // 清除重复的userInfo键
  notifyUserStoreHydrate()
}

// 清除所有本地缓存数据
export const clearAllCache = () => {
  console.log('清除所有本地缓存...')

  // 清除用户信息
  clearUserInfo()

  // 清除首页相关缓存
  localStorage.removeItem('lastActiveTabId')
  // 保留 inviteCode：token 过期后仍应能用于注册/重新登录

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
  console.log('TOKEN已过期，打开全局登录弹窗')
  clearAllCache()
  openGlobalAuthModal('login', '登录已过期，请重新登录')
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
