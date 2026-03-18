<template>
  <div class="creative-library">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="创意素材库" left-arrow fixed placeholder @click-left="onBack" />

    <!-- 顶部 Banner -->
    <div class="banner">
      <img src="@/assets/img/img-sck-banner.webp" alt="创意素材库" class="banner-img" />
    </div>

    <!-- 标签导航 -->
    <div class="tab-section">
      <div class="tab-container">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </div>
      </div>
    </div>

    <!-- 内容列表 (网格布局) - 推广教程 -->
    <div v-if="activeTab === 'tutorial'" class="content-grid">
      <div
        v-for="item in displayItems"
        :key="item.id"
        class="grid-item"
        @click="handleItemClick(item)"
      >
        <div class="item-card">
          <div class="item-img-container">
            <img :src="item.img" :alt="item.title" class="item-img" />
          </div>
          <div class="item-title">{{ item.title }}</div>
        </div>
      </div>
    </div>

    <!-- 内容列表 (网格布局) - 视频素材 -->
    <div v-if="activeTab === 'video'" class="content-grid">
      <div v-for="video in videoItems" :key="video.id" class="grid-item">
        <div class="item-card video-card">
          <div class="item-img-container video-preview" @click="handlePlay(video)">
            <video
              class="video-player"
              preload="metadata"
              :src="video.posterUrl"
              playsinline
            ></video>
            <div class="play-overlay">
              <van-icon name="play-circle-o" size="40" color="rgba(255,255,255,0.8)" />
            </div>
          </div>
          <div class="video-footer">
            <div class="video-title">{{ video.title }}</div>
            <button class="download-btn" @click.stop="handleDownload(video.url)">下载视频</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容列表 (网格布局) - 图片素材 -->
    <div v-if="activeTab === 'image'" class="content-grid">
      <div v-for="photo in photoItems" :key="photo.id" class="grid-item">
        <div class="item-card photo-card">
          <div class="item-img-container photo-preview" @click="handlePreviewImage(photo.url)">
            <img :src="photo.url" alt="图片素材" class="photo-img" />
          </div>
          <div class="video-footer">
            <div class="video-title">{{ photo.title }}</div>
            <button class="download-btn" @click.stop="handleDownload(photo.url)">下载图片</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容列表 (列表布局) - 文案素材 -->
    <div v-if="activeTab === 'copywriting'" class="copywriting-list">
      <div v-for="(item, index) in copywritingItems" :key="index" class="copy-card">
        <div class="copy-content">{{ item.display }}</div>
        <div class="copy-footer">
          <div class="copy-name">{{ item.name }}</div>
          <button class="copy-btn" @click="handleCopy(item.display)">复制</button>
        </div>
      </div>
    </div>

    <!-- 视频播放弹窗 -->
    <div v-if="showVideoPlayer" class="video-overlay" @click="closeVideo">
      <div class="video-window" @click.stop>
        <video
          ref="videoRef"
          class="full-video"
          controls
          autoplay
          playsinline
          :src="currentVideoUrl"
        ></video>
        <div class="close-video" @click="closeVideo">
          <van-icon name="cross" size="24" color="#fff" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showImagePreview } from 'vant'

const router = useRouter()
const activeTab = ref('video') // 默认选中视频素材
const showVideoPlayer = ref(false)
const currentVideoUrl = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)

const tabs = [
  { id: 'video', name: '视频素材' },
  { id: 'image', name: '图片素材' },
  { id: 'copywriting', name: '文案素材' },
  { id: 'tutorial', name: '推广教程' },
]

// 推广教程数据
const displayItems = computed(() => {
  return [
    {
      id: 1,
      title: '自媒体作品评论扶持',
      img: new URL('@/assets/img/img-tgjc-01.webp', import.meta.url).href,
    },
    {
      id: 2,
      title: '自媒体评论推广指南',
      img: new URL('@/assets/img/img-tgjc-02.webp', import.meta.url).href,
    },
    {
      id: 3,
      title: 'AI视频制作与发布...',
      img: new URL('@/assets/img/img-tgjc-03.webp', import.meta.url).href,
    },
    {
      id: 4,
      title: '蓝牙推广教程',
      img: new URL('@/assets/img/img-tgjc-04.webp', import.meta.url).href,
    },
  ]
})

// 视频素材数据 (10个视频)
const videoItems = computed(() => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `365带你追梦${i + 1}`,
    url: `https://jiji1.tv/sucai/video/365sp${i + 1}.mp4`,
    posterUrl: `https://jiji1.tv/sucai/video/365sp${i + 1}.mp4#t=0.1`,
  }))
})

// 图片素材数据 (24张图片)
const photoItems = computed(() => {
  return Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    title: `365素材图${i + 1}`,
    url: `https://jiji1.tv/sucai/photo/365-${i + 1}.png`,
  }))
})

