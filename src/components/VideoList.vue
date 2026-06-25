<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

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
  link?: string
  isAd?: boolean
}

const props = defineProps({
  videos: {
    type: Array as () => VideoItem[],
    default: () => [],
  },
  returnPath: {
    type: String,
    default: '/',
  },
})

const getItemKey = (item: VideoItem, index: number) =>
  item.isAd || item.link
    ? `ad-${item.id ?? item.link ?? index}`
    : `video-${item.id ?? index}`

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return timeStr

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const currentYear = new Date().getFullYear()

    if (year > currentYear) {
      const today = new Date()
      const todayDay = today.getDate()
      const todayMonth = today.getMonth() + 1
      const todayYear = today.getFullYear()

      if (year === todayYear && month === todayMonth && day === todayDay) {
        return '今天'
      }
      if (year === todayYear && month === todayMonth && day === todayDay - 1) {
        return '昨天'
      }
      if (year === todayYear && month === todayMonth && day === todayDay - 2) {
        return '前天'
      }
      return `${month}-${day}`
    }

    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    }

    const dayBeforeYesterday = new Date(today)
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)
    if (date.toDateString() === dayBeforeYesterday.toDateString()) {
      return '前天'
    }

    if (year === currentYear) {
      return `${month}-${day}`
    }
    return `${year}-${month}-${day}`
  } catch {
    return timeStr
  }
}

const handleAdClick = (video: VideoItem) => {
  if (video.link) {
    window.open(video.link, '_blank')
  }
}

const handleVideoClick = (videoId: number) => {
  const scrollPosition = window.scrollY || document.documentElement.scrollTop
  sessionStorage.setItem('homeScrollPosition', scrollPosition.toString())
  router.push(`/video/${videoId}?from=${props.returnPath}`)
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (!target) return
  target.style.background = '#333'
  target.alt = '图片加载失败'
}
</script>

<template>
  <div class="video-grid">
    <template v-for="(item, index) in videos" :key="getItemKey(item, index)">
      <div
        v-if="!item.isAd && !item.link"
        class="video-item"
        @click="handleVideoClick(item.id || index + 1)"
      >
        <div class="video-cover">
          <img
            v-lazy="item.coverUrl"
            loading="lazy"
            alt="Video Cover"
            @error="handleImageError"
          />
          <div class="video-badge vip" v-if="item.isVip">
            <span class="vip-text">VIP</span>
          </div>
          <div class="video-badge free" v-else>限免</div>
          <div class="video-duration" v-if="item.duration">{{ item.duration }}</div>
        </div>
        <div class="video-title">{{ item.title }}</div>
        <div class="video-info" v-if="item.class || item.time">
          <span class="video-class" v-if="item.class">{{ item.class }}</span>
          <span class="video-time" v-if="item.time">{{ formatTime(item.time) }}</span>
        </div>
      </div>

      <div v-else class="video-item ad-item" @click="handleAdClick(item)">
        <div class="video-cover">
          <img
            v-lazy="item.coverUrl"
            loading="lazy"
            alt="Ad Cover"
            @error="handleImageError"
          />
        </div>
        <div class="video-title">{{ item.title }}</div>
        <div class="video-info">
          <span class="video-class ad-class">广告</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 视频网格 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
  width: 100%;
  box-sizing: border-box;
}

.video-item {
  position: relative;
  text-decoration: none;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.video-cover {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #333;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-cover .vip-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.video-badge {
  position: absolute;
  top: 5px;
  left: 5px;
  background-color: #ff9500;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-badge.vip {
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  padding: 4px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.vip-icon {
  width: 14px;
  height: 14px;
  display: block;
}

.vip-text {
  font-size: 12px;
  color: #333;
  font-weight: bold;
  line-height: 1;
}

.video-badge.free {
  background: linear-gradient(90deg, #fc00ff 0%, #00dbde 100%);
}

.video-badge.ad {
  background-color: #ff5722;
}

.video-duration {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
}

.video-title {
  font-size: 12px;
  color: #eee;
  line-height: 1.3;
  height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-word;
  width: 100%;
}

.video-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 10px;
  color: #999;
  min-height: 18px;
}

.video-class {
  background-color: #333;
  padding: 1px 5px;
  border-radius: 3px;
  max-width: 60px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 16px;
  display: inline-block;
  height: 18px;
}

.video-time {
  margin-left: auto;
  line-height: 16px;
  height: 16px;
  display: flex;
  align-items: center;
}

.ad-item {
  cursor: pointer;
}

.ad-class {
  background-color: #333;
  color: #fff;
}

@media (max-width: 480px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .video-title {
    font-size: 11px;
  }

  .video-info {
    font-size: 9px;
  }
}

@media (max-width: 360px) {
  .video-grid {
    gap: 6px;
  }
}
</style>
