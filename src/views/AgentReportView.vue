<script setup lang="ts">
import { ref } from 'vue'
import HeaderNav from '@/components/HeaderNav.vue'

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'direct', label: '直属' },
  { key: 'indirect', label: '非直属' },
]

const activeTab = ref('all')

const reportCards = [
  { title: '佣金收入', value: '0.00' },
  { title: '团队投注', value: '0.00' },
  { title: '团队盈利', value: '0.00' },
  { title: '团队人数', value: '0' },
  { title: '投注人数', value: '0' },
  { title: '充值人数', value: '0' },
]
</script>

<template>
  <div class="agent-report-page">
    <HeaderNav title="代理报表" />

    <div class="agent-report-content">
      <div class="report-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="report-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="report-grid">
        <div v-for="card in reportCards" :key="card.title" class="report-card">
          <div class="report-value">{{ card.value }}</div>
          <div class="report-label">{{ card.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-report-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
}

.agent-report-content {
  padding: 60px 15px 24px;
}

.report-tabs {
  display: flex;
  align-items: center;
  background-color: #1f1f1f;
  border-radius: 26px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 16px;
}

.report-tab {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #cfcfcf;
  font-size: 15px;
  padding: 10px 0;
  border-radius: 22px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.report-tab.active {
  background-color: #ff9500;
  color: #fff;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
}

.report-card {
  background-image:
    linear-gradient(135deg, rgba(44, 44, 44, 0) 0%, rgba(26, 26, 26, 0) 100%),
    url('@/assets/img/bg-daili-01.png'),
    linear-gradient(90deg, #805123, #f2e29a, #805123);
  background-size: auto, cover, auto;
  background-position: center, center, center;
  background-repeat: no-repeat, no-repeat, no-repeat;
  background-clip: padding-box, padding-box, border-box;
  background-origin: padding-box, padding-box, border-box;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}

.report-value {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
}

.report-label {
  font-size: 15px;
  color: #c3c3c3;
}

@media (max-width: 768px) {
  .report-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

