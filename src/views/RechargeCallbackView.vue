<template>
  <div class="recharge-callback-page">
    <div class="callback-container">
      <!-- 成功图标 -->
      <div class="success-icon">
        <van-icon name="checked" />
      </div>

      <!-- 标题 -->
      <h1 class="callback-title">充值成功</h1>

      <!-- 提示信息 -->
      <p class="callback-message">您的充值已成功到账，感谢您的支持！</p>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn-primary" @click="goToHome">返回首页</button>
        <button class="btn-secondary" @click="goToProfile">查看账户</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 查看账户
const goToProfile = () => {
  router.push('/profile')
}
</script>

<style scoped>
.recharge-callback-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.callback-container {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border-radius: 20px;
  padding: 40px 30px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.5s ease-out;
}

.success-icon .van-icon {
  font-size: 50px;
  color: #fff;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.callback-title {
  font-size: 28px;
  color: #fff;
  margin: 0 0 15px 0;
  font-weight: bold;
}

.callback-message {
  font-size: 16px;
  color: #b0b0b0;
  margin: 0 0 40px 0;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  padding: 12px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: normal;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s ease;
  text-align: center;
}

.btn-primary {
  background-color: #ff9500;
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:active {
  opacity: 0.8;
}

.btn-secondary {
  background-color: transparent;
  color: #ff9500;
  border: 1px solid #ff9500;
}

.btn-secondary:hover {
  background-color: rgba(255, 149, 0, 0.1);
}

.btn-secondary:active {
  opacity: 0.8;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .callback-container {
    padding: 30px 20px;
  }

  .callback-title {
    font-size: 24px;
  }

  .callback-message {
    font-size: 14px;
  }

  .success-icon {
    width: 70px;
    height: 70px;
  }

  .success-icon .van-icon {
    font-size: 40px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}</style>
