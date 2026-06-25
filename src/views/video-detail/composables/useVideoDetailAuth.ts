import { openGlobalAuthModal } from '@/api/fetch-api'
import type { useVideoDetailUser } from './useVideoDetailUser'

type UserApi = ReturnType<typeof useVideoDetailUser>

export function useVideoDetailAuth(userApi: UserApi) {
  let pendingPlayAfterAuth = false
  let onPlayAfterAuth: (() => Promise<void>) | undefined

  const registerPlayAfterAuth = (fn: () => Promise<void>) => {
    onPlayAfterAuth = fn
  }

  const showAuthenticationModal = (
    tab: 'login' | 'register' = 'login',
    options?: { playAfter?: boolean },
  ) => {
    if (options?.playAfter ?? true) {
      pendingPlayAfterAuth = true
    }
    openGlobalAuthModal(tab)
  }

  const handleAuthSuccess = async () => {
    await userApi.fetchUserInfo()
    if (pendingPlayAfterAuth) {
      pendingPlayAfterAuth = false
      await onPlayAfterAuth?.()
    }
  }

  const goToLogin = () => showAuthenticationModal('login')

  const promptLogin = (message: string) => {
    showDialog({
      title: '提示',
      message,
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      showCancelButton: true,
      confirmButtonColor: '#ff9500',
    }).then(() => showAuthenticationModal('login'))
  }

  return {
    showAuthenticationModal,
    handleAuthSuccess,
    goToLogin,
    promptLogin,
    registerPlayAfterAuth,
  }
}
