<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo, fetchUserBalance } from '@/api/fetch-api'
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
const returnTopCategoryId = ref((route.query.returnTopCategoryId as string) || '')
const returnPrimaryCategoryId = ref((route.query.returnPrimaryCategoryId as string) || '')
const returnTopCategoryName = ref((route.query.returnTopCategoryName as string) || '')
const returnPrimaryCategoryName = ref((route.query.returnPrimaryCategoryName as string) || '')

// 彩票数据
interface LotteryIssue {
  issueNumber: string
  drawnNumbers: number[]
  status: string
}

interface SqkjItem {
  opencode: string
  name: string
  title: string
  expect: string
}

// 彩票当前期号数据
const currentIssue = ref<LotteryIssue>({
  issueNumber: '',
  drawnNumbers: [],
  status: '',
})

// 开奖信息
const sqkjInfo = ref<SqkjItem | null>(null)

// 倒计时数据
interface CountdownData {
  lefttime: number
  nowexpect: string
}

const countdownData = ref<CountdownData | null>(null)
const countdownInterval = ref<ReturnType<typeof setInterval> | null>(null)

// 选号相关
const selectedNumbers = ref<number[]>([])
const singleBetAmount = ref(0) // 单注金额
const betMultiplier = ref(1) // 倍数
const isBetting = ref(false) // 投注中状态

// 投注成功弹窗
const showBettingSuccessModal = ref(false)
const bettingSuccessMessage = ref('')

// 错误提示弹窗
const showErrorModal = ref(false)
const errorMessage = ref('')

// 登录过期弹窗
const showLoginExpiredModal = ref(false)

// 用户余额
const userBalance = ref(0)

// 玩法数据接口
interface WanfaOption {
  id: string
  wanfa_id: string
  name: string
  peilv: string
  caipiao_id: string
  wanfaname: string
}

interface CoinItem {
  id: string
  coin: string
  img: string
}

interface BeishuItem {
  id: string
  name: string
  value: string
}

// 玩法数据
const wanfaList = ref<WanfaOption[][]>([])
const coinList = ref<CoinItem[]>([])
const beishuList = ref<BeishuItem[]>([])
const isLoadingWanfa = ref(false)
const hasWanfaError = ref(false)

// 玩法分类名称列表
const wanfaNames = ref<string[]>([])
const activeWanfaIndex = ref(0)

// 倒计时是否结束（剩余时间 <= 1秒）
const isCountdownEnded = computed(() => {
  return countdownData.value ? countdownData.value.lefttime <= 1 : false
})

// 获取倒计时接口
const fetchCountdown = async () => {
  if (!categoryBiaoshi.value) {
    console.log('缺少必要参数：biaoshi')
    return
  }

  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      service: 'Caipiao.Gettimes2',
      lang: 'zh',
      biaoshi: categoryBiaoshi.value,
    })

    console.log('获取倒计时数据')

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
    console.log('获取倒计时数据:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      const info = result.data.info
      if (info && typeof info.lefttime === 'number') {
        countdownData.value = {
          lefttime: info.lefttime,
          nowexpect: String(info.nowexpect || ''),
        }
        console.log('倒计时数据:', countdownData.value)
        startCountdown()
      }
    } else {
      console.log('获取倒计时数据失败:', result)
    }
  } catch (error) {
    console.error('获取倒计时数据失败:', error)
  }
}

// 启动倒计时
const startCountdown = () => {
  // 清除之前的倒计时
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }

  // 每秒更新一次倒计时
  countdownInterval.value = setInterval(() => {
    if (countdownData.value && countdownData.value.lefttime > 0) {
      countdownData.value.lefttime--
    } else {
      // 倒计时结束，清除定时器并重新获取
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
        countdownInterval.value = null
      }
      fetchCountdown()
    }
  }, 1000)
}

// 格式化倒计时显示
const formatCountdown = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  } else {
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }
}

