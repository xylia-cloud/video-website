<template>
  <div v-if="isVisible" class="customer-service-overlay">
    <button type="button" class="overlay-back-button" aria-label="返回" @click="closeModal">
      <van-icon name="arrow-left" size="20" color="#333" />
    </button>

    <div v-if="isLoading" class="loading-container">
      <van-loading type="spinner" color="#ff9500" size="40" />
      <div class="loading-text">正在加载客服...</div>
    </div>

    <iframe
      v-show="!isLoading && !hasError && customerServiceUrl"
      ref="customerServiceIframe"
      :src="customerServiceUrl"
      class="customer-service-iframe"
      frameborder="0"
      title="在线客服"
      @load="handleIframeLoad"
    />

    <div v-if="hasError" class="error-container">
      <van-icon name="warning-o" size="48" color="#ff9500" />
      <div class="error-text">客服加载失败</div>
      <button type="button" class="retry-button" @click="retryLoad">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { generateCustomerServiceUrl } from '@/utils/rsa'
import {
  CUSTOMER_SERVICE_MODAL_EVENT,
  isCustomerServiceModalOpen,
  type CustomerServiceModalDetail,
} from '@/utils/customerService'

const isVisible = ref(false)
const customerServiceUrl = ref('')
const isLoading = ref(true)
const hasError = ref(false)
const customerServiceIframe = ref<HTMLIFrameElement | null>(null)

const resolveCustomerServiceUrl = async (urlFromDetail?: string) => {
  if (urlFromDetail) {
    let normalizedUrl = urlFromDetail
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

  return generateCustomerServiceUrl()
}

const loadCustomerService = async (urlFromDetail?: string) => {
  try {
    isLoading.value = true
    hasError.value = false
    customerServiceUrl.value = await resolveCustomerServiceUrl(urlFromDetail)
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

const handleIframeLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const closeModal = () => {
  isVisible.value = false
  isCustomerServiceModalOpen.value = false
  customerServiceUrl.value = ''
  isLoading.value = true
  hasError.value = false
  document.body.style.overflow = ''
}

const openModal = async (detail?: CustomerServiceModalDetail) => {
  isVisible.value = true
  isCustomerServiceModalOpen.value = true
  document.body.style.overflow = 'hidden'
  await loadCustomerService(detail?.url)
}

const handleOpenEvent = (event: Event) => {
  const customEvent = event as CustomEvent<CustomerServiceModalDetail>
  void openModal(customEvent.detail)
}

const retryLoad = async () => {
  hasError.value = false
  isLoading.value = true
  const currentUrl = customerServiceUrl.value
  customerServiceUrl.value = ''
  await loadCustomerService(currentUrl || undefined)
}

watch(isVisible, (visible) => {
  isCustomerServiceModalOpen.value = visible
  if (!visible) {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  window.addEventListener(CUSTOMER_SERVICE_MODAL_EVENT, handleOpenEvent as EventListener)
})

onBeforeUnmount(() => {
  window.removeEventListener(CUSTOMER_SERVICE_MODAL_EVENT, handleOpenEvent as EventListener)
  document.body.style.overflow = ''
})

defineExpose({
  isVisible,
  openModal,
  closeModal,
})
</script>

<style scoped>
.customer-service-overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;
  background-color: #fff;
}

/* 覆盖客服页标题栏左侧返回按钮，点击关闭弹窗 */
.overlay-back-button {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10051;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 47px;
  padding: 0;
  border: none;
  background: #ededed;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.overlay-back-button:active {
  opacity: 0.85;
}

.loading-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #fff;
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
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
}

.error-text {
  font-size: 16px;
  color: #666;
}

.retry-button {
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  background: linear-gradient(135deg, #ff9500 0%, #ff7700 100%);
  color: #fff;
}
</style>
