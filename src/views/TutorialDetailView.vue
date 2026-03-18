<template>
  <div class="tutorial-detail">
    <van-nav-bar :title="pageTitle" left-arrow fixed placeholder @click-left="onBack" />
    <div class="content">
      <img :src="detailImg" alt="详情" class="detail-img" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tutorialId = computed(() => Number(route.params.id) || 1)

const pageTitle = computed(() => {
  const titles: Record<number, string> = {
    1: '自媒体作品评论扶持',
    2: '自媒体评论推广指南',
    3: 'AI视频制作与发布',
    4: '蓝牙推广教程',
  }
  return titles[tutorialId.value] || '教程详情'
})

const detailImg = computed(() => {
  // 根据 ID 映射图片：1 -> 05, 2 -> 06, 3 -> 07, 4 -> 08
  const imgNum = 4 + tutorialId.value
  const imgName = `img-tgjc-0${imgNum}.webp`
  return new URL(`../assets/img/${imgName}`, import.meta.url).href
})

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.tutorial-detail {
  background-color: #000;
  min-height: 100vh;
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

.content {
  width: 100%;
}

.detail-img {
  width: 100%;
  display: block;
  height: auto;
}
</style>
