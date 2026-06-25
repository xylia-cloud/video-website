<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from 'vant/es/icon'
import type { VideoDetail } from '@/api/fetch-api'
import { ENABLE_PLAY_VIDEO_AD } from '../types'
import { resolveCoverUrl } from '../utils'

defineProps<{
  videoDetail: VideoDetail
  isPlaying: boolean
  isVideoFloating: boolean
  isNeedPay: boolean
  hasVideoError: boolean
  videoErrorMessage: string
  showVideoAd: boolean
}>()

const emit = defineEmits<{
  play: []
  retry: []
  stop: []
  videoPlay: []
  videoEnded: []
  videoError: []
  closeAd: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

defineExpose({ containerRef, videoRef })
</script>

<template>
  <div
    ref="containerRef"
    :class="['video-container', { 'video-floating': isVideoFloating && isPlaying }]"
  >
    <div v-if="ENABLE_PLAY_VIDEO_AD && showVideoAd" class="video-ad-overlay">
      <div class="video-ad-modal">
        <div class="ad-close-btn" @click="emit('closeAd')">
          <Icon name="cross" size="20" color="#fff" />
        </div>
        <div class="ad-content">
          <img src="@/assets/img/ad-video-cover.jpeg" alt="广告" class="ad-image" />
        </div>
      </div>
    </div>

    <template v-if="isPlaying">
      <div v-if="hasVideoError" class="play-error">
        <Icon name="warning-o" size="50" color="#ff6b6b" />
        <div class="error-msg">{{ videoErrorMessage || '视频播放失败' }}</div>
        <div class="retry-btn" @click="emit('retry')">重试</div>
      </div>
      <video
        v-else
        ref="videoRef"
        controls
        autoplay
        playsinline
        webkit-playsinline
        x5-playsinline
        x5-video-player-type="h5"
        x5-video-player-fullscreen="false"
        class="video-player"
        @error="emit('videoError')"
        @play="emit('videoPlay')"
        @ended="emit('videoEnded')"
      >
        您的浏览器不支持 HTML5 视频播放
      </video>

      <div v-if="isVideoFloating" class="floating-close" @click="emit('stop')">
        <Icon name="cross" size="20" color="#fff" />
      </div>
    </template>

    <div v-else class="main-video-cover">
      <img :src="resolveCoverUrl(videoDetail.vod_pic)" alt="视频封面" />
      <div class="play-btn" @click="emit('play')">
        <Icon name="play-circle-o" size="48" color="#fff" />
        <div v-if="isNeedPay" class="pay-badge">VIP</div>
      </div>
    </div>
  </div>

  <div v-if="isVideoFloating && isPlaying" class="video-placeholder" />
</template>

<style scoped>
.video-container {
  width: 100%;
  position: relative;
  aspect-ratio: 16/9;
  background-color: #000;
  transition: all 0.3s ease;
  overflow: hidden;
}

.video-floating {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99;
  max-height: 30vh;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.floating-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: pointer;
}

.video-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #111;
}

.play-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
}

.error-msg {
  margin-top: 20px;
  color: #fff;
  font-size: 16px;
  text-align: center;
}

.retry-btn {
  margin-top: 20px;
  background-color: #ff9500;
  color: #000;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
}

.main-video-cover {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.main-video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  cursor: pointer;
}

.pay-badge {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  color: #333;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.video-ad-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.video-ad-modal {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

.ad-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.ad-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
