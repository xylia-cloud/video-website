<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, closeToast, Loading, Icon } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo, setUserInfo, type UserInfo, createAuthHeaders, fetchUserPoints } from '@/api/fetch-api'
import { BASE_URL } from '@/utils/config'

const router = useRouter()

// 选项卡状态
const activeTab = ref('video'); // 'game' 或 'video'

// 切换选项卡
const switchTab = (tab: string) => {
    if (tab === 'game') {
        router.push('/recharge');
    } else {
        activeTab.value = tab;
    }
};

// 用户数据
const userInfo = ref<UserInfo | null>(null)
const userBalance = ref(0)
const userVideoNums = ref(0) // 用户观看次数
const isVip = ref('0') // VIP状态：'1'是VIP，'0'不是VIP
const vipEndtime = ref('') // VIP到期时间
const isUserLoggedIn = ref(false)

// 充值选项数据
const chargeOptions = ref<Array<{ price: number, type: number, desc: string }>>([])
const isLoadingChargeOptions = ref(false)
const selectedChargeOption = ref<{ price: number, type: number, desc: string } | null>(null)

// 充值完成弹窗状态
const showChargeCompleteDialog = ref(false)

// VIP状态显示计算属性
const vipStatusText = computed(() => {
    if (isVip.value === '1') {
        if (vipEndtime.value) {
            // 格式化时间戳为可读日期
            const endDate = new Date(parseInt(vipEndtime.value) * 1000)
            const now = new Date()

            if (endDate > now) {
                // VIP未过期
                const year = endDate.getFullYear()
                const month = String(endDate.getMonth() + 1).padStart(2, '0')
                const day = String(endDate.getDate()).padStart(2, '0')
                return `已开通 🎉 (至${year}-${month}-${day})`
            } else {
                // VIP已过期
                return '已过期 ⏰'
            }
        } else {
            return '已开通 🎉'
        }
    } else {
        return '未开通'
    }
})

// 获取用户信息
const fetchUserInfo = () => {
    const localUserInfo = getUserInfo()
    if (localUserInfo && localUserInfo.token) {
        isUserLoggedIn.value = true
        userInfo.value = localUserInfo
        userBalance.value = localUserInfo.coin || 0
        userVideoNums.value = localUserInfo.video_nums || 0
        isVip.value = localUserInfo.is_vip || '0'
        vipEndtime.value = localUserInfo.endtime || ''
    } else {
        isUserLoggedIn.value = false
        userInfo.value = null
        userBalance.value = 0
        userVideoNums.value = 0
        isVip.value = '0'
        vipEndtime.value = ''
    }
}

// 获取充值选项
const fetchChargeOptions = async () => {
    if (isLoadingChargeOptions.value) return

    isLoadingChargeOptions.value = true
    try {
        // 获取包含认证信息的请求头
        const authHeaders = createAuthHeaders(false) as any

        // 构建充值选项接口URL，使用视频API的BASE_URL
        const chargeUrl = `${BASE_URL}/index.php/ajax/charge.html`
        console.log('🔍 充值选项接口请求URL:', chargeUrl)

        // 构建请求参数，包含reqTime和token（如果有）
        const queryParams = new URLSearchParams()
        if (authHeaders.reqTime) {
            queryParams.append('reqTime', authHeaders.reqTime.toString())
        }
        if (authHeaders.token) {
            queryParams.append('token', authHeaders.token.toString())
        }

        const finalUrl = queryParams.toString() ? `${chargeUrl}?${queryParams.toString()}` : chargeUrl

        console.log('📝 充值选项参数:', {
            reqTime: authHeaders.reqTime,
            token: authHeaders.token ? '***已设置***' : '未设置'
        })

        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: authHeaders
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const result = await response.json()
        console.log('💰 充值选项接口返回:', result)

        if (result.code === 1 && result.data) {
            chargeOptions.value = result.data
            console.log('✅ 充值选项加载成功，共', result.data.length, '个选项')

            // 默认选中第一个选项
            if (chargeOptions.value.length > 0) {
                selectedChargeOption.value = chargeOptions.value[0]
            }
        } else {
            console.error('❌ 获取充值选项失败:', result.msg)
            chargeOptions.value = []
        }
    } catch (error) {
        console.error('🚫 获取充值选项请求失败:', error)
        chargeOptions.value = []
        showToast({
            message: '获取充值选项失败，请稍后再试',
            position: 'top',
            duration: 3000,
        })
    } finally {
        isLoadingChargeOptions.value = false
    }
}

