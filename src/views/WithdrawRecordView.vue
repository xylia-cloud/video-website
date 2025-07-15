<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from 'vant';
import { useRouter } from 'vue-router';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};

// 积分明细数据
const pointsRecords = ref([
  { id: 1, date: '2025-04-17', amount: '100', type: '观看视频', status: 'add' },
  { id: 2, date: '2025-04-17', amount: '50', type: '签到奖励', status: 'add' },
  { id: 3, date: '2025-04-14', amount: '200', type: '购买会员', status: 'minus' },
  { id: 4, date: '2025-04-14', amount: '20', type: '分享奖励', status: 'add' },
  { id: 5, date: '2025-04-14', amount: '150', type: '观看付费视频', status: 'minus' },
  { id: 6, date: '2025-04-14', amount: '100', type: '每日任务', status: 'add' },
  { id: 7, date: '2025-04-14', amount: '50', type: '邀请好友', status: 'add' }
]);
</script>

<template>
  <div class="points-details-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="nav-bar">
        <div class="back-button" @click="goBack">
          <Icon name="arrow-left" color="#fff" size="20" />
        </div>
        <div class="page-title">积分明细</div>
        <div class="right-placeholder"></div>
      </div>
    </div>

    <!-- 积分明细列表 -->
    <div class="records-list">
      <div class="record-item" v-for="record in pointsRecords" :key="record.id">
        <div class="record-left">
          <div class="record-title">{{ record.type }}</div>
          <div class="record-date">{{ record.date }}</div>
        </div>
        <div class="record-right">
          <div class="record-amount" :class="{ 'add': record.status === 'add', 'minus': record.status === 'minus' }">
            {{ record.status === 'add' ? '+' : '-' }}{{ record.amount }}
          </div>
          <div class="record-status" :class="{ 'add': record.status === 'add', 'minus': record.status === 'minus' }">
            {{ record.status === 'add' ? '获得' : '消费' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.points-details-page {
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

.records-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #222;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 10px;
}

.record-left {
  display: flex;
  flex-direction: column;
}

.record-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 5px;
}

.record-date {
  font-size: 14px;
  color: #999;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.record-amount {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.record-amount.add {
  color: #00C853;
}

.record-amount.minus {
  color: #FF3D00;
}

.record-status {
  font-size: 14px;
}

.record-status.add {
  color: #00C853;
}

.record-status.minus {
  color: #FF3D00;
}
</style> 