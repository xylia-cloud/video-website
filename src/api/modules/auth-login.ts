import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import { withTopLoading } from '../core/loading'
import { getUserInfo, setUserInfo, clearAllCache } from '../core/auth-session'
import type { RegisterParams, UserInfo } from '../types'

export const registerUser = async (params: RegisterParams) => {
  // 构建表单数据
  const formData = new URLSearchParams()
  formData.append('service', 'login.userReg')
  formData.append('country_code', String(params.country_code))
  formData.append('user_login', params.user_login)
  formData.append('user_pass', params.user_pass)
  formData.append('user_pass2', params.user_pass2)

  // 如果有推荐码，添加到表单数据
  if (params.rec_code) {
    formData.append('rec_code', params.rec_code)
  }

  console.log('正在发送注册表单请求到:', NEW_API_BASE_URL, '数据:', formData.toString())

  // 获取基础请求头，设置为表单格式
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  // 发起POST请求到新的接口地址，使用表单数据
  const response = await fetch(NEW_API_BASE_URL, {
    method: 'POST',
    body: formData.toString(),
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('注册接口原始返回:', result)

  // 新接口格式: { ret: 200, data: { code: 0, msg: "操作成功", info: [1] } }
  // 转换为原有格式: { code: 1, data: {...}, msg: "" }
  let adaptedResult

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    // 注册成功
    adaptedResult = {
      code: 1,
      data: result.data.info, // 返回 [1] 表示成功
      msg: result.data.msg || '注册成功',
    }
  } else {
    // 注册失败
    adaptedResult = {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '注册失败，请重试',
    }
  }

  return adaptedResult
}

export const userLogin = async (params: {
  user_name: string
  user_pwd: string
  country_code?: number
}) => {
  if (!params.user_name) {
    throw new Error('用户名不能为空')
  }

  if (!params.user_pwd) {
    throw new Error('密码不能为空')
  }

  console.log('正在登录...')

  // 构建表单数据
  const formData = new URLSearchParams()
  formData.append('service', 'login.userLogin')
  formData.append('user_login', params.user_name)
  formData.append('user_pass', params.user_pwd)
  formData.append('country_code', String(params.country_code || 86))

  console.log('正在发送登录表单请求到:', NEW_API_BASE_URL, '数据:', formData.toString())

  // 获取基础请求头，设置为表单格式
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  // 发起POST请求到新接口，使用表单数据
  const response = await fetch(NEW_API_BASE_URL, {
    method: 'POST',
    body: formData.toString(),
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()

  // 适配新接口的返回格式
  // 新接口格式: { ret: 200, data: { code: 0, msg: "", info: {...} } }
  // 转换为原有格式: { code: 1, data: {...}, msg: "" }
  let adaptedResult

  if (result && result.ret === 200 && result.data && result.data.code === 0) {
    // 登录成功，转换数据格式，保存所有用户信息
    const userInfo: UserInfo = {
      user_id: parseInt(result.data.info.id),
      user_name: params.user_name, // 使用登录时的用户名
      token: result.data.info.token,
      user_portrait: result.data.info.avatar,
      user_points: parseInt(result.data.info.score || '0'),
      coin: parseInt(result.data.info.coin || '0'), // 钻石余额
      group_id: parseInt(result.data.info.level || '1'),
      group_name: `等级${result.data.info.level || '1'}`,
      user_nick_name: result.data.info.user_nicename,
      rec_code: result.data.info.rec_code,
      // 🔥 新增：保存完整的用户信息
      sex: result.data.info.sex || '0',
      birthday: result.data.info.birthday || '',
      signature: result.data.info.signature || '',
      province: result.data.info.province || '',
      city: result.data.info.city || '',
      avatar_thumb: result.data.info.avatar_thumb || '',
    }

    console.log('💾 正在保存完整的用户信息到localStorage:', userInfo)

    // 保存到本地存储（正式登录，清除游客标记）
    setUserInfo(userInfo, { isGuest: false })

    // 转换为原有的返回格式
    adaptedResult = {
      code: 1,
      data: userInfo,
      msg: '登录成功',
    }
  } else {
    // 登录失败，转换错误格式
    adaptedResult = {
      code: 0,
      data: null,
      msg: result?.data?.msg || result?.msg || '登录失败，请检查用户名和密码',
    }
  }

  return adaptedResult
}

/**
 * 游客登录接口
 * @param imei 设备IMEI号
 * @param rec_code 推荐码（可选）
 * @returns 游客登录结果
 */
export const touristLogin = async (
  imei: string,
  rec_code?: string,
  options?: { loading?: boolean },
) => {
  return withTopLoading(async () => {
    if (!imei) {
      throw new Error('IMEI不能为空')
    }

    console.log('正在进行游客登录...')

    // 🔥 service参数在URL中，IMEI参数在表单body中（目标API只支持表单格式）
    const url = `${NEW_API_BASE_URL}?service=Login.TouristLogin`

    // 构建表单数据（目标API不支持JSON，必须使用表单格式）
    const formData = new URLSearchParams()
    formData.append('IMEI', imei)
    
    // 如果有推荐码，添加到表单数据
    if (rec_code) {
      formData.append('rec_code', rec_code)
      console.log('游客登录携带推荐码:', rec_code)
    }

    console.log('正在发送游客登录请求到:', url)
    console.log('表单body数据:', formData.toString())

    // 获取基础请求头，设置为表单格式
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    // 发起POST请求，body为表单格式
    const response = await fetch(url, {
      method: 'POST',
      body: formData.toString(),
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const responseText = await response.text()
    console.log('游客登录API原始响应:', responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('游客登录API返回的JSON解析失败:', e)
      throw new Error('游客登录API返回的数据格式不正确')
    }

    console.log('游客登录结果:', result)

    // 处理游客登录结果
    if (result.ret === 200 && result.data && result.data.info) {
      const apiUserInfo = result.data.info

      // 🔥 统一游客用户字段：将 user_nicename 映射为 user_nick_name
      const userInfo = {
        ...apiUserInfo,
        // 统一昵称字段名（API返回的是user_nicename，统一为user_nick_name）
        user_nick_name: apiUserInfo.user_nicename || apiUserInfo.user_nick_name || '',
        user_id: parseInt(apiUserInfo.id) || 0,
        user_name: apiUserInfo.user_nicename || apiUserInfo.id || '',
        user_portrait: apiUserInfo.avatar || apiUserInfo.avatar_thumb || '',
        token: apiUserInfo.token,
        sex: apiUserInfo.sex || '0',
        birthday: apiUserInfo.birthday || '',
        signature: apiUserInfo.signature || '',
        province: apiUserInfo.province || '',
        city: apiUserInfo.city || '',
        avatar: apiUserInfo.avatar || '',
        avatar_thumb: apiUserInfo.avatar_thumb || '',
        user_points: parseInt(apiUserInfo.score || '0'),
        coin: parseFloat(apiUserInfo.coin || '0'),
        rec_code: apiUserInfo.rec_code || '',
      }

      console.log('📋 游客登录API返回:', {
        原始昵称字段: apiUserInfo.user_nicename,
        统一后昵称字段: userInfo.user_nick_name,
      })

      setUserInfo(userInfo as UserInfo, { isGuest: true })

      console.log('💾 游客登录成功，已保存统一格式的用户信息到localStorage')

      return {
        code: 1,
        data: userInfo,
        msg: '游客登录成功',
      }
    } else {
      // 游客登录失败
      return {
        code: 0,
        data: null,
        msg: result?.msg || '游客登录失败',
      }
    }
  }, options?.loading ?? true)
}

/**
 * 用户退出登录
 */
export const userLogout = async () => {
  try {
    console.log('正在退出登录...')

    // 获取当前用户信息
    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.token) {
      console.log('没有用户信息，直接清除缓存')
      clearAllCache()
      return true
    }

    // 兼容游客用户和正式用户的数据结构
    const uid = userInfo.user_id || userInfo.id
    if (!uid) {
      console.log('用户ID不存在，直接清除缓存')
      clearAllCache()
      return true
    }

    // 构建表单数据
    const formData = new URLSearchParams()
    formData.append('service', 'login.logout')
    formData.append('uid', String(uid))
    formData.append('token', userInfo.token)

    console.log('正在发送退出登录表单请求到:', NEW_API_BASE_URL, '数据:', formData.toString())

    // 发起退出登录请求
    const response = await fetch(NEW_API_BASE_URL, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`退出登录请求失败: ${response.status}`, errorText)
    } else {
      const result = await response.json()
      console.log('退出登录结果:', result)

      // 检查退出登录结果
      if (result && result.ret === 200 && result.data) {
        if (result.data.code === 0) {
          console.log('退出登录成功:', result.data.msg || '操作成功')
        } else if (result.data.code === 700) {
          console.log('登录状态已失效，直接清除本地缓存:', result.data.msg)
        } else {
          console.warn('退出登录接口返回异常:', result)
        }
      } else {
        console.warn('退出登录接口返回格式异常:', result)
      }
    }

    // 无论接口是否成功，都清除所有缓存
    clearAllCache()
    console.log('用户已退出登录，所有缓存已清除')

    return true
  } catch (error) {
    console.error('退出登录请求错误:', error)
    // 发生错误时也清除所有缓存
    clearAllCache()
    return false
  }
}
