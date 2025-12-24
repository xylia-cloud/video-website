<template>
  <!-- 全屏Loading -->
  <div v-if="isFullScreenLoading" class="fullscreen-loading">
    <van-loading type="spinner" size="40px" color="#ff9500" />
    <div class="loading-text">加载中...</div>
  </div>

  <!-- 加载更多状态（仅非第一个标签显示） -->
  <div v-if="isLoadingMore && !isFirstTabActive" class="loading-more">
    <van-loading type="spinner" size="20" color="#ff9500" />
    <van-icon name="down" size="16" color="#999" />
    <span>正在加载更多...</span>
  </div>

  <!-- 已全部加载（仅非第一个标签显示） -->
  <div
    v-if="
      videoDataLength > 0 && !hasMoreVideos && !isLoading && !isLoadingMore && !isFirstTabActive
    "
    class="all-loaded"
  >
    已经到底了~
  </div>
</template>

<script setup lang="ts">
interface Props {
  isFullScreenLoading: boolean
  isLoadingMore: boolean
  isFirstTabActive: boolean
  videoDataLength: number
  hasMoreVideos: boolean
  isLoading: boolean
}

defineProps<Props>()
</script>

<style scoped>
/* 全屏Loading样式 */
.fullscreen-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(17, 17, 17, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.fullscreen-loading .loading-text {
  margin-top: 15px;
  color: #fff;
  font-size: 14px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
  margin-bottom: 15px;
  color: #999;
  font-size: 14px;
  gap: 8px;
}

.all-loaded {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  margin-bottom: 15px;
  color: #999;
  font-size: 14px;
}
</style>
