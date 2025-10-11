// 全局顶部loading管理工具

let loadingCount = 0

// 显示顶部loading
export const showTopLoading = () => {
  loadingCount++
  if (loadingCount === 1) {
    // 只有在第一个请求时才显示loading
    window.dispatchEvent(new CustomEvent('show-top-loading'))
  }
}

// 隐藏顶部loading
export const hideTopLoading = () => {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) {
    // 只有在所有请求完成时才隐藏loading
    window.dispatchEvent(new CustomEvent('hide-top-loading'))
  }
}

// 重置loading状态（用于错误处理）
export const resetTopLoading = () => {
  loadingCount = 0
  window.dispatchEvent(new CustomEvent('hide-top-loading'))
}

// 获取当前loading状态
export const getLoadingCount = () => {
  return loadingCount
}