// 获取倍数接口
const fetchBeishu = async () => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      service: 'Caipiao.Getbeishu',
      lang: 'zh',
    })

    console.log('获取倍数数据')

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
    console.log('获取倍数数据:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      // 处理倍数数据
      const info = result.data.info || []
      if (Array.isArray(info)) {
        beishuList.value = info.map((item: Record<string, unknown>) => ({
          id: String(item.id || ''),
          name: String(item.name || ''),
          value: String(item.value || ''),
        }))
      }
      console.log('处理后的倍数数据:', beishuList.value)
    } else {
      console.log('获取倍数数据失败:', result)
      beishuList.value = []
    }
  } catch (error) {
    console.error('获取倍数数据失败:', error)
    beishuList.value = []
    showToast('获取倍数数据失败')
  }
}

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
      const info = result.data.info || {}

      // 处理硬币数据
      if (info.coinimg && Array.isArray(info.coinimg)) {
        coinList.value = info.coinimg.map((item: Record<string, unknown>) => ({
          id: String(item.id || ''),
          coin: String(item.coin || ''),
          img: String(item.img || ''),
        }))
      }

      // 处理开奖信息
      if (info.sqkj && Array.isArray(info.sqkj) && info.sqkj.length > 0) {
        const sqkjData = info.sqkj[0]
        sqkjInfo.value = {
          opencode: String(sqkjData.opencode || ''),
          name: String(sqkjData.name || ''),
          title: String(sqkjData.title || ''),
          expect: String(sqkjData.expect || ''),
        }

        // 更新期号和开奖号码
        currentIssue.value.issueNumber = sqkjInfo.value.expect
        const opencodeArray = sqkjInfo.value.opencode.split(',').map((num) => Number(num.trim()))
        currentIssue.value.drawnNumbers = opencodeArray
      }

      // 处理玩法数据
      if (info.wanfa && Array.isArray(info.wanfa)) {
        wanfaList.value = info.wanfa.map((group: Record<string, unknown>[]) => {
          if (Array.isArray(group)) {
            return group.map((item: Record<string, unknown>) => ({
              id: String(item.id || ''),
              wanfa_id: String(item.wanfa_id || ''),
              name: String(item.name || ''),
              peilv: String(item.peilv || ''),
              caipiao_id: String(item.caipiao_id || ''),
              wanfaname: String(item.wanfaname || ''),
            }))
          }
          return []
        })

        // 提取玩法分类名称（从第一个玩法组中获取）
        const nameSet = new Set<string>()
        wanfaList.value.forEach((group) => {
          group.forEach((item) => {
            nameSet.add(item.wanfaname)
          })
        })
        wanfaNames.value = Array.from(nameSet)
        activeWanfaIndex.value = 0
      } else {
        wanfaList.value = []
        wanfaNames.value = []
      }

      console.log('处理后的玩法数据:', wanfaList.value)
      console.log('玩法分类:', wanfaNames.value)
    } else {
      console.log('获取玩法数据失败:', result)
      hasWanfaError.value = true
      wanfaList.value = []
      wanfaNames.value = []
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

// 设置单注金额
const setSingleBetAmount = (amount: number) => {
  singleBetAmount.value = amount
}

// 设置倍数
const setBetMultiplier = (multiplier: number) => {
  betMultiplier.value = multiplier
}

// 提交投注
const submitBetting = async () => {
  if (selectedNumbers.value.length === 0) {
    showToast('请选择号码')
    return
  }
  if (singleBetAmount.value === 0) {
    showToast('请选择投注金额')
    return
  }

  // 验证单注金额为整数
  if (!Number.isInteger(singleBetAmount.value)) {
    showToast('投注金额必须为整数')
    return
  }

  try {
    // 设置投注中状态
    isBetting.value = true

    // 获取用户信息
    const userInfo = getUserInfo()
    if (!userInfo) {
      showToast('获取用户信息失败')
      return
    }

    // 获取当前玩法的wanfa_id
    const currentWanfaId = wanfaList.value[activeWanfaIndex.value]?.[0]?.wanfa_id || ''

    // 计算总注数和总金额
    const zhushu = selectedNumbers.value.length // 注数
    const totalMoney = singleBetAmount.value * zhushu * betMultiplier.value // 总金额 = 单注金额 * 注数 * 倍数

    // 构建查询参数
    const queryParams = new URLSearchParams({
      service: 'Caipiao.Touzhu',
      lang: 'zh',
      uid: userInfo.user_id?.toString() || '',
      token: userInfo.token || '',
      zhuboid: '', // 先留空
      biaoshi: categoryBiaoshi.value,
      title: primaryCategoryName.value,
      wanfid: currentWanfaId, // 玩法ID（如46、47、48）
      wanfaxiid: selectedNumbers.value.join(','), // 选中的选项ID（如202、203等）
      zhushu: zhushu.toString(), // 注数
      beishu: betMultiplier.value.toString(), // 倍数
      money: totalMoney.toString(), // 总金额 = 单注金额 * 注数 * 倍数
      value: '', // 先留空
      source: 'mobile',
    })

    console.log('投注参数:', Object.fromEntries(queryParams))

    // 发起投注请求
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
    console.log('投注结果:', result)

    if (result && result.ret === 200 && result.data) {
      if (result.data.code === 0) {
        // 投注成功
        bettingSuccessMessage.value = result.data.msg || '下单成功,恭喜发财'
        showBettingSuccessModal.value = true

        // 投注成功后更新余额
        try {
          const balanceResult = await fetchUserBalance()
          if (balanceResult.code === 1 && balanceResult.data) {
            userBalance.value = balanceResult.data.coin
          }
        } catch (error) {
          console.error('更新余额失败:', error)
        }
      } else {
        // 其他错误（包括余额不足等）
        errorMessage.value = result.data.msg || '投注失败，请重试'
        showErrorModal.value = true
      }
    } else {
      showToast(result?.data?.msg || result?.msg || '投注失败，请重试')
    }
  } catch (error) {
    console.error('投注错误:', error)
    showToast('网络错误，请重试')
  } finally {
    // 关闭投注中状态
    isBetting.value = false
  }
}

// 自定义返回逻辑
const handleBack = () => {
  console.log('返回参数:', {
    returnTopCategoryId: returnTopCategoryId.value,
    returnPrimaryCategoryId: returnPrimaryCategoryId.value,
    returnTopCategoryName: returnTopCategoryName.value,
    returnPrimaryCategoryName: returnPrimaryCategoryName.value,
  })

  // 返回到二级分类页面
  router.push({
    name: 'game-secondary',
    params: {
      topCategoryId: returnTopCategoryId.value,
      primaryCategoryId: returnPrimaryCategoryId.value,
    },
    query: {
      topCategoryName: returnTopCategoryName.value,
      primaryCategoryName: returnPrimaryCategoryName.value,
      returnTopCategoryId: returnTopCategoryId.value,
    },
  })
}

// 跳转到投注记录页面
const goToTouzhuRecord = () => {
  router.push({
    name: 'lotteryTouzhuRecord',
    query: {
      biaoshi: categoryBiaoshi.value,
    },
  })
}

// 跳转到开奖记录页面
const goToHistory = () => {
  router.push({
    name: 'lotteryHistory',
    query: {
      biaoshi: categoryBiaoshi.value,
    },
  })
}

// 跳转到登录页面
const goToLogin = () => {
  router.push({
    name: 'login',
  })
}

onMounted(() => {
  console.log('彩票详情页:', {
    primaryCategoryId: primaryCategoryId.value,
    primaryCategoryName: primaryCategoryName.value,
    categoryId: categoryId.value,
    categoryBiaoshi: categoryBiaoshi.value,
  })

  // 获取用户余额
  const loadBalance = async () => {
    try {
      const result = await fetchUserBalance()
      if (result.code === 1 && result.data) {
        userBalance.value = result.data.coin
      } else if (result.code === 700) {
        // 登录状态失效
        console.log('登录状态失效:', result.msg)
        showLoginExpiredModal.value = true
      }
    } catch (error) {
      console.error('获取余额失败:', error)
      // 降级处理：从本地存储获取
      const userInfo = getUserInfo()
      if (userInfo) {
        userBalance.value = userInfo.coin || 0
      }
    }
  }

  // 获取玩法数据
  if (categoryId.value && categoryBiaoshi.value) {
    fetchWanfa()
  }

  // 获取倍数数据
  fetchBeishu()

  // 获取倒计时数据
  if (categoryBiaoshi.value) {
    fetchCountdown()
  }

  // 加载余额
  loadBalance()
})
</script>

<template>
  <div class="lottery-detail">
    <!-- 头部导航 -->
    <HeaderNav :title="primaryCategoryName" :custom-back="true" @back="handleBack" />

    <!-- 内容区域 -->
    <div class="content">
      <!-- 玩法分类标签页 -->
      <div v-if="wanfaNames.length > 0" class="tabs-section">
        <div
          v-for="(wanfaName, index) in wanfaNames"
          :key="wanfaName"
          class="tab-item"
          :class="{ active: activeWanfaIndex === index }"
          @click="activeWanfaIndex = index"
        >
          <span>{{ wanfaName }}</span>
          <div v-if="activeWanfaIndex === index" class="tab-indicator"></div>
        </div>
      </div>

      <!-- 期号和开奖信息 -->
      <div class="lottery-info">
        <div class="info-left">
          <div class="issue-row">
            <span class="label">期号</span>
            <span class="issue-number">{{ currentIssue.issueNumber }}</span>
          </div>
          <div class="result-row">
            <span class="label">开奖结果</span>
            <div class="drawn-numbers">
              <div class="drawn-number-item" v-for="num in currentIssue.drawnNumbers" :key="num">
                <span>{{ num }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="info-right">
          <div v-if="currentIssue.status" class="status-badge">{{ currentIssue.status }}</div>
          <div v-if="countdownData" class="countdown-section">
            <div class="countdown-label">开奖倒计时</div>
            <div class="countdown-timer">{{ formatCountdown(countdownData.lefttime) }}</div>
          </div>
        </div>
      </div>

      <!-- 功能按钮 -->
      <div class="function-buttons">
        <button class="func-btn" @click="goToTouzhuRecord">
          <van-icon name="records" size="16" />
          投注记录
        </button>
        <button class="func-btn" @click="goToHistory">
          <van-icon name="award" size="16" />
          开奖记录
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoadingWanfa" class="loading-container">
        <van-loading type="spinner" color="#ff9500" />
        <span class="loading-text">加载中...</span>
      </div>

      <!-- 玩法选项面板 -->
      <div v-if="wanfaList.length > 0 && activeWanfaIndex < wanfaList.length" class="wanfa-panel">
        <div class="wanfa-grid">
          <div
            v-for="option in wanfaList[activeWanfaIndex]"
            :key="option.id"
            class="wanfa-item"
            :class="{ selected: selectedNumbers.includes(Number(option.id)) }"
            @click="toggleNumber(Number(option.id))"
          >
            <div class="option-name">{{ option.name }}</div>
            <div class="option-odds">{{ option.peilv }}</div>
          </div>
        </div>
      </div>

      <!-- 投注金额选择 -->
      <div v-if="coinList.length > 0" class="betting-amount-section">
        <div class="amount-buttons">
          <button
            v-for="coin in coinList"
            :key="coin.id"
            class="amount-btn"
            :class="{ active: singleBetAmount === Number(coin.coin) }"
            @click="setSingleBetAmount(Number(coin.coin))"
          >
            <van-icon name="diamond" size="14" />
            {{ coin.coin }}
          </button>
        </div>
      </div>

      <!-- 倍数选择 -->
      <div class="multiplier-section">
        <span class="multiplier-label">倍数：</span>
        <div class="multiplier-buttons">
          <button
            v-for="beishu in beishuList"
            :key="beishu.id"
            class="multiplier-btn"
            :class="{ active: betMultiplier === Number(beishu.value) }"
            @click="setBetMultiplier(Number(beishu.value))"
          >
            {{ beishu.name }}倍
          </button>
        </div>
      </div>

      <!-- 底部信息和投注 -->
      <div class="bottom-section">
        <div class="balance-info">
          <van-icon name="diamond" size="16" class="diamond-icon" />
          <span class="balance">余额：{{ userBalance }}</span>
        </div>
        <div class="betting-input-group">
          <input
            v-model.number="singleBetAmount"
            type="number"
            class="betting-input"
            placeholder="输入金额"
            min="0"
            :disabled="isBetting || isCountdownEnded"
          />
          <button
            class="submit-btn"
            @click="submitBetting"
            :disabled="isBetting || isCountdownEnded"
          >
            <van-loading v-if="isBetting" type="spinner" size="16" color="#fff" />
            <span v-else>{{ isCountdownEnded ? '禁止下注' : '投注' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 投注中LOADING效果 -->
  <div v-if="isBetting" class="betting-loading-overlay">
    <div class="betting-loading-content">
      <van-loading type="spinner" size="48" color="#ff9500" />
      <p>投注中...</p>
    </div>
  </div>

  <!-- 投注成功弹窗 -->
  <div v-if="showBettingSuccessModal" class="betting-success-modal-overlay">
    <div class="betting-success-modal">
      <div class="modal-header">
        <h2>投注成功</h2>
      </div>
      <div class="modal-body">
        <p>{{ bettingSuccessMessage }}</p>
      </div>
      <div class="modal-footer">
        <button
          class="modal-btn"
          @click="
            () => {
              showBettingSuccessModal = false
              selectedNumbers = []
              singleBetAmount = 0
              betMultiplier = 1
            }
          "
        >
          确定
        </button>
      </div>
    </div>
  </div>

  <!-- 错误提示弹窗 -->
  <div v-if="showErrorModal" class="betting-success-modal-overlay">
    <div class="betting-success-modal">
      <div class="modal-header">
        <h2>提示</h2>
      </div>
      <div class="modal-body">
        <p>{{ errorMessage }}</p>
      </div>
      <div class="modal-footer">
        <button
          class="modal-btn"
          @click="
            () => {
              showErrorModal = false
            }
          "
        >
          确定
        </button>
      </div>
    </div>
  </div>

  <!-- 登录过期弹窗 -->
  <div v-if="showLoginExpiredModal" class="betting-success-modal-overlay">
    <div class="betting-success-modal">
      <div class="modal-header">
        <h2>登录过期</h2>
      </div>
      <div class="modal-body">
        <p>您的登陆状态失效，请重新登陆！</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn" @click="goToLogin">去登录</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lottery-detail {
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
  padding: 108px 12px 280px 12px;
  flex: 1;
  overflow-y: auto;
}

/* 标签页样式 */
.tabs-section {
  position: fixed;
  top: 44px;
  left: 0;
  right: 0;
  display: flex;
  gap: 0;
  padding: 12px 0 0 0;
  border-bottom: 1px solid #333;
  margin-bottom: 0;
  width: 100%;
  background-color: #111;
  z-index: 20;
}

.tab-item {
  position: relative;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  transition: color 0.3s ease;
  flex: 1;
  text-align: center;
  white-space: nowrap;
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
  align-items: flex-start;
  background-color: #2c2c2c;
  padding: 16px;
  border-radius: 8px 8px 0 0;
  margin-bottom: 0;
  gap: 12px;
}

.info-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.info-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.issue-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.issue-row .label {
  color: #999;
  font-size: 13px;
  min-width: 50px;
  text-align: right;
}

.issue-number {
  font-size: 16px;
  color: #ff9500;
  font-weight: 600;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-row .label {
  color: #999;
  font-size: 13px;
  min-width: 50px;
  white-space: nowrap;
}

.status-badge {
  background-color: #ff9500;
  color: #000;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.countdown-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.1), rgba(255, 184, 77, 0.1));
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 149, 0, 0.3);
  min-width: 90px;
}

.countdown-label {
  font-size: 10px;
  color: #999;
  text-align: center;
}

.countdown-timer {
  font-size: 14px;
  font-weight: bold;
  color: #ff9500;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

/* 功能按钮 */
.function-buttons {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  justify-content: space-between;
  background-color: #2c2c2c;
  border-radius: 0 0 8px 8px;
  padding: 8px 12px;
  border-top: 1px solid #444;
}

.func-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 8px;
  background-color: transparent;
  border: none;
  border-radius: 0;
  color: #ff9500;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  border-right: 1px solid #444;
}

.func-btn:last-child {
  border-right: none;
}

.func-btn:hover {
  color: #ffb84d;
  opacity: 0.8;
}

.func-btn:active {
  transform: scale(0.98);
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

/* 玩法选项面板 */
.wanfa-panel {
  margin-bottom: 16px;
}

.wanfa-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.wanfa-item {
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #2c2c2c;
}

.wanfa-item:hover {
  border-color: #ff9500;
}

.wanfa-item.selected {
  background-color: #ff9500;
  border-color: #ff9500;
  color: #000;
}

.option-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.option-odds {
  font-size: 12px;
  color: #999;
}

.wanfa-item.selected .option-odds {
  color: #000;
}

/* 投注金额选择 */
.betting-amount-section {
  position: fixed;
  bottom: 123px;
  left: 0;
  right: 0;
  padding: 12px;
  background-color: #111;
  border-top: 1px solid #333;
  border-bottom: none;
  z-index: 10;
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

/* 倍数选择 */
.multiplier-section {
  position: fixed;
  bottom: 65px;
  left: 0;
  right: 0;
  padding: 12px;
  background-color: #1a1a1a;
  border-top: 1px solid #333;
  border-bottom: none;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.multiplier-label {
  color: #999;
  font-size: 14px;
  white-space: nowrap;
}

.multiplier-buttons {
  display: flex;
  gap: 8px;
  flex: 1;
  overflow-x: auto;
}

.multiplier-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  background-color: #222;
  border: 1px solid #333;
  color: #999;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.multiplier-btn:hover {
  border-color: #ff9500;
  color: #ff9500;
}

.multiplier-btn.active {
  background-color: #ff9500;
  border-color: #ff9500;
  color: #000;
}

/* 底部信息和提交 */
.bottom-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #2c2c2c;
  border-top: 1px solid #333;
  z-index: 11;
}

.balance-info {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.label {
  color: #999;
}

.diamond-icon {
  font-size: 14px;
  color: #ff9500;
}

.balance {
  color: #fff;
  margin-left: 8px;
}

.betting-input-group {
  display: flex;
  gap: 0;
  align-items: center;
  border: 1px solid #444;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.betting-input-group:focus-within {
  border-color: #ff9500;
  box-shadow: 0 0 8px rgba(255, 149, 0, 0.2);
}

.betting-input {
  width: 80px;
  padding: 8px 12px;
  border: none;
  background-color: #1a1a1a;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.betting-input:focus {
  background-color: #222;
}

.betting-input::placeholder {
  color: #666;
}

.submit-btn {
  background: linear-gradient(135deg, #ff9500 0%, #ffb84d 100%);
  color: #000;
  border: none;
  padding: 8px 20px;
  border-radius: 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.submit-btn:hover {
  opacity: 0.9;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.2);
}

.submit-btn:active {
  opacity: 0.8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.betting-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 投注中LOADING效果 */
.betting-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.betting-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.betting-loading-content p {
  color: #fff;
  font-size: 16px;
  margin: 0;
}

/* 投注成功弹窗 */
.betting-success-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.betting-success-modal {
  background-color: #1a1a1a;
  border-radius: 12px;
  width: 80%;
  max-width: 300px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
  background-color: #222;
  padding: 16px;
  border-bottom: 1px solid #333;
  text-align: center;
}

.modal-header h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.modal-body {
  padding: 24px 16px;
  text-align: center;
}

.modal-body p {
  margin: 0;
  color: #fff;
  font-size: 14px;
  line-height: 1.6;
}

.modal-footer {
  padding: 0;
  border-top: 1px solid #333;
  display: flex;
  justify-content: center;
}

.modal-btn {
  background: none;
  color: #ff9500;
  border: none;
  padding: 12px 16px;
  border-radius: 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  min-width: 100%;
  flex: 1;
}

.modal-btn:hover {
  opacity: 0.8;
}

.modal-btn:active {
  opacity: 0.8;
}
</style>
