import type { RouteLocationNormalizedLoaded } from 'vue-router'

const INVITE_STORAGE_KEY = 'inviteCode'

/** 从完整 URL 中解析 invite（兼容 hash 前、hash 后） */
export function parseInviteFromUrl(href = window.location.href): string {
  const match = href.match(/[?&]invite=([^&#]*)/i)
  if (!match?.[1]) return ''

  try {
    return decodeURIComponent(match[1]).trim()
  } catch {
    return match[1].trim()
  }
}

/** 从 vue-router query 读取 invite */
export function getInviteFromRoute(route?: RouteLocationNormalizedLoaded): string {
  const fromRoute = route?.query?.invite
  if (typeof fromRoute === 'string' && fromRoute) return fromRoute.trim()
  if (Array.isArray(fromRoute) && fromRoute[0]) return String(fromRoute[0]).trim()
  return ''
}

export function getStoredInviteCode(): string {
  return localStorage.getItem(INVITE_STORAGE_KEY)?.trim() || ''
}

export function persistInviteCode(code: string): void {
  const normalized = code.trim()
  if (normalized) {
    localStorage.setItem(INVITE_STORAGE_KEY, normalized)
  }
}

/**
 * 解析 URL / 路由中的邀请码并写入 localStorage。
 * 应在路由跳转或游客登录/注册前调用。
 */
export function captureInviteCode(route?: RouteLocationNormalizedLoaded): string {
  const fromRoute = getInviteFromRoute(route)
  const fromUrl = parseInviteFromUrl()
  const code = fromRoute || fromUrl

  if (code) {
    persistInviteCode(code)
    return code
  }

  return getStoredInviteCode()
}

/** 获取当前可用的邀请码（URL 优先，其次 localStorage） */
export function resolveInviteCode(route?: RouteLocationNormalizedLoaded): string {
  return captureInviteCode(route) || getStoredInviteCode()
}
