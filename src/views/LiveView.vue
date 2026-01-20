<script setup lang="ts">
import { useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import hd01 from '@/assets/img/hd-01.png'
import hd02 from '@/assets/img/hd-02.png'
import hd03 from '@/assets/img/hd-03.png'
import hd04 from '@/assets/img/hd-04.png'

const router = useRouter()

const activities = [
  { id: '1', image: hd01, disabled: true },
  { id: '2', image: hd02, disabled: true },
  { id: '3', image: hd03 },
  { id: '4', image: hd04 },
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
    <div class="bottom-nav">
      <router-link to="/" class="nav-item">
        <img src="@/assets/img/icon-tabbar-home-normal.svg" alt="首页" class="tabbar-icon" />
        <div class="nav-text">首页</div>
      </router-link>
      <router-link to="/live" class="nav-item active">
        <img src="@/assets/img/icon-tabbar-live-active.svg" alt="活动" class="tabbar-icon" />
        <div class="nav-text">活动</div>
      </router-link>
      <router-link to="/game" class="nav-item">
        <img src="@/assets/img/icon-tabbar-game-normal.svg" alt="游戏" class="tabbar-icon" />
        <div class="nav-text">游戏</div>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <img src="@/assets/img/icon-tabbar-account-normal.svg" alt="我的" class="tabbar-icon" />
        <div class="nav-text">我的</div>
      </router-link>
    </div>
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

/* 底部导航 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #222;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #333;
  z-index: 30;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  text-decoration: none;
}

.tabbar-icon {
  width: 24px;
  height: 24px;
}

.nav-item.active,
.nav-item.router-link-active {
  color: #ff9500;
}

.nav-text {
  font-size: 12px;
}
</style>
