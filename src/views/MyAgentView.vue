<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo, isLoggedIn } from '@/api/fetch-api'
import QRCode from 'qrcode'
import { NEW_API_BASE_URL } from '@/utils/config'

const router = useRouter()

// 用户信息
const userInfo = ref<any>(null)
// 二维码数据URL
const qrCodeDataUrl = ref<string>('')
// 是否显示二维码弹窗
const showQRCodeModal = ref(false)
// 是否显示代理扶持弹窗
const showAgentSupportModal = ref(false)

// 佣金数据
const todayCommission = ref('0.00')
const yesterdayCommission = ref('0.00')
const claimableCommission = ref('0.00')

// 团队数据
const newUsers = ref(0)
const newDirect = ref(0)
const rechargeCount = ref(0)
const totalTeamMembers = ref(0)
const effectiveRecharge = ref('0.00')
const effectiveBetting = ref('0.00')

// 获取当前域名
const getCurrentDomain = () => {
  const protocol = window.location.protocol
  const host = window.location.host
  return `${protocol}//${host}`
}

// 获取用户信息
const fetchUserInfo = () => {
  if (!isLoggedIn()) {
    showToast({
      message: '请先登录',
      duration: 2000,
      position: 'top',
    })
    router.push('/login')
    return
  }

  const info = getUserInfo()
  if (info) {
    userInfo.value = info
  }
}

// 生成邀请链接
const inviteLink = computed(() => {
  const currentDomain = getCurrentDomain()
  if (!userInfo.value || !userInfo.value.rec_code) {
    return `${currentDomain}/#/`
  }
  return `${currentDomain}/#/?invite=${userInfo.value.rec_code}`
})

// 邀请码
const inviteCode = computed(() => {
  return userInfo.value?.rec_code || ''
})

// 生成二维码
const generateQRCode = async (text: string) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
    qrCodeDataUrl.value = dataUrl
  } catch (error) {
    console.error('生成二维码失败:', error)
    showToast({
      message: '生成二维码失败',
      duration: 2000,
    })
  }
}

// 复制链接
const copyLink = async () => {
  try {
    const link = inviteLink.value
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(link)
      showToast({
        message: '链接已复制',
        duration: 2000,
      })
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = link
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast({
        message: '链接已复制',
        duration: 2000,
      })
    }
  } catch (error) {
    console.error('复制失败:', error)
    showToast({
      message: '复制失败，请重试',
      duration: 2000,
    })
  }
}

// 显示二维码
const showQRCode = async () => {
  await generateQRCode(inviteLink.value)
  showQRCodeModal.value = true
}

// 关闭二维码弹窗
const closeQRCodeModal = () => {
  showQRCodeModal.value = false
}

// 复制邀请码
const copyInviteCode = async () => {
  try {
    const code = inviteCode.value
    if (!code) {
      showToast({
        message: '邀请码不存在',
        duration: 2000,
      })
      return
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code)
      showToast({
        message: '邀请码已复制',
        duration: 2000,
      })
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = code
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast({
        message: '邀请码已复制',
        duration: 2000,
      })
    }
  } catch (error) {
    console.error('复制失败:', error)
    showToast({
      message: '复制失败，请重试',
      duration: 2000,
    })
  }
}

// 领取佣金
const claimCommission = () => {
  showToast({
    message: '佣金领取功能开发中',
    duration: 2000,
  })
}

// 获取代理数据
const fetchAgentData = async () => {
  try {
    const currentUserInfo = getUserInfo()
    if (!currentUserInfo) return

    const uid = currentUserInfo.user_id || currentUserInfo.id
    const token = currentUserInfo.token

    if (!uid || !token) return

    // 构建请求URL
    const queryParams = new URLSearchParams()
    queryParams.append('service', 'User.GetAgentData')
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
    console.log('获取代理数据返回:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      const data = result.data.info || {}
      
      // 更新佣金数据
      todayCommission.value = parseFloat(data.today_commission || '0').toFixed(2)
      yesterdayCommission.value = parseFloat(data.yesterday_commission || '0').toFixed(2)
      claimableCommission.value = parseFloat(data.claimable_commission || '0').toFixed(2)
      
      // 更新团队数据
      newUsers.value = parseInt(data.new_users || '0')
      newDirect.value = parseInt(data.new_direct || '0')
      rechargeCount.value = parseInt(data.recharge_count || '0')
      totalTeamMembers.value = parseInt(data.total_team_members || '0')
      effectiveRecharge.value = parseFloat(data.effective_recharge || '0').toFixed(2)
      effectiveBetting.value = parseFloat(data.effective_betting || '0').toFixed(2)
    }
  } catch (error) {
    console.error('获取代理数据失败:', error)
  }
}

