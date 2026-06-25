import {
  API_PREFIX,
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  VIDEO_CATEGORIES,
  NEW_API_BASE_URL,
  buildNewApiUrl,
} from '@/utils/config'
import { getUserInfo, setUserInfo, checkLoginRequired, isGuestUser } from '../core/auth-session'

export const fetchUserBaseInfo = async (params: { uid: number; token: string }) => {
  if (!params.uid) {
    throw new Error('用户ID不能为空')
  }

  if (!params.token) {
    throw new Error('用户token不能为空')
  }

  console.log('正在获取用户基本信息...')

  // 创建查询参数对象
  const queryParams = new URLSearchParams()
  queryParams.append('service', 'user.getBaseInfo')
  queryParams.append('uid', params.uid.toString())
  queryParams.append('token', params.token)

  // 获取基础请求头
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  }

  // 发起POST请求到新接口
  const response = await fetch(buildNewApiUrl(queryParams), {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
  }

  const result = await response.json()
  console.log('获取用户基本信息结果:', result)

  return result
}

/**
 * 修改用户头像接口
 * @param params 头像参数，支持file文件对象或imgdata base64编码
 * @returns 接口返回结果
 */
export const updateUserPortrait = async (params: { file?: File; imgdata?: string }) => {
  if (!params.file && !params.imgdata) {
    throw new Error('文件对象或base64编码数据不能为空')
  }

  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再修改头像')
  }

  console.log('正在更新用户头像...')

  // 获取用户信息
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.token) {
    throw new Error('用户信息不完整，请重新登录')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在，请重新登录')
  }

  // 创建查询参数对象 - 基础参数放在URL中
  const queryParams = new URLSearchParams()
  queryParams.append('service', 'user.updateAvatar')
  queryParams.append('uid', uid.toString())
  queryParams.append('token', userInfo.token)

  // 创建 FormData 对象用于文件上传
  const formData = new FormData()
  
  // 将所有参数都放在FormData中
  formData.append('service', 'user.updateAvatar')
  formData.append('uid', uid.toString())
  formData.append('token', userInfo.token)

  // 添加头像文件参数
  if (params.file) {
    formData.append('file', params.file)
    console.log('使用文件上传模式，参数名: file，文件名:', params.file.name)
  } else if (params.imgdata) {
    formData.append('imgdata', params.imgdata)
    console.log('使用base64上传模式，参数名: imgdata，数据长度:', params.imgdata.length)
  }

  // 获取基础请求头
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    // 注意：不设置Content-Type，让浏览器自动设置带boundary的值
  }

  try {
    // 发起POST请求 - 所有参数都在FormData中
    const response = await fetch(`${NEW_API_BASE_URL}`, {
      method: 'POST',
      body: formData,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`更新用户头像失败: ${response.status}`, errorText)
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    console.log('头像上传响应:', result)

    // 如果更新成功且返回了新的头像路径，更新本地存储的用户信息
    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      // 获取当前用户信息
      const currentUserInfo = getUserInfo()

      if (currentUserInfo) {
        // 从返回的info数组中获取头像信息
        const avatarInfo = result.data.info && result.data.info[0]
        const newAvatar = avatarInfo?.avatar
        const newAvatarThumb = avatarInfo?.avatar_thumb

        console.log('✅ 头像上传成功，新头像URL:', newAvatar)

        // 更新头像路径
        const updatedUserInfo = {
          ...currentUserInfo,
          user_portrait: newAvatar,
          avatar: newAvatar,
          avatar_thumb: newAvatarThumb,
        }

        // 保存到本地存储
        setUserInfo(updatedUserInfo)
        console.log('✅ 本地用户信息已更新')
      }

      return {
        code: 1,
        data: { 
          user_portrait: result.data.info?.[0]?.avatar,
          avatar_thumb: result.data.info?.[0]?.avatar_thumb,
        },
        msg: result.data.msg || '头像更新成功',
      }
    } else {
      return {
        code: 0,
        data: null,
        msg: result?.data?.msg || result?.msg || '头像更新失败',
      }
    }
  } catch (error) {
    console.error('更新用户头像请求错误:', error)
    throw error
  }
}

/**
 * 修改用户信息接口（包括昵称和密码）
 * @param params 用户信息参数
 * @returns 接口返回结果
 */
