<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo } from '@/api/fetch-api'
import { NEW_API_BASE_URL } from '@/utils/config'

// 统计数据
const stats = ref([
  { label: '团队人数', value: 0 },
  { label: '充值人数', value: 0 },
  { label: '今日活跃', value: 0 },
])

const searchQuery = ref('')

// 团队成员列表
const teamMembers = ref<
  Array<{
    account: string
    memberId: string
  }>
>([])

// 分页信息
const currentPage = ref(1)
const totalPages = ref(1)
const isLoading = ref(false)

const filteredTeamMembers = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return teamMembers.value

  return teamMembers.value.filter(
    (member) => member.account.includes(query) || member.memberId.includes(query),
  )
})

// 获取统计数据（Daili.index）
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

      // 更新统计数据
      stats.value = [
        { label: '团队人数', value: parseInt(data.team_total_people || '0') },
        { label: '充值人数', value: parseInt(data.chongzhi_total_people || '0') },
        { label: '今日活跃', value: parseInt(data.today_total_people || '0') },
      ]
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取团队成员列表（Daili.agent）
const fetchTeamMembers = async (page: number = 1) => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const currentUserInfo = getUserInfo()
    if (!currentUserInfo) return

    const uid = currentUserInfo.user_id || currentUserInfo.id
    const token = currentUserInfo.token

    if (!uid || !token) return

    const queryParams = new URLSearchParams()
    queryParams.append('service', 'Daili.agent')
    queryParams.append('uid', String(uid))
    queryParams.append('token', token)
    queryParams.append('page', String(page))
    queryParams.append('pagesize', '20')

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
    console.log('获取团队成员列表返回:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      const info = result.data.info || {}
      const dataList = info.data || []

      // 更新分页信息
      totalPages.value = parseInt(info.total_page || '1')
      currentPage.value = page

      // 转换数据格式
      teamMembers.value = dataList.map(
        (item: { id?: string; user_nicename?: string; create_time?: string; avatar?: string }) => ({
          account: item.user_nicename || '',
          memberId: item.id || '',
        }),
      )
    }
  } catch (error) {
    console.error('获取团队成员列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  // 搜索功能：如果搜索框为空，重新加载列表；否则使用本地过滤
  if (!searchQuery.value.trim()) {
    fetchTeamMembers(1)
  }
}

onMounted(() => {
  fetchStats()
  fetchTeamMembers(1)
})
</script>

<template>
  <div class="team-management-page">
    <HeaderNav title="团队管理" />

    <div class="team-management-content">
      <div class="stats-row">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="stat-card"
          :class="{ primary: stat.label === '团队人数' }"
        >
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>

      <div class="search-bar">
        <div class="search-input">
          <svg viewBox="0 0 24 24" class="search-icon" aria-hidden="true">
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27a6 6 0 1 0-.71.71l.27.28v.78l5 5L20.49 19l-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="请输入会员ID"
            @keyup.enter="handleSearch"
          />
        </div>
        <button class="search-btn" type="button" @click="handleSearch">搜索</button>
      </div>

      <div class="table">
        <div class="table-header">
          <span>排名</span>
          <span>账号</span>
          <span>ID</span>
        </div>

        <div v-if="filteredTeamMembers.length" class="table-body">
          <div
            v-for="(member, index) in filteredTeamMembers"
            :key="`${member.account}-${member.memberId}-${index}`"
            class="table-row"
          >
            <span>{{ index + 1 }}</span>
            <span>{{ member.account }}</span>
            <span>{{ member.memberId }}</span>
          </div>
        </div>

        <div v-else class="empty-state">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-management-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
}

.team-management-content {
  padding: 60px 15px 24px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #1f1f1f;
  border-radius: 12px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.stat-card.primary {
  background: #ff9500;
  color: #fff;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.stat-card.primary .stat-label {
  color: #fff;
}

.search-bar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  background: #1f1f1f;
  border-radius: 28px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.search-input input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 14px;
}

.search-icon {
  width: 18px;
  height: 18px;
  color: #aaa;
  flex-shrink: 0;
}

.search-btn {
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  border: none;
  border-radius: 28px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.table {
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 3fr 1.5fr;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  background-image: url('@/assets/img/bg-tdgl-01.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #c7c7c7;
  font-size: 15px;
  font-weight: 600;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 3fr 1.5fr;
  padding: 14px 16px;
  color: #fff;
  font-size: 15px;
}

.table-row + .table-row {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #888;
  font-size: 14px;
}
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 3fr 1.5fr;
  }
}
</style>
