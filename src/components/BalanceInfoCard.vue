<script setup lang="ts">
import { computed } from 'vue'

// 定义 props
interface Props {
  userVideoNums: number
  isVip: number | string
  balance: number
  showRefreshIcon?: boolean
  refreshLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRefreshIcon: false,
  refreshLoading: false,
})
const emit = defineEmits<{
  (e: 'refresh-balance'): void
}>()

// 计算 VIP 状态（兼容数字和字符串）
const isVipActive = computed(() => {
  return props.isVip === 1 || props.isVip === '1'
})
</script>

<template>
  <div class="balance-info-card">
    <div class="balance-left">
      <div class="vip-section">
        <div class="vip-info">
          <div class="vip-title">
            <div class="vip-icon">
              <img src="@/assets/img/diamond.png" alt="视频会员" />
            </div>
            <span class="vip-title-text">视频会员</span>
            <van-icon v-if="isVipActive" name="success" size="16" color="#52c41a" />
          </div>
          <div class="vip-stats">
            <div class="stats-left">
              <span class="stats-label">观看</span>
              <span class="stats-label">次数</span>
            </div>
            <span class="stats-value">{{ userVideoNums }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="balance-right">
      <div class="balance-title-row">
        <button
          v-if="showRefreshIcon"
          type="button"
          class="balance-refresh-btn"
          :disabled="refreshLoading"
          aria-label="刷新余额"
          @click="emit('refresh-balance')"
        >
          <van-icon
            name="replay"
            size="14"
            class="balance-refresh-icon"
            :class="{ spinning: refreshLoading }"
          />
        </button>
        <div class="balance-title">账户余额</div>
      </div>
      <div class="balance-amount">
        <span class="balance-amount-value">{{ balance.toFixed(2) }}</span>
        <span class="balance-amount-unit">金币</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 视频会员和账户余额卡片 - 使用背景图 */
.balance-info-card {
  padding: 20px;
  background-image: url('@/assets/img/bg-recharge.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 100px;
  position: relative;
  overflow: hidden;
}

/* 左侧：视频会员 */
.balance-left {
  flex: 1;
}

.vip-section {
  display: flex;
  align-items: flex-start;
}

.vip-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.vip-title {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vip-title-text {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
}

.vip-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vip-icon img {
  width: 16px;
  height: 16px;
  filter: drop-shadow(0 2px 4px rgba(255, 149, 0, 0.5));
}

.vip-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.stats-left {
  display: flex;
  flex-direction: column;
  gap: 0;
  line-height: 1.2;
}

.stats-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.stats-value {
  font-size: 24px;
  font-weight: normal;
  color: #fff;
  line-height: 1;
}

/* 右侧：账户余额 */
.balance-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-title {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
}

.balance-title-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.balance-refresh-btn {
  border: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.balance-refresh-btn:disabled {
  cursor: default;
}

.balance-refresh-icon {
  color: rgba(255, 255, 255, 0.85);
}

.balance-refresh-icon.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.balance-amount {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
}

.balance-amount-value {
  font-size: 22px;
  font-weight: normal;
  color: #fff;
  line-height: 1;
}

.balance-amount-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
