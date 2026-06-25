import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import { checkLoginRequired, getUserInfo } from '../core/auth-session'
import type { AccountDetail, FollowListResponse } from '../types'

export const fetchAccountDetails = async () => {
  if (!checkLoginRequired()) {
    throw new Error('请先登录')
  }

  const userInfo = getUserInfo()
  if (!userInfo) {
    throw new Error('用户信息不存在')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在')
  }

  console.log('正在获取账目明细...')

  // 构建请求参数
  const queryParams = new URLSearchParams({
    service: 'user.details',
  })

  const formData = new URLSearchParams({
    uid: String(uid),
    token: userInfo.token,
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
    console.log('账目明细返回:', result)

    if (result && result.ret === 200 && result.data) {
      if (result.data.code === 0) {
        return {
          code: 1,
          data: result.data.info || [],
          msg: result.data.msg || '获取成功',
        }
      } else {
        return {
          code: 0,
          data: [],
          msg: result.data.msg || '获取失败',
        }
      }
    } else {
      return {
        code: 0,
        data: [],
        msg: result?.msg || '获取失败',
      }
    }
  } catch (error) {
    console.error('获取账目明细失败:', error)
    throw error
  }
}

/**
 * 获取提现记录（从账目明细中筛选提现相关条目）
 */
export const fetchWithdrawRecords = async () => {
  const result = await fetchAccountDetails()
  if (result.code !== 1) {
    return result
  }

  const list = (result.data || []).filter((item: AccountDetail) => {
    const action = item.action || ''
    return /提现|提款|取现/i.test(action)
  })

  return {
    code: 1,
    data: list,
    msg: result.msg || '获取成功',
  }
}

export const fetchFollowsList = async (params: {
  uid: string
  touid: string
  p?: number
  lang?: string
}): Promise<FollowListResponse> => {
  try {
    console.log('获取关注列表参数:', params)

    const formData = new URLSearchParams()
    formData.append('service', 'User.getFollowsList')
    formData.append('uid', params.uid)
    formData.append('touid', params.touid)
    formData.append('p', (params.p || 1).toString())
    if (params.lang) {
      formData.append('lang', params.lang)
    }

    const response = await fetch(NEW_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('关注列表API返回:', result)

    if (result && result.ret === 200 && result.data) {
      return {
        code: result.data.code || 1,
        info: result.data.info || [],
        msg: result.data.msg || '获取成功',
      }
    } else {
      return {
        code: 0,
        info: [],
        msg: result?.msg || '获取失败',
      }
    }
  } catch (error) {
    console.error('获取关注列表失败:', error)
    throw error
  }
}