export const updateUserInfo = async (params: {
  user_nick_name?: string
  user_login?: string // 🔥 添加游客账号字段
  sex?: string
  birthday?: string
  user_pwd?: string
  user_pwd1?: string
  user_pwd2?: string
  user_qq?: string
  user_email?: string
  user_phone?: string
  [key: string]: string | undefined
}) => {
  // 检查是否需要登录
  if (!checkLoginRequired()) {
    throw new Error('请先登录再修改个人信息')
  }

  // 获取用户信息
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.token) {
    throw new Error('用户信息不完整，请重新登录')
  }

  // 兼容游客用户和正式用户的数据结构
  const uid = userInfo.user_id || userInfo.id
  if (!uid) {
    throw new Error('用户ID不存在，请重新登录')
  }

  console.log('正在更新用户信息...')

  // 判断是修改个人信息还是修改密码
  const isChangingPassword = params.user_pwd && params.user_pwd1 && params.user_pwd2

  if (isChangingPassword) {
    // 修改密码接口
    const queryParams = new URLSearchParams()
    queryParams.append('service', 'user.updatePass')
    queryParams.append('uid', uid.toString())
    queryParams.append('token', userInfo.token)
    queryParams.append('oldpass', params.user_pwd!)
    queryParams.append('pass', params.user_pwd1!)
    queryParams.append('pass2', params.user_pwd2!)

    // 🔥 如果本地存储 isGuest 为 true（游客用户），则添加 isyouke=1 参数
    if (isGuestUser()) {
      queryParams.append('isyouke', '1')
      console.log('🎯 检测到游客用户修改密码，添加 isyouke=1 查询参数')
    }

    // 获取基础请求头
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    try {
      // 发起POST请求到新接口
      const response = await fetch(buildNewApiUrl(queryParams), {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`修改密码失败: ${response.status}`, errorText)
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('修改密码响应:', result)

      // 转换新接口返回格式为原有格式
      if (result && result.ret === 200 && result.data && result.data.code === 0) {
        return {
          code: 1,
          data: null,
          msg: '密码修改成功',
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.data?.msg || result?.msg || '密码修改失败',
        }
      }
    } catch (error) {
      console.error('修改密码请求错误:', error)
      throw error
    }
  } else {
    // 修改个人信息接口
    const queryParams = new URLSearchParams()
    queryParams.append('service', 'user.updateFields')
    queryParams.append('uid', uid.toString())
    queryParams.append('token', userInfo.token)

    // 🔥 如果本地存储 isGuest 为 true（游客用户），则添加 isyouke=1 参数
    if (isGuestUser()) {
      queryParams.append('isyouke', '1')
      console.log('🎯 检测到游客用户，添加 isyouke=1 查询参数')
    }

    // 构建fields JSON字符串，包含所有字段
    const fields: any = {
      user_nicename: params.user_nick_name || '',
      avatar: '', // 头像通过单独接口上传
      sex: params.sex || '0',
      signature: '', // 个性签名，暂时为空
      birthday: params.birthday || '',
      location: '', // 位置，暂时为空
      province: '', // 省份，暂时为空
      city: '', // 城市，暂时为空
    }

    // 🔥 如果传入了 user_login 字段（游客账号），则添加到 fields 中
    if (params.user_login !== undefined) {
      fields.user_login = params.user_login
    }

    // 保留旧字段的兼容性
    if (params.user_qq !== undefined) {
      fields.user_qq = params.user_qq
    }
    if (params.user_email !== undefined) {
      fields.user_email = params.user_email
    }
    if (params.user_phone !== undefined) {
      fields.user_phone = params.user_phone
    }

    console.log('🔍 updateUserInfo - fields 对象:', fields)
    queryParams.append('fields', JSON.stringify(fields))

    // 🔍 调试：显示完整的查询参数
    console.log('🔍 updateUserInfo - 完整查询参数:', queryParams.toString())

    // 获取基础请求头
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }

    try {
      // 发起POST请求到新接口
      const response = await fetch(buildNewApiUrl(queryParams), {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`更新用户信息失败: ${response.status}`, errorText)
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('更新用户信息响应:', result)

      // 转换新接口返回格式为原有格式
      if (result && result.ret === 200 && result.data && result.data.code === 0) {
        // 如果更新成功，更新本地存储的用户信息
        const currentUserInfo = getUserInfo()
        if (currentUserInfo) {
          // 合并新的用户信息（游客和正式用户已统一使用 user_nick_name）
          const updatedUserInfo = {
            ...currentUserInfo,
            user_nick_name: params.user_nick_name || currentUserInfo.user_nick_name,
            sex: params.sex || currentUserInfo.sex,
            birthday: params.birthday || currentUserInfo.birthday,
            user_qq: params.user_qq || currentUserInfo.user_qq,
            user_email: params.user_email || currentUserInfo.user_email,
            user_phone: params.user_phone || currentUserInfo.user_phone,
          }

          // 🔥 如果是游客用户且传入了 user_login，则更新账号字段
          if (params.user_login !== undefined) {
            updatedUserInfo.user_name = params.user_login
            // 使用类型断言来添加 user_login 字段
            ;(updatedUserInfo as any).user_login = params.user_login
          }

          console.log('💾 更新本地用户信息:', {
            old_user_nick_name: currentUserInfo.user_nick_name,
            new_user_nick_name: updatedUserInfo.user_nick_name,
            old_user_name: currentUserInfo.user_name,
            new_user_name: updatedUserInfo.user_name,
            user_login_updated: params.user_login !== undefined,
          })

          // 保存到本地存储
          setUserInfo(updatedUserInfo)
        }

        return {
          code: 1,
          data: fields,
          msg: '个人信息更新成功',
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result?.data?.msg || result?.msg || '个人信息更新失败',
        }
      }
    } catch (error) {
      console.error('更新用户信息请求错误:', error)
      throw error
    }
  }
}
