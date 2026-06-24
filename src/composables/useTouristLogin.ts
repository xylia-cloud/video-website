import { touristLogin } from '@/api/fetch-api'
import { useUserStore } from '@/stores/user'
import { getDeviceIMEI } from '@/utils/device'
import { resolveInviteCode } from '@/utils/invite'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

interface TouristLoginOptions {
  route: RouteLocationNormalizedLoaded
  onSuccess?: () => void | Promise<void>
  showFailureToast?: boolean
}

export async function performTouristLogin({
  route,
  onSuccess,
  showFailureToast = true,
}: TouristLoginOptions): Promise<void> {
  const userStore = useUserStore()
  if (userStore.isLoggedIn || userStore.profile) {
    return
  }

  try {
    const recCode = resolveInviteCode(route) || undefined
    const result = await touristLogin(getDeviceIMEI(), recCode)

    if (result.code === 1 && result.data) {
      useUserStore().hydrateFromStorage()
      showToast({ message: '已获取游客信息', duration: 1000 })
      await onSuccess?.()
      return
    }

    if (showFailureToast) {
      showToast({ message: '获取游客信息失败', duration: 2000 })
    }
  } catch {
    if (showFailureToast) {
      showToast({ message: '获取游客信息失败', duration: 2000 })
    }
  }
}
