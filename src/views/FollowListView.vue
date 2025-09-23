<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import { fetchFollowsList, getUserInfo, isLoggedIn, type FollowItem } from '@/api/fetch-api'

const router = useRouter()

// 响应式数据
const followList = ref<FollowItem[]>([])
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const currentPage = ref(1)
const hasMore = ref(true)
const isLoadingMore = ref(false)

// 获取关注列表数据
const fetchFollowsData = async (page = 1, loadMore = false) => {
    // 检查登录状态
    if (!isLoggedIn()) {
        showToast('请先登录')
        router.push('/login')
        return
    }

    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.user_id) {
        showToast('用户信息异常，请重新登录')
        router.push('/login')
        return
    }

    if (loadMore) {
        isLoadingMore.value = true
    } else {
        isLoading.value = true
        hasError.value = false
        errorMessage.value = ''
    }

    try {
        const result = await fetchFollowsList({
            uid: userInfo.user_id.toString(),
            touid: userInfo.user_id.toString(), // 获取自己的关注列表
            p: page
        })

        console.log('关注列表数据:', result)

        if (result && result.code === 1) {
            if (loadMore && page > 1) {
                // 加载更多，追加数据
                followList.value = [...followList.value, ...result.info]
            } else {
                // 首次加载，替换数据
                followList.value = result.info
            }

            // 检查是否还有更多数据
            hasMore.value = result.info.length >= 10 // 假设每页10条数据
            currentPage.value = page
        } else {
            hasError.value = true
            errorMessage.value = result?.msg || '获取关注列表失败'
            if (!loadMore) {
                followList.value = []
            }
        }
    } catch (error: any) {
        console.error('获取关注列表失败:', error)
        hasError.value = true
        errorMessage.value = error.message || '网络请求失败'
        if (!loadMore) {
            followList.value = []
        }
    } finally {
        isLoading.value = false
        isLoadingMore.value = false
    }
}

// 加载更多数据
const loadMore = () => {
    if (!hasMore.value || isLoadingMore.value) return
    fetchFollowsData(currentPage.value + 1, true)
}

// 处理关注/取消关注操作
const handleFollowToggle = async (item: FollowItem) => {
    showLoadingToast('操作中...')

    try {
        // 这里应该调用关注/取消关注的API
        // 暂时模拟操作成功
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 切换关注状态
        item.isattent = item.isattent === '1' ? '0' : '1'

        closeToast()
        showToast(item.isattent === '1' ? '关注成功' : '取消关注成功')
    } catch (error) {
        closeToast()
        showToast('操作失败，请稍后再试')
    }
}

// 组件挂载时获取数据
onMounted(() => {
    fetchFollowsData()
})
</script>

<template>
    <div class="follow-list-page">
        <!-- 头部导航 -->
        <HeaderNav title="我的关注" />

        <!-- 主要内容 -->
        <div class="follow-container">
            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-state">
                <van-loading type="spinner" color="#ff9500" />
                <div class="loading-text">加载中...</div>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="hasError" class="error-state">
                <van-icon name="warning-o" size="24" color="#ff9500" />
                <div class="error-text">{{ errorMessage }}</div>
                <van-button type="primary" size="small" @click="fetchFollowsData()" class="retry-btn">
                    重试
                </van-button>
            </div>

            <!-- 空状态 -->
            <div v-else-if="followList.length === 0" class="empty-state">
                <van-icon name="friends-o" size="48" color="#999" />
                <div class="empty-text">暂无关注的用户</div>
                <div class="empty-tip">去发现更多有趣的人吧~</div>
            </div>

            <!-- 关注列表 -->
            <div v-else class="follow-list">
                <div v-for="item in followList" :key="`${item.uid}-${item.touid}`" class="follow-item">
                    <div class="user-info">
                        <div class="user-avatar">
                            <img :src="item.user_portrait || '/src/assets/img/img-avatar-default.png'"
                                :alt="item.user_nick_name || item.user_name"
                                @error="($event.target as HTMLImageElement).src = '/src/assets/img/img-avatar-default.png'" />
                        </div>
                        <div class="user-details">
                            <div class="user-name">{{ item.user_nick_name || item.user_name || '用户' }}</div>
                            <div class="user-id">ID: {{ item.touid }}</div>
                        </div>
                    </div>
                    <div class="follow-action">
                        <van-button :type="item.isattent === '1' ? 'default' : 'primary'" size="small"
                            @click="handleFollowToggle(item)" class="follow-btn">
                            {{ item.isattent === '1' ? '已关注' : '关注' }}
                        </van-button>
                    </div>
                </div>

                <!-- 加载更多 -->
                <div v-if="isLoadingMore" class="loading-more">
                    <van-loading type="spinner" size="20" color="#ff9500" />
                    <span>加载更多...</span>
                </div>

                <!-- 已全部加载 -->
                <div v-else-if="!hasMore && followList.length > 0" class="all-loaded">
                    已经到底了~
                </div>

                <!-- 加载更多按钮 -->
                <div v-else-if="hasMore" class="load-more-btn" @click="loadMore">
                    <van-button type="primary" size="large" block>加载更多</van-button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.follow-list-page {
    background-color: #111;
    color: #fff;
    min-height: 100vh;
}

.follow-container {
    padding: 60px 16px 20px;
}

/* 加载状态 */
.loading-state,
.error-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
}

.loading-text,
.error-text,
.empty-text {
    margin-top: 10px;
    color: #999;
    font-size: 14px;
}

.empty-tip {
    margin-top: 8px;
    color: #666;
    font-size: 12px;
}

.retry-btn {
    margin-top: 15px;
    background-color: #ff9500 !important;
    border-color: #ff9500 !important;
}

/* 关注列表 */
.follow-list {
    padding-bottom: 20px;
}

.follow-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    background-color: #222;
    border-radius: 8px;
    margin-bottom: 10px;
    transition: background-color 0.3s ease;
}

.follow-item:hover {
    background-color: #2a2a2a;
}

.user-info {
    display: flex;
    align-items: center;
    flex: 1;
}

.user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 12px;
    flex-shrink: 0;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-details {
    flex: 1;
    min-width: 0;
}

.user-name {
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.user-id {
    font-size: 12px;
    color: #999;
}

.follow-action {
    flex-shrink: 0;
    margin-left: 12px;
}

.follow-btn {
    min-width: 70px;
    border-radius: 20px;
}

/* 加载更多状态 */
.loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    color: #999;
    font-size: 14px;
    gap: 8px;
}

.all-loaded {
    text-align: center;
    padding: 20px 0;
    color: #999;
    font-size: 14px;
}

.load-more-btn {
    padding: 20px 0;
}

.load-more-btn .van-button {
    background-color: #ff9500;
    border-color: #ff9500;
}

/* 响应式设计 */
@media (max-width: 375px) {
    .follow-container {
        padding: 60px 12px 20px;
    }

    .follow-item {
        padding: 12px;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        margin-right: 10px;
    }

    .user-name {
        font-size: 15px;
    }
}
</style>
