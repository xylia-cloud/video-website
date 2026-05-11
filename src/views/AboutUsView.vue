<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon as VanIcon, showToast } from 'vant';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};

// 应用信息
const appInfo = ref({
  name: '365娱乐',
  version: 'v1.0.0',
  description: '专业的影视娱乐平台，为用户提供高质量的视频内容和游戏娱乐服务。',
  features: [
    '海量高清视频资源',
    '多样化游戏娱乐',
    '实时直播互动',
    '个性化推荐算法',
    '会员特权服务'
  ]
});

// 联系信息
const contactInfo = ref({
  website: 'https://ym01.ch',
  email: 'support@ym01.ch',
  qq: '123456789',
  wechat: 'ym01_support'
});

// 复制联系方式
const copyContact = (type: string, value: string) => {
  navigator.clipboard.writeText(value).then(() => {
    showToast({
      message: `${type}已复制到剪贴板`,
      duration: 2000
    });
  }).catch(() => {
    showToast({
      message: '复制失败，请手动复制',
      duration: 2000
    });
  });
};

// 访问官网
const visitWebsite = () => {
  window.open(contactInfo.value.website, '_blank');
};
</script>

<template>
  <div class="about-us-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="24" color="#fff" />
      </div>
      <div class="title">关于我们</div>
      <div class="placeholder"></div>
    </div>

    <div class="content">
      <!-- 应用Logo和基本信息 -->
      <div class="app-info-card">
        <div class="app-logo">
          <img src="@/assets/img/icon-vip-active.png" alt="应用Logo" />
        </div>
        <div class="app-details">
          <div class="app-name">{{ appInfo.name }}</div>
          <div class="app-version">{{ appInfo.version }}</div>
          <div class="app-description">{{ appInfo.description }}</div>
        </div>
      </div>

      <!-- 功能特色 -->
      <div class="features-section">
        <div class="section-title">功能特色</div>
        <div class="features-list">
          <div 
            v-for="(feature, index) in appInfo.features" 
            :key="index"
            class="feature-item"
          >
            <div class="feature-icon">
              <van-icon name="checked" size="16" color="#ff9500" />
            </div>
            <div class="feature-text">{{ feature }}</div>
          </div>
        </div>
      </div>

      <!-- 联系我们 -->
      <div class="contact-section">
        <div class="section-title">联系我们</div>
        <div class="contact-list">
          <div class="contact-item" @click="visitWebsite">
            <div class="contact-icon">
              <van-icon name="globe-o" size="20" color="#ff9500" />
            </div>
            <div class="contact-info">
              <div class="contact-label">官方网站</div>
              <div class="contact-value">{{ contactInfo.website }}</div>
            </div>
            <div class="contact-arrow">
              <van-icon name="arrow" size="16" color="#999" />
            </div>
          </div>

          <div class="contact-item" @click="copyContact('邮箱地址', contactInfo.email)">
            <div class="contact-icon">
              <van-icon name="envelop-o" size="20" color="#ff9500" />
            </div>
            <div class="contact-info">
              <div class="contact-label">邮箱地址</div>
              <div class="contact-value">{{ contactInfo.email }}</div>
            </div>
            <div class="contact-arrow">
              <van-icon name="copy" size="16" color="#999" />
            </div>
          </div>

          <div class="contact-item" @click="copyContact('QQ客服', contactInfo.qq)">
            <div class="contact-icon">
              <van-icon name="chat-o" size="20" color="#ff9500" />
            </div>
            <div class="contact-info">
              <div class="contact-label">QQ客服</div>
              <div class="contact-value">{{ contactInfo.qq }}</div>
            </div>
            <div class="contact-arrow">
              <van-icon name="copy" size="16" color="#999" />
            </div>
          </div>

          <div class="contact-item" @click="copyContact('微信客服', contactInfo.wechat)">
            <div class="contact-icon">
              <van-icon name="wechat" size="20" color="#ff9500" />
            </div>
            <div class="contact-info">
              <div class="contact-label">微信客服</div>
              <div class="contact-value">{{ contactInfo.wechat }}</div>
            </div>
            <div class="contact-arrow">
              <van-icon name="copy" size="16" color="#999" />
            </div>
          </div>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="copyright-section">
        <div class="copyright-text">
          © 2025 {{ appInfo.name }}. All rights reserved.
        </div>
        <div class="copyright-desc">
          致力于为用户提供优质的娱乐体验
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-us-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
}

/* 顶部导航栏样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #111;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-button {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.placeholder {
  width: 24px;
  height: 24px;
}

/* 内容区域 */
.content {
  padding: 0 15px 20px;
}

/* 应用信息卡片 */
.app-info-card {
  background-color: #222;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.app-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
}

.app-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #ff9500;
}

.app-version {
  font-size: 14px;
  color: #999;
  margin-bottom: 15px;
}

.app-description {
  font-size: 16px;
  line-height: 1.6;
  color: #ccc;
}

/* 功能特色区域 */
.features-section {
  background-color: #222;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #ff9500;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
}

.feature-icon {
  margin-right: 10px;
}

.feature-text {
  font-size: 16px;
  color: #ccc;
}

/* 联系我们区域 */
.contact-section {
  background-color: #222;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item:hover {
  background-color: rgba(255, 149, 0, 0.1);
}

.contact-icon {
  margin-right: 15px;
  width: 20px;
  display: flex;
  justify-content: center;
}

.contact-info {
  flex: 1;
}

.contact-label {
  font-size: 16px;
  color: #fff;
  
}

.contact-value {
  font-size: 14px;
  color: #999;
}

.contact-arrow {
  width: 16px;
  display: flex;
  justify-content: center;
}

/* 版权信息区域 */
.copyright-section {
  text-align: center;
  padding: 20px 0;
}

.copyright-text {
  font-size: 14px;
  color: #999;
  margin-bottom: 5px;
}

.copyright-desc {
  font-size: 12px;
  color: #666;
}
</style> 
