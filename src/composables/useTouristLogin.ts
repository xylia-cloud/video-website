import { touristLogin } from '@/api/fetch-api'
import { useUserStore } from '@/stores/user'
import { getDeviceIMEI } from '@/utils/device'
import { resolveInviteCode } from '@/utils/invite'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

interface TouristLoginOptions {
  route: RouteLocationNormalizedLoaded
  onSuccess?: () => void | Promise<void>
  showFailureToast?: boolean
  /** 不触发顶部线形进度条 / TopLoading Toast */
  silentLoading?: boolean
  /** 不弹出「已获取游客信息」提示 */
  silentSuccessToast?: boolean
}

let touristLoginInFlight: Promise<void> | null = null

export async function performTouristLogin({
  route,
  onSuccess,
  showFailureToast = true,
  silentLoading = false,
  silentSuccessToast = false,
}: TouristLoginOptions): Promise<void> {
  const userStore = useUserStore()
  userStore.hydrateFromStorage()
  if (userStore.isLoggedIn || userStore.profile) {
    return
  }

  if (touristLoginInFlight) {
    await touristLoginInFlight
    return
  }

  touristLoginInFlight = (async () => {
    try {
      const recCode = resolveInviteCode(route) || undefined
      const result = await touristLogin(getDeviceIMEI(), recCode, {
        loading: !silentLoading,
      })

      if (result.code === 1 && result.data) {
        useUserStore().hydrateFromStorage()
        if (!silentSuccessToast) {
          showToast({ message: '已获取游客信息', duration: 1000 })
        }
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
    } finally {
      touristLoginInFlight = null
    }
  })()

  await touristLoginInFlight
}
