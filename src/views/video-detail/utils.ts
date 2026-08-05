import { getFullImageUrl, checkApiAuthError } from '@/api/fetch-api'
import { BASE_URL } from '@/utils/config'

export const resolveCoverUrl = (url?: string) => getFullImageUrl(url, 'video')

const DIRECT_MEDIA_EXTENSIONS = [
  '.m3u8',
  '.mp4',
  '.ts',
  '.flv',
  '.mkv',
  '.webm',
  '.ogg',
  '.mov',
  '.avi',
  '.wmv',
  '.rmvb',
  '.m4v',
]

// 判断地址是否为网页播放器页面（如 https://player.jiji1.tv/?url=xxx），
// 需要 iframe 承载；否则视为可直接播放的媒体地址（m3u8/mp4 等）。
// 仅绝对 http(s) 外链且非同源地址才可能是网页播放器，避免相对路径/本站
// 地址被误判后 iframe 嵌套加载项目自身页面。
export const isPlayerPageUrl = (url?: string): boolean => {
  if (!url) return false
  if (!/^https?:\/\//i.test(url)) return false
  if (typeof window !== 'undefined') {
    try {
      const urlOrigin = new URL(url).origin
      if (urlOrigin === window.location.origin) return false
    } catch {
      return false
    }
  }
  const clean = url.split('#')[0].split('?')[0].toLowerCase()
  return !DIRECT_MEDIA_EXTENSIONS.some((ext) => clean.endsWith(ext))
}

export const resolveVideoUrl = (src: string): string => {
  let url = src
  if (!url.startsWith('http') && !url.startsWith('/')) {
    url = `${BASE_URL}/${url}`
  }
  if (url.includes('localhost') && !src.includes('localhost')) {
    url = `${BASE_URL}/${src}`
  }
  return url
}

export const processAdImageUrl = (imgPath: string) => {
  if (!imgPath) return ''
  if (imgPath.startsWith('http')) return imgPath
  if (imgPath.startsWith('/')) return `${BASE_URL}${imgPath}`
  return `${BASE_URL}/${imgPath}`
}

export const isLoginRequiredResult = (result: unknown): boolean => {
  if (!result || typeof result !== 'object') return false
  const r = result as Record<string, unknown>
  if (checkApiAuthError(result)) return true
  if (r.code === 1002) return true
  const msg = String(r.msg || r.message || '')
  return msg.includes('请先登录') || msg.includes('重新登录')
}

export const buildShareUrl = (recCode: string) => {
  const currentUrl = window.location.href
  const urlObj = new URL(currentUrl)
  const hashPart = urlObj.hash
  const basePath = urlObj.origin + urlObj.pathname

  if (hashPart && recCode) {
    const hashMatch = hashPart.match(/^#([^?]*)(\?.*)?$/)
    if (hashMatch) {
      const hashPath = hashMatch[1]
      const hashQuery = hashMatch[2] || ''
      const params = new URLSearchParams(hashQuery)
      params.set('invite', recCode)
      return `${basePath}#${hashPath}?${params.toString()}`
    }
  }

  return urlObj.toString()
}
