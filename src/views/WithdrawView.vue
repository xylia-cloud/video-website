<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon, showToast, showDialog, showLoadingToast, closeToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import {
  fetchWithdrawTypes,
  fetchUserProfit,
  fetchUserAccountList,
  addUserAccount,
  deleteUserAccount,
  submitWithdraw,
  getUserInfo,
  fetchUserPoints,
  setUserInfo,
} from '@/api/fetch-api'

const router = useRouter()

// 数据接口定义
interface WithdrawType {
  type: string
  name: string
  icon: string
  cash_take: string
}

interface UserAccount {
  id: string
  uid: string
  type: string
  account_bank: string
  name: string
  account: string
  addtime: string
}

interface UserProfit {
  votes: string
  votestotal: string | null
  total: string
  cash_rate: string
  cash_take: string
  tips: string
}

// 响应式数据
const loading = ref(false)
const withdrawTypes = ref<WithdrawType[]>([])
const userAccounts = ref<UserAccount[]>([])
const userProfit = ref<UserProfit | null>(null)
const selectedAccount = ref<UserAccount | null>(null)

// 提现金额
const withdrawAmount = ref('')

// 下拉选择状态
const showAccountDropdown = ref(false)

// 添加账号弹窗
const showAddAccountModal = ref(false)
const selectedWithdrawType = ref<WithdrawType | null>(null)
const newAccount = ref({
  name: '',
  account: '',
  account_bank: '',
})

// 提现成功弹窗
const showSuccessModal = ref(false)

// 获取提现账户类型
const loadWithdrawTypes = async () => {
  try {
    const result = await fetchWithdrawTypes()
    if (result.code === 1) {
      withdrawTypes.value = result.data || []
    }
  } catch (error) {
    console.error('获取提现账户类型失败:', error)
  }
}

// 获取用户收益信息
const loadUserProfit = async () => {
  try {
    const result = await fetchUserProfit()
    if (result.code === 1) {
      userProfit.value = result.data
    }
  } catch (error) {
    console.error('获取用户收益失败:', error)
  }
}

// 获取用户提现账号列表
const loadUserAccounts = async () => {
  try {
    const result = await fetchUserAccountList()
    if (result.code === 1) {
      userAccounts.value = result.data || []
      // 默认选择第一个账号
      if (userAccounts.value.length > 0) {
        selectedAccount.value = userAccounts.value[0]
      }
    }
  } catch (error) {
    console.error('获取用户账号失败:', error)
  }
}

// 选择提现账号
const selectAccount = (account: UserAccount) => {
  selectedAccount.value = account
  showAccountDropdown.value = false
}

// 切换账号下拉框
const toggleAccountDropdown = () => {
  showAccountDropdown.value = !showAccountDropdown.value
}

// 点击外部关闭下拉框
const closeAccountDropdown = () => {
  showAccountDropdown.value = false
}

// 从下拉框中选择添加账号类型
const selectAddAccountType = (type: WithdrawType) => {
  selectedWithdrawType.value = type
  newAccount.value = {
    name: '',
    account: '',
    account_bank: type.name === '银行卡' ? '' : type.name,
  }
  showAccountDropdown.value = false
  showAddAccountModal.value = true
}

// 添加提现账号
const handleAddAccount = async () => {
  if (!selectedWithdrawType.value) return

  if (!newAccount.value.name || !newAccount.value.account) {
    showToast('请填写完整信息')
    return
  }

  if (selectedWithdrawType.value.name === '银行卡' && !newAccount.value.account_bank) {
    showToast('请填写银行名称')
    return
  }

  try {
    showLoadingToast({
      message: '添加中...',
      forbidClick: true,
    })

    const result = await addUserAccount({
      type: parseInt(selectedWithdrawType.value.type),
      account_bank: newAccount.value.account_bank,
      account: newAccount.value.account,
      name: newAccount.value.name,
    })

    closeToast()

    if (result.code === 1) {
      showToast('添加成功')
      showAddAccountModal.value = false
      await loadUserAccounts()
    } else {
      showToast(result.msg || '添加失败')
    }
  } catch (error) {
    closeToast()
    console.error('添加账号失败:', error)
    showToast('添加失败')
  }
}

