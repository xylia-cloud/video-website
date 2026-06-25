import { getFullImageUrl, checkApiAuthError } from '@/api/fetch-api'
import { BASE_URL } from '@/utils/config'

export const resolveCoverUrl = (url?: string) => getFullImageUrl(url, 'video')

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
