import { ref, type Ref } from 'vue'
import { fetchVideoDetail } from '@/api/fetch-api'
import type { VideoDetail } from '@/api/fetch-api'
import { isLoginRequiredResult } from '../utils'
import type { useVideoDetailAuth } from './useVideoDetailAuth'
import type { useVideoPlayer } from './useVideoPlayer'
import type { useVideoSocial } from './useVideoSocial'

type AuthApi = ReturnType<typeof useVideoDetailAuth>
type PlayerApi = ReturnType<typeof useVideoPlayer>
type SocialApi = ReturnType<typeof useVideoSocial>

export function useVideoDetailData(
  videoId: Ref<string>,
  videoDetail: Ref<VideoDetail | null>,
  videoSrc: Ref<string>,
  playerApi: PlayerApi,
  authApi: AuthApi,
  socialApi: SocialApi,
) {
  const isLoading = ref(true)
  const hasDetailError = ref(false)
  const detailErrorMessage = ref('')

  let detailRequestSeq = 0
  let onGoBack: (() => void) | undefined

  const setGoBackHandler = (fn: () => void) => {
    onGoBack = fn
  }

  const applyDetailResult = (
    data: VideoDetail,
    paywall: {
      isNeedPay: Ref<boolean>
      pointsNeeded: Ref<number>
      isWatched: Ref<boolean>
    },
  ) => {
    videoDetail.value = data

    if (data.vod_play_url && data.vod_play_url !== 'undefined' && data.vod_play_url !== 'null') {
      videoSrc.value = data.vod_play_url
    } else {
      playerApi.hasVideoError.value = true
      playerApi.videoErrorMessage.value = '视频源不可用，请稍后再试'
    }

    if (data.vod_points_play !== undefined && data.vod_points_play !== null) {
      const pointsValue = Number(data.vod_points_play)
      if (!Number.isNaN(pointsValue) && pointsValue > 0) {
        paywall.isNeedPay.value = true
        paywall.pointsNeeded.value = pointsValue
      } else {
        paywall.isNeedPay.value = false
        paywall.pointsNeeded.value = 0
      }
    } else {
      paywall.isNeedPay.value = false
      paywall.pointsNeeded.value = 0
    }

    if (data.is_watched !== undefined) {
      paywall.isWatched.value = data.is_watched === 1
    }
    if (data.user_digg === 1) socialApi.isDigged.value = true
    if (data.user_collect === 1) socialApi.isCollected.value = true
  }

  const resetPaywallState = (paywall: {
    isNeedPay: Ref<boolean>
    pointsNeeded: Ref<number>
    isWatched: Ref<boolean>
  }) => {
    paywall.isNeedPay.value = false
    paywall.pointsNeeded.value = 0
    paywall.isWatched.value = false
    socialApi.resetSocialState()
  }

  const fetchVideoDetailData = async (
    paywall: {
      isNeedPay: Ref<boolean>
      pointsNeeded: Ref<number>
      isWatched: Ref<boolean>
    },
    onLoaded?: () => void,
  ) => {
    const seq = ++detailRequestSeq
    const requestedId = videoId.value
    isLoading.value = true
    hasDetailError.value = false
    detailErrorMessage.value = ''
    playerApi.hasVideoError.value = false
    playerApi.videoErrorMessage.value = ''
    resetPaywallState(paywall)

    try {
      const result = await fetchVideoDetail(requestedId, { loading: false })

      if (seq !== detailRequestSeq || videoId.value !== requestedId) return

      if (isLoginRequiredResult(result)) {
        showDialog({
          title: '需要登录',
          message: '观看视频需要登录，是否前往登录？',
          confirmButtonText: '去登录',
          cancelButtonText: '取消',
          showCancelButton: true,
          confirmButtonColor: '#ff9500',
        })
          .then(() => authApi.showAuthenticationModal('login'))
          .catch(() => onGoBack?.())
        return
      }

      if (result.code === 1 && result.data) {
        applyDetailResult(result.data, paywall)
        onLoaded?.()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        hasDetailError.value = true
        detailErrorMessage.value = result.msg || '获取视频详情失败'
      }
    } catch (error: unknown) {
      hasDetailError.value = true
      detailErrorMessage.value =
        error instanceof Error ? error.message : '网络请求错误'
    } finally {
      if (seq === detailRequestSeq) {
        isLoading.value = false
      }
    }
  }

  return {
    isLoading,
    hasDetailError,
    detailErrorMessage,
    fetchVideoDetailData,
    setGoBackHandler,
  }
}
