<script setup lang="ts">
// 提现页面逻辑
import { Icon } from 'vant';
import { ref } from 'vue';
import BankCardSelector from '@/components/BankCardSelector.vue';
import HeaderNav from '@/components/HeaderNav.vue';

// 可提现余额
const withdrawableBalance = ref('9999.99');

// 提现金额选项
const amountOptions = [
  { amount: 0.3, label: '0.3元' },
  { amount: 1, label: '1元' },
  { amount: 5, label: '5元' },
  { amount: 10, label: '10元' },
  { amount: 20, label: '20元' },
  { amount: 50, label: '50元' },
  { amount: 100, label: '100元' },
  { amount: 200, label: '200元' },
  { amount: 'custom', label: '自定义' },
];

// 当前选中的金额
const selectedAmount = ref<number | string>(0.3);
// 自定义金额
const customAmount = ref<string>('');
// 显示自定义金额输入框
const showCustomInput = ref(false);
// 显示提现成功弹窗
const showSuccessPopup = ref(false);

// 银行卡选择弹窗显示状态
const showBankCardSelector = ref(false);

// 当前选中的银行卡信息
const selectedBankCard = ref({
  name: '温雅然',
  bank: '工商银行',
  cardNumber: '6217178678109080027',
  lastFour: '0027'
});

// 选择提现金额
const selectAmount = (amount: number | string) => {
  selectedAmount.value = amount;
  // 如果是自定义金额，显示输入框
  if (amount === 'custom') {
    showCustomInput.value = true;
    customAmount.value = '';
  } else {
    showCustomInput.value = false;
  }
};

// 打开银行卡选择弹窗
const openBankCardSelector = () => {
  showBankCardSelector.value = true;
};

// 选择银行卡回调
const onSelectBankCard = (card: any) => {
  selectedBankCard.value = {
    ...card,
    lastFour: card.cardNumber.slice(-4)
  };
};

// 提现操作
const withdraw = () => {
  // 如果是自定义金额，使用自定义的金额值
  const finalAmount = selectedAmount.value === 'custom' ? customAmount.value : selectedAmount.value;
  console.log('提现金额：', finalAmount);
  console.log('提现银行卡：', selectedBankCard.value);
  // 显示提现成功弹窗
  showSuccessPopup.value = true;
  // 实际提现逻辑处理
};

// 关闭提现成功弹窗
const closeSuccessPopup = () => {
  showSuccessPopup.value = false;
};
</script>

<template>
  <div class="withdraw-page">
    <!-- 顶部导航栏 -->
    <HeaderNav title="提现" />

    <!-- 提现内容区 -->
    <div class="withdraw-container">
      <!-- 可提现余额 -->
      <div class="balance-card">
        <div class="balance-label">可提现余额：</div>
        <div class="balance-amount">{{ withdrawableBalance }}</div>
        <div class="coin-icon">
          <img src="@/assets/img/icon-coin.png" alt="积分" />
        </div>
      </div>

      <!-- 选择提现金额 -->
      <div class="amount-section">
        <div class="section-title">选择提现金额</div>
        <div class="withdraw-to" @click="openBankCardSelector">
          提现至银行卡（{{ selectedBankCard.lastFour }}）
          <Icon name="arrow" color="#999" size="16" />
        </div>
      </div>

      <!-- 金额选择网格 -->
      <div class="amount-grid">
        <div 
          v-for="option in amountOptions" 
          :key="option.label"
          class="amount-item" 
          :class="{ selected: selectedAmount === option.amount }"
          @click="selectAmount(option.amount)"
        >
          {{ option.label }}
        </div>
      </div>

      <!-- 自定义金额输入框 -->
      <div v-if="showCustomInput" class="custom-amount-input">
        <div class="input-wrapper">
          <span class="input-prefix">¥</span>
          <input 
            type="number" 
            v-model="customAmount" 
            placeholder="请输入提现金额" 
            min="0.3"
            step="0.1"
          />
        </div>
      </div>

      <!-- 提现按钮 -->
      <div class="withdraw-button-container">
        <div class="withdraw-button" @click="withdraw">立即提现</div>
      </div>

      <!-- 温馨提示 -->
      <div class="tips-section">
        <div class="tips-title">温馨提示：</div>
        <div class="tips-content">
          <div class="tip-item">1.提现服务时间为12小时：；上午12.00到晚23.50 分</div>
          <div class="tip-item">2.提现同账号每日累积提现上限总额为 10000000元整；</div>
          <div class="tip-item">3.每次发起提现以后流水系统会自动清零流水；</div>
          <div class="tip-item">4. 提现需投注金额达到充值金额的400%，否则无法完成提现。</div>
          <div class="tip-item">（例如：充值100元，需投注400元方可提现。）</div>
          <div class="tip-item">5. 请确保正确填写开户银行、银行卡号和持卡人姓名。</div>
          <div class="tip-item">6. 由于银行卡风控，现调整提现金额为200元起。</div>
          <div class="tip-item">7.当您提现申请完成后，我承诺，除非遇到非可控因素，我们</div>
          <div class="tip-item">将为您提供1分钟快速到账的提款服务。</div>
        </div>
      </div>
    </div>

    <!-- 银行卡选择弹窗 -->
    <BankCardSelector
      v-model="showBankCardSelector"
      :initial-selected-index="0"
      @select="onSelectBankCard"
    />

    <!-- 提现成功弹窗 -->
    <div class="success-popup" v-if="showSuccessPopup">
      <div class="popup-overlay" @click="closeSuccessPopup"></div>
      <div class="success-popup-content">
        <div class="success-popup-bg">
          <img src="@/assets/img/bg-withdraw-success.png" alt="提现成功背景" />
          <div class="success-popup-text">
            <div class="success-title">提现成功</div>
            <div class="success-desc">提现成功，请耐心等待审核</div>
          </div>
          <div class="success-button" @click="closeSuccessPopup">确定</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.withdraw-page {
  background-color: #111;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* 提升iOS滚动体验 */
}

