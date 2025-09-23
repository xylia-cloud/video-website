<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo, type UserInfo } from '@/api/fetch-api'

const router = useRouter()

// 用户数据
const userInfo = ref<UserInfo | null>(null)
const userBalance = ref(0) // 账户余额（钻石）
const isUserLoggedIn = ref(false)

// 获取用户余额和登录状态 - 参考游戏界面的实现
const fetchUserBalance = () => {
  const localUserInfo = getUserInfo()
  if (localUserInfo && localUserInfo.token) {
    // 用户已登录
    isUserLoggedIn.value = true
    userInfo.value = localUserInfo
    userBalance.value = localUserInfo.coin || 0 // 使用coin字段作为钻石余额
  } else {
    // 用户未登录
    isUserLoggedIn.value = false
    userInfo.value = null
    userBalance.value = 0
  }
}

// 检查登录状态并跳转
const checkLogin = () => {
  if (!isUserLoggedIn.value) {
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
  fetchUserBalance()
})
</script>

<template>
  <div class="wallet-page">
    <!-- 头部导航 -->
    <HeaderNav title="钱包" />

    <!-- 钱包主体内容 -->
    <div class="wallet-container">
      <!-- 未登录提示 -->
      <div v-if="!isUserLoggedIn" class="login-prompt">
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
      <div v-if="isUserLoggedIn" class="action-buttons">
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

/* 登录提示样式 */
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

/* 钻石余额展示区域 */
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

/* 操作按钮区域 */
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

.recharge-btn {
  background-color: #ff9500;
  color: #fff;
}

.recharge-btn:hover {
  background-color: #e68600;
}

.withdraw-btn {
  background-color: #ff9500;
  color: #fff;
}

.withdraw-btn:hover {
  background-color: #e68600;
}

/* 功能列表 */
.function-list {
  background-color: #222;
  border-radius: 12px;
  overflow: hidden;
}

.function-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.function-item:last-child {
  border-bottom: none;
}

.function-item:hover {
  background-color: #2a2a2a;
}

.function-icon {
  width: 40px;
  height: 40px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.function-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.function-text {
  flex: 1;
}

.function-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px;
}

.function-desc {
  font-size: 14px;
  color: #999;
}

.function-arrow {
  color: #666;
}

/* 响应式设计 */
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

  .function-item {
    padding: 14px 16px;
  }
}
</style>