<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import HeaderNav from '@/components/HeaderNav.vue';
import { getUserInfo, isLoggedIn } from '@/api/fetch-api';

const router = useRouter();

// 用户信息
const userInfo = ref<any>(null);

// 用户积分
const userPoints = computed(() => {
  if (!userInfo.value) return 0;
  return userInfo.value.user_points || 0;
});

// 获取用户信息
const fetchUserInfo = () => {
  if (!isLoggedIn()) {
    console.log('用户未登录');
    return;
  }
  
  const info = getUserInfo();
  if (info) {
    userInfo.value = info;
    console.log('钱包页面获取用户信息:', info);
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 跳转到充值页面
const goToRecharge = () => {
  router.push('/recharge');
};

// 跳转到积分记录页面（原提现页面）
const goToPointsRecord = () => {
  router.push('/points-record');
};

// 跳转到充值记录页面
const goToRechargeRecord = () => {
  router.push('/recharge-record');
};

// 跳转到积分明细页面（原提现记录页面）
const goToPointsDetails = () => {
  router.push('/points-details');
};

// 跳转到银行卡页面
const goToBankCard = () => {
  router.push('/bank-card');
};

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo();
});
</script>

<template>
  <div class="wallet-page">
    <!-- 顶部导航 -->
    <HeaderNav title="积分明细" />
    
    <div class="page-content">
      <!-- 账户余额 -->
      <div class="balance-card">
        <div class="balance-content">
          <div class="balance-amount">{{ userPoints }}</div>
          <div class="balance-title">积分余额</div>
        </div>
        <div class="balance-icon">
          <img src="@/assets/img/icon-vip-active.png" alt="积分" />
        </div>
      </div>

      <!-- 操作菜单 -->
      <div class="action-menu">

        
        <div class="menu-item" @click="goToRechargeRecord">
          <div class="menu-icon">
            <img src="@/assets/img/icon-czjl-orange.svg" alt="分享记录" />
          </div>
          <div class="menu-text">分享记录</div>
          <div class="menu-arrow">
            <van-icon name="arrow" color="#666" />
          </div>
        </div>
        
        <div class="menu-item" @click="goToPointsDetails">
          <div class="menu-icon">
            <img src="@/assets/img/icon-txjl-orange.svg" alt="积分明细" />
          </div>
          <div class="menu-text">消费记录</div>
          <div class="menu-arrow">
            <van-icon name="arrow" color="#666" />
          </div>
        </div>
        
        <!-- <div class="menu-item" @click="goToBankCard">
          <div class="menu-icon">
            <img src="@/assets/img/icon-bankcard-orange.svg" alt="银行卡" />
          </div>
          <div class="menu-text">银行卡</div>
          <div class="menu-arrow">
            <van-icon name="arrow" color="#666" />
          </div>
        </div> -->
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

.page-content {
  padding-top: 60px; /* 为固定导航留出空间 */
  padding-bottom: 20px;
}

.balance-card {
  margin: 15px;
  background-color: #222;
  border-radius: 12px;
  padding: 0px 0 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.balance-card:before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, transparent 70%, rgba(255, 149, 0, 0.1));
  z-index: 1;
}

.balance-content {
  position: relative;
  z-index: 2;
}

.balance-amount {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.balance-title {
  font-size: 16px;
  color: #999;
}

.balance-icon {
  width: 136px;
  height: 136px;
  position: relative;
  z-index: 2;
}

.balance-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.action-menu {
  margin: 20px 15px;
  background-color: #222;
  border-radius: 12px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 18px 15px;
  border-bottom: 1px solid #333;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 24px;
  height: 24px;
  margin-right: 15px;
}

.menu-icon img {
  width: 100%;
  height: 100%;
}

.menu-text {
  flex: 1;
  font-size: 16px;
}

.menu-arrow {
  width: 20px;
  display: flex;
  justify-content: center;
}
</style> 