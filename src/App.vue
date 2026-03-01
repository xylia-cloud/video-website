<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { isLoggedIn, isTokenExpired, forceLogin } from '@/api/fetch-api'
import TopLoading from '@/components/TopLoading.vue'
import CustomerServiceButton from '@/components/CustomerServiceButton.vue'

// 应用启动时检查TOKEN状态（仅记录，不强制登录）
onMounted(() => {
  console.log('应用启动，检查TOKEN状态...')

  // 延迟检查，仅用于日志记录，不强制用户登录
  setTimeout(() => {
    if (isTokenExpired()) {
      console.log('检测到TOKEN已过期，但允许用户继续浏览')
    } else if (isLoggedIn()) {
      console.log('TOKEN有效，用户已登录')
    } else {
      console.log('用户未登录，但允许浏览公开内容')
    }
  }, 1000)
})
</script>

<template>
  <div class="app-container">
    <TopLoading />
    <RouterView />
    <CustomerServiceButton />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  font-family: 'PingFang SC', 'Helvetica Neue', Helvetica, 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #222;
  color: #333;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

@media screen and (min-width: 768px) {
  body:after {
    content: '';
    position: fixed;
    top: 20px;
    left: 0;
    right: 0;
    text-align: center;
    color: #666;
    font-size: 14px;
    z-index: 1000;
    pointer-events: none;
  }
}
</style>