.withdraw-container {
  flex: 1;
  padding: 0 15px;
  padding-bottom: 20px;
  padding-top: 64px; /* 调整为HeaderNav的默认高度+间距 */
}

.balance-card {
  background-color: #222;
  border-radius: 10px;
  padding: 20px;
  margin: 15px 0;
  position: relative;
  overflow: hidden;
}

.balance-label {
  font-size: 14px;
}

.balance-amount {
  font-size: 24px;
  font-weight: bold;
}

.coin-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.coin-icon img {
  width: 70px;
  height: 70px;
}

.amount-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
}

.withdraw-to {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #ccc;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 30px;
}

.amount-item {
  background-color: #222;
  border-radius: 8px;
  padding: 15px 0;
  text-align: center;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid transparent;
}

.amount-item.selected {
  background-color: #FF8F00;
  color: #fff;
}

.custom-amount-input {
  margin-bottom: 30px;
}

.input-wrapper {
  background-color: #222;
  border-radius: 8px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
}

.input-prefix {
  font-size: 18px;
  margin-right: 10px;
  color: #FF8F00;
}

.input-wrapper input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 16px;
  height: 30px;
}

.withdraw-button-container {
  margin-top: 20px;
  margin-bottom: 30px;
}

.withdraw-button {
  background-color: #FF8F00;
  color: #fff;
  text-align: center;
  padding: 15px 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}

.tips-section {
  margin-top: 30px;
  padding: 0 5px;
}

.tips-title {
  font-size: 16px;
  margin-bottom: 10px;
  color: #999;
}

.tips-content {
  color: #999;
  font-size: 14px;
}

.tip-item {
  margin-bottom: 8px;
  line-height: 1.3;
}

/* 提现成功弹窗样式 */
.success-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
}

.success-popup-content {
  position: relative;
  width: 90%;
  max-width: 320px;
  z-index: 1000;
}

.success-popup-bg {
  position: relative;
  width: 100%;
}

.success-popup-bg img {
  width: 100%;
  display: block;
}

.success-popup-text {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  text-align: center;
  transform: translateY(-50%);
}

.success-title {
  font-size: 24px;
  font-weight: bold;
  color: #2C2C2C;
  margin-bottom: 10px;
  margin-top: 20px;
}

.success-desc {
  font-size: 16px;
  color: #2C2C2C;
  opacity: 0.8;
}

.success-button {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: 80%;
  background-color: #FF3B30;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding: 12px 0;
  border-radius: 30px;
}
</style> 