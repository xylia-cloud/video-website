<script setup lang="ts">
import { usePWAInstall } from '@/composables/usePWAInstall'

const { isInstallable, install } = usePWAInstall()
</script>

<template>
  <Transition name="slide-up">
    <div v-if="isInstallable" class="install-banner">
      <div class="install-content">
        <div class="install-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </div>
        <div class="install-text">
          <span class="install-title">安装球球大作战</span>
          <span class="install-desc">添加到主屏幕，更快更方便</span>
        </div>
      </div>
      <div class="install-actions">
        <button class="install-btn" @click="install">安装</button>
        <button class="close-btn" @click="isInstallable = false">关闭</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.install-banner {
  position: fixed;
  bottom: 60px;
  left: 12px;
  right: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0,0,0,.15);
  z-index: 9999;
}

.install-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.install-icon {
  width: 40px;
  height: 40px;
  background: #1989fa;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.install-text {
  display: flex;
  flex-direction: column;
}

.install-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.install-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.install-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.install-btn {
  background: #1989fa;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
}

.close-btn {
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all .3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
