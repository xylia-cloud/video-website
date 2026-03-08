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

const route = useRoute()

// 当前路由路径
const currentRoute = computed(() => route.path)

// 客服按钮是否激活（客服没有对应的路由，所以需要单独控制）
const isCustomerServiceActive = ref(false)

// 图标路径
const homeActiveIcon = '/src/assets/img/icon-tabbar-home-active.svg'
const homeNormalIcon = '/src/assets/img/icon-tabbar-home-normal.svg'
const liveActiveIcon = '/src/assets/img/icon-tabbar-live-active.svg'
const liveNormalIcon = '/src/assets/img/icon-tabbar-live-normal.svg'
const kefuActiveIcon = '/src/assets/img/icon-tabbar-kefu-active.svg'
const kefuNormalIcon = '/src/assets/img/icon-tabbar-kefu-normal.svg'
const gameActiveIcon = '/src/assets/img/icon-tabbar-game-active.svg'
const gameNormalIcon = '/src/assets/img/icon-tabbar-game-normal.svg'
const accountActiveIcon = '/src/assets/img/icon-tabbar-account-active.svg'
const accountNormalIcon = '/src/assets/img/icon-tabbar-account-normal.svg'

// 跳转到客服
const goToCustomerService = async () => {
  try {
    // 点击时短暂激活客服图标
    isCustomerServiceActive.value = true
    setTimeout(() => {
      isCustomerServiceActive.value = false
    }, 300)

    showToast({
      message: '正在跳转客服...',
      duration: 1000,
    })

    // 获取或生成浏览器指纹
    let browserId = localStorage.getItem('browserId')
    
    if (!browserId) {
      // 生成简单的浏览器指纹
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform
      ].join('|')
      
      let hash = 0
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      browserId = Math.abs(hash).toString(36)
      localStorage.setItem('browserId', browserId)
    }

    // 调用接口获取RSA密钥
    const formData = new URLSearchParams()
    formData.append('murmur', browserId)
    
    const response = await fetch('https://help.186web.cc/admin/RSAEncrypt/gtRsP', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })
    
    const result = await response.json()
    
    if (result && result.data) {
      const rsaPassWord = result.data
      const customerServiceUrl = `https://help186.xuhgki.cn/index/index/home?code=${rsaPassWord}`
      window.open(customerServiceUrl, '_blank')
    } else {
      throw new Error('获取客服密钥失败')
    }
  } catch (error) {
    console.error('跳转客服失败:', error)
    showToast({
      message: '客服功能暂时不可用，请稍后重试',
      duration: 2000,
    })
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
