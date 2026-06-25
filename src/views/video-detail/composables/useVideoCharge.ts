import { ref } from 'vue'
import { createAuthHeaders, openGlobalAuthModal } from '@/api/fetch-api'
import { BASE_URL } from '@/utils/config'
import type { ChargeOption } from '../types'
import { isLoginRequiredResult } from '../utils'
import type { useVideoDetailUser } from './useVideoDetailUser'

type UserApi = ReturnType<typeof useVideoDetailUser>

export function useVideoCharge(userApi: UserApi) {
  const showChargeModal = ref(false)
  const showChargeCompleteDialog = ref(false)
  const chargeOptions = ref<ChargeOption[]>([])
  const isLoadingChargeOptions = ref(false)
  const selectedChargeOption = ref<ChargeOption | null>(null)

  const fetchChargeOptions = async () => {
    if (isLoadingChargeOptions.value) return

    isLoadingChargeOptions.value = true
    try {
      const authHeaders = createAuthHeaders(false) as Record<string, string>
      const chargeUrl = `${BASE_URL}/index.php/ajax/charge.html`
      const queryParams = new URLSearchParams()
      if (authHeaders.reqTime) queryParams.append('reqTime', authHeaders.reqTime)
      if (authHeaders.token) queryParams.append('token', authHeaders.token)

      const finalUrl = queryParams.toString() ? `${chargeUrl}?${queryParams.toString()}` : chargeUrl
      const response = await fetch(finalUrl, { method: 'GET', headers: authHeaders })
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)

      const result = await response.json()
      chargeOptions.value = result.code === 1 && result.data ? result.data : []
    } catch {
      chargeOptions.value = []
    } finally {
      isLoadingChargeOptions.value = false
    }
  }

  const showChargeDialog = async () => {
    showToast({
      message: '加载中...',
      position: 'top',
      duration: 0,
      className: 'custom-toast-loading',
      icon: 'loading',
    })

    try {
      await fetchChargeOptions()
      closeToast()

      if (chargeOptions.value.length >= 4) {
        selectedChargeOption.value = chargeOptions.value[3]!
      } else if (chargeOptions.value.length > 0) {
        selectedChargeOption.value = chargeOptions.value[chargeOptions.value.length - 1]!
      } else {
        selectedChargeOption.value = null
      }

      showChargeModal.value = true
    } catch {
      closeToast()
      showToast({
        message: '获取充值选项失败，请稍后再试',
        position: 'top',
        duration: 3000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
    }
  }

  const selectChargeOption = (option: ChargeOption) => {
    selectedChargeOption.value = option
  }

  const closeChargeCompleteDialog = () => {
    showChargeCompleteDialog.value = false
  }

  const showChargeCompletePrompt = () => {
    showChargeCompleteDialog.value = true
  }

  const confirmCharge = async (onSuccess?: () => Promise<void>) => {
    if (!selectedChargeOption.value) {
      showToast({
        message: '请选择充值选项',
        position: 'top',
        duration: 2000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
      return
    }

    try {
      showToast({
        message: '正在处理充值...',
        position: 'top',
        duration: 0,
        className: 'custom-toast-loading',
        icon: 'loading',
      })

      const auth = userApi.userStore.getAuthParams()
      if (!auth) {
        closeToast()
        showToast({
          message: '用户信息不存在，请刷新页面重试',
          position: 'top',
          duration: 3000,
          className: 'custom-toast-error',
          icon: 'cross',
        })
        return
      }

      const authHeaders = createAuthHeaders(true) as Record<string, string>
      const formData = new URLSearchParams()
      formData.append('uid', auth.uid.toString())
      formData.append('type', selectedChargeOption.value.type.toString())

      const response = await fetch(`${BASE_URL}/index.php/ajax/buy.html`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
      const result = await response.json()
      closeToast()

      if (result.code === 1) {
        if (result.data?.payUrl) {
          showToast({
            message: '正在跳转到支付页面...',
            position: 'top',
            duration: 2000,
            className: 'custom-toast-info',
            icon: 'info-o',
          })
          setTimeout(() => {
            window.location.href = result.data.payUrl
          }, 500)
          showChargeModal.value = false
          setTimeout(showChargeCompletePrompt, 1000)
        } else {
          showToast({
            message: '充值成功！',
            position: 'top',
            duration: 2000,
            className: 'custom-toast-success',
            icon: 'success',
          })
          showChargeModal.value = false
          await userApi.getUserRealTimeInfo()
        }
      } else if (isLoginRequiredResult(result)) {
        showToast({
          message: '请先登录后再充值',
          position: 'top',
          duration: 2000,
          className: 'custom-toast-error',
          icon: 'cross',
        })
        showChargeModal.value = false
        openGlobalAuthModal('login')
      } else {
        showToast({
          message: result.msg || '充值失败，请重试',
          position: 'top',
          duration: 3000,
          className: 'custom-toast-error',
          icon: 'cross',
        })
      }
    } catch {
      closeToast()
      showToast({
        message: '网络错误，请稍后再试',
        position: 'top',
        duration: 3000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
    }
  }

  const handleChargeComplete = async (afterRefresh?: () => Promise<void>) => {
    showChargeCompleteDialog.value = false
    await userApi.refreshUserPointsAfterCharge()
    await afterRefresh?.()
  }

  return {
    showChargeModal,
    showChargeCompleteDialog,
    chargeOptions,
    isLoadingChargeOptions,
    selectedChargeOption,
    showChargeDialog,
    selectChargeOption,
    closeChargeCompleteDialog,
    confirmCharge,
    handleChargeComplete,
  }
}
