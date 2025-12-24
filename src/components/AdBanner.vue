<template>
  <div class="ad-banner" v-if="ad" @click="handleAdClick(ad)">
    <img :src="ad.imageUrl" :alt="ad.title" @error="handleImageError($event, ad)" />
  </div>
</template>

<script setup lang="ts">
// 定义单图广告数据接口
interface SingleAd {
  id: number
  imageUrl: string
  title: string
  link?: string
}

interface Emits {
  (e: 'ad-click', ad: SingleAd): void
  (e: 'image-error', event: Event, ad: SingleAd): void
}

defineProps<{
  ad: SingleAd | null
}>()

const emit = defineEmits<Emits>()

const handleAdClick = (ad: SingleAd) => {
  if (!ad.link) return

  console.log(`广告点击: ${ad.title}, 链接: ${ad.link}`)

  // 如果是内部链接，使用路由跳转
  if (ad.link.startsWith('/')) {
    // 这里可以导入并使用 router，但为了保持组件独立性，通过 emit 传递给父组件
    emit('ad-click', ad)
  } else {
    // 外部链接，使用window.open打开
    window.open(ad.link, '_blank')
  }
}

const handleImageError = (event: Event, ad: SingleAd) => {
  console.error(`广告图片加载失败: ${ad.title}, URL: ${ad.imageUrl}`)
  emit('image-error', event, ad)
}
</script>

<style scoped>
.ad-banner {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
  height: 100px;
  cursor: pointer;
}

.ad-banner img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}
</style>