// 选择充值选项
const selectChargeOption = (option: { price: number, type: number, desc: string }) => {
    selectedChargeOption.value = option
}

// 确认充值
const confirmCharge = async () => {
    if (!selectedChargeOption.value) {
        showToast({
            message: '请选择充值选项',
            position: 'top',
            duration: 2000,
        })
        return
    }

    try {
        // 显示加载状态
        showToast({
            message: '正在处理充值...',
            position: 'top',
            duration: 0, // 不自动消失
            icon: 'loading',
        })

        // 构建充值接口URL
        const buyUrl = `${BASE_URL}/index.php/ajax/buy.html`
        console.log('🔍 充值接口请求URL:', buyUrl)

        // 获取用户信息
        const userInfo = getUserInfo()
        if (!userInfo) {
            closeToast()
            showToast({
                message: '用户信息不存在，请刷新页面重试',
                position: 'top',
                duration: 3000,
            })
            return
        }

        // 兼容游客用户和正式用户的数据结构
        const uid = userInfo.user_id || userInfo.id
        if (!uid) {
            closeToast()
            showToast({
                message: '用户ID不存在，请重新登录',
                position: 'top',
                duration: 3000,
            })
            return
        }

        // 获取包含认证信息的请求头（token和reqTime会在请求头中）
        const authHeaders = createAuthHeaders(true) as any

        // 构建请求体参数 - 只需要 uid 和 type
        // token 和 reqTime 已经在请求头中，PHP代理会转发这些请求头
        const formData = new URLSearchParams()
        formData.append('uid', uid.toString())
        formData.append('type', selectedChargeOption.value.type.toString())

        console.log('📝 充值参数:')
        console.log('  请求头:', {
            token: authHeaders.token ? '***已设置***' : '未设置',
            reqTime: authHeaders.reqTime
        })
        console.log('  请求体:', {
            uid: uid,
            type: selectedChargeOption.value.type
        })

        const response = await fetch(buyUrl, {
            method: 'POST',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const result = await response.json()
        console.log('💰 充值接口返回:', result)

        // 关闭加载提示
        closeToast()

        if (result.code === 1) {
            // 检查是否返回了支付链接
            if (result.data && result.data.payUrl) {
                // 打开支付页面 - 使用 window.location.href 替代 window.open 以兼容iOS
                console.log('🔗 跳转到支付页面:', result.data.payUrl)

                showToast({
                    message: '正在跳转到支付页面...',
                    position: 'top',
                    duration: 2000,
                })

                // 延迟跳转，让用户看到提示
                setTimeout(() => {
                    window.location.href = result.data.payUrl
                }, 500)

            } else {
                // 充值成功（无需跳转支付页面）
                showToast({
                    message: '充值成功！',
                    position: 'top',
                    duration: 2000,
                })

                // 刷新用户信息
                fetchUserInfo()
            }

        } else if (result.code === 0 && result.msg === '请先登录') {
            // 需要登录
            showToast({
                message: '请先登录后再充值',
                position: 'top',
                duration: 2000,
            })

            router.push('/login')

        } else {
            // 充值失败
            showToast({
                message: result.msg || '充值失败，请重试',
                position: 'top',
                duration: 3000,
            })
        }

    } catch (error) {
        console.error('🚫 充值失败:', error)

        // 关闭加载提示
        closeToast()

        showToast({
            message: '充值失败，请稍后再试',
            position: 'top',
            duration: 3000,
        })
    }
}

// 显示充值完成提示弹窗
const showChargeCompletePrompt = () => {
    showChargeCompleteDialog.value = true
}

// 刷新积分（充值完成后调用）
const refreshUserPoints = async () => {
    console.log('🔄 开始刷新用户积分信息...')

    try {
        // 显示加载提示
        showToast({
            message: '充值中...',
            position: 'top',
            duration: 0, // 不自动消失
            icon: 'loading',
        })

        // 调用获取积分接口
        const pointsResult = await fetchUserPoints()

        // 关闭加载提示
        closeToast()

        if (pointsResult.code === 1 && pointsResult.data) {
            // 更新用户积分信息
            const localUserInfo = getUserInfo()
            if (localUserInfo) {
                // 更新本地存储的用户信息
                localUserInfo.user_points = pointsResult.data.points
                localUserInfo.points = pointsResult.data.points
                localUserInfo.video_nums = pointsResult.data.video_nums
                localUserInfo.is_vip = pointsResult.data.is_vip
                if (pointsResult.data.endtime) {
                    localUserInfo.endtime = pointsResult.data.endtime
                }

                // 保存到本地存储
                setUserInfo(localUserInfo)

                // 更新页面显示的数据
                userInfo.value = localUserInfo
                userVideoNums.value = pointsResult.data.video_nums
                userBalance.value = localUserInfo.coin || 0
                isVip.value = pointsResult.data.is_vip || '0'
                vipEndtime.value = pointsResult.data.endtime || ''
            }

            // 显示成功提示
            showToast({
                message: `当前观看次数：${pointsResult.data.video_nums}`,
                position: 'top',
                duration: 2000,
            })

            console.log('✅ 积分刷新完成，当前观看次数:', pointsResult.data.video_nums)
            console.log('✅ 积分详情:', pointsResult.data)

        } else {
            // 显示失败提示
            showToast({
                message: pointsResult.msg || '积分刷新失败',
                position: 'top',
                duration: 3000,
            })
        }

        // 关闭充值完成弹窗
        showChargeCompleteDialog.value = false

    } catch (error) {
        console.error('❌ 刷新积分失败:', error)

        // 关闭加载提示
        closeToast()

        showToast({
            message: '刷新失败，请稍后再试',
            position: 'top',
            duration: 3000,
        })
    }
}


onMounted(async () => {
    fetchUserInfo()
    fetchChargeOptions()

    // 获取最新的积分和VIP状态信息
    try {
        const pointsResult = await fetchUserPoints()
        if (pointsResult.code === 1 && pointsResult.data) {
            // 更新用户积分信息
            const localUserInfo = getUserInfo()
            if (localUserInfo) {
                // 更新本地存储的用户信息
                localUserInfo.user_points = pointsResult.data.points
                localUserInfo.points = pointsResult.data.points
                localUserInfo.video_nums = pointsResult.data.video_nums
                localUserInfo.is_vip = pointsResult.data.is_vip
                if (pointsResult.data.endtime) {
                    localUserInfo.endtime = pointsResult.data.endtime
                }

                // 保存到本地存储
                setUserInfo(localUserInfo)

                // 更新页面显示的数据
                userInfo.value = localUserInfo
                userVideoNums.value = pointsResult.data.video_nums
                isVip.value = pointsResult.data.is_vip || '0'
                vipEndtime.value = pointsResult.data.endtime || ''

                console.log('✅ 页面加载时积分信息获取成功:', pointsResult.data)
            }
        }
    } catch (error) {
        console.error('❌ 页面加载时获取积分信息失败:', error)
        // 静默失败，不显示错误提示，避免影响页面正常加载
    }
})
</script>

<template>
    <div class="vip-recharge-page">
        <!-- 头部导航 -->
        <HeaderNav title="充值中心" />

        <!-- 选项卡切换 -->
        <div class="nav-tabs">
            <div class="nav-tabs-wrapper">
                <div class="tab-container">
                    <div class="tab-button" :class="{ active: activeTab === 'video' }" @click="switchTab('video')">
                        视频充值
                    </div>
                    <div class="tab-button" :class="{ active: activeTab === 'game' }" @click="switchTab('game')">
                        游戏充值
                    </div>
                </div>
            </div>
        </div>

        <!-- 主体内容 -->
        <div class="vip-container">
            <!-- 会员信息展示 -->
            <div class="member-info-section">
                <div class="member-info-content">
                    <div class="member-status">
                        <span class="status-label">视频会员：</span>
                        <span class="status-value"
                            :class="{ 'vip-active': isVip === '1', 'vip-expired': isVip === '1' && vipEndtime && new Date(parseInt(vipEndtime) * 1000) <= new Date() }">{{
                                vipStatusText }}</span>
                    </div>
                    <div class="member-balance">{{ userVideoNums }}</div>
                    <div class="balance-label">观看次数</div>
                </div>
                <div class="member-icon">
                    <img src="@/assets/img/icon-vip-active.png" alt="VIP" />
                </div>
            </div>

            <!-- 充值选项列表 -->
            <div class="charge-options-list">
                <h3>视频充值套餐</h3>
                <!-- 加载状态 -->
                <div v-if="isLoadingChargeOptions" class="loading-state">
                    <Loading type="spinner" color="#ff9500" />
                    <div class="loading-text">加载充值选项中...</div>
                </div>

                <!-- 空状态 -->
                <div v-else-if="chargeOptions.length === 0" class="empty-state">
                    <Icon name="warning-o" size="24" color="#ff9500" />
                    <div class="empty-text">暂无充值选项</div>
                </div>

                <!-- 充值选项 -->
                <div v-else>
                    <div v-for="option in chargeOptions" :key="option.type" class="charge-option-item"
                        :class="{ selected: selectedChargeOption?.type === option.type }"
                        @click="selectChargeOption(option)">
                        <!-- 套餐内容 -->
                        <div class="package-content">
                            <div class="package-info">
                                <div class="package-name">{{ option.desc }}</div>
                            </div>
                            <div class="package-price">{{ option.price }}元</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 常见问题 -->
            <div class="faq-section">
                <h3>常见问题</h3>
                <div class="faq-list">
                    <div class="faq-item">
                        <span class="faq-number">1.</span>
                        <span class="faq-text">由于支付通道不稳定，若支付失败，请切换支付通道后重新购买。</span>
                    </div>
                    <div class="faq-item">
                        <span class="faq-number">2.</span>
                        <span class="faq-text">支付通道偶尔不可用，请稍后重试。</span>
                    </div>
                    <div class="faq-item">
                        <span class="faq-number">3.</span>
                        <span class="faq-text">会员可重复购买，时长叠加。</span>
                    </div>
                    <div class="faq-item">
                        <span class="faq-number">4.</span>
                        <span class="faq-text">如果确定支付成功但等待过久仍未到账，请联系客服反馈问题。</span>
                    </div>
                </div>
            </div>

            <!-- 底部购买区域 -->
            <div class="purchase-section">
                <div class="price-info">
                    <span class="price-label">{{ selectedChargeOption?.desc || '请选择充值选项' }}</span>
                    <span class="price-value">{{ selectedChargeOption?.price || 0 }}.00元</span>
                </div>
                <button class="purchase-btn" @click="confirmCharge" :disabled="!selectedChargeOption">
                    立即充值
                </button>
            </div>
        </div>

        <!-- 充值完成提示弹窗 -->
        <div v-if="showChargeCompleteDialog" class="charge-complete-overlay">
            <div class="charge-complete-modal">
                <div class="complete-icon">
                    <Icon name="success" size="48" color="#ff9500" />
                </div>
                <div class="complete-title">支付提示</div>
                <div class="complete-content">
                    <p>如果您已完成支付，请点击已完成充值按钮</p>
                </div>
                <div class="complete-buttons">
                    <button class="complete-confirm-btn" @click="refreshUserPoints">
                        已完成充值
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.vip-recharge-page {
    background-color: #111;
    color: #fff;
    min-height: 100vh;
}

.vip-container {
    padding: 120px 16px 100px;
}

/* 🔥 导航选项卡 - 圆角按钮样式 */
.nav-tabs {
    position: fixed;
    top: 50px;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 99;
    display: flex;
    justify-content: center;
}

.nav-tabs-wrapper {
    width: 100%;
    max-width: 420px;
    padding: 10px 20px;
    background-color: #111;
}

.tab-container {
    display: flex;
    background-color: #333;
    border-radius: 20px;
    padding: 3px;
    gap: 3px;
    width: 100%;
}

.tab-button {
    flex: 1;
    padding: 8px 0;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #999;
    background-color: transparent;
}

.tab-button.active {
    background: linear-gradient(135deg, #ff9500 0%, #ff7700 100%);
    color: #fff;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

/* 会员信息展示 */
.member-info-section {
    background: url('@/assets/img/bg-recharge.png') center/cover;
    border-radius: 12px;
    padding: 0 20px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.member-info-content {
    flex: 1;
}

.member-status {
    margin-bottom: 8px;
}

.status-label {
    font-size: 14px;
    color: #ccc;
}

.status-value {
    font-size: 14px;
    color: #ff9500;
    font-weight: 500;
}

.status-value.vip-active {
    color: #ff9500;
}

.status-value.vip-expired {
    color: #999;
}

.member-balance {
    font-size: 24px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 4px;
}

.balance-label {
    font-size: 12px;
    color: #999;
}

.member-icon {
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.member-icon img {
    width: 120px;
    height: 120px;
    object-fit: contain;
}

/* 充值选项列表 */
.charge-options-list {
    margin-bottom: 24px;
}

.charge-options-list h3 {
    font-size: 15px;
    color: #fff;
    margin: 0 0 16px 0;
    font-weight: 500;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #ccc;
}

.loading-text,
.empty-text {
    margin-top: 12px;
    font-size: 14px;
}

.charge-option-item {
    background: url('@/assets/img/bg-recharge.png') center/cover;
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 24px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    border: 2px solid transparent;
}

.charge-option-item.selected {
    border-color: #ff9500;
    background: url('@/assets/img/bg-recharge.png') center/cover;
    box-shadow: 0 0 15px rgba(255, 149, 0, 0.3);
}

.charge-option-item:hover {
    background: url('@/assets/img/bg-recharge.png') center/cover;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.recommend-tag {
    position: absolute;
    top: -1px;
    left: 12px;
    background-color: #ff9500;
    color: #fff;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 0 0 6px 6px;
    font-weight: 500;
}

.package-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.package-icon {
    width: 40px;
    height: 40px;
    background-color: #444;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-emoji {
    font-size: 20px;
}

.package-info {
    flex: 1;
}

.package-name {
    font-size: 18px;
    font-weight: 500;
    color: #fff;
    margin-bottom: 4px;
}

.package-desc {
    font-size: 12px;
    color: #999;
}

.package-price {
    font-size: 30px;
    font-weight: bold;
    color: #fff;
}

/* 🔥 常见问题 */
.faq-section {
    margin: 24px 0;
}

.faq-section h3 {
    font-size: 15px;
    color: #fff;
    margin: 0 0 16px 0;
    font-weight: 500;
}

.faq-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.faq-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.5;
}

.faq-number {
    color: #ff9500;
    font-weight: 500;
    font-size: 14px;
    flex-shrink: 0;
    min-width: 20px;
}

.faq-text {
    color: #ccc;
    font-size: 14px;
    line-height: 1.5;
}

/* 底部购买区域 */
.purchase-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #111;
    padding: 16px;
    border-top: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.price-info {
    flex: 1;
}

.price-label {
    font-size: 14px;
    color: #ccc;
    display: block;
    margin-bottom: 2px;
}

.price-value {
    font-size: 18px;
    font-weight: bold;
    color: #fff;
}

.purchase-btn {
    background-color: #ff9500;
    color: #fff;
    border: none;
    border-radius: 25px;
    padding: 12px 32px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.purchase-btn:hover {
    background-color: #e68600;
}

.purchase-btn:disabled {
    background-color: #666;
    cursor: not-allowed;
}

/* 充值完成提示弹窗样式 */
.charge-complete-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
}

.charge-complete-modal {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-radius: 16px;
    width: 100%;
    max-width: 360px;
    padding: 30px 20px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.complete-icon {
    margin-bottom: 20px;
}

.complete-title {
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 16px;
}

.complete-content {
    color: #ccc;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 24px;
}

.complete-buttons {
    display: flex;
    justify-content: center;
}

.complete-confirm-btn {
    background-color: #ff9500;
    color: #fff;
    border: none;
    border-radius: 25px;
    padding: 12px 32px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.complete-confirm-btn:hover {
    background-color: #e68600;
}

/* 响应式设计 */
@media (max-width: 375px) {
    .vip-container {
        padding: 100px 12px 100px;
    }

    .member-info-section {
        padding: 16px;
    }

    .charge-option-item {
        padding: 12px;
    }

    .purchase-section {
        padding: 12px;
    }
}

/* 桌面端：限制底部购买区域宽度与页面一致 */
@media screen and (min-width: 768px) {
    .purchase-section {
        left: 50% !important;
        right: auto !important;
        width: 420px !important;
        transform: translateX(-50%) !important;
    }
}
</style>
