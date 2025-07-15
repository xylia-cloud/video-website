<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon as VanIcon } from 'vant';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};

// 查看隐私政策
const viewPrivacyPolicy = () => {
  router.push('/privacy-policy');
};

// 查看关于我们
const viewAboutUs = () => {
  router.push('/about-us');
};
</script>

<template>
  <div class="settings-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="24" color="#fff" />
      </div>
      <div class="title">系统设置</div>
      <div class="placeholder"></div>
    </div>

    <!-- 设置项列表 -->
    <div class="settings-list">

      
      <div class="settings-item" @click="viewPrivacyPolicy">
        <div class="item-name">隐私政策</div>
        <van-icon name="arrow" size="18" color="#999" />
      </div>
      
      <div class="settings-item" @click="viewAboutUs">
        <div class="item-name">关于我们</div>
        <van-icon name="arrow" size="18" color="#999" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
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
}

.back-button {
  width: 24px;
  height: 24px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.placeholder {
  width: 24px;
  height: 24px;
}

/* 设置项列表样式 */
.settings-list {
  margin: 20px 15px;
  background-color: #222;
  border-radius: 10px;
  overflow: hidden;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #333;
}

.settings-item:last-child {
  border-bottom: none;
}

.item-name {
  font-size: 16px;
  color: #fff;
}
</style> 