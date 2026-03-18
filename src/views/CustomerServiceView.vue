<template>
  <div class="customer-service-page">
    <!-- 自定义返回按钮 - 覆盖在iframe上方 -->
    <div class="custom-back-button" @click="goBack">
      <van-icon name="arrow-left" size="20" color="#fff" />
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <van-loading type="spinner" color="#ff9500" size="40" />
      <div class="loading-text">正在加载客服...</div>
    </div>

    <!-- 客服iframe -->
    <iframe
      v-show="!isLoading"
      ref="customerServiceIframe"
      :src="customerServiceUrl"
      class="customer-service-iframe"
      frameborder="0"
      @load="handleIframeLoad"
    ></iframe>

    <!-- 错误提示 -->
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

const router = useRouter()
const route = useRoute()

const customerServiceUrl = ref('')
const isLoading = ref(true)
const hasError = ref(false)
const customerServiceIframe = ref<HTMLIFrameElement | null>(null)

// 返回上一页
const goBack = () => {
  router.back()
}

// iframe加载完成
const handleIframeLoad = () => {
  isLoading.value = false
  hasError.value = false
}

// 重试加载
const retryLoad = () => {
  hasError.value = false
  isLoading.value = true
  loadCustomerService()
}

// 加载客服
const loadCustomerService = async () => {
  try {
    // 检查是否从URL参数传入了客服链接
    const urlFromQuery = route.query.url as string
    if (urlFromQuery) {
      customerServiceUrl.value = decodeURIComponent(urlFromQuery)
      return
    }

    // 否则，生成客服链接
    showToast({
      message: '正在加载客服...',
      duration: 1000,
    })

    // 获取或生成浏览器指纹
    let browserId = localStorage.getItem('browserId')
    
    if (!browserId) {
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
      customerServiceUrl.value = `https://help186.xuhgki.cn/index/index/home?code=${rsaPassWord}`
    } else {
      throw new Error('获取客服密钥失败')
    }
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

onMounted(() => {
  loadCustomerService()
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

/* 自定义返回按钮 */
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
  background: #13c9cb;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.custom-back-button:hover {
  background: #10b5b7;
  transform: scale(1.05);
}

.custom-back-button:active {
  transform: scale(0.95);
}

/* 客服iframe */
.customer-service-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 加载状态 */
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

/* 错误状态 */
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
