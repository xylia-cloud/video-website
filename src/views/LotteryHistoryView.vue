<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo } from '@/api/fetch-api'
import { showToast } from 'vant'
import { NEW_API_BASE_URL } from '@/utils/config'

// 路由
const route = useRoute()
const router = useRouter()

// 从路由参数获取 biaoshi
const biaoshi = ref((route.query.biaoshi as string) || 'f3k3')

// 开奖记录数据接口
interface HistoryRecord {
  id: string
  expect: string // 期号
  opencode: string // 开奖号码
  opentime: string // 开奖时间
  title: string // 彩票名称
  name: string // 彩票标识
  isdraw: string // 是否开奖
  source: string // 数据来源
}

// 页面状态
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const records = ref<HistoryRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 无限滚动
const sentinelRef = ref<HTMLElement | null>(null)
let intersectionObserver: IntersectionObserver | null = null

// 获取开奖记录
const fetchHistoryRecords = async (page: number = 1) => {
  try {
    isLoading.value = true
    hasError.value = false
    errorMessage.value = ''

    // 获取用户信息
    const userInfo = getUserInfo()
    if (!userInfo) {
      showToast('请先登录')
      router.push({ name: 'login' })
      return
    }

    // 构建查询参数
    const queryParams = new URLSearchParams({
      service: 'Lottery.History',
      lang: 'zh_cn',
      biaoshi: biaoshi.value,
      page: page.toString(),
    })

    console.log('获取开奖记录参数:', Object.fromEntries(queryParams))

    // 发起GET请求
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    console.log('开奖记录结果:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      // 处理开奖记录数据
      const info = result.data.info || []
      if (Array.isArray(info)) {
        const newRecords = info.map((item: Record<string, unknown>) => ({
          id: String(item.id || ''),
          expect: String(item.expect || ''),
          opencode: String(item.opencode || ''),
          opentime: String(item.opentime || ''),
          title: String(item.title || ''),
          name: String(item.name || ''),
          isdraw: String(item.isdraw || '0'),
          source: String(item.source || ''),
        }))

        if (page === 1) {
          records.value = newRecords
        } else {
          records.value.push(...newRecords)
        }

        currentPage.value = page
        hasMore.value = newRecords.length >= pageSize.value
      } else {
        records.value = []
        hasMore.value = false
      }
    } else {
      hasError.value = true
      errorMessage.value = result?.data?.msg || '获取开奖记录失败'
      records.value = []
    }
  } catch (error) {
    console.error('获取开奖记录失败:', error)
    hasError.value = true
    errorMessage.value = '网络错误，请重试'
    records.value = []
    showToast('获取开奖记录失败')
  } finally {
    isLoading.value = false
  }
}

// 返回
const handleBack = () => {
  router.back()
}

// 初始化无限滚动观察器
const initInfiniteScroll = () => {
  if (sentinelRef.value) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当哨兵元素进入视口时，加载更多数据
          if (entry.isIntersecting && !isLoading.value && hasMore.value) {
            console.log('触发自动加载，当前页:', currentPage.value, '哨兵元素:', sentinelRef.value)
            fetchHistoryRecords(currentPage.value + 1)
          }
        })
      },
      {
        rootMargin: '100px', // 提前 100px 开始加载
        threshold: 0.01,
      },
    )

    intersectionObserver.observe(sentinelRef.value)
    console.log('无限滚动观察器已初始化，哨兵元素:', sentinelRef.value)
  } else {
    console.warn('哨兵元素未找到:', sentinelRef.value)
  }
}

// 清理观察器
const cleanupInfiniteScroll = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
}

// 格式化开奖号码
const formatOpencode = (opencode: string): string[] => {
  if (!opencode) return []
  return opencode.split(',').map((code) => code.trim())
}

onMounted(async () => {
  console.log('开奖记录页面已加载')
  await fetchHistoryRecords(1)
  // 等待 DOM 更新完成
  await nextTick()
  // 再等待一个微任务周期，确保 ref 已经绑定
  await new Promise((resolve) => setTimeout(resolve, 0))
  initInfiniteScroll()
})

// 监听 records 变化，当有新数据时重新初始化观察器
watch(
  () => records.value.length,
  async () => {
    if (records.value.length > 0 && hasMore.value) {
      await nextTick()
      // 清理旧的观察器
      cleanupInfiniteScroll()
      // 初始化新的观察器
      initInfiniteScroll()
    }
  },
)