// 删除提现账号
const handleDeleteAccount = async (account: UserAccount) => {
  try {
    await showDialog({
      title: '确认删除',
      message: `确定要删除这个提现账号吗？\n\n${account.name}\n${getAccountDisplayInfo(account)}`,
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonColor: '#ff4444',
      showCancelButton: true,
    })

    // 用户确认删除
    showLoadingToast({
      message: '删除中...',
      forbidClick: true,
    })

    const result = await deleteUserAccount(parseInt(account.id))
    closeToast()

    if (result.code === 1) {
      showToast('删除成功')
      await loadUserAccounts()
    } else {
      showToast(result.msg || '删除失败')
    }
  } catch (error) {
    if (error === 'cancel') {
      // 用户点击取消按钮，不做任何操作
      console.log('用户取消删除操作')
      return
    }
    closeToast()
    console.error('删除账号失败:', error)
    showToast('删除失败')
  }
}

// 提交提现申请
const handleWithdraw = async () => {
  if (!selectedAccount.value) {
    showToast('请选择提现账号')
    return
  }

  if (!withdrawAmount.value || parseFloat(withdrawAmount.value) <= 0) {
    showToast('请输入正确的提现金额')
    return
  }

  const cashvote = parseInt(withdrawAmount.value)
  if (isNaN(cashvote)) {
    showToast('提现金额格式不正确')
    return
  }

  const minAmount = parseInt(userProfit.value?.cash_take || '5')
  if (cashvote < minAmount) {
    showToast(`最低提现金额为${minAmount}元`)
    return
  }

  try {
    showLoadingToast({
      message: '提交中...',
      forbidClick: true,
    })

    const result = await submitWithdraw({
      accountid: parseInt(selectedAccount.value.id),
      cashvote: cashvote,
    })

    closeToast()

    if (result.code === 1) {
      showSuccessModal.value = true
      withdrawAmount.value = ''
      
      // 刷新用户收益信息（提现余额）
      await loadUserProfit()
      
      // 刷新用户账户余额（如果提现会影响账户余额的话）
      // 如果提现只是从佣金提现，不影响游戏余额，可以注释掉下面这行
      await refreshUserBalance()
    } else {
      showToast(result.msg || '提现申请失败')
    }
  } catch (error) {
    closeToast()
    console.error('提现失败:', error)
    showToast('提现申请失败')
  }
}

// 刷新用户余额
const refreshUserBalance = async () => {
  try {
    const pointsResult = await fetchUserPoints()
    if (pointsResult.code === 1 && pointsResult.data) {
      // 更新本地存储的用户信息
      const userInfo = getUserInfo()
      if (userInfo) {
        userInfo.coin = pointsResult.data.coin
        userInfo.user_points = pointsResult.data.points
        userInfo.points = pointsResult.data.points
        userInfo.video_nums = pointsResult.data.video_nums
        userInfo.is_vip = pointsResult.data.is_vip
        if (pointsResult.data.endtime) {
          userInfo.endtime = pointsResult.data.endtime
        }
        setUserInfo(userInfo)
        console.log('✅ 提现后余额已刷新，当前余额:', pointsResult.data.coin)
      }
    }
  } catch (error) {
    console.error('刷新余额失败:', error)
  }
}

// 获取账户类型名称
const getAccountTypeName = (type: string) => {
  const withdrawType = withdrawTypes.value.find((t) => t.type === type)
  return withdrawType?.name || '未知类型'
}

// 获取账户显示信息
const getAccountDisplayInfo = (account: UserAccount) => {
  const typeName = getAccountTypeName(account.type)
  if (account.type === '3') {
    return `${account.account_bank}(${account.account.slice(-4)})`
  } else {
    return `${typeName}(${account.account})`
  }
}

// 检查登录状态
const checkLoginStatus = () => {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.token) {
    showDialog({
      title: '未登录',
      message: '请先登录后再进行提现操作',
      confirmButtonText: '去登录',
      confirmButtonColor: '#ff9500',
    }).then(() => {
      router.push('/login')
    })
    return false
  }
  return true
}

// 计算可提现金额（100的倍数）
const withdrawableAmount = computed(() => {
  if (!userProfit.value?.total) return '0'
  const total = parseFloat(userProfit.value.total)
  return Math.floor(total / 100) * 100
})

// 页面初始化
onMounted(async () => {
  if (!checkLoginStatus()) return

  loading.value = true
  try {
    await Promise.all([loadWithdrawTypes(), loadUserProfit(), loadUserAccounts()])
  } finally {
    loading.value = false
  }

  document.addEventListener('click', closeAccountDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeAccountDropdown)
})
</script>

