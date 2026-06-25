<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from 'vant/es/icon'
import { Loading } from 'vant/es/loading'
import VideoList from '@/components/VideoList.vue'
import type { ListAd, VideoItem } from '../types'

const props = defineProps<{
  recommendVideos: (VideoItem | ListAd)[]
  isRecommendLoading: boolean
  isRefreshingRecommends: boolean
  hasRecommendError: boolean
  recommendErrorMessage: string
}>()

const emit = defineEmits<{
  refresh: []
}>()

const isInitialLoading = computed(
  () =>
    props.isRecommendLoading &&
    !props.isRefreshingRecommends &&
    props.recommendVideos.length === 0,
)

const canShowRefresh = computed(
  () => !isInitialLoading.value && (props.recommendVideos.length > 0 || !props.isRecommendLoading),
)
</script>

<template>
  <div class="recommended-section">
    <div class="section-divider">
      <div class="section-line" />
      <div class="section-label">猜你喜欢</div>
      <div class="section-line" />
    </div>

    <div v-if="isInitialLoading" class="loading-state">
      <Loading type="spinner" color="#ff9500" />
      <div class="loading-text">加载中...</div>
    </div>

    <div
      v-else-if="hasRecommendError && recommendVideos.length === 0"
      class="error-state"
    >
      <Icon name="warning-o" size="24" color="#ff9500" />
      <div class="error-text">加载失败，请稍后再试</div>
      <div v-if="recommendErrorMessage" class="error-detail">{{ recommendErrorMessage }}</div>
    </div>

    <template v-else>
      <div class="recommend-list-wrap" :class="{ 'is-refreshing': isRefreshingRecommends }">
        <div v-if="isRefreshingRecommends" class="refresh-loading-overlay">
          <Loading type="spinner" color="#ff9500" />
          <div class="loading-text">加载中...</div>
        </div>

        <VideoList
          v-if="recommendVideos.length > 0"
          :videos="recommendVideos"
          return-path="/"
        />
        <div v-else class="empty-recommend">暂无推荐视频</div>
      </div>

      <div
        v-if="canShowRefresh"
        class="refresh-btn"
        :class="{ disabled: isRefreshingRecommends }"
        @click="!isRefreshingRecommends && emit('refresh')"
      >
        <Loading v-if="isRefreshingRecommends" type="spinner" color="#ff9500" size="16px" />
        <Icon v-else name="replay" />
        <span>{{ isRefreshingRecommends ? '加载中...' : '换一批' }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.recommended-section {
  padding: 15px;
}

.section-divider {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.section-line {
  flex: 1;
  height: 1px;
  background-color: #333;
}

.section-label {
  padding: 0 15px;
  font-size: 16px;
  font-weight: bold;
  color: #ff9500;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  gap: 10px;
}

.loading-text,
.error-text {
  color: #999;
  font-size: 14px;
}

.error-detail {
  color: #666;
  font-size: 12px;
}

.empty-recommend {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 14px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff9500;
  font-size: 14px;
  padding: 10px 0;
  margin-bottom: 15px;
  cursor: pointer;
  gap: 5px;
}

.refresh-btn.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.recommend-list-wrap {
  position: relative;
  min-height: 80px;
}

.recommend-list-wrap.is-refreshing {
  pointer-events: none;
}

.refresh-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(17, 17, 17, 0.75);
  border-radius: 8px;
}

.refresh-loading-overlay .loading-text {
  color: #999;
  font-size: 14px;
}
</style>
