import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import { withTopLoading } from '../core/loading'
import { getUserInfo } from '../core/auth-session'

export const fetchVideoChargeLog = async (params: { page?: number; limit?: number } = {}) => {
  return withTopLoading(async () => {
    // 获取用户信息
    const userInfo = getUserInfo()
    if (!userInfo) {
      throw new Error('用户信息不存在')
    }

    // 兼容游客用户和正式用户的数据结构
    const userId = userInfo.user_id || userInfo.id
    const token = userInfo.token

    if (!userId || !token) {
      throw new Error('用户信息不完整')
    }

    console.log('正在获取视频充值记录...')

    // 构建请求参数
    const queryParams = new URLSearchParams({
      service: 'User.ChargeLog',
    })

    const formData = new URLSearchParams({
      uid: String(userId),
      token: token,
      page: String(params.page || 1),
      limit: String(params.limit || 10),
    })

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    try {
      const response = await fetch(buildNewApiUrl(queryParams), {
        method: 'POST',
        headers,
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('获取视频充值记录返回:', result)

      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0) {
          return {
            code: 1,
            data: result.data.info,
            msg: result.data.msg || '获取成功',
          }
        } else {
          return {
            code: 0,
            data: null,
            msg: result.data.msg || '获取失败',
          }
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.msg || '获取失败',
        }
      }
    } catch (error) {
      console.error('获取视频充值记录失败:', error)
      throw error
    }
  })
}

/**
 * 获取游戏充值记录
 * @param params page: 页码 (可选，默认1), limit: 每页数量 (可选，默认10)
 */
export const fetchGameChargeLog = async (params: { page?: number; limit?: number } = {}) => {
  return withTopLoading(async () => {
    // 获取用户信息
    const userInfo = getUserInfo()
    if (!userInfo) {
      throw new Error('用户信息不存在')
    }

    // 兼容游客用户和正式用户的数据结构
    const userId = userInfo.user_id || userInfo.id
    const token = userInfo.token

    if (!userId || !token) {
      throw new Error('用户信息不完整')
    }

    console.log('正在获取游戏充值记录...')

    // 构建请求参数 - 使用正确的游戏充值记录接口
    const formData = new URLSearchParams({
      service: 'Charge.GetChargeList',
      lang: 'zh_cn',
      uid: String(userId),
      token: token,
      page: String(params.page || 1),
      pagesize: String(params.limit || 10),
    })

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    try {
      const response = await fetch(NEW_API_BASE_URL, {
        method: 'POST',
        headers,
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('获取游戏充值记录返回:', result)

      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0 && result.data.info) {
          // 游戏充值记录的数据结构：data.info.data 是数组，data.info.total 是总数
          return {
            code: 1,
            data: {
              list: result.data.info.data || [],
              total: parseInt(result.data.info.total || '0'),
              page: params.page || 1,
              // 计算总页数
              pagecount: Math.ceil(parseInt(result.data.info.total || '0') / (params.limit || 10)),
            },
            msg: result.data.msg || '获取成功',
          }
        } else {
          return {
            code: 0,
            data: null,
            msg: result.data.msg || '获取失败',
          }
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.msg || '获取失败',
        }
      }
    } catch (error) {
      console.error('获取游戏充值记录失败:', error)
      throw error
    }
  })
}
