import { BASE_URL } from '@/utils/config'

/**
 * 统一处理图片URL拼接及缺省图逻辑
 * @param path 接口返回的原始路径
 * @param type 图片类型，用于匹配不同的占位图
 */
export const getFullImageUrl = (
  path: string | undefined | null,
  type: 'video' | 'ad' | 'tag' | 'avatar' = 'video',
): string => {
  // 1. 处理路径为空的情况（返回占位图）
  if (!path || path === '') {
    const placeholders = {
      video: 'https://via.placeholder.com/300x400/222/999?text=无封面',
      ad: 'https://via.placeholder.com/750x200/222/999?text=广告加载中',
      tag: 'https://via.placeholder.com/150x200/222/999?text=分类',
      avatar: 'https://via.placeholder.com/100/333/ccc?text=User',
    }
    return placeholders[type]
  }

  // 2. 如果已经是完整路径，直接返回
  if (path.startsWith('http')) {
    return path
  }

  // 3. 拼接服务器地址
  // 确保 BASE_URL 没有多余的末尾斜杠
  const root = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL
  // 确保 path 开头有斜杠
  const subPath = path.startsWith('/') ? path : `/${path}`

  return `${root}${subPath}`
}

