<template>
  <div class="bonus-description">
    <van-nav-bar
      title="礼金介绍"
      left-arrow
      fixed
      placeholder
      @click-left="onBack"
    />
    <div class="content">
      <img src="@/assets/img/img-ljjs.webp" alt="礼金介绍" class="description-img" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.bonus-description {
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

.description-img {
  width: 100%;
  display: block;
  height: auto;
}
</style>
