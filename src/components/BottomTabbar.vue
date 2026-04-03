<template>
  <div class="bottom-nav">
    <router-link to="/" class="nav-item" :class="{ active: currentRoute === '/' }">
      <img 
        :src="currentRoute === '/' ? homeActiveIcon : homeNormalIcon" 
        alt="首页" 
        class="tabbar-icon" 
      />
      <div class="nav-text">首页</div>
    </router-link>
    
    <router-link to="/live" class="nav-item" :class="{ active: currentRoute === '/live' }">
      <img 
        :src="currentRoute === '/live' ? liveActiveIcon : liveNormalIcon" 
        alt="活动" 
        class="tabbar-icon" 
      />
      <div class="nav-text">活动</div>
    </router-link>
    
    <div class="nav-item" :class="{ active: isCustomerServiceActive }" @click="goToCustomerService">
      <img 
        :src="isCustomerServiceActive ? kefuActiveIcon : kefuNormalIcon" 
        alt="客服" 
        class="tabbar-icon" 
      />
      <div class="nav-text">客服</div>
    </div>
    
    <router-link to="/game" class="nav-item" :class="{ active: currentRoute === '/game' }">
      <img 
        :src="currentRoute === '/game' ? gameActiveIcon : gameNormalIcon" 
        alt="游戏" 
        class="tabbar-icon" 
      />
      <div class="nav-text">游戏</div>
    </router-link>
    
    <router-link to="/profile" class="nav-item" :class="{ active: currentRoute === '/profile' }">
      <img 
        :src="currentRoute === '/profile' ? accountActiveIcon : accountNormalIcon" 
        alt="我的" 
        class="tabbar-icon" 
      />
      <div class="nav-text">我的</div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { generateCustomerServiceUrl } from '@/utils/rsa'

// 导入图标
import homeActiveIcon from '@/assets/img/icon-tabbar-home-active.svg'
import homeNormalIcon from '@/assets/img/icon-tabbar-home-normal.svg'
import liveActiveIcon from '@/assets/img/icon-tabbar-live-active.svg'
import liveNormalIcon from '@/assets/img/icon-tabbar-live-normal.svg'
import kefuActiveIcon from '@/assets/img/icon-tabbar-kefu-active.svg'
import kefuNormalIcon from '@/assets/img/icon-tabbar-kefu-normal.svg'
import gameActiveIcon from '@/assets/img/icon-tabbar-game-active.svg'
import gameNormalIcon from '@/assets/img/icon-tabbar-game-normal.svg'
import accountActiveIcon from '@/assets/img/icon-tabbar-account-active.svg'
import accountNormalIcon from '@/assets/img/icon-tabbar-account-normal.svg'

const route = useRoute()

// 当前路由路径
const currentRoute = computed(() => route.path)

// 客服按钮是否激活（客服没有对应的路由，所以需要单独控制）
const isCustomerServiceActive = ref(false)

// 跳转到客服
const goToCustomerService = async () => {
  // 点击时短暂激活客服图标
  isCustomerServiceActive.value = true
  setTimeout(() => {
    isCustomerServiceActive.value = false
  }, 300)

  try {
    const customerServiceUrl = generateCustomerServiceUrl()
    const newWindow = window.open(customerServiceUrl, '_blank', 'noopener,noreferrer')
    if (!newWindow) {
      showToast('请允许弹窗后重试')
    }
  } catch (error) {
    console.error('跳转客服失败:', error)
    showToast('客服功能暂时不可用，请稍后重试')
  }
}
</script>

<style scoped>
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
  z-index: 999;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  text-decoration: none;
  cursor: pointer;
  flex: 1;
  height: 100%;
}

.nav-item.active,
.nav-item.router-link-active {
  color: #ff9500;
}

.tabbar-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
}

.nav-text {
  font-size: 10px;
}
</style>
