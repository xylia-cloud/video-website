<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { VideoDetail } from '@/api/fetch-api'
import { captureInviteCode } from '@/utils/invite'
import { performTouristLogin } from '@/composables/useTouristLogin'
import BottomTabbar from '@/components/BottomTabbar.vue'
import { Icon } from 'vant/es/icon'
import { Loading } from 'vant/es/loading'

import VideoDetailChargeModals from './video-detail/components/VideoDetailChargeModals.vue'
import VideoDetailPlayer from './video-detail/components/VideoDetailPlayer.vue'
import VideoDetailInfo from './video-detail/components/VideoDetailInfo.vue'
import VideoDetailRecommend from './video-detail/components/VideoDetailRecommend.vue'
import { useVideoDetailUser } from './video-detail/composables/useVideoDetailUser'
import { useVideoCharge } from './video-detail/composables/useVideoCharge'
import { useVideoPlayer } from './video-detail/composables/useVideoPlayer'
import { useVideoRecommend } from './video-detail/composables/useVideoRecommend'
import { useVideoDetailPage } from './video-detail/composables/useVideoDetailPage'

const route = useRoute()
const router = useRouter()

const videoId = ref(route.params.id as string)
const videoDetail = ref<VideoDetail | null>(null)
const videoSrc = ref('')

const userApi = useVideoDetailUser()
const chargeApi = useVideoCharge(userApi)
const playerApi = useVideoPlayer(videoDetail, videoSrc)
const recommendApi = useVideoRecommend(videoId, videoDetail)
const pageApi = useVideoDetailPage(
  videoId,
  videoDetail,
  videoSrc,
  userApi,
  chargeApi,
  playerApi,
)

const {
  userStore,
  isRefreshing,
  vipStatusDisplay,
  fetchUserInfo,
  handleRefreshBalance,
} = userApi

const {
  showChargeModal,
  showChargeCompleteDialog,
  chargeOptions,
  isLoadingChargeOptions,
  selectedChargeOption,
  selectChargeOption,
  confirmCharge,
  handleChargeComplete,
} = chargeApi

const {
  isPlaying,
  isVideoFloating,
  videoContainerRef,
  videoEl,
  hasVideoError,
  videoErrorMessage,
  canShowDownload,
  cleanupVideoPlayer,
  stopPlayback,
  handleVideoError,
  handleDownloadVideo,
  handleScroll,
} = playerApi

const {
  recommendVideos,
  isRecommendLoading,
  hasRecommendError,
  recommendErrorMessage,
  isRefreshingRecommends,
  resetRecommendState,
  fetchRecommendVideosData,
  refreshRecommends,
  fetchListAds,
} = recommendApi

const {
  isLoading,
  hasDetailError,
  detailErrorMessage,
  isNeedPay,
  showVideoAd,
  isDigged,
  isDiggLoading,
  isCollected,
  isCollectLoading,
  videoTagType,
  fetchVideoDetailData,
  setGoBackHandler,
  playVideo,
  closeVideoAdAndPlay,
  handleVideoPlay,
  handleDigg,
  handleCollect,
  shareVideo,
  goToLogin,
  handleAuthSuccess,
} = pageApi

const loadDetailPage = async () => {
  resetRecommendState()
  await fetchVideoDetailData()
  if (!videoDetail.value || hasDetailError.value) {
    isRecommendLoading.value = false
    return
  }
  void loadRecommendAsync()
}

const loadRecommendAsync = async () => {
  await fetchListAds()
  await fetchRecommendVideosData()
}

const playerComponentRef = ref<InstanceType<typeof VideoDetailPlayer> | null>(null)

const syncPlayerRefs = () => {
  const exposed = playerComponentRef.value
  if (!exposed) return
  videoContainerRef.value = exposed.containerRef ?? null
  videoEl.value = exposed.videoRef ?? null
}

const goBack = () => {
  if (isPlaying.value) {
    stopPlayback()
  }
  router.back()
}

setGoBackHandler(goBack)

const onAuthSuccess = () => {
  void handleAuthSuccess()
}

watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) return
    videoId.value = newId as string
    stopPlayback()
    showVideoAd.value = false
    await loadDetailPage()
  },
)

watch(isPlaying, async (playing) => {
  if (playing) {
    await nextTick()
    syncPlayerRefs()
  }
})

onMounted(async () => {
  captureInviteCode(route)
  window.addEventListener('global-auth-success', onAuthSuccess)

  await performTouristLogin({
    route,
    showFailureToast: false,
    silentLoading: true,
    silentSuccessToast: true,
  })

  await fetchUserInfo({ silent: true })
  await loadDetailPage()

  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('global-auth-success', onAuthSuccess)
  window.removeEventListener('scroll', handleScroll)
  cleanupVideoPlayer()
  showVideoAd.value = false
})
</script>

<template>
  <div class="video-detail-page">
    <VideoDetailChargeModals
      v-model:show-charge-modal="showChargeModal"
      :show-charge-complete-dialog="showChargeCompleteDialog"
      :charge-options="chargeOptions"
      :is-loading-charge-options="isLoadingChargeOptions"
      :selected-charge-option="selectedChargeOption"
      @select-option="selectChargeOption"
      @confirm-charge="confirmCharge"
      @charge-complete="handleChargeComplete()"
    />

    <div class="top-nav">
      <div class="back-btn" @click="goBack">
        <Icon name="arrow-left" color="#fff" size="20" />
      </div>
      <div class="page-title">{{ videoDetail?.vod_name || '视频详情' }}</div>
      <div class="placeholder" />
    </div>

    <div v-if="isLoading" class="loading-state">
      <Loading type="spinner" color="#ff9500" />
      <div class="loading-text">加载中...</div>
    </div>

    <div v-else-if="hasDetailError" class="error-state">
      <Icon name="warning-o" size="24" color="#ff9500" />
      <div class="error-text">加载失败，请稍后再试</div>
      <div v-if="detailErrorMessage" class="error-detail">{{ detailErrorMessage }}</div>
    </div>

    <template v-else-if="videoDetail">
      <VideoDetailPlayer
        ref="playerComponentRef"
        :video-detail="videoDetail"
        :is-playing="isPlaying"
        :is-video-floating="isVideoFloating"
        :is-need-pay="isNeedPay"
        :has-video-error="hasVideoError"
        :video-error-message="videoErrorMessage"
        :show-video-ad="showVideoAd"
        @play="playVideo"
        @retry="playVideo"
        @stop="stopPlayback"
        @video-play="handleVideoPlay"
        @video-error="handleVideoError"
        @close-ad="closeVideoAdAndPlay"
      />

      <VideoDetailInfo
        :video-detail="videoDetail"
        :vip-status-display="vipStatusDisplay"
        :is-logged-in="!!userStore.isLoggedIn"
        :is-refreshing="isRefreshing"
        :video-tag-type="videoTagType"
        :is-digged="isDigged"
        :is-digg-loading="isDiggLoading"
        :is-collected="isCollected"
        :is-collect-loading="isCollectLoading"
        :can-show-download="canShowDownload"
        @refresh-balance="handleRefreshBalance"
        @share="shareVideo"
        @login="goToLogin"
        @digg="handleDigg"
        @collect="handleCollect"
        @download="handleDownloadVideo"
      />

      <VideoDetailRecommend
        :recommend-videos="recommendVideos"
        :is-recommend-loading="isRecommendLoading"
        :is-refreshing-recommends="isRefreshingRecommends"
        :has-recommend-error="hasRecommendError"
        :recommend-error-message="recommendErrorMessage"
        @refresh="refreshRecommends"
      />
    </template>

    <BottomTabbar />
  </div>
</template>

<style scoped>
.video-detail-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 50px;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background-color: #222;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.page-title {
  font-size: 16px;
  font-weight: bold;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder {
  width: 24px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  gap: 12px;
}

.loading-text,
.error-text {
  color: #999;
  font-size: 14px;
}

.error-detail {
  color: #666;
  font-size: 12px;
  text-align: center;
}
</style>
