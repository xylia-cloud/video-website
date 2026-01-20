<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import hd01Detail from '@/assets/img/hd-01-detail.png'
import hd02Detail from '@/assets/img/hd-02-detail.png'
import hd03Detail from '@/assets/img/hd-03-detail.png'
import hd04Detail from '@/assets/img/hd-04-detail.png'

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)

const detailImages: Record<string, string> = {
  '1': hd01Detail,
  '2': hd02Detail,
  '3': hd03Detail,
  '4': hd04Detail,
}

const currentImage = computed(() => detailImages[id.value] || '')

const handleBack = () => {
  router.back()
}
</script>

<template>
  <div class="activity-detail-page">
    <HeaderNav title="活动详情" :custom-back="true" @back="handleBack" />

    <div class="content">
      <img v-if="currentImage" :src="currentImage" class="detail-image" alt="活动详情" />
      <div v-else class="not-found">未找到活动详情</div>
    </div>
  </div>
</template>

<style scoped>
.activity-detail-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding-top: 46px; /* HeaderNav height */
  overflow-y: auto;
  padding-bottom: 20px;
  position: relative;
}

.detail-image {
  width: 100%;
  display: block;
  height: auto;
}

.not-found {
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
