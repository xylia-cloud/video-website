<template>
  <div class="video-section">
    <!-- 最热视频列表（仅首页标签显示标题） -->
    <div v-if="isFirstTabActive">
      <!-- 最热标题 -->
      <div class="section-title">最热</div>
      <div v-if="isLoading" class="loading-state">
        <van-loading type="spinner" color="#ff9500" />
        <div class="loading-text">加载中...</div>
      </div>
      <div v-else-if="hasError" class="error-state">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载失败，请稍后再试</div>
        <div v-if="errorMessage" class="error-detail">{{ errorMessage }}</div>
      </div>

      <VideoList v-else :videos="videoData" />

      <!-- 热门视频换一批按钮 -->
      <div v-if="videoData.length > 0 && !isLoading" class="refresh-btn" @click="refreshVideos">
        <van-icon name="replay" />
        <span>换一批</span>
      </div>
    </div>

    <!-- 最新视频列表（仅首页标签显示） -->
    <div v-if="isFirstTabActive">
      <!-- 最新标题 -->
      <div class="section-title">最新</div>
      <div v-if="isLoadingLatest || latestVideoData.length === 0" class="loading-state">
        <van-loading type="spinner" color="#ff9500" />
        <div class="loading-text">{{ isLoadingLatest ? '加载最新视频中...' : '加载中...' }}</div>
      </div>
      <div v-else-if="hasLatestError" class="error-state">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载失败，请稍后再试</div>
        <div v-if="latestErrorMessage" class="error-detail">{{ latestErrorMessage }}</div>
      </div>
      <VideoList v-else :videos="latestVideoData" />

      <!-- 最新视频换一批按钮 -->
      <div
        v-if="latestVideoData.length > 0 && !isLoadingLatest"
        class="refresh-btn"
        @click="refreshLatestVideos"
      >
        <van-icon name="replay" />
        <span>换一批</span>
      </div>
    </div>

    <!-- 非首页标签的视频列表 -->
    <div v-else>
      <div v-if="isLoading && videoData.length === 0" class="loading-state">
        <van-loading type="spinner" color="#ff9500" />
        <div class="loading-text">加载中...</div>
      </div>
      <div v-else-if="hasError" class="error-state">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载失败，请稍后再试</div>
        <div v-if="errorMessage" class="error-detail">{{ errorMessage }}</div>
      </div>
      <VideoList v-else :videos="videoData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoList from '@/components/VideoList.vue'

interface VideoItem {
  id?: number
  coverUrl: string
  title: string
  isVip?: boolean
  isFree?: boolean
  duration?: string
  class?: string
  time?: string
  points?: number | string
  link?: string // 广告链接
  isAd?: boolean // 是否为广告
}

interface Props {
  isFirstTabActive: boolean
  isLoading: boolean
  hasError: boolean
  errorMessage?: string
  videoData: VideoItem[]
  isLoadingLatest: boolean
  hasLatestError: boolean
  latestErrorMessage?: string
  latestVideoData: VideoItem[]
}

interface Emits {
  (e: 'refresh-videos'): void
  (e: 'refresh-latest-videos'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const refreshVideos = () => {
  emit('refresh-videos')
}

const refreshLatestVideos = () => {
  emit('refresh-latest-videos')
}
</script>

<style scoped>
.video-section {
  width: 100%;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 15px;
  padding: 0 10px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.loading-text {
  margin-top: 10px;
  font-size: 14px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.error-text {
  margin-top: 10px;
  font-size: 14px;
}

.error-detail {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
  padding: 10px 20px;
  background-color: #333;
  border-radius: 20px;
  color: #ff9500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.refresh-btn:hover {
  background-color: #444;
}

.refresh-btn span {
  margin-left: 5px;
}
</style>
