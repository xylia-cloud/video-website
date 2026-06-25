import { showTopLoading, hideTopLoading } from '@/utils/topLoading'

/**
 * API请求包装器，自动处理顶部loading效果
 */
export const withTopLoading = async <T>(
  apiFunction: () => Promise<T>,
  showLoading: boolean = true,
): Promise<T> => {
  if (showLoading) {
    showTopLoading()
  }

  try {
    const result = await apiFunction()
    return result
  } finally {
    if (showLoading) {
      hideTopLoading()
    }
  }
}
