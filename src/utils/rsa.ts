import JSEncrypt from 'jsencrypt'

// RSA公钥 - 从用户提供的base64编码公钥
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCoWNs2xq+Ah8mB5QiBEwHTvorS
2VOrXzh+lczXv0Bvn5Z/aSytCHXVMxYizuxbrTdSBh/XJl9rRyhh/R1s/aRwDasC
eyyTYoQ6B12TQGEWyCnz4Kp4KibqqsQO5Qd2XCB1JattEIEB8r5SO+8flueY7sxI
nyIbrotOljcVP0TqLQIDAQAB
-----END PUBLIC KEY-----`

/**
 * RSA加密函数
 * @param text 要加密的文本
 * @returns 加密后的base64字符串
 */
export const rsaEncrypt = (text: string): string => {
  try {
    // console.log('开始RSA加密，原始文本:', text)
    // console.log('使用的公钥:', PUBLIC_KEY.substring(0, 50) + '...')

    const encrypt = new JSEncrypt()
    encrypt.setPublicKey(PUBLIC_KEY)

    const encrypted = encrypt.encrypt(text)

    if (!encrypted) {
      //   console.error('JSEncrypt.encrypt() 返回了空值')
      throw new Error('RSA加密失败')
    }

    // console.log('RSA加密成功，加密后的数据长度:', encrypted.length)
    // console.log('加密结果预览:', encrypted.substring(0, 50) + '...')

    return encrypted
  } catch (error) {
    // console.error('RSA加密错误:', error)
    throw new Error('RSA加密失败')
  }
}

/**
 * 生成人工客服链接
 * @param userId 用户ID
 * @returns 加密后的客服链接
 */
export const generateCustomerServiceUrl = (userId: string | number): string => {
  try {
    // 基础URL
    const baseUrl = 'https://kf.cwmlfr.cn/index/index/home'

    // 构建查询参数
    const params = new URLSearchParams({
      visiter_id: '',
      visiter_name: '',
      avatar: '',
      business_id: '17',
      groupid: '0',
      special: '24',
      user_id: String(userId),
    })

    // 获取查询字符串
    let queryString = params.toString()

    // 添加随机密码参数
    const randomPwd = Math.random().toString(36).substring(2, 15)
    queryString += `&pwd=${randomPwd}`

    // console.log('准备加密的查询字符串:', queryString)

    // RSA加密查询字符串
    const encryptedData = rsaEncrypt(queryString)

    // console.log('加密后的数据:', encryptedData)

    // 构建最终URL
    const finalUrl = `${baseUrl}?code=${encodeURIComponent(encryptedData)}`

    // console.log('最终客服链接:', finalUrl)

    return finalUrl
  } catch (error) {
    console.error('生成客服链接失败:', error)
    throw new Error('生成客服链接失败')
  }
}