// 文案素材数据
const copywritingItems = [
  {
    name: '365语录1',
    display: '经典语录金哥扛，满楼兄弟随便狂，社会语录你得会，你若不会你受罪。',
  },
  {
    name: '365语录2',
    display: '抽烟只抽炫赫门，一生只爱一个人，赚钱就做豪横人，金元满楼是财神。',
  },
  {
    name: '365语录3',
    display: '365大舞台，有梦你就来！\n认准365，兄弟们——干就完了！',
  },
  {
    name: '365语录4',
    display: '翻江复倒海，六合定乾坤！\n要么出众，要么出局！',
  },
  {
    name: '365语录5',
    display:
      '成即开怀，未成依旧快哉；\n人生本就几场赢，三分豪气三分笑；\n加入问鼎，用品牌的力量打破命运的天花板\n———365大舞台，有梦你就来！',
  },
  {
    name: '365语录6',
    display:
      '谋事在人，成事在天。不可强也！ 大丈夫生居天地间，岂能郁郁久居人下！人生三幸事，新增，人头费，分红。',
  },
  {
    name: '365语录7',
    display:
      '你天马行空的想法不如脚踏实地的做法，怕就穷一辈子一切的努力都是要付出才有回报 ————天下能阻挡我前进的，就只有我自己。',
  },
  {
    name: '365语录8',
    display:
      '赚钱，能治愈一切矫情，有钱，能治愈一切自卑。先有实力，再有脾气，百因必有果，分红必有我。',
  },
  {
    name: '365语录9',
    display: '吹牛装B猛如虎，一问人头一千五，过江猛龙下山虎，365分红不低于55。 ',
  },
  {
    name: '365语录10',
    display:
      '我们不靠运气赢得掌声，靠的是实力和执行！\n人生没有白走的路，每一步都算数。\n今天的你只需迈出一步，明天的你必将站上巅峰！\n加入365，用品牌的力量打破命运的天花板！',
  },
  {
    name: '365语录11',
    display: '猛虎下山苍龙啸，满楼兄弟就是傲，金哥不摆鸿门宴，兄弟玩的是排面。',
  },
  {
    name: '365语录12',
    display: '人间值得，夜晚值得，你也值得。\n不必追光，你我皆是星辰。\n365有你想要的一切！',
  },
  {
    name: '365语录9',
    display: '与其抱怨黑暗，不如提灯前行。\n先谋生，再谋爱。\n来到365，好事发生！ ',
  },
  {
    name: '365语录10',
    display:
      '于平凡中追求不凡\n在坚守中成就梦想\n365舞台为你敞开\n依靠品牌的力量一定能让你突出重围，走向人生巅峰',
  },
  {
    name: '365语录11',
    display: '太阳不起你不起，365代理就是了不起，你不睡，我不睡，跟着金哥一起跳苏喂苏喂！',
  },
  {
    name: '365语录12',
    display: '乾坤未定，你我皆是黑马。\n半山腰总是最挤的，你得去山顶看看。\n365带你上山巅！',
  },
]

const onBack = () => {
  router.back()
}

const handleItemClick = (item: any) => {
  router.push({ name: 'tutorialDetail', params: { id: item.id } })
}

const handlePlay = (video: any) => {
  currentVideoUrl.value = video.url
  showVideoPlayer.value = true
}

const closeVideo = () => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
  showVideoPlayer.value = false
  currentVideoUrl.value = ''
}

const handlePreviewImage = (url: string) => {
  showImagePreview([url])
}

const handleCopy = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast('已复制到剪贴板')
    })
    .catch(() => {
      showToast('复制失败，请手动选择复制')
    })
}

const handleDownload = (url: string) => {
  window.open(url, '_blank')
  showToast('开始下载...')
}
</script>

<style scoped>
.creative-library {
  background-color: #000;
  min-height: 100vh;
  color: #fff;
}

:deep(.van-nav-bar) {
  background-color: #1a1a1a;
}
:deep(.van-nav-bar__title) {
  color: #fff;
}
:deep(.van-nav-bar .van-icon) {
  color: #fff;
}
:deep(.van-nav-bar::after) {
  display: none;
}

.banner {
  width: 100%;
}

.banner-img {
  width: 100%;
  display: block;
  height: auto;
}

.tab-section {
  padding: 15px;
}

.tab-container {
  display: flex;
  background:
    linear-gradient(#1a1a1a, #1a1a1a) padding-box,
    linear-gradient(to right, #553713, #f0e5a3, #553713) border-box;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 4px;
  justify-content: space-between;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  color: #999;
  border-radius: 6px;
  transition: all 0.3s;
}

.tab-item.active {
  background: linear-gradient(135deg, #ff9500, #ff5722);
  color: #fff;
  font-weight: bold;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 15px 20px;
}

.item-card {
  background-color: #1a1a1a;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #333;
}

.video-card,
.photo-card {
  display: flex;
  flex-direction: column;
}

.item-img-container {
  width: 100%;
  overflow: hidden;
  background-color: #222;
  position: relative;
}

.video-preview,
.photo-preview {
  background-color: #000;
}

.video-player,
.photo-img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.2);
}

.video-footer {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-title {
  font-size: 12px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.download-btn {
  width: 100%;
  height: 30px;
  background: linear-gradient(135deg, #ff9500, #ff5722);
  border: none;
  border-radius: 15px;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.item-img {
  width: 100%;
  display: block;
  height: auto;
}

.item-title {
  padding: 10px;
  font-size: 12px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 文案素材样式 */
.copywriting-list {
  padding: 0 15px 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.copy-card {
  background:
    linear-gradient(#1a1a1a, #1a1a1a) padding-box,
    linear-gradient(to right, #553713, #f0e5a3, #553713) border-box;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.copy-content {
  font-size: 14px;
  color: #fff;
  line-height: 1.6;
  white-space: pre-wrap; /* 支持换行符 */
}

.copy-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #333;
}

.copy-name {
  font-size: 12px;
  color: #999;
}

.copy-btn {
  padding: 0 20px;
  height: 28px;
  background: linear-gradient(135deg, #ff9500, #ff5722);
  border: none;
  border-radius: 14px;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

/* 视频播放弹窗样式 */
.video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-window {
  width: 100%;
  max-width: 100vw;
  position: relative;
}

.full-video {
  width: 100%;
  max-height: 80vh;
  display: block;
}

.close-video {
  position: absolute;
  top: -50px;
  right: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}
</style>
