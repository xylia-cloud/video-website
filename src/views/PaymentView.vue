<template>
  <div class="payment-page">
    <div class="payment-top-bar">
      <div class="back-btn" @click="goBack">
        <van-icon name="arrow-left" size="20" color="#111" />
      </div>
      <div class="title">支付</div>
      <div class="right-actions"></div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <van-loading type="spinner" color="#ff9500" size="40" />
      <div class="loading-text">正在加载支付页面...</div>
    </div>

    <div v-if="hasError" class="error-container">
      <van-icon name="warning-o" size="48" color="#ff9500" />
      <div class="error-text">该支付页面无法内嵌，请返回后使用浏览器打开</div>
      <button class="back-button" @click="goBack">返回</button>
    </div>

    <iframe
      v-show="!hasError"
      ref="paymentIframe"
      :src="payUrl"
      class="payment-iframe"
      frameborder="0"
      @load="handleIframeLoad"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const payUrl = ref('')
const isLoading = ref(true)
const hasError = ref(false)
const paymentIframe = ref<HTMLIFrameElement | null>(null)

let loadingTimeout: ReturnType<typeof setTimeout> | null = null

const goBack = () => {
  // 直接返回到充值页面，避免第三方页面历史记录导致的多次返回问题
  router.replace('/recharge')
}

const handleIframeLoad = () => {
  isLoading.value = false
}

onMounted(() => {
  const urlFromQuery = route.query.url as string
  if (!urlFromQuery) {
    hasError.value = true
    isLoading.value = false
    return
  }

  payUrl.value = decodeURIComponent(urlFromQuery)

  loadingTimeout = setTimeout(() => {
    if (isLoading.value) {
      hasError.value = true
      isLoading.value = false
    }
  }, 5000)
})

onBeforeUnmount(() => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }

  if (paymentIframe.value) {
    paymentIframe.value.src = ''
  }
})
</script>

<style scoped>
.payment-page {
  width: 100%;
  height: 100vh;
  background: #fff;
  overflow: hidden;
}

.payment-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
  z-index: 10;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  text-align: center;
  color: #111;
  font-size: 15px;
  font-weight: 600;
}

.right-actions {
  width: 40px;
  display: flex;
  justify-content: flex-end;
}

.loading-container {
  position: absolute;
  inset: 48px 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-text {
  color: #bdbdbd;
  font-size: 13px;
}

.error-container {
  position: absolute;
  inset: 48px 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 16px;
  text-align: center;
}

.error-text {
  color: #fff;
  font-size: 14px;
  line-height: 1.4;
}

.back-button {
  height: 34px;
  padding: 0 16px;
  border-radius: 18px;
  border: none;
  background: #ff9500;
  color: #111;
  font-weight: 600;
}

.payment-iframe {
  position: absolute;
  top: 48px;
  left: 0;
  width: 100%;
  height: calc(100vh - 48px);
  border: none;
  background: #fff;
}
</style>