// 页面卸载时清理
onBeforeUnmount(() => {
  cleanupInfiniteScroll()
})
</script>

<template>
  <div class="lottery-history">
    <!-- 头部导航 -->
    <HeaderNav title="开奖记录" :custom-back="true" @back="handleBack" />

    <!-- 内容区域 -->
    <div class="content">
      <!-- 加载状态 -->
      <div v-if="isLoading && records.length === 0" class="loading-container">
        <van-loading type="spinner" color="#ff9500" />
        <span class="loading-text">加载中...</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="hasError && records.length === 0" class="error-container">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ errorMessage }}</p>
        <button class="retry-btn" @click="fetchHistoryRecords(1)">重试</button>
      </div>

      <!-- 空状态 -->
      <div v-if="!isLoading && !hasError && records.length === 0" class="empty-container">
        <div class="empty-icon">📋</div>
        <p class="empty-message">暂无开奖记录</p>
      </div>

      <!-- 开奖记录列表 -->
      <div v-if="records.length > 0" class="records-list">
        <div v-for="record in records" :key="record.id" class="record-card">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="header-left">
              <div class="lottery-name">{{ record.title }}</div>
              <div class="lottery-issue">期号: {{ record.expect }}</div>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <!-- 开奖号码部分 -->
            <div class="opencode-section">
              <span class="label">开奖号码</span>
              <div class="drawn-numbers">
                <div
                  v-for="(code, index) in formatOpencode(record.opencode)"
                  :key="index"
                  class="drawn-number-item"
                >
                  <span>{{ code }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <span class="time">{{ record.opentime }}</span>
          </div>
        </div>

        <!-- 加载中提示 -->
        <div v-if="isLoading && records.length > 0" class="loading-more">
          <van-loading type="spinner" size="24" color="#ff9500" />
          <span>加载中...</span>
        </div>

        <!-- 没有更多 -->
        <div v-if="!hasMore && records.length > 0" class="no-more">
          <span>没有更多记录了</span>
        </div>

        <!-- 无限滚动哨兵元素 -->
        <div v-if="hasMore" ref="sentinelRef" class="sentinel"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lottery-history {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.content {
  padding: 60px 12px 20px 12px;
  flex: 1;
  overflow-y: auto;
}

/* 加载状态 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 17, 17, 0.95);
  gap: 12px;
  z-index: 100;
}

.loading-text {
  color: #ff9500;
  font-size: 14px;
  font-weight: 500;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 16px;
}

.error-icon {
  font-size: 48px;
}

.error-message {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.retry-btn {
  padding: 8px 20px;
  background-color: #ff9500;
  color: #000;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  opacity: 0.9;
}

.retry-btn:active {
  opacity: 0.8;
}

/* 空状态 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
}

.empty-message {
  color: #999;
  font-size: 14px;
  margin: 0;
}

/* 记录列表 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.record-card {
  background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #3a3a3a;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;
  background: linear-gradient(90deg, rgba(255, 149, 0, 0.05) 0%, rgba(255, 149, 0, 0) 100%);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.lottery-name {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.lottery-issue {
  font-size: 12px;
  color: #999;
  letter-spacing: 0.3px;
  font-weight: 500;
}

/* 卡片内容 */
.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.opencode-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label {
  color: #999;
  font-weight: 500;
  font-size: 13px;
}

/* 开奖号码 */
.drawn-numbers {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
}

.drawn-number-item {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ffb84d, #ff9500);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.4),
    inset -2px -2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
}

.drawn-number-item::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  top: 4px;
  left: 4px;
}

/* 卡片底部 */
.card-footer {
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: right;
}

.time {
  font-size: 12px;
  color: #888;
  letter-spacing: 0.3px;
  font-weight: 500;
}

/* 加载中提示 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 0;
  color: #999;
  font-size: 14px;
  font-weight: 500;
}

/* 没有更多 */
.no-more {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  color: #666;
  font-size: 13px;
  letter-spacing: 0.3px;
  font-weight: 500;
}

/* 无限滚动哨兵元素 */
.sentinel {
  height: 1px;
  visibility: hidden;
}
</style>
