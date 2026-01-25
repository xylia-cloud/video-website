<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo } from '@/api/fetch-api'
import { NEW_API_BASE_URL } from '@/utils/config'

const reportCards = ref([
  { title: '佣金收入', value: '0.00' },
  { title: '团队投注', value: '0.00' },
  { title: '团队盈利', value: '0.00' },
  { title: '团队人数', value: '0' },
  { title: '投注人数', value: '0' },
  { title: '充值人数', value: '0' },
])

const isLoading = ref(false)

// 获取统计数据（Daili.index）- 用于获取投注人数和充值人数
const fetchStats = async () => {
  try {
    const currentUserInfo = getUserInfo()
    if (!currentUserInfo) return

    const uid = currentUserInfo.user_id || currentUserInfo.id
    const token = currentUserInfo.token

    if (!uid || !token) return

    const queryParams = new URLSearchParams()
    queryParams.append('service', 'Daili.index')
    queryParams.append('uid', String(uid))
    queryParams.append('token', token)

    const separator = NEW_API_BASE_URL.includes('?') ? '&' : '?'
    const requestUrl = `${NEW_API_BASE_URL}${separator}${queryParams.toString()}`

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    console.log('获取统计数据返回:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      const data = result.data.info || {}
      
      // 更新团队人数、投注人数和充值人数
      const teamPeople = parseInt(data.team_total_people || '0')
      const touzhuPeople = parseInt(data.touzhu_total_people || '0')
      const chongzhiPeople = parseInt(data.chongzhi_total_people || '0')
      
      // 找到对应的卡片并更新
      const teamCard = reportCards.value.find(card => card.title === '团队人数')
      const touzhuCard = reportCards.value.find(card => card.title === '投注人数')
      const chongzhiCard = reportCards.value.find(card => card.title === '充值人数')
      
      if (teamCard) {
        teamCard.value = teamPeople.toString()
      }
      if (touzhuCard) {
        touzhuCard.value = touzhuPeople.toString()
      }
      if (chongzhiCard) {
        chongzhiCard.value = chongzhiPeople.toString()
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取代理报表数据
const fetchReportData = async (page: number = 1) => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const currentUserInfo = getUserInfo()
    if (!currentUserInfo) return

    const uid = currentUserInfo.user_id || currentUserInfo.id
    const token = currentUserInfo.token

    if (!uid || !token) return

    const queryParams = new URLSearchParams()
    queryParams.append('service', 'Daili.coin')
    queryParams.append('uid', String(uid))
    queryParams.append('token', token)
    queryParams.append('p4', '4')
    queryParams.append('p', String(page))

    const separator = NEW_API_BASE_URL.includes('?') ? '&' : '?'
    const requestUrl = `${NEW_API_BASE_URL}${separator}${queryParams.toString()}`

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    console.log('获取代理报表数据返回:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      const info = result.data.info || {}
      const dataList = info.data || []

      // 如果有数据，取第一条；否则使用默认值
      if (dataList.length > 0) {
        const data = dataList[0]
        // 更新佣金收入、团队投注、团队盈利
        // 团队人数、投注人数、充值人数由 Daili.index 接口提供
        const yongjinCard = reportCards.value.find(card => card.title === '佣金收入')
        const touzhuCard = reportCards.value.find(card => card.title === '团队投注')
        const profitCard = reportCards.value.find(card => card.title === '团队盈利')
        
        if (yongjinCard) {
          yongjinCard.value = parseFloat(data.yongjin || '0').toFixed(2)
        }
        if (touzhuCard) {
          touzhuCard.value = parseFloat(data.total_touzhu || '0').toFixed(2)
        }
        if (profitCard) {
          profitCard.value = parseFloat(data.team_profit || '0').toFixed(2)
        }
      } else {
        // 没有数据时重置为默认值（只重置 Daili.coin 提供的数据）
        const yongjinCard = reportCards.value.find(card => card.title === '佣金收入')
        const touzhuCard = reportCards.value.find(card => card.title === '团队投注')
        const profitCard = reportCards.value.find(card => card.title === '团队盈利')
        
        if (yongjinCard) {
          yongjinCard.value = '0.00'
        }
        if (touzhuCard) {
          touzhuCard.value = '0.00'
        }
        if (profitCard) {
          profitCard.value = '0.00'
        }
      }
    }
  } catch (error) {
    console.error('获取代理报表数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchReportData(1)
  fetchStats()
})
</script>

<template>
  <div class="agent-report-page">
    <HeaderNav title="代理报表" />

    <div class="agent-report-content">
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
