<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import { fetchAccountDetails, type AccountDetail, getUserInfo, isLoggedIn } from '@/api/fetch-api'

const router = useRouter()

// 数据状态
const accountDetails = ref<AccountDetail[]>([])
const isLoading = ref(false)
const hasError = ref(false)

// 获取账目明细数据
const loadAccountDetails = async () => {
  isLoading.value = true
  hasError.value = false

  try {
    const result = await fetchAccountDetails()
    console.log('获取账目明细数据:', result)

    if (result && result.code === 1) {
      accountDetails.value = result.data || []
    } else {
      hasError.value = true
      showToast(result?.msg || '获取账目明细失败')
    }
  } catch (error) {
    console.error('获取账目明细失败:', error)
    hasError.value = true
    showToast('网络错误，请重试')
  } finally {
    isLoading.value = false
  }
}

// 格式化金额显示
const formatAmount = (amount: string) => {
  const num = parseFloat(amount)
  return num.toFixed(2)
}

// 获取类型样式类
const getTypeClass = (type: string) => {
  return type === '收入' ? 'income' : 'expense'
}

// 获取类型图标
const getTypeIcon = (type: string) => {
  return type === '收入' ? '+' : '-'
}

// 检查登录状态并加载数据
onMounted(() => {
  if (!isLoggedIn()) {
    showToast('请先登录')
    router.push('/login')
    return
  }

  loadAccountDetails()
})
</script>

<template>
  <div class="wallet-page">
    <!-- 顶部导航栏 -->
    <HeaderNav title="账目明细" />

    <!-- 主要内容区 -->
    <div class="wallet-container">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <van-loading type="spinner" color="#ff9500">加载中...</van-loading>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="hasError" class="error-container">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载失败</div>
        <button class="retry-button" @click="loadAccountDetails">重试</button>
      </div>

      <!-- 账目明细列表 -->
      <div v-else-if="accountDetails.length > 0" class="record-list">
        <div v-for="detail in accountDetails" :key="detail.id" class="record-item">
          <!-- 账目信息 -->
          <div class="record-header">
            <div class="account-info">
              <div class="account-action">{{ detail.action }}</div>
              <div class="account-id">ID: {{ detail.id }}</div>
            </div>
            <div class="account-type" :class="getTypeClass(detail.type)">
              {{ detail.type }}
            </div>
          </div>

          <!-- 账目详情 -->
          <div class="record-details">
            <div class="detail-row">
              <span class="detail-label">金额:</span>
              <span class="detail-value amount" :class="getTypeClass(detail.type)">
                {{ getTypeIcon(detail.type) }}{{ formatAmount(detail.totalcoin) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="empty-container">
        <van-icon name="orders-o" size="48" color="#666" />
        <div class="empty-text">暂无账目记录</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wallet-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 20px;
}

/* 内容区域 */
.wallet-container {
  flex: 1;
  padding: 60px 16px 20px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-text {
  margin-top: 15px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.retry-button {
  margin-top: 20px;
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 149, 0, 0.4);
}

/* 空状态 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-text {
  margin-top: 15px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
}

/* 记录列表 */
.record-list {
  padding-top: 20px;
}

.record-item {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.record-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* 记录头部 */
.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.account-info {
  flex: 1;
}

.account-action {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.account-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.account-type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.account-type.income {
  background-color: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.account-type.expense {
  background-color: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

/* 记录详情 */
.record-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  min-width: 60px;
}

.detail-value {
  font-size: 14px;
  color: #fff;
  text-align: right;
  flex: 1;
}

.amount {
  font-weight: 600;
  font-size: 15px;
  font-family: monospace;
}

.amount.income {
  color: #4caf50;
}

.amount.expense {
  color: #f44336;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .wallet-container {
    padding: 60px 12px 20px;
  }

  .record-item {
    padding: 12px;
  }

  .account-action {
    font-size: 15px;
  }

  .record-header {
    align-items: flex-start;
    gap: 8px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .detail-value {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .record-list {
    padding-top: 12px;
  }

  .record-item {
    margin-bottom: 12px;
    padding: 10px;
  }

  .detail-label {
    font-size: 13px;
    min-width: auto;
  }

  .detail-value {
    font-size: 13px;
  }

  .amount {
    font-size: 14px;
  }
}
</style>