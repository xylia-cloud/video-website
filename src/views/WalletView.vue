<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import HeaderNav from '@/components/HeaderNav.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const { coin, isLoggedIn } = storeToRefs(userStore)

const userBalance = computed(() => coin.value)

const loadWalletBalance = async () => {
  if (!userStore.isLoggedIn) {
    return
  }

  try {
    await userStore.refreshPoints()
  } catch (error) {
    console.error('刷新钱包余额失败:', error)
  }
}

// 检查登录状态并跳转
const checkLogin = () => {
  if (!isLoggedIn.value) {
    showToast('请先登录')
    router.push('/login')
    return false
  }
  return true
}

// 跳转到充值页面
const goToRecharge = () => {
  if (checkLogin()) {
    router.push('/recharge')
  }
}

// 跳转到提现页面
const goToWithdraw = () => {
  if (checkLogin()) {
    router.push('/withdraw')
  }
}

// 跳转到提现记录页面
const goToWithdrawRecord = () => {
  if (checkLogin()) {
    router.push('/withdraw-record')
  }
}

// 跳转到账目明细页面
const goToAccountDetails = () => {
  if (checkLogin()) {
    router.push('/account-details')
  }
}

// 跳转到充值记录页面
const goToRechargeRecord = () => {
  if (checkLogin()) {
    router.push('/recharge-record')
  }
}

onMounted(() => {
  loadWalletBalance()
})
</script>

<template>
  <div class="wallet-page">
    <!-- 头部导航 -->
    <HeaderNav title="钱包" />

    <!-- 钱包主体内容 -->
    <div class="wallet-container">
      <!-- 未登录提示 -->
      <div v-if="!isLoggedIn" class="login-prompt">
        <div class="login-prompt-icon">
          <van-icon name="lock" size="48" color="#666" />
        </div>
        <div class="login-prompt-text">请先登录查看钱包信息</div>
        <button class="login-btn" @click="router.push('/login')">立即登录</button>
      </div>

      <!-- 已登录状态 - 钻石余额展示 -->
      <div v-else class="balance-section">
        <!-- 钻石图标 -->
        <div class="diamond-icon">
          <img src="@/assets/img/icon-diamond.png" alt="钻石" />
        </div>

        <!-- 余额标题 -->
        <div class="balance-title">钻石余额</div>

        <!-- 余额数值 -->
        <div class="balance-amount">{{ userBalance.toFixed(2) }}</div>
      </div>

      <!-- 已登录状态 - 操作按钮区域 -->
      <div v-if="isLoggedIn" class="action-buttons">
        <!-- 充值按钮 -->
        <button class="action-btn recharge-btn" @click="goToRecharge">
          + 充值
        </button>

        <!-- 提现按钮 -->
        <button class="action-btn withdraw-btn" @click="goToWithdraw">
          ⇓ 提现
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wallet-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
}

.wallet-container {
  padding: 80px 20px 20px;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  text-align: center;
}

.login-prompt-icon {
  margin-bottom: 20px;
}

.login-prompt-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 30px;
}

.login-btn {
  background-color: #ff9500;
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 12px 40px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-btn:hover {
  background-color: #e68600;
}

.balance-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 60px;
  margin-bottom: 40px;
}

.diamond-icon {
  margin-bottom: 20px;
}

.diamond-icon img {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.balance-title {
  font-size: 16px;
  color: #999;
  margin-bottom: 10px;
}

.balance-amount {
  font-size: 48px;
  font-weight: bold;
  color: #ff9500;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}

.action-btn {
  flex: 1;
  height: 50px;
  border-radius: 25px;
  border: none;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recharge-btn,
.withdraw-btn {
  background-color: #ff9500;
  color: #fff;
}

.recharge-btn:hover,
.withdraw-btn:hover {
  background-color: #e68600;
}

@media (max-width: 375px) {
  .wallet-container {
    padding: 70px 16px 20px;
  }

  .balance-section {
    padding: 30px 16px 50px;
  }

  .diamond-icon img {
    width: 100px;
    height: 100px;
  }

  .balance-amount {
    font-size: 42px;
  }

  .action-buttons {
    gap: 16px;
  }
}
</style>
