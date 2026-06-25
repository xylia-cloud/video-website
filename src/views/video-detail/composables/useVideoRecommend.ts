import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAds, fetchDetailRecommend } from '@/api/fetch-api'
import type { VideoDetailRef } from '../types'
import type { ListAd, VideoItem } from '../types'
import { AD_POSITIONS } from '../types'
import { processAdImageUrl, resolveCoverUrl } from '../utils'

export function useVideoRecommend(videoId: Ref<string>, videoDetail: Ref<VideoDetailRef>) {
  const router = useRouter()

  const recommendVideos = ref<(VideoItem | ListAd)[]>([])
  const isRecommendLoading = ref(true)
  const hasRecommendError = ref(false)
  const recommendErrorMessage = ref('')
  const isRefreshingRecommends = ref(false)
  const listAds = ref<ListAd[]>([])

  const mapApiVideo = (item: Record<string, unknown>): VideoItem => {
    const pointsPlay =
      item.vod_points_play !== undefined ? Number(item.vod_points_play) : 0
    const isVip = pointsPlay > 0
    return {
      id: Number(item.vod_id || item.id),
      coverUrl: resolveCoverUrl(String(item.vod_pic || '')),
      title: String(item.vod_name || ''),
      isVip,
      isFree: !isVip,
      duration: String(item.vod_duration || ''),
      class: String(item.vod_class || item.type_name || ''),
      time: String(item.vod_pubdate || item.vod_time || ''),
      points: isVip ? `${pointsPlay}积分` : '',
    }
  }

  const extractVideoList = (result: unknown): Record<string, unknown>[] => {
    if (!result || typeof result !== 'object') return []
    const r = result as Record<string, unknown>
    let raw: unknown[] = []
    if (Array.isArray(r.data)) raw = r.data
    else if (Array.isArray(r.list)) raw = r.list
    else if (r.data && typeof r.data === 'object' && Array.isArray((r.data as { list?: unknown[] }).list)) {
      raw = (r.data as { list: unknown[] }).list
    } else if (Array.isArray(result)) raw = result
    return raw.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
  }

  const insertAds = (videos: VideoItem[]): (VideoItem | ListAd)[] => {
    let processed: (VideoItem | ListAd)[] = videos.slice(0, 10)
    if (listAds.value.length === 0) return processed

    const adsToUse = listAds.value.slice(0, 3)
    for (let i = 0; i < Math.min(AD_POSITIONS.length, adsToUse.length); i++) {
      const position = AD_POSITIONS[i]!
      if (processed.length >= position) {
        processed = [...processed]
        processed.splice(position, 0, adsToUse[i]!)
      }
    }
    return processed
  }

  const resetRecommendState = () => {
    recommendVideos.value = []
    isRecommendLoading.value = true
    hasRecommendError.value = false
    recommendErrorMessage.value = ''
  }

  const fetchRecommendVideosData = async (refresh = false) => {
    try {
      if (refresh) {
        isRefreshingRecommends.value = true
      } else {
        isRecommendLoading.value = true
      }
      hasRecommendError.value = false
      recommendErrorMessage.value = ''

      const params = {
        id: videoId.value,
        page: 1,
        type_id: videoDetail.value?.type_id || 1,
      }

      const result = await fetchDetailRecommend(params)
      const videoList = extractVideoList(result)

      if (videoList.length > 0) {
        recommendVideos.value = insertAds(videoList.map(mapApiVideo))
      } else {
        recommendVideos.value = []
      }
    } catch (error: unknown) {
      hasRecommendError.value = true
      recommendErrorMessage.value =
        error instanceof Error ? error.message : '加载失败，请稍后再试'
    } finally {
      isRecommendLoading.value = false
      isRefreshingRecommends.value = false
    }
  }

  const refreshRecommends = () => {
    if (isRefreshingRecommends.value) return
    fetchRecommendVideosData(true)
  }

  const fetchListAds = async () => {
    try {
      const result = await fetchAds({ ad_pos: 4, ad_type: 2 })
      if (result?.code === 1 && Array.isArray(result.data) && result.data.length > 0) {
        listAds.value = result.data.map((item: Record<string, unknown>) => ({
          id: Number(item.id || 0),
          coverUrl: processAdImageUrl(String(item.ad_img || '')),
          title: String(item.ad_name || '广告'),
          isVip: false,
          isFree: true,
          class: '广告',
          link: String(item.ad_url || ''),
          points: '',
          isAd: true as const,
        }))
      } else {
        listAds.value = []
      }
    } catch {
      listAds.value = []
    }
  }

  const handleAdClick = (ad: ListAd) => {
    if (!ad.link) return
    if (ad.link.startsWith('/')) {
      router.push(ad.link)
    } else {
      window.open(ad.link, '_blank')
    }
  }

  return {
    recommendVideos,
    isRecommendLoading,
    hasRecommendError,
    recommendErrorMessage,
    isRefreshingRecommends,
    resetRecommendState,
    fetchRecommendVideosData,
    refreshRecommends,
    fetchListAds,
    handleAdClick,
  }
}
