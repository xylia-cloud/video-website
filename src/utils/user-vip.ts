/** 解析 VIP 到期时间（支持时间戳或日期字符串） */
export function parseVipEndtime(endtime: string | number | undefined | null): Date | null {
  if (endtime === undefined || endtime === null || endtime === '') return null

  if (typeof endtime === 'string' && endtime.includes('-')) {
    const date = new Date(endtime)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const timestamp = typeof endtime === 'number' ? endtime : parseInt(String(endtime), 10)
  if (Number.isNaN(timestamp)) return null
  return new Date(timestamp * 1000)
}

/** 判断 VIP 是否在有效期内 */
export function isVipActive(
  endtime: string | number | undefined | null,
  isVip?: number | string,
): boolean {
  const vipStatus = Number(isVip)
  if (vipStatus !== 1) return false
  if (!endtime) return true

  const endDate = parseVipEndtime(endtime)
  if (!endDate) return true
  return endDate > new Date()
}
