<template>
  <van-popup
    :show="visible"
    teleport="body"
    :close-on-click-overlay="true"
    :lock-scroll="true"
    :overlay="true"
    overlay-class="domain-popup-overlay"
    class="domain-popup"
    @click-overlay="handleClose"
  >
    <div class="domain-popup-card">
      <button class="domain-popup-close" type="button" @click="handleClose">×</button>
      
      <!-- 顶部图片区域 -->
      <div class="domain-popup-hero">
        <img class="domain-popup-hero-img" src="@/assets/img/img-yjym.webp" alt="365娱乐" />
      </div>

      <!-- 内容区域 -->
      <div class="domain-popup-body">
        <!-- 域名列表 -->
        <div class="domain-list">
          <!-- 主域名 -->
          <div class="domain-item-wrapper primary-wrapper">
            <div class="domain-item primary" :style="{ backgroundImage: `url(${bgGameImg})` }">
              <div class="domain-icon">
                <img class="icon-logo" src="@/assets/img/icon-logo.webp" alt="365" />
              </div>
              <div class="domain-text">365abc.cc</div>
              <button class="copy-btn" type="button" @click="copyDomain('365abc.cc')">复制</button>
            </div>
          </div>

          <!-- 其他域名容器 -->
          <div class="domain-item-wrapper secondary-wrapper">
            <div class="secondary-domains" :style="{ backgroundImage: `url(${bgGameImg})` }">
              <div
                v-for="domain in domains"
                :key="domain"
                class="domain-item"
              >
                <van-icon name="search" size="14" color="#ff9500" />
                <div class="domain-text">{{ domain }}</div>
                <button class="copy-btn" type="button" @click="copyDomain(domain)">复制</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="domain-popup-actions">
        <button class="domain-popup-btn domain-popup-btn-left" type="button" @click="saveImage">
          保存图片
        </button>
        <button class="domain-popup-btn domain-popup-btn-right" type="button" @click="downloadApp">
          下载APP
        </button>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { showToast } from 'vant'
import bgGameImg from '@/assets/img/bg-game.png'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(props.show)

// 域名列表
const domains = ref([
  '365abc.me',
  '365aaa.me',
  '365bbb.me',
  '365ccc.me',
  '365ddd.me',
])

watch(
  () => props.show,
  (newVal) => {
    visible.value = newVal
  }
)

const handleClose = () => {
  emit('update:show', false)
}

// 复制域名
const copyDomain = async (domain: string) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(domain)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = domain
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    showToast({
      message: '已复制',
      duration: 1200,
    })
  } catch {
    showToast({
      message: '复制失败',
      duration: 2000,
    })
  }
}

// 搜索域名
const searchDomain = (domain: string) => {
  // 可以在这里实现搜索功能
  console.log('搜索域名:', domain)
}

// 保存图片
const saveImage = () => {
  showToast({
    message: '请长按弹窗截图保存',
    duration: 2000,
  })
}

// 下载APP
const downloadApp = () => {
  const appDownloadUrl = 'https://jm.muqumw.cn/fyf/index.html?vipid=168168'
  window.open(appDownloadUrl, '_blank')
}
</script>

<style scoped>
:global(.domain-popup-overlay) {
  background: rgba(0, 0, 0, 0.75);
}

.domain-popup {
  background: transparent;
}

.domain-popup-card {
  width: min(92vw, 420px);
  border-radius: 14px;
  background:
    linear-gradient(#0d0c0b, #0d0c0b) padding-box,
    linear-gradient(180deg, #553713 0%, #f0e5a3 50%, #553713 100%) border-box;
  border: 2px solid transparent;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
}

.domain-popup-close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 34px;
  line-height: 40px;
  cursor: pointer;
  z-index: 10;
}

.domain-popup-hero {
  background: rgba(255, 255, 255, 0.04);
  position: relative;
  overflow: hidden;
}

.domain-popup-hero-img {
  width: 100%;
  display: block;
  height: auto;
  min-height: 180px;
  object-fit: cover;
}

.domain-popup-body {
  padding: 14px 14px 0;
}

.domain-list {
  max-height: 320px;
  overflow-y: auto;
  margin-bottom: 0;
}

.domain-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  margin-bottom: 6px;
  transition: all 0.3s;
}

.domain-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.domain-item-wrapper {
  margin-bottom: 6px;
}

.primary-wrapper {
  background: linear-gradient(180deg, #553713 0%, #f0e5a3 50%, #553713 100%);
  border-radius: 8px;
  padding: 1px;
}

.secondary-wrapper {
  background: linear-gradient(180deg, #553713 0%, #f0e5a3 50%, #553713 100%);
  border-radius: 8px;
  padding: 1px;
}

.secondary-domains {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
  padding: 6px;
  overflow: hidden;
}

.secondary-domains .domain-item {
  margin-bottom: 6px;
}

.secondary-domains .domain-item:last-child {
  margin-bottom: 0;
}

.domain-item.primary {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: none;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: none;
  margin-bottom: 0;
}

.domain-item.primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  z-index: 0;
}

.domain-item.primary .domain-icon,
.domain-item.primary .domain-text,
.domain-item.primary .copy-btn {
  position: relative;
  z-index: 1;
}

.domain-icon {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
}

.icon-logo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.domain-text {
  flex: 1;
  color: #ff9500;
  font-size: 13px;
  font-weight: 500;
}

.copy-btn {
  padding: 4px 12px;
  background: #ff9500;
  color: #000;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}

.copy-btn:hover {
  background: #ffaa33;
  transform: scale(1.05);
}

.domain-popup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 16px;
  padding: 0 14px 14px;
}

.domain-popup-btn {
  height: 44px;
  border-radius: 8px;
  border: none;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.domain-popup-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.domain-popup-btn-left {
  background: #ff9500;
}

.domain-popup-btn-right {
  background: #1fb954;
}

/* 滚动条样式 */
.domain-list::-webkit-scrollbar {
  width: 4px;
}

.domain-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.domain-list::-webkit-scrollbar-thumb {
  background: rgba(255, 149, 0, 0.5);
  border-radius: 2px;
}

.domain-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 149, 0, 0.7);
}
</style>
