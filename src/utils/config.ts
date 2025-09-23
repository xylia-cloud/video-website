/**
 * 全局配置文件
 * 集中管理应用的配置项，便于维护和环境切换
 */

// 🎬 视频相关API - jiji1.tv (视频列表、详情、分类、广告等)
export const BASE_URL = (() => {
  // 添加详细的环境检测日志
  console.log('🔍 BASE_URL初始化检测:')
  console.log('  import.meta.env.DEV:', import.meta.env.DEV)
  console.log('  import.meta.env.MODE:', import.meta.env.MODE)
  console.log('  import.meta.env.PROD:', import.meta.env.PROD)

  if (import.meta.env.DEV) {
    // 开发环境：使用Vite代理
    console.log('  ✅ 检测到开发环境，使用 /api 代理')
    return '/api'
  } else {
    console.log('  ✅ 检测到生产环境，开始智能检测部署方式')
    // 生产环境：智能检测部署方式
    if (import.meta.env.VITE_API_BASE_URL) {
      // 优先使用环境变量
      console.log('  🎯 使用环境变量:', import.meta.env.VITE_API_BASE_URL)
      return import.meta.env.VITE_API_BASE_URL
    } else if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.hostname !== 'jiji1.tv'
    ) {
      // 如果部署在其他域名（如jiji8.cc），使用当前域名的API代理
      const proxyUrl = `${window.location.protocol}//${window.location.hostname}/api`
      console.log('  🎯 检测到代理部署，使用:', proxyUrl)
      return proxyUrl
    } else {
      // 兜底：直接使用jiji1.tv
      console.log('  🎯 使用直接部署: https://jiji1.tv')
      return 'https://jiji1.tv'
    }
  }
})()

// API代理前缀（开发环境用）
export const API_PREFIX = '/api'

// 👤 用户相关API - live.88tv.co (个人中心、登录、注册、支付等)
export const NEW_API_BASE_URL = import.meta.env.DEV ? '/userapi' : 'https://live.88tv.co/appapi/'

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
export const DEFAULT_PAGE_SIZE = 10

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
