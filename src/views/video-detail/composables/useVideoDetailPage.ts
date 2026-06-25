import type { Ref } from 'vue'
import type { VideoDetail } from '@/api/fetch-api'
import { useVideoDetailAuth } from './useVideoDetailAuth'
import { useVideoDetailData } from './useVideoDetailData'
import { useVideoPaywall } from './useVideoPaywall'
import { useVideoSocial } from './useVideoSocial'
import type { useVideoCharge } from './useVideoCharge'
import type { useVideoDetailUser } from './useVideoDetailUser'
import type { useVideoPlayer } from './useVideoPlayer'

type UserApi = ReturnType<typeof useVideoDetailUser>
type ChargeApi = ReturnType<typeof useVideoCharge>
type PlayerApi = ReturnType<typeof useVideoPlayer>

export function useVideoDetailPage(
  videoId: Ref<string>,
  videoDetail: Ref<VideoDetail | null>,
  videoSrc: Ref<string>,
  userApi: UserApi,
  chargeApi: ChargeApi,
  playerApi: PlayerApi,
) {
  const authApi = useVideoDetailAuth(userApi)
  const socialApi = useVideoSocial(videoDetail, userApi, authApi)
  const paywallApi = useVideoPaywall(videoDetail, userApi, chargeApi, playerApi, authApi)
  const dataApi = useVideoDetailData(
    videoId,
    videoDetail,
    videoSrc,
    playerApi,
    authApi,
    socialApi,
  )

  const fetchVideoDetailData = (onLoaded?: () => void) =>
    dataApi.fetchVideoDetailData(
      {
        isNeedPay: paywallApi.isNeedPay,
        pointsNeeded: paywallApi.pointsNeeded,
        isWatched: paywallApi.isWatched,
      },
      onLoaded,
    )

  return {
    ...authApi,
    ...socialApi,
    ...paywallApi,
    ...dataApi,
    fetchVideoDetailData,
  }
}
