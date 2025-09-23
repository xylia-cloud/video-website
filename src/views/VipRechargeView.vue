<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo, type UserInfo } from '@/api/fetch-api'

const router = useRouter()

// 用户数据
const userInfo = ref<UserInfo | null>(null)
const userBalance = ref(0)
const isUserLoggedIn = ref(false)

// VIP套餐数据
const vipPackages = ref([
    {
        id: 1,
        name: '体验VIP',
        description: '视频体验VIP一天',
        price: 30,
        duration: '1天',
        isSelected: true,
        icon: '🎬'
    },
    {
        id: 2,
        name: '月度畅看VIP',
        description: '视频VIP一个月',
        price: 50,
        duration: '1个月',
        isSelected: false,
        icon: '🎬'
    },
    {
        id: 3,
        name: '季度畅看VIP',
        description: '视频VIP三个月',
        price: 100,
        duration: '3个月',
        isSelected: false,
        icon: '🎬'
    },
    {
        id: 4,
        name: '半年尊享VIP',
        description: '视频VIP六个月',
        price: 120,
        duration: '6个月',
        isSelected: false,
        icon: '🎬'
    },
    {
        id: 5,
        name: '年度尊享VIP',
        description: '视频VIP一年',
        price: 150,
        duration: '1年',
        isSelected: false,
        icon: '🎬'
    },
    {
        id: 6,
        name: '终身至尊VIP',
        description: '视频SVIP终身',
        price: 200,
        duration: '终身',
        isSelected: false,
        icon: '👑'
    }
])

// 当前选中的套餐
const selectedPackage = ref(vipPackages.value[0])

// 获取用户信息
const fetchUserInfo = () => {
    const localUserInfo = getUserInfo()
    if (localUserInfo && localUserInfo.token) {
        isUserLoggedIn.value = true
        userInfo.value = localUserInfo
        userBalance.value = localUserInfo.coin || 0
    } else {
        isUserLoggedIn.value = false
        userInfo.value = null
        userBalance.value = 0
    }
}

// 选择套餐
const selectPackage = (pkg: any) => {
    // 重置所有选中状态
    vipPackages.value.forEach(p => p.isSelected = false)
    // 设置当前选中
    pkg.isSelected = true
    selectedPackage.value = pkg
}

// 立即购买
const purchaseVip = () => {
    if (!isUserLoggedIn.value) {
        showToast('请先登录')
        router.push('/login')
        return
    }

    if (userBalance.value < selectedPackage.value.price) {
        showToast('余额不足，请先充值')
        router.push('/recharge')
        return
    }

    // 这里应该调用VIP购买接口
    showToast(`正在购买${selectedPackage.value.name}...`)
    // TODO: 实现VIP购买逻辑
}


onMounted(() => {
    fetchUserInfo()
})
</script>

<template>
    <div class="vip-recharge-page">
        <!-- 头部导航 -->
        <HeaderNav title="充值" />

        <!-- 主体内容 -->
        <div class="vip-container">
            <!-- 会员信息展示 -->
            <div class="member-info-section">
                <div class="member-info-content">
                    <div class="member-status">
                        <span class="status-label">视频会员：</span>
                        <span class="status-value">已开通 🎉</span>
                    </div>
                    <div class="member-balance">{{ userBalance.toFixed(2) }}</div>
                    <div class="balance-label">账户余额</div>
                </div>
                <div class="member-icon">
                    <img src="@/assets/img/icon-vip-active.png" alt="VIP" />
                </div>
            </div>

            <!-- VIP套餐列表 -->
            <div class="vip-packages-list">
                <div v-for="pkg in vipPackages" :key="pkg.id" class="vip-package-item"
                    :class="{ selected: pkg.isSelected }" @click="selectPackage(pkg)">
                    <!-- 推荐标签 -->
                    <div v-if="pkg.id === 6" class="recommend-tag">推荐</div>

                    <!-- 套餐内容 -->
                    <div class="package-content">
                        <div class="package-icon">
                            <span class="icon-emoji">{{ pkg.icon }}</span>
                        </div>
                        <div class="package-info">
                            <div class="package-name">{{ pkg.name }}</div>
                            <div class="package-desc">{{ pkg.description }}</div>
                        </div>
                        <div class="package-price">{{ pkg.price }}元</div>
                    </div>

                </div>
            </div>

            <!-- 底部购买区域 -->
            <div class="purchase-section">
                <div class="price-info">
                    <span class="price-label">体验VIP</span>
                    <span class="price-value">{{ selectedPackage.price }}.00元</span>
                </div>
                <button class="purchase-btn" @click="purchaseVip">
                    立即购买
                </button>
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
    padding: 80px 16px 100px;
}

/* 会员信息展示 */
.member-info-section {
    background: #222;
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

/* VIP套餐列表 */
.vip-packages-list {
    margin-bottom: 24px;
}

.vip-package-item {
    background-color: #222;
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    border: 2px solid transparent;
}

.vip-package-item.selected {
    border-color: #ff9500;
    background-color: #2a1f0a;
}

.vip-package-item:hover {
    background-color: #2a2a2a;
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
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    margin-bottom: 4px;
}

.package-desc {
    font-size: 12px;
    color: #999;
}

.package-price {
    font-size: 18px;
    font-weight: bold;
    color: #ff9500;
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

/* 响应式设计 */
@media (max-width: 375px) {
    .vip-container {
        padding: 70px 12px 100px;
    }

    .member-info-section {
        padding: 16px;
    }

    .vip-package-item {
        padding: 12px;
    }

    .purchase-section {
        padding: 12px;
    }
}
</style>
