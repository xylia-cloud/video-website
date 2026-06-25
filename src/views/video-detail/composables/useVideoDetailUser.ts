import { computed, ref } from 'vue'
import type { UserInfo } from '@/api/fetch-api'
import { useUserStore } from '@/stores/user'

export function useVideoDetailUser() {
  const userStore = useUserStore()

  const userInfo = ref<UserInfo | null>(userStore.profile)
  const isLoadingUserInfo = ref(false)
  const isRefreshing = ref(false)
  const userVideoNums = ref(0)
  const isVip = ref('0')
  const vipEndtime = ref('')

  const userPoints = computed(() => userVideoNums.value || 0)

  const vipStatusDisplay = computed(() => {
    if (Number(isVip.value) === 1) {
      if (vipEndtime.value) {
        let endDate: Date
        if (typeof vipEndtime.value === 'string' && vipEndtime.value.includes('-')) {
          endDate = new Date(vipEndtime.value)
        } else {
          endDate = new Date(parseInt(vipEndtime.value, 10) * 1000)
        }
        const now = new Date()
        if (endDate > now) {
          const year = endDate.getFullYear()
          const month = String(endDate.getMonth() + 1).padStart(2, '0')
          const day = String(endDate.getDate()).padStart(2, '0')
          return `VIP到期：${year}-${month}-${day}`
        }
        return `观影次数：${userVideoNums.value}`
      }
      return 'VIP已开通'
    }
    return `观影次数：${userVideoNums.value}`
  })

  const applyPointsDataToView = (data: {
    video_nums?: number
    is_vip?: number | string
    endtime?: string | number
  }) => {
    userStore.hydrateFromStorage()
    const localUserInfo = userStore.profile
    if (localUserInfo) {
      userInfo.value = localUserInfo
    }
    if (data.video_nums !== undefined) {
      userVideoNums.value = data.video_nums
    }
    if (data.is_vip !== undefined) {
      isVip.value = String(data.is_vip)
    }
    if (data.endtime) {
      vipEndtime.value = String(data.endtime)
    }
  }

  const getUserRealTimeInfo = async (options?: { force?: boolean }) => {
    const currentUserInfo = userStore.profile
    if (!currentUserInfo) return null
    if (isLoadingUserInfo.value) return null

    isLoadingUserInfo.value = true
    try {
      const pointsResult = await userStore.refreshPoints({ force: options?.force ?? false })
      if (pointsResult?.code === 1 && pointsResult.data) {
        applyPointsDataToView(pointsResult.data)
        return pointsResult.data
      }
      const localUserInfo = userStore.profile
      if (localUserInfo) {
        userInfo.value = localUserInfo
        return localUserInfo
      }
      return null
    } catch {
      const localUserInfo = userStore.profile
      if (localUserInfo) {
        userInfo.value = localUserInfo
        return localUserInfo
      }
      return null
    } finally {
      isLoadingUserInfo.value = false
    }
  }

  const fetchUserInfo = async (options?: { silent?: boolean; force?: boolean }) => {
    const silent = options?.silent ?? false
    const force = options?.force ?? false
    if (!silent) {
      showToast({ message: '加载中', duration: 0, forbidClick: true })
    }

    const info = userStore.profile
    if (info) {
      userInfo.value = info
      userVideoNums.value = info.video_nums || 0
      isVip.value = String(info.is_vip || 0)
      vipEndtime.value = String(info.endtime || '')
    }

    await getUserRealTimeInfo({ force })
    if (!silent) {
      closeToast()
    }
  }

  const fetchLatestPointsInfo = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    try {
      if (!silent) {
        showToast({ message: '加载中', duration: 0, forbidClick: true })
      }
      const pointsResult = await userStore.refreshPoints({
        loading: !silent,
      })
      if (pointsResult.code === 1 && pointsResult.data) {
        applyPointsDataToView(pointsResult.data)
      }
    } catch {
      // silent
    } finally {
      if (!silent) {
        closeToast()
      }
    }
  }

  const handleRefreshBalance = async () => {
    if (isRefreshing.value) return
    isRefreshing.value = true
    try {
      const pointsResult = await userStore.refreshPoints({ force: true, loading: true })
      if (pointsResult.code === 1 && pointsResult.data) {
        applyPointsDataToView(pointsResult.data)
        showToast({
          message: `刷新成功！观看次数：${pointsResult.data.video_nums}`,
          position: 'top',
          duration: 2000,
          icon: 'success',
        })
      } else {
        showToast({
          message: pointsResult.msg || '刷新失败',
          position: 'top',
          duration: 2000,
          icon: 'cross',
        })
      }
    } catch {
      showToast({
        message: '刷新失败，请稍后重试',
        position: 'top',
        duration: 2000,
        icon: 'cross',
      })
    } finally {
      isRefreshing.value = false
    }
  }

  const refreshUserPointsAfterCharge = async () => {
    try {
      showToast({
        message: '充值中...',
        position: 'top',
        duration: 0,
        className: 'custom-toast-loading',
        icon: 'loading',
      })

      const pointsResult = await userStore.refreshPoints({ force: true, loading: true })
      closeToast()

      if (pointsResult.code === 1 && pointsResult.data) {
        applyPointsDataToView(pointsResult.data)
        showToast({
          message: `当前观看次数：${pointsResult.data.video_nums}`,
          position: 'top',
          duration: 2000,
          className: 'custom-toast-success',
          icon: 'success',
        })
      } else {
        showToast({
          message: pointsResult.msg || '积分刷新失败',
          position: 'top',
          duration: 3000,
          className: 'custom-toast-error',
          icon: 'cross',
        })
      }
    } catch {
      closeToast()
      showToast({
        message: '刷新失败，请稍后重试',
        position: 'top',
        duration: 3000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
    }
  }

  return {
    userStore,
    userInfo,
    isRefreshing,
    userVideoNums,
    isVip,
    vipEndtime,
    userPoints,
    vipStatusDisplay,
    applyPointsDataToView,
    getUserRealTimeInfo,
    fetchUserInfo,
    fetchLatestPointsInfo,
    handleRefreshBalance,
    refreshUserPointsAfterCharge,
  }
}
