const IMAGE_BASE_URL = 'https://test.jiji8.cc'

export const getFullImageUrl = (
  path: string | undefined | null,
  type: 'video' | 'ad' | 'tag' | 'avatar' = 'video',
): string => {
  if (!path || path === '') {
    const placeholders = {
      video: 'https://via.placeholder.com/300x400/222/999?text=无封面',
      ad: 'https://via.placeholder.com/750x200/222/999?text=广告加载中',
      tag: 'https://via.placeholder.com/150x200/222/999?text=分类',
      avatar: 'https://via.placeholder.com/100/333/ccc?text=User',
    }
    return placeholders[type]
  }

  if (path.startsWith('http')) {
    return path
  }

  const root = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL
  const subPath = path.startsWith('/') ? path : `/${path}`

  return `${root}${subPath}`
}

