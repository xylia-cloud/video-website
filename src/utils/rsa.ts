const CUSTOMER_SERVICE_DOMAIN = 'https://kefu.xblsend.cn'
const CUSTOMER_SERVICE_A = 'U2FsdGVkX185g1A-WoCIppoQzUk5JacTUelzD84jXio'

export const getCurrentUserId = (): string => {
  try {
    const rawUserInfo = localStorage.getItem('user_info') || localStorage.getItem('userInfo')
    if (!rawUserInfo) return ''

    const userInfo = JSON.parse(rawUserInfo)
    return String(userInfo.user_id || userInfo.id || userInfo.user_name || '')
  } catch (error) {
    console.error('读取用户ID失败:', error)
    return ''
  }
}

export const generateCustomerServiceUrl = (userId?: string | number): string => {
  const resolvedUserId = String(userId ?? getCurrentUserId() ?? '')
  // 构建参数字符串
  const params = `?a=${CUSTOMER_SERVICE_A}&userId=${resolvedUserId}`
  // 对参数进行 base64 编码
  const encodedParams = btoa(params)
  return `${CUSTOMER_SERVICE_DOMAIN}/${encodedParams}`
}
