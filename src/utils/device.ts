/**
 * 设备相关工具函数
 */

/**
 * 生成模拟的IMEI号
 * IMEI格式：15位数字，前8位为TAC（Type Allocation Code），后7位为序列号
 * @returns 15位IMEI字符串
 */
export const generateIMEI = (): string => {
  // 检查是否已经有保存的IMEI
  const savedIMEI = localStorage.getItem('deviceIMEI')
  if (savedIMEI && savedIMEI.length === 15) {
    return savedIMEI
  }

  // 生成新的IMEI
  // TAC部分使用常见的手机厂商代码（这里使用苹果的一个TAC）
  const tac = '35328409'

  // 生成6位随机序列号
  const serial = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0')

  // 前14位
  const imei14 = tac + serial

  // 计算校验位（使用Luhn算法）
  const checkDigit = calculateLuhnCheckDigit(imei14)

  const fullIMEI = imei14 + checkDigit

  // 保存到本地存储
  localStorage.setItem('deviceIMEI', fullIMEI)

  console.log('生成新的设备IMEI:', fullIMEI)
  return fullIMEI
}

/**
 * 使用Luhn算法计算校验位
 * @param digits 前14位数字字符串
 * @returns 校验位（0-9）
 */
function calculateLuhnCheckDigit(digits: string): string {
  let sum = 0
  let alternate = false

  // 从右到左遍历
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i))

    if (alternate) {
      digit *= 2
      if (digit > 9) {
        digit = (digit % 10) + 1
      }
    }

    sum += digit
    alternate = !alternate
  }

  return ((10 - (sum % 10)) % 10).toString()
}

/**
 * 获取当前设备的IMEI（如果没有则生成一个）
 * @returns IMEI字符串
 */
export const getDeviceIMEI = (): string => {
  return generateIMEI()
}

/**
 * 验证IMEI格式是否正确
 * @param imei IMEI字符串
 * @returns 是否有效
 */
export const validateIMEI = (imei: string): boolean => {
  // 检查长度
  if (imei.length !== 15) {
    return false
  }

  // 检查是否全为数字
  if (!/^\d{15}$/.test(imei)) {
    return false
  }

  // 使用Luhn算法验证校验位
  const checkDigit = imei.charAt(14)
  const calculatedCheckDigit = calculateLuhnCheckDigit(imei.substring(0, 14))

  return checkDigit === calculatedCheckDigit
}
