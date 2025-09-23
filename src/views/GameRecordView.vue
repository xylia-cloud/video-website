<template>
    <div class="game-record-page">
        <!-- 头部导航 -->
        <div class="header-nav">
            <div class="nav-left" @click="goBack">
                <svg class="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </div>
            <div class="nav-title">游戏记录</div>
            <div class="nav-right"></div>
        </div>

        <!-- 游戏记录列表 -->
        <div class="record-content">
            <!-- 加载状态 -->
            <div v-if="loading && records.length === 0" class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">加载中...</div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!loading && records.length === 0" class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                        <path d="m9 9 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="m15 9-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </div>
                <div class="empty-text">暂无游戏记录</div>
            </div>

            <!-- 记录列表 -->
            <div v-else class="record-list">
                <div v-for="record in records" :key="record.aioid" class="record-item">
                    <!-- 游戏信息 -->
                    <div class="record-header">
                        <div class="game-info">
                            <div class="game-name">{{ record.game_name }}</div>
                            <div class="game-id">游戏ID: {{ record.gameid }}</div>
                        </div>
                        <div class="record-status" :class="getStatusClass(record.status)">
                            {{ record.status }}
                        </div>
                    </div>

                    <!-- 订单信息 -->
                    <div class="record-details">
                        <div class="detail-row">
                            <span class="detail-label">订单号:</span>
                            <span class="detail-value">{{ record.ref_no }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">时间:</span>
                            <span class="detail-value">{{ record.start_time }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">输赢:</span>
                            <span class="detail-value payout" :class="getPayoutClass(record.payout)">
                                {{ formatPayout(record.payout) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 分页加载更多 -->
            <div v-if="hasMore && !loading" class="load-more">
                <button @click="loadMore" class="load-more-btn">
                    加载更多
                </button>
            </div>

            <!-- 底部加载状态 -->
            <div v-if="loading && records.length > 0" class="bottom-loading">
                <div class="loading-spinner small"></div>
                <span>加载中...</span>
            </div>

            <!-- 没有更多数据 -->
            <div v-if="!hasMore && records.length > 0" class="no-more">
                没有更多记录了
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { fetchGameRecord, type GameRecord } from '@/api/fetch-api'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const records = ref<GameRecord[]>([])
const currentPage = ref(1)
const total = ref(0)
const hasMore = ref(true)

// 返回上一页
const goBack = () => {
    router.back()
}

// 获取游戏记录
const loadGameRecords = async (page: number = 1, append: boolean = false) => {
    if (loading.value) return

    try {
        loading.value = true

        const response = await fetchGameRecord({ p: page })

        if (response.code === 1) {
            const newRecords = response.data.list || []

            if (append) {
                records.value = [...records.value, ...newRecords]
            } else {
                records.value = newRecords
            }

            total.value = response.data.total || 0

            // 判断是否还有更多数据
            hasMore.value = records.value.length < total.value

            currentPage.value = page
        } else {
            showToast(response.msg || '获取游戏记录失败')
        }
    } catch (error) {
        console.error('获取游戏记录失败:', error)
        showToast('获取游戏记录失败，请重试')
    } finally {
        loading.value = false
    }
}

// 加载更多
const loadMore = () => {
    if (hasMore.value && !loading.value) {
        loadGameRecords(currentPage.value + 1, true)
    }
}

// 获取状态样式类
const getStatusClass = (status: string) => {
    switch (status) {
        case '有效':
            return 'status-valid'
        case '无效':
            return 'status-invalid'
        default:
            return 'status-default'
    }
}

// 获取输赢样式类
const getPayoutClass = (payout: string) => {
    const amount = parseFloat(payout)
    if (amount > 0) {
        return 'payout-win'
    } else if (amount < 0) {
        return 'payout-loss'
    } else {
        return 'payout-zero'
    }
}

// 格式化输赢金额
const formatPayout = (payout: string) => {
    const amount = parseFloat(payout)
    if (amount > 0) {
        return `+${amount}`
    } else if (amount < 0) {
        return `${amount}`
    } else {
        return '0'
    }
}

// 组件挂载时加载数据
onMounted(() => {
    loadGameRecords()
})
</script>

<style scoped>
.game-record-page {
    background-color: #111;
    color: #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* 头部导航 */
.header-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-left {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.3s;
}

.nav-left:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.back-icon {
    width: 24px;
    height: 24px;
    color: #fff;
}

.nav-title {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
}

.nav-right {
    width: 40px;
}

/* 内容区域 */
.record-content {
    flex: 1;
    padding: 0 16px 20px;
}

/* 加载状态 */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top: 3px solid #ff6b6b;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

.loading-spinner.small {
    width: 20px;
    height: 20px;
    border-width: 2px;
    margin-bottom: 0;
    margin-right: 8px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-text {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
}

/* 空状态 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
}

.empty-icon {
    width: 60px;
    height: 60px;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 16px;
}

.empty-icon svg {
    width: 100%;
    height: 100%;
}

.empty-text {
    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
}

/* 记录列表 */
.record-list {
    padding-top: 20px;
}

.record-item {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.record-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* 记录头部 */
.record-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.game-info {
    flex: 1;
}

.game-name {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
}

.game-id {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
}

.record-status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

.status-valid {
    background-color: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-invalid {
    background-color: rgba(244, 67, 54, 0.2);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
}

.status-default {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 记录详情 */
.record-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    min-width: 60px;
}

.detail-value {
    font-size: 14px;
    color: #fff;
    text-align: right;
    flex: 1;
}

.payout {
    font-weight: 600;
    font-size: 15px;
}

.payout-win {
    color: #4caf50;
}

.payout-loss {
    color: #f44336;
}

.payout-zero {
    color: rgba(255, 255, 255, 0.7);
}

/* 加载更多 */
.load-more {
    display: flex;
    justify-content: center;
    padding: 10px 0;
}

.load-more-btn {
    background: linear-gradient(90deg, #ff9500, #ff6d00);
    color: #fff;
    border: none;
    border-radius: 25px;
    padding: 12px 32px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.load-more-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.load-more-btn:active {
    transform: translateY(0);
}

/* 底部加载 */
.bottom-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
}

/* 没有更多 */
.no-more {
    text-align: center;
    padding: 20px 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-nav {
        padding: 10px 12px;
    }

    .nav-title {
        font-size: 16px;
    }

    .record-content {
        padding: 0 12px 20px;
    }

    .record-item {
        padding: 12px;
    }

    .game-name {
        font-size: 15px;
    }

    .record-header {
        align-items: flex-start;
        gap: 8px;
    }


    .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }

    .detail-value {
        text-align: left;
    }
}

@media (max-width: 480px) {
    .record-list {
        padding-top: 12px;
    }

    .record-item {
        margin-bottom: 12px;
        padding: 10px;
    }

    .detail-label {
        font-size: 13px;
        min-width: auto;
    }

    .detail-value {
        font-size: 13px;
    }

    .payout {
        font-size: 14px;
    }
}
</style>
