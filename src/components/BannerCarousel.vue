<template>
  <div class="banner" v-if="bannerAds.length > 0">
    <van-swipe
      :autoplay="3000"
      lazy-render
      indicator-color="#ff9500"
      :loop="true"
      @change="onBannerChange"
    >
      <van-swipe-item v-for="(ad, index) in bannerAds" :key="ad.id" @click="handleAdClick(ad)">
        <div v-show="currentBannerIndex === index">
          <img :src="ad.imageUrl" :alt="ad.title" @error="handleImageError($event, ad)" />
        </div>
      </van-swipe-item>
    </van-swipe>
  </div>
</template>

<script setup lang="ts">
// 定义轮播图广告数据接口
interface BannerAd {
  id: number
  imageUrl: string
  title: string
  link?: string
}

interface Props {
  bannerAds: BannerAd[]
  currentBannerIndex: number
}

interface Emits {
  (e: 'banner-change', index: number): void
  (e: 'ad-click', ad: BannerAd): void
  (e: 'image-error', event: Event, ad: BannerAd): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const onBannerChange = (index: number) => {
  emit('banner-change', index)
}

const handleAdClick = (ad: BannerAd) => {
  emit('ad-click', ad)
}

const handleImageError = (event: Event, ad: BannerAd) => {
  emit('image-error', event, ad)
}
</script>

<style scoped>
.banner {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
}

.banner img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}

.banner .van-swipe {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.banner .van-swipe-item {
  cursor: pointer;
}

.banner .banner-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
  padding: 15px 10px 8px;
  color: #fff;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}
</style>
