<script setup lang="ts">
// 充值页面逻辑
import { Icon } from 'vant';
import { ref, onMounted } from 'vue';

// 当前选中的套餐类型
const activeTab = ref('gold'); // 'gold' 或 'vip'

const selectedCoin = ref(30);
const selectedPrice = ref(30.00);

const coinOptions = [
  { amount: 30, price: 30.00 },
  { amount: 50, price: 50.00 },
  { amount: 100, price: 100.00 },
  { amount: 200, price: 200.00 },
  { amount: 400, price: 400.00 },
  { amount: 500, price: 500.00 },
  { amount: 1000, price: 1000.00 },
  { amount: 2000, price: 2000.00 }
];

// VIP套餐选项
const vipOptions = [
  { name: '体验VIP', desc: '视频体验VIP一天', price: 30, duration: '1天', id: 1 },
  { name: '月度畅看VIP', desc: '视频VIP一个月', price: 50, duration: '1个月', id: 2 },
  { name: '季度畅看VIP', desc: '视频VIP三个月', price: 100, duration: '3个月', id: 3 },
  { name: '半年尊享VIP', desc: '视频VIP六个月', price: 120, duration: '6个月', id: 4 },
  { name: '年度尊享VIP', desc: '视频VIP一年', price: 150, duration: '1年', id: 5 },
  { name: '终身至尊VIP', desc: '视频SVIP终身', price: 200, duration: '终身', id: 6 }
];

// 当前选择的VIP套餐
const selectedVIP = ref(vipOptions[0]);

const selectCoin = (coin: number, price: number): void => {
  selectedCoin.value = coin;
  selectedPrice.value = price;
};

const selectVIP = (vip: any): void => {
  console.log('选择VIP套餐', vip.name);
  selectedVIP.value = vip;
};

const switchTab = (tab: string): void => {
  activeTab.value = tab;
  if (tab === 'vip') {
    selectedVIP.value = vipOptions[0];
  } else {
    selectCoin(30, 30.00);
  }
};

// 确保初始化时有选中状态
onMounted(() => {
  if (activeTab.value === 'vip') {
    selectedVIP.value = vipOptions[0];
  }
});
</script>

<template>
  <div class="recharge-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="nav-bar">
        <div class="back-button" @click="$router.back()">
          <Icon name="arrow-left" color="#fff" size="20" />
        </div>
        <div class="page-title">充值</div>
        <div class="right-placeholder"></div>
      </div>
    </div>

    <!-- 充值选项 -->
    <div class="recharge-container">
      <!-- 套餐选择标签页 -->
      <div class="package-tabs">
        <div 
          class="tab-item vip" 
          :class="{ active: activeTab === 'vip' }"
          @click="switchTab('vip')"
        >
          VIP套餐
        </div>
        <div 
          class="tab-item gold" 
          :class="{ active: activeTab === 'gold' }"
          @click="switchTab('gold')"
        >
          金币套餐
        </div>
      </div>
      
      <!-- 账户信息 -->
      <div class="account-info">
        <div class="membership-status">
          <span>视频会员：</span>
          <span class="activated">已开通 <img src="@/assets/img/icon-vip-badge.svg" alt="会员图标" /></span>
        </div>
        <div class="balance">
          <div class="balance-amount">9999.99</div>
          <div class="balance-label">账户余额</div>
        </div>
        <div class="membership-icon">
          <img src="@/assets/img/icon-vip-active.png" alt="会员图标" />
        </div>
      </div>
      
      <!-- 金币套餐选项 -->
      <div class="recharge-grid" v-if="activeTab === 'gold'">
        <div 
          v-for="(option, index) in coinOptions" 
          :key="index"
          class="recharge-item" 
          :class="{ selected: selectedCoin === option.amount }"
          @click="selectCoin(option.amount, option.price)"
        >
          <div class="coin-icon">
            <img src="../assets/img/icon-coin.png" alt="积分" />
          </div>
          <div class="coin-amount">{{ option.amount }}积分</div>
          <div class="selected-mark" v-if="selectedCoin === option.amount">
            <img src="../assets/img/icon-check.svg" alt="选中" />
          </div>
          <div class="item-footer">祝您日进斗金</div>
        </div>
      </div>

      <!-- VIP套餐选项 -->
      <div class="vip-list" v-if="activeTab === 'vip'">
        <div 
          v-for="(vip, index) in vipOptions" 
          :key="vip.id"
          class="vip-item" 
          :class="{ active: selectedVIP.id === vip.id }"
          @click="selectVIP(vip)"
        >
          <div class="vip-item-left">
            <div class="vip-icon">
              <img src="../assets/img/icon-vip-active.png" alt="VIP图标" />
            </div>
          </div>
          <div class="vip-item-middle">
            <div class="vip-title">{{ vip.name }}</div>
            <div class="vip-subtitle">{{ vip.desc }}</div>
          </div>
          <div class="vip-item-right">
            <div class="vip-price">{{ vip.price }}元</div>
            <div class="vip-selected" v-if="selectedVIP.id === vip.id">
              <img src="../assets/img/icon-check.svg" alt="选中" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部结算栏 -->
    <div class="checkout-bar">
      <div class="total-amount" v-if="activeTab === 'gold'">
        总计 {{ selectedPrice.toFixed(2) }}元
      </div>
      <div class="total-amount" v-else>
        {{ selectedVIP.name }} {{ selectedVIP.price.toFixed(2) }}元
      </div>
      <div class="checkout-button">立即购买</div>
    </div>
  </div>
