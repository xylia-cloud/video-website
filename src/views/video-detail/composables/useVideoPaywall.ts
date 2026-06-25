import { computed, ref, type Ref } from 'vue'
import { updateUserLog, updateVideoHits } from '@/api/fetch-api'
import type { VideoDetail } from '@/api/fetch-api'
import { ENABLE_PLAY_VIDEO_AD } from '../types'
import { isLoginRequiredResult } from '../utils'
import type { useVideoCharge } from './useVideoCharge'
import type { useVideoDetailAuth } from './useVideoDetailAuth'
import type { useVideoDetailUser } from './useVideoDetailUser'
import type { useVideoPlayer } from './useVideoPlayer'

type UserApi = ReturnType<typeof useVideoDetailUser>
type ChargeApi = ReturnType<typeof useVideoCharge>
type PlayerApi = ReturnType<typeof useVideoPlayer>
type AuthApi = ReturnType<typeof useVideoDetailAuth>

export function useVideoPaywall(
  videoDetail: Ref<VideoDetail | null>,
  userApi: UserApi,
  chargeApi: ChargeApi,
  playerApi: PlayerApi,
  authApi: AuthApi,
) {
  const isNeedPay = ref(false)
  const pointsNeeded = ref(0)
  const isWatched = ref(false)
  const showVideoAd = ref(false)

  const isFreeVideo = computed(() => {
    if (!videoDetail.value) return true
    if (
      videoDetail.value.vod_points_play !== undefined &&
      videoDetail.value.vod_points_play !== null
    ) {
      const pointsValue = Number(videoDetail.value.vod_points_play)
      return Number.isNaN(pointsValue) || pointsValue <= 0
    }
    return true
  })

  const videoTagType = computed(() => {
    if (!videoDetail.value) return 'limited'
    if (!isFreeVideo.value && isWatched.value) return 'purchased'
    if (!isFreeVideo.value) return 'pay'
    return 'limited'
  })

  const updatePlayCount = async () => {
    if (!videoDetail.value?.vod_id) return
    try {
      const result = await updateVideoHits({
        mid: 1,
        id: videoDetail.value.vod_id,
        type: 'update',
      })
      if (result?.data?.hits && videoDetail.value) {
        videoDetail.value.vod_hits = result.data.hits
      }
    } catch {
      // silent
    }
  }

  const recordWatchHistory = async (): Promise<boolean> => {
    if (!videoDetail.value?.vod_id) return true
    try {
      const result = await updateUserLog({
        mid: 1,
        id: videoDetail.value.vod_id,
        type: 1,
        ac: 'set',
      })
      if (result?.code === 1) return true
      if (isLoginRequiredResult(result)) {
        authApi.showAuthenticationModal('login')
        return false
      }
      return true
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (
        message.includes('请先登录') ||
        message.includes('认证失败') ||
        message.includes('重新登录')
      ) {
        authApi.showAuthenticationModal('login')
        return false
      }
      return true
    }
  }

  const startVideoPlayback = () => playerApi.beginPlayback(recordWatchHistory)

  const deductPointsAndPlay = async () => {
    const played = await startVideoPlayback()
    if (!played) return
    isWatched.value = true
    setTimeout(async () => {
      await userApi.getUserRealTimeInfo({ force: true })
    }, 2000)
  }

  const continuePlay = async () => {
    showToast({ message: '加载中', duration: 0, forbidClick: true })
    try {
      const latestUserInfo = await userApi.getUserRealTimeInfo({ force: true })
      closeToast()

      if (isWatched.value) {
        await startVideoPlayback()
        return
      }

      if (isNeedPay.value && pointsNeeded.value > 0) {
        if (Number(userApi.isVip.value) === 1) {
          await startVideoPlayback()
          return
        }

        const currentVideoNums = userApi.userVideoNums.value || 0
        if (currentVideoNums >= 1) {
          showDialog({
            title: '付费确认',
            message: '观看此视频需要扣除 1 观影次数，确认观看吗？',
            confirmButtonText: '扣除 1 观影次数观看',
            cancelButtonText: '取消',
            showCancelButton: true,
            confirmButtonColor: '#ff9500',
          })
            .then(() => deductPointsAndPlay())
            .catch(() => {})
          return
        }

        const currentPoints =
          latestUserInfo?.points !== undefined
            ? Number(latestUserInfo.points)
            : userApi.userPoints.value

        if (currentPoints < pointsNeeded.value) {
          await chargeApi.showChargeDialog()
          return
        }

        showDialog({
          title: '付费确认',
          message: `观看此视频需要扣除 ${pointsNeeded.value} 积分，确认观看吗？`,
          confirmButtonText: `扣除 ${pointsNeeded.value} 积分观看`,
          cancelButtonText: '取消',
          showCancelButton: true,
          confirmButtonColor: '#ff9500',
        })
          .then(() => deductPointsAndPlay())
          .catch(() => {})
        return
      }

      await startVideoPlayback()
    } catch {
      closeToast()
      showToast({ message: '检查播放权限失败，请稍后重试', icon: 'fail' })
    }
  }

  const playVideo = async () => {
    if (ENABLE_PLAY_VIDEO_AD) {
      showVideoAd.value = true
      return
    }
    await continuePlay()
  }

  const closeVideoAdAndPlay = () => {
    showVideoAd.value = false
    void continuePlay()
  }

  const handleVideoPlay = () => {
    if (!playerApi.isVideoPlayed.value) {
      playerApi.isVideoPlayed.value = true
      void updatePlayCount()
      if (isNeedPay.value && pointsNeeded.value > 0) {
        isWatched.value = true
        setTimeout(async () => {
          await userApi.getUserRealTimeInfo({ force: true })
        }, 2000)
      }
    }
  }

  authApi.registerPlayAfterAuth(playVideo)

  return {
    isNeedPay,
    pointsNeeded,
    isWatched,
    showVideoAd,
    isFreeVideo,
    videoTagType,
    playVideo,
    closeVideoAdAndPlay,
    handleVideoPlay,
  }
}
