import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import {
  checkLoginRequired,
  getUserInfo,
} from '../core/auth-session'
import type { AccountDetail } from '../types'

// ========== 提现相关接口 ==========

/**
 * 获取提现账户类型
 */
export const fetchWithdrawTypes = async () => {
  const queryParams = new URLSearchParams({
    service: 'home.getTixianType',
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(buildNewApiUrl(queryParams), {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取提现账户类型返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: result.data.info,
      msg: result.data.msg || '获取成功',
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '获取失败',
    }
  }
}

/**
 * 获取用户收益信息
 */
export const fetchUserProfit = async () => {
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

  const queryParams = new URLSearchParams({
    service: 'user.getProfit',
    uid: String(uid),
    token: userInfo.token,
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(buildNewApiUrl(queryParams), {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取用户收益返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: result.data.info[0] || {},
      msg: result.data.msg || '获取成功',
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '获取失败',
    }
  }
}

/**
 * 获取用户提现账号列表
 */
export const fetchUserAccountList = async () => {
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

  const queryParams = new URLSearchParams({
    service: 'user.getUserAccountList',
    uid: String(uid),
    token: userInfo.token,
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(buildNewApiUrl(queryParams), {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取提现账号列表返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: result.data.info || [],
      msg: result.data.msg || '获取成功',
    }
  } else {
    return {
      code: 0,
      data: [],
      msg: result?.data?.msg || result?.msg || '获取失败',
    }
  }
}

/**
 * 添加提现账号
 */
export const addUserAccount = async (params: {
  type: number
  account_bank: string
  account: string
  name: string
}) => {
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

  const queryParams = new URLSearchParams({
    service: 'user.setUserAccount',
    uid: String(uid),
    token: userInfo.token,
    type: String(params.type),
    account_bank: params.account_bank,
    account: params.account,
    name: params.name,
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(buildNewApiUrl(queryParams), {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('添加提现账号返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: result.data.info[0] || {},
      msg: result.data.msg || '添加成功',
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '添加失败',
    }
  }
}

/**
 * 删除提现账号
 */
export const deleteUserAccount = async (accountId: number) => {
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

  const queryParams = new URLSearchParams({
    service: 'user.delUserAccount',
    uid: String(uid),
    token: userInfo.token,
    id: String(accountId),
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(buildNewApiUrl(queryParams), {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('删除提现账号返回:', result)

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    return {
      code: 1,
      data: null,
      msg: result.data.msg || '删除成功',
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '删除失败',
    }
  }
}

/**
 * 用户提现
 */
export const submitWithdraw = async (params: { accountid: number; cashvote: number }) => {
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

  const queryParams = new URLSearchParams({
    service: 'user.setCash',
    uid: String(uid),
    token: userInfo.token,
    accountid: String(params.accountid),
    cashvote: String(params.cashvote),
  })

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  const response = await fetch(buildNewApiUrl(queryParams), {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('提现申请返回:', result)

  if (result && result.ret === 200 && result.data) {
    if (result.data.code === 0) {
      return {
        code: 1,
        data: result.data.info || {},
        msg: result.data.msg || '提现申请成功',
      }
    } else {
      return {
        code: 0,
        data: null,
        msg: result.data.msg || '提现申请失败',
      }
    }
  } else {
    return {
      code: 0,
      data: null,
      msg: result?.msg || '提现申请失败',
    }
  }
}
