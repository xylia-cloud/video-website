<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon, Loading } from 'vant'
import { useRouter } from 'vue-router'
import { fetchPromotionRecord } from '@/api/fetch-api'

const router = useRouter()

// 返回上一页
const goBack = () => {
  router.back()
}

// 推广记录数据接口
interface PromotionRecord {
  addtime: string
  user_login: string
}

// 推广记录数据
const records = ref<PromotionRecord[]>([])
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const hasMoreData = ref(true)
const isLoadingMore = ref(false)

// 获取推广记录
const fetchRecords = async (loadMore = false) => {
  try {
    if (loadMore) {
      isLoadingMore.value = true
    } else {
      isLoading.value = true
      hasError.value = false
      errorMessage.value = ''
      currentPage.value = 1
      records.value = []
    }

    const params = {
      p: currentPage.value,
    }

    console.log('请求推广记录，参数:', params)
    const result = await fetchPromotionRecord(params)
    console.log('推广记录接口返回:', result)

    if (result && result.code === 1 && result.data) {
      const { list = [], count = 0, totalPage = 1 } = result.data

      console.log('推广记录列表:', list)

      if (loadMore) {
        records.value = [...records.value, ...list]
      } else {
        records.value = list
      }

      // 更新分页信息
      totalCount.value = count
      totalPages.value = totalPage
      hasMoreData.value = currentPage.value < totalPage

      // 为下次加载准备
      if (hasMoreData.value) {
        currentPage.value += 1
      }
    } else {
      hasError.value = true
      errorMessage.value = result?.msg || '获取推广记录失败'
    }
  } catch (error) {
    console.error('获取推广记录失败:', error)
    hasError.value = true
    errorMessage.value = (error as Error).message || '网络请求失败'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// 滚动加载更多
const handleScroll = () => {
  if (isLoadingMore.value || !hasMoreData.value) return

  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  // 距离底部100px时加载更多
  if (documentHeight - (scrollTop + windowHeight) < 100) {
    fetchRecords(true)
  }
}

onMounted(() => {
  fetchRecords()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="promotion-record-page">
    <!-- 头部导航 -->
    <div class="header">
      <Icon name="arrow-left" size="20" @click="goBack" />
      <span class="title">推广记录</span>
      <div class="placeholder"></div>
    </div>

    <!-- 统计信息 -->
    <div v-if="!isLoading && !hasError && totalCount > 0" class="stats-info">
      <div class="stats-item">
        <div class="stats-label">累计推广人数</div>
        <div class="stats-value">{{ totalCount }}</div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <Loading type="spinner" size="24px" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-container">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ errorMessage }}</div>
      <div class="retry-button" @click="fetchRecords()">重试</div>
    </div>

    <!-- 推广记录列表 -->
    <div v-else-if="records.length > 0" class="records-list">
      <div v-for="(record, index) in records" :key="index" class="record-item">
        <div class="record-left">
          <div class="record-info">
            <div class="user-name">{{ record.user_login }}</div>
            <div class="record-time">{{ record.addtime }}</div>
          </div>
        </div>
        <div class="record-right">
          <div class="status-badge success">已注册</div>
        </div>
      </div>

      <!-- 加载更多提示 -->
      <div v-if="isLoadingMore" class="loading-more">
        <Loading type="spinner" size="16px" />
        <span>加载中...</span>
      </div>
      <div v-else-if="!hasMoreData" class="no-more-data">没有更多数据了</div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-container">
      <div class="empty-icon">
        <Icon name="orders-o" size="48" color="#999" />
      </div>
      <div class="empty-text">暂无推广记录</div>
      <div class="empty-description">快去邀请好友注册吧</div>
    </div>
  </div>
</template>

<style scoped>
.promotion-record-page {
  min-height: 100vh;
  background-color: #111;
  color: #fff;
  padding-bottom: 20px;
}

/* 头部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background-color: #222;
  border-bottom: 1px solid #333;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.placeholder {
  width: 20px;
}

/* 统计信息 */
.stats-info {
  display: flex;
  justify-content: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
  margin: 12px 15px;
  border-radius: 8px;
}

.stats-item {
  text-align: center;
}

.stats-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
  text-align: center;
}

.retry-button {
  padding: 10px 30px;
  background-color: #ff9500;
  color: #fff;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.retry-button:hover {
  background-color: #ff8800;
}

/* 推广记录列表 */
.records-list {
  padding: 0 15px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #222;
  border-radius: 10px;
  margin-bottom: 12px;
}

.record-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.record-icon {
  font-size: 32px;
  margin-right: 12px;
}

.record-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-right {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.success {
  background-color: rgba(76, 217, 100, 0.2);
  color: #4cd964;
}

/* 加载更多提示 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

/* 空状态 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-icon {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #666;
}
</style>
