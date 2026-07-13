<script setup lang="ts">
import { Icon } from 'vant/es/icon'
import { Loading } from 'vant/es/loading'
import type { ChargeOption } from '../types'

const showChargeModal = defineModel<boolean>('showChargeModal', { default: false })

defineProps<{
  showChargeCompleteDialog: boolean
  chargeOptions: ChargeOption[]
  isLoadingChargeOptions: boolean
  selectedChargeOption: ChargeOption | null
}>()

const emit = defineEmits<{
  selectOption: [option: ChargeOption]
  confirmCharge: []
  chargeComplete: []
}>()
</script>

<template>
  <div
    v-if="showChargeModal"
    class="charge-modal-overlay"
    @click.self="showChargeModal = false"
  >
    <div class="charge-modal">

      <div class="charge-content">
        <div v-if="isLoadingChargeOptions" class="charge-loading">
          <Loading type="spinner" color="#ff9500" />
          <div>加载充值选项中...</div>
        </div>

        <div v-else-if="chargeOptions.length === 0" class="charge-empty">
          <Icon name="warning-o" size="24" color="#ff9500" />
          <div>暂无充值选项</div>
        </div>

        <div v-else class="charge-options">
          <div
            v-for="option in chargeOptions"
            :key="option.type"
            :class="['charge-option', { selected: selectedChargeOption?.type === option.type }]"
            @click="emit('selectOption', option)"
          >
            <div class="option-price">¥{{ option.price }}</div>
            <div class="option-desc">{{ option.desc }}</div>
          </div>
        </div>
      </div>

      <div class="charge-footer">
        <button class="charge-cancel-btn" @click="showChargeModal = false">
          取消
        </button>
        <button
          class="charge-confirm-btn"
          :disabled="!selectedChargeOption"
          @click="emit('confirmCharge')"
        >
          确认充值
        </button>
      </div>
    </div>
  </div>

  <div v-if="showChargeCompleteDialog" class="charge-complete-overlay">
    <div class="charge-complete-modal">
      <div class="complete-icon">
        <Icon name="success" size="48" color="#ff9500" />
      </div>
      <div class="complete-title">支付提示</div>
      <div class="complete-content">
        <p>如果您已完成支付，请点击已完成充值按钮</p>
      </div>
      <div class="complete-buttons">
        <button class="complete-confirm-btn" @click="emit('chargeComplete')">已完成充值</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.charge-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.charge-modal {
  border-radius: 16px;
  width: 100%;
  max-width: 300px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.charge-content {
  padding: 8px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-left: 1px solid rgba(255, 149, 0, 0.2);
  border-right: 1px solid rgba(255, 149, 0, 0.2);
  border-radius: 16px 16px 0 0;
  overflow-y: auto;
  flex: 1;
}

.charge-loading,
.charge-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #aaa;
}

.charge-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.charge-option {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 50px;
  justify-content: center;
}

.charge-option.selected {
  border-color: #ff9500;
  background: rgba(255, 149, 0, 0.15);
  box-shadow: 0 0 20px rgba(255, 149, 0, 0.3);
}

.option-price {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 2px;
}

.charge-option.selected .option-price {
  color: #ff9500;
}

.option-desc {
  color: #fff;
  font-size: 11px;
  line-height: 1.2;
}

.charge-footer {
  padding: 8px 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid rgba(255, 149, 0, 0.2);
  border-radius: 0 0 16px 16px;
}

.charge-cancel-btn {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.charge-confirm-btn {
  padding: 10px 16px;
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.charge-confirm-btn:disabled {
  background: linear-gradient(90deg, #666, #555);
  cursor: not-allowed;
  opacity: 0.6;
}

.charge-complete-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
}

.charge-complete-modal {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 16px;
  padding: 30px 24px;
  width: 100%;
  max-width: 320px;
  text-align: center;
  border: 1px solid rgba(255, 149, 0, 0.2);
}

.complete-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin: 16px 0 12px;
}

.complete-content {
  color: #aaa;
  font-size: 14px;
  margin-bottom: 24px;
}

.complete-confirm-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}
</style>
