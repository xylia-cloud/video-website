<script setup lang="ts">
import { useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import hd01 from '@/assets/img/hd-01.png'
import hd02 from '@/assets/img/hd-02.png'
import hd03 from '@/assets/img/hd-03.png'
import hd04 from '@/assets/img/hd-04.png'

const router = useRouter()

const activities = [
  { id: '3', image: hd03 },
  { id: '4', image: hd04 },
    { id: '1', image: hd01, disabled: true },
  { id: '2', image: hd02, disabled: true },
]

const goToDetail = (item: { id: string; disabled?: boolean }) => {
  if (item.disabled) return
  router.push({ name: 'activityDetail', params: { id: item.id } })
}
</script>

<template>
  <div class="live-page">
    <HeaderNav title="活动" :showBack="false" />
    <!-- 活动内容区域 -->
    <div class="live-content">
      <div class="activity-list">
        <div
          v-for="item in activities"
          :key="item.id"
          class="activity-item"
          :class="{ disabled: item.disabled }"
          @click="goToDetail(item)"
        >
          <img :src="item.image" class="activity-banner" alt="活动Banner" />
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomTabbar />
  </div>
</template>

<style scoped>
.live-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 50px;
  position: relative;
  max-width: 480px;
  margin: 0 auto;
}

.live-content {
  padding: 62px 12px 12px;
  min-height: calc(100vh - 50px);
  overflow-y: auto;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-item:active {
  transform: scale(0.98);
}

.activity-item.disabled {
  cursor: default;
}

.activity-item.disabled:active {
  transform: none;
}

.activity-banner {
  width: 100%;
  display: block;
  height: auto;
}

/* 底部导航样式已移至 BottomTabbar 组件 */
</style>