<template>
  <div class="withdraw-page">
    <!-- 顶部导航栏 -->
    <HeaderNav title="提现" />

    <!-- 主要内容区 -->
    <div class="withdraw-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" color="#ff9500">加载中...</van-loading>
      </div>

      <!-- 主要内容 -->
      <div v-else>
        <!-- 可提现余额卡片 -->
        <div class="balance-card">
          <div class="balance-info">
            <div class="balance-row">
              <div class="balance-item">
                <div class="balance-label">实际余额：</div>
                <div class="balance-amount">{{ userProfit?.total || '0' }}</div>
              </div>
              <div class="balance-divider"></div>
              <div class="balance-item">
                <div class="balance-label">可提现余额：</div>
                <div class="balance-amount highlight">{{ withdrawableAmount }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 选择区域标题 -->
        <div class="selection-header">
          <div class="selection-title">提现金额</div>
          <div class="account-selection-title" @click.stop="toggleAccountDropdown">
            <span v-if="selectedAccount">
              提现至{{ getAccountTypeName(selectedAccount.type) }}({{
                selectedAccount.account.slice(-4)
              }})
            </span>
            <span v-else>选择提现账号</span>
            <Icon name="arrow" size="14" color="#ccc" />

            <!-- 账号下拉选择 -->
            <div v-show="showAccountDropdown" class="account-dropdown" @click.stop>
              <!-- 现有账号列表 -->
              <div v-if="userAccounts.length > 0" class="existing-accounts">
                <div class="dropdown-section-title">选择账号</div>
                <div
                  v-for="account in userAccounts"
                  :key="account.id"
                  class="dropdown-account-item"
                  :class="{ active: selectedAccount?.id === account.id }"
                  @click="selectAccount(account)"
                >
                  <div class="account-info">
                    <div class="account-name">{{ account.name }}</div>
                    <div class="account-detail">{{ getAccountDisplayInfo(account) }}</div>
                  </div>
                  <div class="account-actions">
                    <Icon
                      name="delete"
                      size="16"
                      color="#ff4444"
                      @click.stop="handleDeleteAccount(account)"
                    />
                  </div>
                </div>
              </div>

              <!-- 添加新账号选项 -->
              <div class="add-account-options">
                <div class="dropdown-section-title">添加新账号</div>
                <div
                  v-for="type in withdrawTypes"
                  :key="type.type"
                  class="dropdown-add-item"
                  @click="selectAddAccountType(type)"
                >
                  <img :src="type.icon" :alt="type.name" class="add-type-icon" />
                  <span class="add-type-name">添加{{ type.name }}</span>
                  <Icon name="plus" size="14" color="#ff9500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 提现金额输入 -->
        <div class="amount-input-section">
          <div class="amount-input">
            <span class="currency-symbol">¥</span>
            <input
              type="number"
              v-model="withdrawAmount"
              placeholder="请输入提现金额"
              min="0.3"
              step="0.1"
            />
          </div>
        </div>

        <!-- 提现按钮 -->
        <div class="withdraw-button-container" v-if="selectedAccount && withdrawAmount">
          <button class="withdraw-button" @click="handleWithdraw">立即提现</button>
        </div>

        <!-- 温馨提示 -->
        <div class="tips-section">
          <div class="tips-title">温馨提示：</div>
          <div class="tips-content">
            <div class="tip-item">1.提现服务时间为12小时：上午12.00到晚23.50分</div>
            <div class="tip-item">2.提现同账号每日累积提现上限总额为10000000元整；</div>
            <div class="tip-item">3.每次发起提现以后流水系统会自动清零流水；</div>
            <div class="tip-item">4. 提现需投注金额达到充值金额的400%，否则无法完成提现。</div>
            <div class="tip-item">（例如：充值100元，需投注400元方可提现。）</div>
            <div class="tip-item">5. 请确保正确填写开户银行、银行卡号和持卡人姓名。</div>
            <div class="tip-item">
              6.
              当您提现申请完成后，我们承诺，除非遇到非可控因素，我们将为您提供1分钟快速到账的提款服务。
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加账号弹窗 -->
    <van-popup v-model:show="showAddAccountModal" position="bottom" class="add-account-popup">
      <div class="popup-header">
        <h3>添加{{ selectedWithdrawType?.name }}账号</h3>
        <Icon name="cross" size="24" @click="showAddAccountModal = false" />
      </div>
      <div class="popup-content">
        <div class="form-item">
          <label>姓名</label>
          <input v-model="newAccount.name" placeholder="请输入姓名" />
        </div>
        <div class="form-item">
          <label>账号</label>
          <input
            v-model="newAccount.account"
            :placeholder="`请输入${selectedWithdrawType?.name}账号`"
          />
        </div>
        <div class="form-item" v-if="selectedWithdrawType?.name === '银行卡'">
          <label>银行名称</label>
          <input v-model="newAccount.account_bank" placeholder="请输入银行名称" />
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="showAddAccountModal = false">取消</button>
          <button class="confirm-btn" @click="handleAddAccount">确定</button>
        </div>
      </div>
    </van-popup>

    <!-- 提现成功弹窗 -->
    <van-popup v-model:show="showSuccessModal" class="success-popup">
      <div class="success-content">
        <div class="success-icon">
          <Icon name="checked" size="48" color="#4CAF50" />
        </div>
        <div class="success-title">提现申请成功</div>
        <div class="success-desc">您的提现申请已提交，我们会尽快处理</div>
        <button class="success-button" @click="showSuccessModal = false">确定</button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.withdraw-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 20px;
}

