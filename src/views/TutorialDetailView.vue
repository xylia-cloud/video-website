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
import imgTgjc05 from '@/assets/img/img-tgjc-05.webp'
import imgTgjc06 from '@/assets/img/img-tgjc-06.webp'
import imgTgjc07 from '@/assets/img/img-tgjc-07.webp'
import imgTgjc08 from '@/assets/img/img-tgjc-08.webp'

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

// 静态映射，避免 import.meta.url 动态路径把多张图打进同一 JS chunk
const TUTORIAL_DETAIL_IMAGES: Record<number, string> = {
  1: imgTgjc05,
  2: imgTgjc06,
  3: imgTgjc07,
  4: imgTgjc08,
}

const detailImg = computed(
  () => TUTORIAL_DETAIL_IMAGES[tutorialId.value] ?? TUTORIAL_DETAIL_IMAGES[1],
)

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
