import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import { withTopLoading } from '../core/loading'
import { checkLoginRequired, getUserInfo } from '../core/auth-session'

// ========== 代理相关接口 ==========

/**
 * 申请代理接口
 * @returns 申请代理结果
 */
export const applyAgent = async () => {
  return withTopLoading(async () => {
    // 检查是否需要登录
    if (!checkLoginRequired()) {
      throw new Error('请先登录再申请代理')
    }

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

    console.log('正在申请代理...')

    try {
      // 使用本地代理请求接口
      const response = await fetch(`${NEW_API_BASE_URL}?service=User.Dodaili`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        },
        body: new URLSearchParams({
          uid: String(userId),
          token: token,
        }).toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('申请代理返回:', result)

      // 根据用户提供的返回数据格式进行处理
      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 1) {
          return {
            code: 1,
            data: result.data.info || [],
            msg: result.data.msg || '申请成功',
          }
        } else {
          return {
            code: 0,
            data: null,
            msg: result.data.msg || '申请失败',
          }
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.msg || '申请失败',
        }
      }
    } catch (error) {
      console.error('申请代理失败:', error)
      throw error
    }
  })
}

// ========== 推广记录相关接口 ==========

/**
 * 获取推广记录列表
 * @param params p: 页码 (可选，默认1)
 * @returns 推广记录数据
 */
export const fetchPromotionRecord = async (params: { p?: number } = {}) => {
  return withTopLoading(async () => {
    // 检查是否需要登录
    if (!checkLoginRequired()) {
      throw new Error('请先登录')
    }

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

    console.log('正在获取推广记录...')

    try {
      // 构建请求参数
      const formData = new URLSearchParams({
        service: 'User.RecHistory',
        uid: String(userId),
        token: token,
        p: String(params.p || 1),
      })

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      }

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
      console.log('推广记录返回:', result)

      // 根据提供的返回数据格式处理
      // { ret: 200, data: { code: 0, msg: "推广历史", info: { count: 1, data: [...], totalPage: 1 } } }
      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0 && result.data.info) {
          return {
            code: 1,
            data: {
              list: result.data.info.data || [],
              count: result.data.info.count || 0,
              totalPage: result.data.info.totalPage || 1,
            },
            msg: result.data.msg || '获取成功',
          }
        } else {
          return {
            code: 0,
            data: { list: [], count: 0, totalPage: 1 },
            msg: result.data.msg || '获取失败',
          }
        }
      } else {
        return {
          code: 0,
          data: { list: [], count: 0, totalPage: 1 },
          msg: result?.msg || '获取失败',
        }
      }
    } catch (error) {
      console.error('获取推广记录失败:', error)
      throw error
    }
  })
}
