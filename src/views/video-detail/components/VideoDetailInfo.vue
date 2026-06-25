<script setup lang="ts">
import { Icon } from 'vant/es/icon'
import type { VideoDetail } from '@/api/fetch-api'

defineProps<{
  videoDetail: VideoDetail
  vipStatusDisplay: string
  isLoggedIn: boolean
  isRefreshing: boolean
  videoTagType: string
  isDigged: boolean
  isDiggLoading: boolean
  isCollected: boolean
  isCollectLoading: boolean
  canShowDownload: boolean
}>()

const emit = defineEmits<{
  refreshBalance: []
  share: []
  login: []
  digg: []
  collect: []
  download: []
}>()
</script>

<template>
  <div class="video-main">
    <div class="watch-limit-box">
      <div class="watch-info-wrapper">
        <div v-if="isLoggedIn" class="watch-text">{{ vipStatusDisplay }}</div>
        <div v-else class="watch-text">登录后查看积分</div>
        <button
          v-if="isLoggedIn"
          class="balance-refresh-btn"
          :disabled="isRefreshing"
          @click="emit('refreshBalance')"
        >
          <van-icon v-if="isRefreshing" name="loading" class="rotating" />
          <span v-else>刷新</span>
        </button>
      </div>
      <div v-if="isLoggedIn" class="share-btn" @click="emit('share')">分享免费观看2部</div>
      <div v-else class="share-btn" @click="emit('login')">登录</div>
    </div>

    <h1 class="main-video-title">{{ videoDetail.vod_name }}</h1>
    <div class="video-meta-tag">
      <div v-if="videoTagType === 'purchased'" class="meta-tag purchased">已购买</div>
      <div v-else-if="videoTagType === 'pay'" class="meta-tag pay">VIP</div>
      <div v-else class="meta-tag limited">限免</div>
      <div class="meta-views">{{ videoDetail.vod_hits }}次播放</div>
      <div class="meta-date">{{ videoDetail.vod_pubdate }}</div>
    </div>

    <div class="action-buttons">
      <div class="action-btn" :class="{ active: isDigged }" @click="emit('digg')">
        <Icon
          :name="isDigged ? 'good-job' : 'good-job-o'"
          size="16"
          :color="isDigged ? '#ff9500' : ''"
        />
        <div class="action-text">
          {{ isDiggLoading ? '点赞中...' : `点赞 (${videoDetail.vod_up || 0})` }}
        </div>
      </div>
      <div class="action-btn" :class="{ active: isCollected }" @click="emit('collect')">
        <Icon
          :name="isCollected ? 'star' : 'star-o'"
          size="16"
          :color="isCollected ? '#ff9500' : ''"
        />
        <div class="action-text">{{ isCollectLoading ? '收藏中...' : '收藏' }}</div>
      </div>
      <div class="action-btn" @click="emit('share')">
        <Icon name="share-o" size="16" />
        <div class="action-text">分享</div>
      </div>
      <div v-if="canShowDownload" class="action-btn" @click="emit('download')">
        <Icon name="down" size="16" />
        <div class="action-text">下载</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-main {
  padding: 15px;
  border-bottom: 8px solid #222;
}

.watch-limit-box {
  display: flex;
  align-items: center;
  background-image: url('@/assets/img/bg-share.svg');
  background-size: cover;
  background-repeat: no-repeat;
  padding: 6px 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.watch-info-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.watch-text {
  font-size: 14px;
  color: #8a4d31;
  font-weight: bold;
}

.balance-refresh-btn {
  background-color: #b66d39;
  color: #fff;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  min-width: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
}

.balance-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.balance-refresh-btn .rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.share-btn {
  background-color: #b66d39;
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  min-width: 80px;
  text-align: center;
}

.main-video-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  line-height: 1.4;
}

.video-meta-tag {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.meta-tag.limited {
  background-color: #4caf50;
  color: #fff;
}

.meta-tag.pay {
  background: linear-gradient(135deg, #ffd700, #ffb800);
  color: #333;
}

.meta-tag.purchased {
  background-color: #ff9500;
  color: #fff;
}

.meta-views,
.meta-date {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #999;
}

.action-btn.active {
  color: #ff9500;
}

.action-text {
  font-size: 12px;
}
</style>