.withdraw-container {
  padding: 80px 15px 20px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 可提现余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #333 0%, #2a2a2a 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-info {
  flex: 1;
}

.balance-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.balance-item {
  flex: 1;
  min-width: 0;
}

.balance-divider {
  width: 1px;
  height: 60px;
  background: #333;
  margin: 10px 0;
}

.balance-label {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.balance-amount.highlight {
  color: #ff9500;
  font-size: 24px;
}

.balance-tip {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  white-space: nowrap;
}

.coin-icon img {
  width: 50px;
  height: 50px;
}

/* 选择区域标题 */
.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.selection-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.account-selection-title {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #ccc;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.account-selection-title:hover {
  background-color: #333;
}

/* 账号下拉选择 */
.account-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #222;
  border: 2px solid #444;
  border-radius: 8px;
  min-width: 250px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-section-title {
  padding: 10px 15px;
  font-size: 12px;
  color: #ff9500;
  font-weight: bold;
  background-color: #333;
  border-bottom: 1px solid #444;
}

.dropdown-account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-bottom: 1px solid #333;
}

.dropdown-account-item:hover {
  background-color: #444;
}

.dropdown-account-item.active {
  background-color: rgba(255, 149, 0, 0.1);
  border-left: 3px solid #ff9500;
}

.dropdown-account-item .account-info {
  flex: 1;
}

.dropdown-account-item .account-name {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
}

.dropdown-account-item .account-detail {
  font-size: 11px;
  color: #ccc;
}

.dropdown-account-item .account-actions {
  display: flex;
  gap: 8px;
}

.dropdown-add-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-bottom: 1px solid #333;
}

.dropdown-add-item:hover {
  background-color: #444;
}

.dropdown-add-item:last-child {
  border-bottom: none;
}

.add-type-icon {
  width: 20px;
  height: 20px;
}

.add-type-name {
  flex: 1;
  font-size: 13px;
  color: #fff;
}

/* 金额输入 */
.amount-input-section {
  margin-bottom: 20px;
}

.amount-input {
  display: flex;
  align-items: center;
  background-color: #222;
  border: 2px solid #ff9500;
  border-radius: 8px;
  padding: 12px 15px;
}

.currency-symbol {
  font-size: 18px;
  color: #ff9500;
  margin-right: 10px;
}

.amount-input input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 16px;
}

.amount-input input::placeholder {
  color: #666;
}

/* 提现按钮 */
.withdraw-button-container {
  margin: 30px 0;
}

.withdraw-button {
  width: 100%;
  background: linear-gradient(135deg, #ff9500 0%, #ff8c00 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.withdraw-button:hover {
  background: linear-gradient(135deg, #ff8c00 0%, #ff7700 100%);
}

/* 温馨提示 */
.tips-section {
  background-color: #222;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.tips-title {
  font-size: 14px;
  color: #ff9500;
  margin-bottom: 10px;
}

.tips-content {
  font-size: 12px;
  color: #999;
  line-height: 1.6;
}

.tip-item {
  margin-bottom: 5px;
}

/* 弹窗样式 */
.add-account-popup {
  background-color: #222;
  border-radius: 12px 12px 0 0;
  color: #fff;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
}

.popup-header h3 {
  margin: 0;
  font-size: 16px;
}

.popup-content {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  font-size: 14px;
  color: #ccc;
  margin-bottom: 8px;
}

.form-item input {
  width: 100%;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
}

.form-item input::placeholder {
  color: #666;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #333;
  color: #ccc;
}

.confirm-btn {
  background-color: #ff9500;
  color: #fff;
}

/* 成功弹窗 */
.success-popup {
  background-color: #222;
  border-radius: 12px;
  color: #fff;
}

.success-content {
  padding: 40px 30px;
  text-align: center;
}

.success-icon {
  margin-bottom: 20px;
}

.success-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.success-desc {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 30px;
  line-height: 1.5;
}

.success-button {
  width: 100%;
  background-color: #ff9500;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
}
</style>
