<template>
  <div v-if="shouldShowButton" class="customer-service-button" @click="handleClick">
    <img src="@/assets/img/kefu.png" alt="客服" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getUserInfo } from '@/api/fetch-api'
import { generateCustomerServiceUrl } from '@/utils/rsa'

const route = useRoute()

// 判断是否应该显示客服按钮
const shouldShowButton = computed(() => {
  // 在游戏播放页面隐藏客服按钮
  return route.path !== '/game-play'
})

const handleClick = () => {
  try {
    // 获取当前用户信息
    const currentUserInfo = getUserInfo()

    // 兼容游客用户和正式用户的数据结构
    const userId = currentUserInfo?.user_id || currentUserInfo?.id

    if (!currentUserInfo || !userId) {
      showToast({
        message: '请先登录后再使用客服功能',
        duration: 2000,
      })
      return
    }

    showToast({
      message: '正在跳转客服...',
      duration: 1000,
    })

    // 生成加密的客服链接
    const customerServiceUrl = generateCustomerServiceUrl(userId)

    // 在新窗口中打开客服链接
    window.open(customerServiceUrl, '_blank')

    console.log('客服链接已生成并打开:', customerServiceUrl)
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
.customer-service-button {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 70px;
  height: 70px;
  cursor: pointer;
  z-index: 9999;
  transition: all 0.3s ease;
}

.customer-service-button:hover {
  transform: scale(1.1);
}

.customer-service-button:active {
  transform: scale(0.95);
}

.customer-service-button img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .customer-service-button {
    width: 60px;
    height: 60px;
    right: 15px;
    bottom: 70px;
  }
}
</style>