// 跳转到团队管理
const goToTeamManagement = () => {
  showToast({
    message: '团队管理功能开发中',
    duration: 2000,
  })
}

// 跳转到业绩查询
const goToPerformanceQuery = () => {
  showToast({
    message: '业绩查询功能开发中',
    duration: 2000,
  })
}

// 跳转到代理报表
const goToAgentReport = () => {
  showToast({
    message: '代理报表功能开发中',
    duration: 2000,
  })
}

// 查看团队详情
const viewTeamDetails = () => {
  showToast({
    message: '团队详情功能开发中',
    duration: 2000,
  })
}

// 显示代理扶持
const showAgentSupport = () => {
  showAgentSupportModal.value = true
}

// 关闭代理扶持弹窗
const closeAgentSupportModal = () => {
  showAgentSupportModal.value = false
}

onMounted(() => {
  fetchUserInfo()
  fetchAgentData()
})
</script>

<template>
  <div class="my-agent-page">
    <HeaderNav title="推广赚钱" />
    
    <div class="agent-content">
      <!-- 推广方式 -->
      <div class="promotion-methods">
        <div class="method-item" @click="copyLink">
          <div class="method-icon">
              <img src="@/assets/img/icon-daili-fzlj.png" alt="复制链接" />
          </div>
          <div class="method-text">
            <div class="method-title">复制链接</div>
            <div class="method-subtitle">分享</div>
          </div>
        </div>
        <div class="method-item" @click="showQRCode">
          <div class="method-icon">
              <img src="@/assets/img/icon-daili-ewm.png" alt="二维码" />
          </div>
          <div class="method-text">
            <div class="method-title">二维码</div>
            <div class="method-subtitle">分享</div>
          </div>
        </div>
        <div class="method-item" @click="showAgentSupport">
          <div class="method-icon">
              <img src="@/assets/img/icon-daili-dlfc.png" alt="代理扶持" />
          </div>
          <div class="method-text">
            <div class="method-title">代理扶持</div>
          </div>
        </div>
      </div>

      <!-- 邀请码 -->
      <div class="invite-code-section">
        <div class="invite-code-display">
          <span class="invite-label">我的专属邀请码:</span>
          <span class="invite-code">{{ inviteCode || '未设置' }}</span>
        </div>
        <button class="copy-code-btn" @click="copyInviteCode">复制</button>
      </div>

      <!-- 佣金统计 -->
      <div class="commission-section">
        <div class="commission-stats">
          <div class="stat-item">
            <div class="stat-value">{{ todayCommission }}</div>
            <div class="stat-label">今日预估佣金</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ yesterdayCommission }}</div>
            <div class="stat-label">昨日预估佣金</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ todayCommission }}</div>
            <div class="stat-label">今日预估佣金</div>
          </div>
        </div>
        <div class="claimable-section">
          <div class="claimable-info">
            <span class="currency">¥</span>
            <span class="claimable-text">可领取佣金: {{ claimableCommission }}</span>
          </div>
          <button class="claim-btn" @click="claimCommission">领取</button>
        </div>
      </div>

      <!-- 管理工具 -->
      <div class="management-tools">
        <div class="tool-item" @click="goToTeamManagement">
          <div class="tool-icon">
            <van-icon name="friends-o" size="24" color="#fff" />
          </div>
          <div class="tool-text">团队管理</div>
        </div>
        <div class="tool-item" @click="goToPerformanceQuery">
          <div class="tool-icon">
            <van-icon name="bar-chart-o" size="24" color="#fff" />
          </div>
          <div class="tool-text">业绩查询</div>
        </div>
        <div class="tool-item" @click="goToAgentReport">
          <div class="tool-icon">
            <van-icon name="description" size="24" color="#fff" />
          </div>
          <div class="tool-text">代理报表</div>
        </div>
      </div>

      <!-- 我的团队 -->
      <div class="team-section">
        <div class="team-header" @click="viewTeamDetails">
          <span class="team-title">我的团队</span>
          <span class="view-more">查看更多></span>
        </div>
        <div class="team-stats-grid">
          <div class="team-stat-card">
            <div class="team-stat-value">{{ newUsers }}</div>
            <div class="team-stat-label">新增用户</div>
          </div>
          <div class="team-stat-card">
            <div class="team-stat-value">{{ newDirect }}</div>
            <div class="team-stat-label">新增直属</div>
          </div>
          <div class="team-stat-card">
            <div class="team-stat-value">{{ rechargeCount }}</div>
            <div class="team-stat-label">充值人数</div>
          </div>
          <div class="team-stat-card">
            <div class="team-stat-value">{{ totalTeamMembers }}</div>
            <div class="team-stat-label">团队总人数</div>
          </div>
        </div>
        <div class="team-bottom-stats">
          <div class="bottom-stat">有效充值 {{ effectiveRecharge }}</div>
          <div class="bottom-stat">有效投注 {{ effectiveBetting }}</div>
        </div>
      </div>

      <!-- 重要提示 -->
      <div class="important-note">
        好友注册时一定要填写您的专属邀请码才有效哦!
      </div>
    </div>

    <!-- 二维码弹窗 -->
    <van-popup v-model:show="showQRCodeModal" class="qr-code-modal" round>
      <div class="qr-code-content">
        <div class="qr-code-title">扫描二维码分享</div>
        <div class="qr-code-image" v-if="qrCodeDataUrl">
          <img :src="qrCodeDataUrl" alt="二维码" />
        </div>
        <button class="close-qr-btn" @click="closeQRCodeModal">关闭</button>
      </div>
    </van-popup>

    <!-- 代理扶持弹窗 -->
    <van-popup v-model:show="showAgentSupportModal" class="agent-support-modal" round>
      <div class="agent-support-content">
        <div class="modal-title">代理扶持</div>
        <div class="modal-text">代理扶持功能开发中，敬请期待...</div>
        <button class="close-modal-btn" @click="closeAgentSupportModal">关闭</button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.my-agent-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 20px;
}

