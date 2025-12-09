<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo } from '@/api/fetch-api'
import { showToast } from 'vant'
import { NEW_API_BASE_URL } from '@/utils/config'

// 路由相关
const route = useRoute()
const router = useRouter()

// 从路由参数获取信息
const primaryCategoryId = ref(route.params.primaryCategoryId as string)
const primaryCategoryName = ref((route.query.primaryCategoryName as string) || '')
const categoryId = ref((route.query.id as string) || '')
const categoryBiaoshi = ref((route.query.biaoshi as string) || '')

// 彩票数据
interface LotteryIssue {
  issueNumber: string
  drawTime: string
  drawnNumbers: number[]
  status: string
}

// 彩票当前期号数据
const currentIssue = ref<LotteryIssue>({
  issueNumber: '20250612003',
  drawTime: '20250612003',
  drawnNumbers: [3, 6, 11, 45, 8, 47],
  status: '封盘中',
})

// 选号相关
const selectedNumbers = ref<number[]>([])
const bettingAmount = ref(0)
const betAmounts = [1, 5, 10, 50, 100, 200, 500, 1000]

// 用户余额
const userBalance = ref(1000)

// 标签页相关
const activeTab = ref<'特码两面' | '特码生肖' | '特码色波'>('特码两面')

// 玩法数据接口
interface WanfaItem {
  id: string
  name: string
  odds: number
}

// 玩法数据
const wanfaList = ref<WanfaItem[]>([])
const isLoadingWanfa = ref(false)
const hasWanfaError = ref(false)

// 获取玩法接口
const fetchWanfa = async () => {
  if (!categoryId.value || !categoryBiaoshi.value) {
    console.log('缺少必要参数：id或biaoshi')
    return
  }

  isLoadingWanfa.value = true
  hasWanfaError.value = false

  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      service: 'Caipiao.Getwanfa',
      lang: 'zh',
      id: categoryId.value,
      biaoshi: categoryBiaoshi.value,
    })

    console.log('获取玩法参数:', { id: categoryId.value, biaoshi: categoryBiaoshi.value })

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
    console.log('获取玩法数据:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      // 处理玩法数据
      const wanfaData = result.data.info || []

      if (Array.isArray(wanfaData)) {
        wanfaList.value = wanfaData.map((item: Record<string, unknown>) => ({
          id: String(item.id || ''),
          name: String(item.name || '未命名玩法'),
          odds: Number(item.odds) || 0,
        }))
      } else {
        wanfaList.value = []
      }

      console.log('处理后的玩法数据:', wanfaList.value)
    } else {
      console.log('获取玩法数据失败:', result)
      hasWanfaError.value = true
      wanfaList.value = []
    }
  } catch (error) {
    console.error('获取玩法数据失败:', error)
    hasWanfaError.value = true
    wanfaList.value = []
    showToast('获取玩法数据失败')
  } finally {
    isLoadingWanfa.value = false
  }
}

// 选择号码
const toggleNumber = (num: number) => {
  const index = selectedNumbers.value.indexOf(num)
  if (index > -1) {
    selectedNumbers.value.splice(index, 1)
  } else {
    selectedNumbers.value.push(num)
  }
}

// 设置投注金额
const setBettingAmount = (amount: number) => {
  bettingAmount.value = amount
}

// 提交投注
const submitBetting = () => {
  if (selectedNumbers.value.length === 0) {
    showToast('请选择号码')
    return
  }
  if (bettingAmount.value === 0) {
    showToast('请选择投注金额')
    return
  }
  showToast(`已提交投注：${selectedNumbers.value.join(',')}，金额：${bettingAmount.value}`)
}

// 自定义返回逻辑
const handleBack = () => {
  router.push({
    name: 'game',
  })
}

onMounted(() => {
  console.log('彩票详情页:', {
    primaryCategoryId: primaryCategoryId.value,
    primaryCategoryName: primaryCategoryName.value,
    categoryId: categoryId.value,
    categoryBiaoshi: categoryBiaoshi.value,
  })

  // 获取用户信息
  const userInfo = getUserInfo()
  if (userInfo) {
    userBalance.value = userInfo.coin || 1000
  }

  // 获取玩法数据
  if (categoryId.value && categoryBiaoshi.value) {
    fetchWanfa()
  }
})
</script>

