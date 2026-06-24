import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getUserInfo,
  isLoggedIn as checkLoggedIn,
  isGuestUser,
  refreshUserPoints,
  clearAllCache,
  type UserInfo,
  type RefreshUserPointsResult,
} from '@/api/fetch-api'
import { isVipActive as checkVipActive } from '@/utils/user-vip'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserInfo | null>(getUserInfo())

  const uid = computed(() => profile.value?.user_id || profile.value?.id || 0)
  const token = computed(() => profile.value?.token || '')
  const coin = computed(() => Number(profile.value?.coin ?? 0))
  const points = computed(() => {
    const p = profile.value
    if (!p) return 0
    return Number(p.user_points ?? p.points ?? 0)
  })
  const videoNums = computed(() => Number(profile.value?.video_nums ?? 0))
  const isVip = computed(() => profile.value?.is_vip ?? 0)
  const vipEndtime = computed(() => profile.value?.endtime ?? '')
  const isGuest = computed(() => isGuestUser())
  const isLoggedIn = computed(() => checkLoggedIn() && profile.value?.token)
  const isVipUser = computed(() => checkVipActive(vipEndtime.value, isVip.value))
  const nickName = computed(
    () => profile.value?.user_nick_name || profile.value?.user_name || '用户',
  )
  const avatar = computed(() => profile.value?.user_portrait || profile.value?.avatar_thumb || '')

  function hydrateFromStorage() {
    profile.value = getUserInfo()
  }

  async function refreshPoints(options?: {
    force?: boolean
    loading?: boolean
  }): Promise<RefreshUserPointsResult> {
    const result = await refreshUserPoints(options)
    hydrateFromStorage()
    return result
  }

  function logoutLocal() {
    clearAllCache()
    profile.value = null
  }

  return {
    profile,
    uid,
    token,
    coin,
    points,
    videoNums,
    isVip,
    vipEndtime,
    isGuest,
    isLoggedIn,
    isVipUser,
    nickName,
    avatar,
    hydrateFromStorage,
    refreshPoints,
    logoutLocal,
  }
})
