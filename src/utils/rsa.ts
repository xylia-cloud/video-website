const CUSTOMER_SERVICE_DOMAIN = 'http://jml.cwmlfr.cn'
const CUSTOMER_SERVICE_A = 'U2FsdGVkX1_Cei7a8KhxvVkrKJ_2wxWogSnRcPXVNK8'

const toBase64Url = (text: string): string => {
  const encoded = btoa(text)
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

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
  const payload = `?a=${CUSTOMER_SERVICE_A}&userId=${resolvedUserId}`
  return `${CUSTOMER_SERVICE_DOMAIN}/${toBase64Url(payload)}`
}
