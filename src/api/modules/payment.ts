import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import {
  createAuthHeaders,
  checkLoginRequired,
  getUserInfo,
} from '../core/auth-session'

export const fetchPayChannels = async () => {
  // 直接GET请求
  const response = await fetch(buildNewApiUrl('service=charge.getqudao'), {
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

    const response = await fetch(buildNewApiUrl('service=charge.getcharge_rules'), {
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

    const response = await fetch(buildNewApiUrl('service=charge.getchargeorders'), {
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
