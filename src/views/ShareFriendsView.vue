<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo, isLoggedIn } from '@/api/fetch-api'
import QRCode from 'qrcode'

const router = useRouter()

// 用户信息
interface UserInfo {
  rec_code?: string
}
const userInfo = ref<UserInfo | null>(null)

// 二维码数据URL
const qrCodeDataUrl = ref<string>('')

// 获取用户信息
const fetchUserInfo = () => {
  if (!isLoggedIn()) {
    return
  }

  const info = getUserInfo()
  if (info) {
    userInfo.value = info
  }
}

// 弹出分享面板控制
const showSharePopup = ref(false)

// 处理分享项点击
const handleShareItemClick = (type: string) => {
  if (type === 'link') {
    copyLink()
  } else if (type === 'qr') {
    saveQRCode()
  } else {
    showToast(`${type === 'image' ? '保存图片' : '保存二维码'}开发中`)
  }
}

// 获取当前域名
const getCurrentDomain = () => {
  const protocol = window.location.protocol
  const host = window.location.host
  return `${protocol}//${host}`
}

// 生成邀请链接
const inviteLink = computed(() => {
  const currentDomain = getCurrentDomain()

  if (!userInfo.value || !userInfo.value.rec_code) {
    return `${currentDomain}/#/`
  }

  return `${currentDomain}/#/?invite=${userInfo.value.rec_code}`
})

// 清理后的邀请链接（用于显示和复制）
const cleanInviteLink = computed(() => {
  const link = inviteLink.value.trim()
  return link.replace(/^[@#]+/, '')
})

// 生成二维码
const generateQRCode = async (text: string) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
    qrCodeDataUrl.value = dataUrl
  } catch (error) {
    console.error('生成二维码失败:', error)
    showToast({
      message: '生成二维码失败',
      duration: 2000,
    })
  }
}

// 监听邀请链接变化，重新生成二维码
watch(cleanInviteLink, (newLink) => {
  if (newLink) {
    generateQRCode(newLink)
  }
}, { immediate: true })

// 复制链接
const copyLink = () => {
  const link = cleanInviteLink.value

  try {
    const textArea = document.createElement('textarea')
    textArea.value = link
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      showToast({
        message: '邀请链接已复制',
        duration: 2000,
        icon: 'success',
      })
    } else {
      throw new Error('copy failed')
    }
  } catch {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(link)
        .then(() => {
          showToast({
            message: '邀请链接已复制',
            duration: 2000,
            icon: 'success',
          })
        })
        .catch(() => {
          showToast({
            message: '复制失败，请手动复制',
            duration: 2000,
            icon: 'cross',
          })
        })
    }
  }
}

// 保存二维码
const saveQRCode = () => {
  if (!qrCodeDataUrl.value) {
    showToast({
      message: '二维码还未生成',
      duration: 2000,
      icon: 'cross'
    })
    return
  }
  
  try {
    const link = document.createElement('a')
    link.download = '邀请二维码.png'
    link.href = qrCodeDataUrl.value
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast({
      message: '二维码已保存',
      duration: 2000,
      icon: 'success'
    })
  } catch (error) {
    console.error('保存二维码失败:', error)
    showToast({
      message: '保存失败，请重试',
      duration: 2000,
      icon: 'cross'
    })
  }
}

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<template>
  <div class="share-page">
    <!-- 顶部导航 -->
    <HeaderNav title="分享好友" />

    <div class="page-content">
      <div class="invite-container">
        <img src="@/assets/img/img-yaoqing.webp" alt="邀请好友" class="invite-image" />
        <div class="invite-action-area">
          <button class="invite-button" @click="showSharePopup = true">立即邀请</button>
        </div>
      </div>
    </div>

    <!-- 底部固定浮动链接 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="showSharePopup = true">
        <van-icon name="qr" class="nav-icon" />
        <span>分享链接</span>
      </div>
      <div class="nav-item" @click="router.push({ name: 'bonusDescription' })">
        <van-icon name="gold-coin-o" class="nav-icon" />
        <span>礼金介绍</span>
      </div>
      <div class="nav-item" @click="router.push({ name: 'myAgent' })">
        <van-icon name="bar-chart-o" class="nav-icon" />
        <span>明细记录</span>
      </div>
    </div>

    <!-- 分享面板弹窗 -->
    <van-popup v-model:show="showSharePopup" position="bottom" round class="share-popup">
      <div class="share-panel">
        <div class="share-banner">
          <img src="@/assets/img/img-yaoqing-02.webp" alt="分享活动" class="share-banner-img" />
        </div>
        <div class="share-grid">
          <div class="share-item" @click="handleShareItemClick('link')">
            <img src="@/assets/img/img-yaoqing-03.webp" alt="保存链接" class="share-btn-img" />
          </div>
          <div class="share-item" @click="handleShareItemClick('image')">
            <img src="@/assets/img/img-yaoqing-04.webp" alt="保存图片" class="share-btn-img" />
          </div>
          <div class="share-item" @click="handleShareItemClick('qr')">
            <img src="@/assets/img/img-yaoqing-05.webp" alt="保存二维码" class="share-btn-img" />
          </div>
        </div>
        <button class="cancel-button" @click="showSharePopup = false">取消</button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.share-page {
  background-color: #000;
  color: #fff;
  min-height: 100vh;
  position: relative;
}

.page-content {
  padding-top: 46px; /* NavBar height */
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.invite-container {
  width: 100%;
  position: relative;
  padding-bottom: 80px; /* 为底部固定导航留出空间 */
}

.invite-image {
  width: 100%;
  display: block;
  height: auto;
}

.invite-action-area {
  padding: 30px 20px;
  display: flex;
  justify-content: center;
}

.invite-button {
  width: 90%;
  height: 46px;
  background: linear-gradient(135deg, #ff9500, #ff5722);
  border: none;
  border-radius: 23px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
}

.invite-button:active {
  transform: scale(0.98);
  opacity: 0.9;
}

/* 底部固定导航样式 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background-color: #1a1a1a;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #333;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
  cursor: pointer;
}

.nav-icon {
  font-size: 24px;
}

/* 分享弹窗样式 */
.share-popup {
  background-color: #1a1a1a;
  color: #fff;
}

.share-panel {
  padding: 15px;
}

.share-banner {
  width: 100%;
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
}

.share-banner-img {
  width: 100%;
  display: block;
  height: auto;
}

.share-grid {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 25px;
}

.share-item {
  flex: 1;
  cursor: pointer;
}

.share-btn-img {
  width: 100%;
  display: block;
  height: auto;
}

.cancel-button {
  width: 100%;
  height: 46px;
  background: linear-gradient(135deg, #ff9500, #ff5722);
  border: none;
  border-radius: 23px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-top: 10px;
}

/* 自定义Toast样式 */
:deep(.custom-toast) {
  min-width: 260px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.custom-toast-success) {
  min-width: 260px;
  background-color: #4caf50;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.custom-toast-error) {
  min-width: 260px;
  background-color: #ff5252;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.custom-toast-info) {
  min-width: 260px;
  background-color: #2196f3;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
