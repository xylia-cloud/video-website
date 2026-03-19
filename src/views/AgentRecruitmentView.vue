<template>
  <div class="agent-recruitment">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="合营计划" left-arrow fixed placeholder @click-left="onBack" />

    <div class="hero-section">
      <img src="@/assets/img/img-hyjh-01.webp" class="hero-img" alt="合营计划" />
    </div>

    <div class="container">
      <!-- 咨询客服区域 -->
      <div class="section contact-section">
        <div class="contact-card">
          <div class="contact-item" @click="openTelegram('jiji8_cc')">
            <img src="@/assets/img/img-hyjh-02.webp" class="contact-icon" alt="Telegram" />
            <span class="contact-label">Telegram1</span>
            <div class="contact-btn">Telegram(点击联系)</div>
            <span class="contact-action">点击咨询</span>
          </div>
          <div class="contact-item" @click="openTelegram('daduizhang168')">
            <img src="@/assets/img/img-hyjh-02.webp" class="contact-icon" alt="Telegram" />
            <span class="contact-label">Telegram2</span>
            <div class="contact-btn">Telegram(点击联系)</div>
            <span class="contact-action">点击咨询</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <img src="@/assets/img/img-hyjh-03.webp" class="content-img" alt="合营计划详情" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const onBack = () => {
  router.back()
}

// 打开Telegram聊天
const openTelegram = (username: string) => {
  const telegramUrl = `https://t.me/${username}`
  window.open(telegramUrl, '_blank')
}
</script>

<style scoped>
.agent-recruitment {
  background-color: #000;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 20px;
}

:deep(.van-nav-bar) {
  background-color: #1a1a1a;
}
:deep(.van-nav-bar::after) {
  display: none;
}
:deep(.van-nav-bar__title) {
  color: #fff;
}
:deep(.van-nav-bar .van-icon) {
  color: #fff;
}

.container {
  padding: 0 15px;
}

.hero-section {
  width: 100%;
}

.hero-img {
  width: 100%;
  display: block;
  height: auto;
}

.section {
  margin-top: 15px;
  margin-bottom: 15px;
}

.contact-card {
  background: #111;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 15px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.contact-item:hover {
  background-color: rgba(255, 149, 0, 0.1);
}

.contact-item:active {
  background-color: rgba(255, 149, 0, 0.2);
}

.contact-item:not(:last-child) {
  border-bottom: 1px solid #222;
}

.contact-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.contact-label {
  font-size: 14px;
  flex: 1;
}

.contact-btn {
  background: linear-gradient(to right, #ff9500, #ff5e00);
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  color: #fff;
}

.contact-action {
  font-size: 12px;
  color: #ff9500;
}

.content-section {
  width: 100%;
}

.content-img {
  width: 100%;
  display: block;
  height: auto;
}
</style>
