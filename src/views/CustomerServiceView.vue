<template>
  <div class="customer-service-page">
    <div class="custom-back-button" @click="goBack">
      <van-icon name="arrow-left" size="20" color="#000" />
    </div>

    <div v-if="isLoading" class="loading-container">
      <van-loading type="spinner" color="#ff9500" size="40" />
      <div class="loading-text">正在加载客服...</div>
    </div>

    <iframe
      v-show="!isLoading && !hasError"
      ref="customerServiceIframe"
      :src="customerServiceUrl"
      class="customer-service-iframe"
      frameborder="0"
      @load="handleIframeLoad"
    ></iframe>

    <div v-if="hasError" class="error-container">
      <van-icon name="warning-o" size="48" color="#ff9500" />
      <div class="error-text">客服加载失败</div>
      <button class="retry-button" @click="retryLoad">重试</button>
      <button class="back-button" @click="goBack">返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { generateCustomerServiceUrl } from '@/utils/rsa'

const router = useRouter()
const route = useRoute()

const customerServiceUrl = ref('')
const isLoading = ref(true)
const hasError = ref(false)
const customerServiceIframe = ref<HTMLIFrameElement | null>(null)

const goBack = () => {
  router.back()
}

const resolveCustomerServiceUrl = async () => {
  const urlFromQuery = route.query.url as string

  if (urlFromQuery) {
    let normalizedUrl = urlFromQuery
    for (let i = 0; i < 2; i++) {
      try {
        const decoded = decodeURIComponent(normalizedUrl)
        if (decoded === normalizedUrl) break
        normalizedUrl = decoded
      } catch {
        break
      }
    }
    return normalizedUrl
  }

  return await generateCustomerServiceUrl()
}

const handleIframeLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const loadCustomerService = async () => {
  try {
    customerServiceUrl.value = await resolveCustomerServiceUrl()
    isLoading.value = true
    hasError.value = false
  } catch (error) {
    console.error('加载客服失败:', error)
    isLoading.value = false
    hasError.value = true
    showToast({
      message: '客服加载失败，请重试',
      duration: 2000,
    })
  }
}

const retryLoad = async () => {
  hasError.value = false
  isLoading.value = true
  await loadCustomerService()
}

onMounted(async () => {
  await loadCustomerService()
})
</script>

<style scoped>
.customer-service-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  z-index: 9999;
}

.custom-back-button {
  position: absolute;
  top: 5px;
  left: 5px;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border-radius: 50%;
  color: #000;
  cursor: pointer;
  transition: all 0.3s;
}

.custom-back-button:hover {
  transform: scale(1.05);
}

.custom-back-button:active {
  transform: scale(0.95);
}

.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-text {
  font-size: 14px;
  color: #666;
}

.customer-service-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.error-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.error-text {
  font-size: 16px;
  color: #666;
  margin-top: 8px;
}

.retry-button,
.back-button {
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-button {
  background: linear-gradient(135deg, #ff9500 0%, #ff7700 100%);
  color: #fff;
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
}

.back-button {
  background: #f5f5f5;
  color: #666;
}

.back-button:hover {
  background: #e0e0e0;
}

.retry-button:active,
.back-button:active {
  transform: translateY(0);
}
</style>