</template>

<style scoped>
.recharge-page {
  background-color: #111;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  padding: 10px 15px;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
}

.back-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.right-placeholder {
  width: 44px;
}

.recharge-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px;
}

.package-tabs {
  display: flex;
  margin-bottom: 20px;
  overflow: hidden;
  gap: 16px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  background-color: #222;
  font-size: 14px;
}

.tab-item.active {
  background-color: #FF8F00;
  color: #fff;
}

.tab-item.vip {
  border-radius: 50px;
}

.tab-item.gold {
  border-radius: 50px;
}

.account-info {
  background-color: #222;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.membership-status {
  font-size: 14px;
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.activated {
  color: #FF8F00;
  display: flex;
  align-items: center;
}

.balance-amount {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.balance-label {
  font-size: 14px;
  color: #999;
}

.membership-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
}

.membership-icon img {
  width: 136px;
}

.recharge-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 80px;
}

.recharge-item {
  background-color: #222;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  border: 2px solid transparent;
}

.recharge-item.selected {
  border-color: #FF8F00;
}

.coin-icon {
  width: 70px;
  height: 70px;
  margin-bottom: 10px;
}

.coin-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.coin-amount {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.selected-mark {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #FF8F00;
  font-weight: bold;
}

.item-footer {
  font-size: 12px;
  color: #999;
  background-color: #333;
  width: 100%;
  text-align: center;
  padding: 4px 0;
  border-radius: 4px;
}

/* VIP套餐样式 */
.vip-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 80px;
}

.vip-item {
  background-color: #272727;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 15px;
  position: relative;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.vip-item.active {
  border: 2px solid #FF8F00 !important;
}

.vip-item-left {
  margin-right: 15px;
}

.vip-icon {
  width: 40px;
  height: 40px;
  background-color: rgba(148, 87, 235, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.vip-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.vip-item-middle {
  flex: 1;
}

.vip-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.vip-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.vip-item-right {
  text-align: right;
  margin-right: 15px;
}

.vip-price {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.vip-selected {
  position: absolute;
  bottom: 2px;
  right: 2px;
}

.checkout-bar {
  height: 60px;
  background-color: #222;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 0 15px;
}

.total-amount {
  flex: 1;
  font-size: 16px;
}

.checkout-button {
  background-color: #FF8F00;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}
</style> 