.agent-content {
  padding: 60px 15px 20px;
}

/* 推广方式 */
.promotion-methods {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.method-item {
  flex: 1;
  background:
    linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%) padding-box,
    linear-gradient(90deg, #805123, #f2e29a, #805123) border-box;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.method-item:active {
  transform: scale(0.95);
}

.method-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.method-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.method-text {
  text-align: center;
}

.method-title {
  font-size: 14px;
  color: #fff;
  margin-bottom: 4px;
}

.method-subtitle {
  font-size: 12px;
  color: #999;
}

/* 邀请码 */
.invite-code-section {
  background-color: #2c2c2c;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.invite-code-display {
  flex: 1;
  color: #fff;
}

.invite-label {
  font-size: 14px;
  color: #999;
  margin-right: 8px;
}

.invite-code {
  font-size: 16px;
  font-weight: bold;
  color: #ff9500;
}

.copy-code-btn {
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  border: none;
  border-radius: 100px;
  border-top-left-radius: 100px;
  border-top-right-radius: 100px;
  border-bottom-right-radius: 100px;
  border-bottom-left-radius: 100px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

/* 佣金统计 */
.commission-section {
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.commission-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.claimable-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.claimable-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency {
  font-size: 14px;
  color: #ff9500;
}

.claimable-text {
  font-size: 14px;
  color: #fff;
}

.claim-btn {
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  border: none;
  border-radius: 100px;
  border-top-left-radius: 100px;
  border-top-right-radius: 100px;
  border-bottom-right-radius: 100px;
  border-bottom-left-radius: 100px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

/* 管理工具 */
.management-tools {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.tool-item {
  flex: 1;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  border-radius: 12px;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tool-item:active {
  transform: scale(0.95);
}

.tool-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-text {
  font-size: 14px;
  color: #fff;
  text-align: center;
}

/* 我的团队 */
.team-section {
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  cursor: pointer;
}

.team-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.view-more {
  font-size: 14px;
  color: #999;
}

.team-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(1, 1fr);
  gap: 12px;
  margin-bottom: 15px;
}

.team-stat-card {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.team-stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.team-stat-label {
  font-size: 12px;
  color: #999;
}

.team-bottom-stats {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.bottom-stat {
  font-size: 14px;
  color: #fff;
}

/* 重要提示 */
.important-note {
  text-align: center;
  font-size: 14px;
  color: #fff;
  padding: 15px;
  background-color: rgba(255, 149, 0, 0.1);
  border-radius: 8px;
}

/* 二维码弹窗 */
.qr-code-modal,
.agent-support-modal {
  background-color: #2c2c2c;
}

.qr-code-content,
.agent-support-content {
  padding: 30px 20px;
  text-align: center;
}

.qr-code-title,
.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20px;
}

.qr-code-image {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

.qr-code-image img {
  width: 200px;
  height: 200px;
}

.close-qr-btn,
.close-modal-btn {
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 30px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
}

.modal-text {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}
</style>

