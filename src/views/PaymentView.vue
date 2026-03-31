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
import { showDialog, showToast } from 'vant'
import { fetchUserPoints, getUserInfo, setUserInfo } from '@/api/fetch-api'

const route = useRoute()
const router = useRouter()

const payUrl = ref('')
const isLoading = ref(true)
const hasError = ref(false)
const paymentIframe = ref<HTMLIFrameElement | null>(null)
const showConfirm = ref(false)

let loadingTimeout: ReturnType<typeof setTimeout> | null = null

const goBack = () => {
  // 如果需要显示确认弹窗，则显示
  if (showConfirm.value) {
    showRechargeConfirmDialog()
  } else {
    // 直接返回到充值页面
    router.replace('/recharge')
  }
}

// 刷新用户余额 - 使用 User.GetPoints 接口
const refreshUserBalance = async () => {
  try {
    showToast({
      message: '正在刷新余额...',
      duration: 1000,
    })

    const result = await fetchUserPoints()
    
    if (result && result.code === 1 && result.data) {
      const currentUserInfo = getUserInfo()
      if (currentUserInfo) {
        const updatedUserInfo = {
          ...currentUserInfo,
          coin: parseFloat(result.data.coin || '0'),
          user_points: parseFloat(result.data.points || '0'),
          video_nums: result.data.video_nums || 0,
          is_vip: result.data.is_vip !== undefined ? result.data.is_vip : 0,
        }
        setUserInfo(updatedUserInfo)
        
        showToast({
          message: '余额已更新',
          duration: 1500,
        })
      }
    } else {
      showToast({
        message: result?.msg || '刷新余额失败',
        duration: 2000,
      })
    }
  } catch (error) {
    console.error('刷新用户余额失败:', error)
    showToast({
      message: '刷新余额失败，请稍后重试',
      duration: 2000,
    })
  }
}

// 显示充值完成确认弹窗
const showRechargeConfirmDialog = () => {
  showDialog({
    title: '充值确认',
    message: '您是否已完成充值？',
    showCancelButton: true,
    confirmButtonText: '充值完成',
    cancelButtonText: '取消',
    confirmButtonColor: '#ff9500',
  })
    .then(async () => {
      // 用户点击"充值完成"
      await refreshUserBalance()
      router.replace('/recharge')
    })
    .catch(() => {
      // 用户点击"取消"，不做任何操作，留在当前页面
    })
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
  
  // 检查是否需要显示充值确认弹窗
  showConfirm.value = route.query.showConfirm === 'true'

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
