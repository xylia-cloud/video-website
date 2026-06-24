<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { fetchWithdrawRecords, type AccountDetail } from '@/api/fetch-api'

const records = ref<AccountDetail[]>([])
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

const loadWithdrawRecords = async () => {
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const result = await fetchWithdrawRecords()
    if (result.code === 1) {
      records.value = result.data || []
    } else {
      hasError.value = true
      errorMessage.value = result.msg || '获取提现记录失败'
    }
  } catch (error) {
    console.error('获取提现记录失败:', error)
    hasError.value = true
    errorMessage.value = (error as Error).message || '网络请求失败'
  } finally {
    isLoading.value = false
  }
}

const formatAmount = (amount: string) => {
  const num = parseFloat(amount)
  return Number.isNaN(num) ? amount : num.toFixed(2)
}

onMounted(() => {
  loadWithdrawRecords()
})
</script>

<template>
  <div class="withdraw-record-page">
    <HeaderNav title="提现记录" />

    <div class="page-content">
      <div v-if="isLoading" class="state-panel">
        <van-loading type="spinner" color="#ff9500">加载中...</van-loading>
      </div>

      <div v-else-if="hasError" class="state-panel">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="state-text">{{ errorMessage }}</div>
        <button class="retry-btn" type="button" @click="loadWithdrawRecords">重试</button>
      </div>

      <div v-else-if="records.length === 0" class="state-panel">
        <van-icon name="orders-o" size="48" color="#666" />
        <div class="state-text">暂无提现记录</div>
      </div>

      <div v-else class="records-list">
        <div v-for="record in records" :key="record.id" class="record-item">
          <div class="record-header">
            <div class="record-action">{{ record.action }}</div>
            <div class="record-type expense">{{ record.type }}</div>
          </div>
          <div class="record-body">
            <div class="info-row">
              <span class="info-label">金额</span>
              <span class="info-value amount">-{{ formatAmount(record.totalcoin) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">记录 ID</span>
              <span class="info-value">{{ record.id }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.withdraw-record-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
}

.page-content {
  padding: 64px 15px 20px;
}

.state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 300px;
  gap: 12px;
}

.state-text {
  color: #999;
  font-size: 14px;
}

.retry-btn {
  padding: 10px 30px;
  background-color: #ff9500;
  border: none;
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  background-color: #222;
  border-radius: 12px;
  padding: 15px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.record-action {
  font-size: 15px;
  font-weight: 500;
}

.record-type {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
}

.record-type.expense {
  color: #ff9500;
  background-color: rgba(255, 149, 0, 0.12);
}

.record-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.info-label {
  color: #999;
}

.info-value {
  color: #fff;
}

.info-value.amount {
  color: #ff9500;
  font-size: 18px;
  font-weight: bold;
}
</style>