<template>
  <div class="lottery-detail">
    <!-- 头部导航 -->
    <HeaderNav :title="primaryCategoryName" :custom-back="true" @back="handleBack" />

    <!-- 内容区域 -->
    <div class="content">
      <!-- 标签页 -->
      <div class="tabs-section">
        <div
          class="tab-item"
          :class="{ active: activeTab === '特码两面' }"
          @click="activeTab = '特码两面'"
        >
          <span>特码两面</span>
          <div v-if="activeTab === '特码两面'" class="tab-indicator"></div>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === '特码生肖' }"
          @click="activeTab = '特码生肖'"
        >
          <span>特码生肖</span>
          <div v-if="activeTab === '特码生肖'" class="tab-indicator"></div>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === '特码色波' }"
          @click="activeTab = '特码色波'"
        >
          <span>特码色波</span>
          <div v-if="activeTab === '特码色波'" class="tab-indicator"></div>
        </div>
      </div>

      <!-- 期号和开奖信息 -->
      <div class="lottery-info">
        <div class="issue-info">
          <div class="issue-number">{{ currentIssue.issueNumber }}</div>
          <div class="issue-time">{{ currentIssue.drawTime }}</div>
        </div>
        <div class="status-badge">{{ currentIssue.status }}</div>
      </div>

      <!-- 开奖号码 -->
      <div class="drawn-numbers">
        <div class="drawn-number-item" v-for="num in currentIssue.drawnNumbers" :key="num">
          <span>{{ num }}</span>
        </div>
      </div>

      <!-- 选号面板 -->
      <div class="number-panel">
        <div class="number-grid">
          <div
            v-for="num in 25"
            :key="num"
            class="number-item"
            :class="{ selected: selectedNumbers.includes(num) }"
            @click="toggleNumber(num)"
          >
            <div class="number-label">{{ num }}</div>
            <div class="number-odds">47</div>
          </div>
        </div>
      </div>

      <!-- 投注金额选择 -->
      <div class="betting-amount-section">
        <div class="amount-buttons">
          <button
            v-for="amount in betAmounts"
            :key="amount"
            class="amount-btn"
            :class="{ active: bettingAmount === amount }"
            @click="setBettingAmount(amount)"
          >
            <van-icon name="diamond" size="14" />
            {{ amount }}
          </button>
        </div>
      </div>

      <!-- 底部信息和提交 -->
      <div class="bottom-section">
        <div class="balance-info">
          <span class="label">0 注</span>
          <span class="diamond-icon">💎</span>
          <span class="balance">余额：{{ userBalance }}</span>
        </div>
        <button class="submit-btn" @click="submitBetting">提交</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lottery-detail {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.content {
  padding: 0 12px;
}

/* 标签页样式 */
.tabs-section {
  display: flex;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid #333;
  margin-bottom: 12px;
}

.tab-item {
  position: relative;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  transition: color 0.3s ease;
}

.tab-item.active {
  color: #ff9500;
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #ff9500;
}

/* 期号信息 */
.lottery-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c2c2c;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.issue-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.issue-number {
  font-size: 14px;
  color: #ff9500;
  font-weight: 500;
}

.issue-time {
  font-size: 12px;
  color: #999;
}

.status-badge {
  background-color: #ff9500;
  color: #000;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 开奖号码 */
.drawn-numbers {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.drawn-number-item {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ff9500;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 14px;
}

/* 选号面板 */
.number-panel {
  margin-bottom: 16px;
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.number-item {
  border: 1px solid #444;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #2c2c2c;
}

.number-item:hover {
  border-color: #ff9500;
}

.number-item.selected {
  background-color: #ff9500;
  border-color: #ff9500;
  color: #000;
}

.number-label {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.number-odds {
  font-size: 12px;
  color: #999;
}

.number-item.selected .number-odds {
  color: #000;
}

/* 投注金额选择 */
.betting-amount-section {
  margin-bottom: 16px;
}

.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.amount-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 20px;
  background-color: #2c2c2c;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.amount-btn:hover {
  border-color: #ff9500;
  color: #ff9500;
}

.amount-btn.active {
  background-color: #ff9500;
  border-color: #ff9500;
  color: #000;
}

/* 底部信息和提交 */
.bottom-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #2c2c2c;
  border-radius: 8px;
  margin-top: 16px;
}

.balance-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.label {
  color: #999;
}

.diamond-icon {
  font-size: 14px;
}

.balance {
  color: #fff;
  margin-left: 8px;
}

.submit-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: #fff;
  border: none;
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}
</style>
