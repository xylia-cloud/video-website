<script setup lang="ts">
// 积分记录页面逻辑
import { ref, computed } from 'vue';
import HeaderNav from '@/components/HeaderNav.vue';

// 当前积分余额
const pointsBalance = ref('9999');

// 积分记录数据
const pointsHistory = ref([
  { id: 1, date: '2025-04-20', amount: 100, type: '观看视频', status: 'add', desc: '完成视频观看任务' },
  { id: 2, date: '2025-04-19', amount: 50, type: '每日签到', status: 'add', desc: '连续签到奖励' },
  { id: 3, date: '2025-04-18', amount: 200, type: '购买VIP', status: 'minus', desc: '购买月度VIP会员' },
  { id: 4, date: '2025-04-17', amount: 200, type: '充值', status: 'add', desc: '购买积分套餐' },
  { id: 5, date: '2025-04-16', amount: 150, type: '观看付费视频', status: 'minus', desc: '观看付费内容' },
  { id: 6, date: '2025-04-15', amount: 30, type: '分享奖励', status: 'add', desc: '分享内容获得奖励' },
  { id: 7, date: '2025-04-14', amount: 50, type: '邀请好友', status: 'add', desc: '邀请新用户注册' },
  { id: 8, date: '2025-04-13', amount: 100, type: '完成任务', status: 'add', desc: '完成每日任务' },
  { id: 9, date: '2025-04-12', amount: 20, type: '点赞视频', status: 'add', desc: '点赞10个视频' },
  { id: 10, date: '2025-04-11', amount: 300, type: '购买视频', status: 'minus', desc: '购买高级VIP视频' }
]);

// 标签选项
const tabs = ref([
  { id: 'all', name: '全部' },
  { id: 'add', name: '获取' },
  { id: 'minus', name: '消费' }
]);

// 当前选中的标签
const activeTab = ref('all');

// 过滤后的积分记录
const filteredRecords = computed(() => {
  if (activeTab.value === 'all') {
    return pointsHistory.value;
  } else {
    return pointsHistory.value.filter(record => record.status === activeTab.value);
  }
});

// 切换标签
const switchTab = (tabId: string) => {
  activeTab.value = tabId;
};
</script>

<template>
  <div class="points-record-page">
    <!-- 顶部导航栏 -->
    <HeaderNav title="积分记录" />

    <!-- 积分余额卡片 -->
    <div class="points-container">
      <div class="balance-card">
        <div class="balance-label">当前积分余额</div>
        <div class="balance-amount">{{ pointsBalance }}</div>
        <div class="coin-icon">
          <img src="@/assets/img/icon-coin.png" alt="积分" />
        </div>
      </div>

      <!-- 标签选项卡 -->
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-item" 
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- 积分记录列表 -->
      <div class="records-list">
        <div v-for="record in filteredRecords" :key="record.id" class="record-item">
          <div class="record-header">
            <div class="record-type">{{ record.type }}</div>
            <div class="record-amount" :class="record.status">
              {{ record.status === 'add' ? '+' : '-' }}{{ record.amount }}
            </div>
          </div>
          <div class="record-content">
            <div class="record-desc">{{ record.desc }}</div>
            <div class="record-date">{{ record.date }}</div>
          </div>
        </div>
      </div>

      <!-- 没有更多数据提示 -->
      <div class="no-more">— 没有更多记录了 —</div>
    </div>
  </div>
</template>

<style scoped>
.points-record-page {
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
  -webkit-overflow-scrolling: touch;
}

.points-container {
  flex: 1;
  padding: 0 15px;
  padding-bottom: 20px;
  padding-top: 64px;
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
  color: #999;
}

.balance-amount {
  font-size: 24px;
  font-weight: bold;
  margin-top: 5px;
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

/* 标签栏 */
.tabs {
  display: flex;
  background-color: #222;
  border-radius: 8px;
  margin: 15px 0;
  padding: 3px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.3s;
}

.tab-item.active {
  background-color: #ff9500;
  color: #000;
  font-weight: bold;
}

/* 记录列表 */
.records-list {
  margin-top: 15px;
}

.record-item {
  background-color: #222;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-type {
  font-size: 16px;
  font-weight: bold;
}

.record-amount {
  font-size: 18px;
  font-weight: bold;
}

.record-amount.add {
  color: #00C853;
}

.record-amount.minus {
  color: #FF3D00;
}

.record-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-desc {
  font-size: 14px;
  color: #999;
}

.record-date {
  font-size: 12px;
  color: #666;
}

.no-more {
  text-align: center;
  color: #666;
  font-size: 12px;
  margin: 20px 0;
}
</style> 