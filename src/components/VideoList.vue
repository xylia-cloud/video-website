<script setup lang="ts">
import { useRouter } from 'vue-router';

// 使用路由
const router = useRouter();

interface VideoItem {
  id?: number;
  coverUrl: string;
  title: string;
  isVip?: boolean;
  isFree?: boolean;
  duration?: string;
  class?: string;
  time?: string;
  points?: number | string;
  link?: string; // 广告链接
  isAd?: boolean; // 是否为广告
}

const props = defineProps({
  videos: {
    type: Array as () => VideoItem[],
    default: () => []
  },
  returnPath: {
    type: String,
    default: '/'
  }
});

// 添加调试信息
console.log('VideoList组件接收到的视频数据:', props.videos);
console.log('VideoList组件接收到的视频数量:', props.videos.length);
if (props.videos.length > 0) {
  console.log('VideoList组件第一个视频项:', props.videos[0]);
}

// 格式化时间函数
function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    
    // 获取年、月、日
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 当前年份
    const currentYear = new Date().getFullYear();
    
    // 如果是未来日期，或者是模拟数据（比如2025年），直接显示日期
    if (year > currentYear) {
      // 当前日期 (在API环境中是2025-05-19)
      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth() + 1;
      const todayYear = today.getFullYear();
      
      // 如果是今天（相同年月日）
      if (year === todayYear && month === todayMonth && day === todayDay) {
        return '今天';
      }
      
      // 如果是昨天（日期差1天）
      if (year === todayYear && month === todayMonth && day === todayDay - 1) {
        return '昨天';
      }
      
      // 如果是前天（日期差2天）
      if (year === todayYear && month === todayMonth && day === todayDay - 2) {
        return '前天';
      }
      
      // 其他日期显示月-日
      return `${month}-${day}`;
    }
    
    // 当前日期
    const today = new Date();
    
    // 如果是今天（相同年月日）
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    }
    
    // 昨天
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    
    // 前天
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    if (date.toDateString() === dayBeforeYesterday.toDateString()) {
      return '前天';
    }
    
    // 其他日期，格式化为 MM-DD 或 YYYY-MM-DD
    if (year === currentYear) {
      return `${month}-${day}`; // 同一年只显示月-日
    } else {
      return `${year}-${month}-${day}`; // 不同年显示年-月-日
    }
  } catch {
    return timeStr;
  }
}

// 处理广告点击
const handleAdClick = (video: VideoItem) => {
  if (video.link) {
    console.log(`广告点击: ${video.title}, 链接: ${video.link}`);
    window.open(video.link, '_blank');
  }
};

// 处理视频点击，在跳转前保存滚动位置
const handleVideoClick = (videoId: number) => {
  // 保存当前滚动位置到sessionStorage
  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  sessionStorage.setItem('homeScrollPosition', scrollPosition.toString());
  console.log(`视频点击前保存滚动位置: ${scrollPosition}`);
  
  // 跳转到视频详情页
  router.push(`/video/${videoId}?from=${props.returnPath}`);
};
</script>

<template>
  <div class="video-grid">
    <!-- 循环所有项目，根据isAd属性区分普通视频和广告 -->
    <template v-for="(item, index) in videos" :key="index">
      <!-- 普通视频项 -->
      <div 
        v-if="!item.isAd && !item.link"
        class="video-item"
        @click="handleVideoClick(item.id || index + 1)"
      >
        <div class="video-cover">
          <img 
            :src="item.coverUrl" 
            alt="Video Cover" 
            loading="lazy" 
            @error="(e) => {
              console.error('图片加载失败:', item.coverUrl, e);
              const target = e.target as HTMLImageElement;
              if (target) {
                target.style.background = '#333';
                target.style.display = 'flex';
                target.style.alignItems = 'center';
                target.style.justifyContent = 'center';
                target.alt = '图片加载失败';
              }
            }"
            @load="() => console.log('图片加载成功:', item.coverUrl)"
          />
          <div class="video-badge" v-if="item.isVip">{{ item.points || '付费' }}</div>
          <div class="video-badge free" v-else>限免</div>
          <div class="video-duration" v-if="item.duration">{{ item.duration }}</div>
        </div>
        <div class="video-title">{{ item.title }}</div>
        <div class="video-info" v-if="item.class || item.time">
          <span class="video-class" v-if="item.class">{{ item.class }}</span>
          <span class="video-time" v-if="item.time">{{ formatTime(item.time) }}</span>
        </div>
      </div>

      <!-- 广告项 -->
      <div 
        v-else
        class="video-item ad-item"
        @click="handleAdClick(item)"
      >
        <div class="video-cover">
          <img :src="item.coverUrl" alt="Ad Cover" loading="lazy" />
          <!-- <div class="video-badge ad">广告</div> -->
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
  min-width: 0; /* 防止内容溢出 */
}

.video-cover {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
  width: 100%;
  aspect-ratio: 16 / 9; /* 固定宽高比 */
  background-color: #333; /* 占位背景 */
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #ff9500;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-badge.free {
  background: linear-gradient(90deg, #FC00FF 0%, #00DBDE 100%);
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

/* 广告项的特殊样式 */
.video-class:contains('广告') {
  background-color: rgba(0, 0, 0, 0.7);
  color: #ff9500;
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

/* 确保网格布局在所有设备上都能正常显示 */
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

/* 处理超小屏幕 */
@media (max-width: 360px) {
  .video-grid {
    gap: 6px;
  }
}
</style> 