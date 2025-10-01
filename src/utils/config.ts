/**
 * 全局配置文件
 * 集中管理应用的配置项，便于维护和环境切换
 */

// 🎬 视频相关API - 直接使用PHP代理
export const BASE_URL = (() => {
  console.log('🔍 BASE_URL初始化检测:')
  console.log('  import.meta.env.DEV:', import.meta.env.DEV)
  console.log('  import.meta.env.MODE:', import.meta.env.MODE)
  console.log('  import.meta.env.PROD:', import.meta.env.PROD)

  if (import.meta.env.DEV) {
    // 开发环境：使用Vite代理
    console.log('  ✅ 检测到开发环境，使用 /api 代理')
    return '/api'
  } else {
    // 生产环境：直接使用PHP代理，绕过NGINX重写
    console.log('  ✅ 检测到生产环境，直接使用PHP代理')
    const proxyUrl = '/proxy.php?target=video&path='
    console.log('  🎯 使用直接PHP代理:', proxyUrl)
    return proxyUrl
  }
})()

// API代理前缀 - 与BASE_URL保持一致
export const API_PREFIX = BASE_URL

// 👤 用户相关API - 直接使用PHP代理
export const NEW_API_BASE_URL = (() => {
  if (import.meta.env.DEV) {
    // 开发环境：使用Vite代理
    return '/userapi'
  } else {
    // 生产环境：直接使用PHP代理，绕过NGINX重写
    console.log('  ✅ 用户API直接使用PHP代理')
    return '/proxy.php?target=user'
  }
})()

// 🔧 调试信息（开发和生产环境都显示）
console.log('🌍 API配置信息:')
console.log('  📺 视频API (jiji1.tv):', BASE_URL)
console.log('  👤 用户API (live.88tv.co):', NEW_API_BASE_URL)
console.log('  🔄 环境:', import.meta.env.DEV ? '开发环境' : '生产环境')
if (typeof window !== 'undefined' && window.location) {
  console.log('  🌐 当前域名:', window.location.hostname)
  console.log('  🎯 部署类型:', window.location.hostname === 'jiji1.tv' ? '直接部署' : '代理部署')
}

// 分页配置
export const DEFAULT_PAGE_SIZE = 20

// 视频分类ID
export const VIDEO_CATEGORIES = {
  ALL: 1, // 全部
  CHINESE: 4, // 中文
  HONGKONG_TAIWAN: 5, // 港台
  JAPAN_KOREA: 6, // 日韩
  EUROPE_AMERICA: 7, // 欧美
  DOMESTIC: 8, // 国产
}

// 其他配置
export const APP_CONFIG = {
  name: '影视网站',
  version: '1.0.0',
  copyright: `© ${new Date().getFullYear()} 影视网站. All Rights Reserved.`,
}
