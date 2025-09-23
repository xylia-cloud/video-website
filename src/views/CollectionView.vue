<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUserLogList } from '@/api/fetch-api';
import { BASE_URL } from '@/utils/config';
import { Icon as VanIcon, showToast, showLoadingToast, closeToast } from 'vant';
import HeaderNav from '@/components/HeaderNav.vue';

const router = useRouter();
const isLoading = ref(false);
const isEmpty = ref(false);

// 定义视频数据接口
interface VideoItem {
    id: number;
    title: string;
    coverUrl: string;
    time?: string;
    isVip?: boolean;
    isLimited?: boolean;
}

// 收藏数据
const collectionData = ref<VideoItem[]>([]);

// 获取收藏数据
const fetchCollectionData = async () => {
    isLoading.value = true;
    isEmpty.value = false;
    collectionData.value = [];

    try {
        showLoadingToast({
            message: '加载中...',
            forbidClick: true,
        });

        console.log('开始获取收藏数据');

        // type: 2 表示收藏
        const result = await fetchUserLogList({ type: 2 });
        console.log('获取收藏数据结果:', result);

        if (result && result.code === 1 && result.list && result.list.length > 0) {
            // 转换API返回的数据为我们需要的格式
            collectionData.value = result.list.map((item: any) => {
                // 视频信息在item.data中
                const videoData = item.data || {};
                return {
                    id: videoData.id || item.ulog_rid,
                    title: videoData.name || '',
                    coverUrl: getCoverUrl(videoData.pic),
                    time: formatTime(item.ulog_time),
                    isVip: false, // 暂时设为false，因为API没有返回这个信息
                    isLimited: false // 暂时设为false，因为API没有返回这个信息
                };
            });

            isEmpty.value = false;
        } else if (result && result.code === 1002) {
            // 未登录
            console.log('用户未登录，跳转到登录页面');
            showToast('请先登录再查看收藏');
            setTimeout(() => {
                router.push({
                    path: '/login',
                    query: { redirect: '/collection' } // 登录后返回收藏页
                });
            }, 1500);
        } else {
            console.log('收藏数据为空或请求失败');
            isEmpty.value = true;
        }
    } catch (error: any) {
        console.error('获取收藏数据失败:', error);
        showToast(error?.message || '获取数据失败，请稍后再试');
        isEmpty.value = true;

        // 如果是认证问题，跳转到登录页
        if (error?.message?.includes('401') || error?.message?.includes('认证')) {
            setTimeout(() => {
                router.push({
                    path: '/login',
                    query: { redirect: '/collection' }
                });
            }, 1500);
        }
    } finally {
        isLoading.value = false;
        closeToast();
    }
};

// 处理封面图片URL
const getCoverUrl = (url?: string) => {
    if (!url) return '';

    if (url.startsWith('http')) {
        return url;
    } else if (url.startsWith('/')) {
        return `${BASE_URL}${url}`;
    } else {
        // 直接返回完整路径
        return `${BASE_URL}/${url}`;
    }
};

// 格式化时间戳
const formatTime = (timestamp: number) => {
    if (!timestamp) return '';

    const date = new Date(timestamp * 1000); // 转换为毫秒
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 计算时间差
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        // 超过7天显示具体日期
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
    }
};

// 跳转到视频详情页
const goToDetail = (id: number) => {
    router.push(`/video/${id}`);
};

// 监听组件挂载
onMounted(() => {
    fetchCollectionData();
});
</script>

<template>
    <div class="collection-page">
        <!-- 头部导航 -->
        <HeaderNav title="我的收藏" />

        <!-- 内容列表 -->
        <div class="content-list" v-if="!isEmpty">
            <div class="list-item" v-for="item in collectionData" :key="item.id" @click="goToDetail(item.id)">
                <div class="item-image">
                    <img :src="item.coverUrl" :alt="item.title"
                        @error="($event.target as HTMLImageElement).src = '/src/assets/img/img-avatar-default.png'" />
                    <div class="item-badge vip" v-if="item.isVip">VIP</div>
                    <div class="item-badge limited" v-if="item.isLimited">限免</div>
                </div>
                <div class="item-info">
                    <div class="item-title">{{ item.title }}</div>
                    <div class="item-meta">
                        <div class="item-time" v-if="item.time">{{ item.time }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-if="isEmpty" class="empty-state">
            <van-icon name="star-o" size="48" color="#666" />
            <p class="empty-text">暂无收藏记录</p>
        </div>
    </div>
</template>

<style scoped>
.collection-page {
    background-color: #111;
    color: #fff;
    min-height: 100vh;
}

/* 内容列表样式 */
.content-list {
    padding: 70px 15px 10px 15px;
}

.list-item {
    display: flex;
    margin-bottom: 15px;
    background-color: #222;
    border-radius: 10px;
    overflow: hidden;
    padding: 16px;
    cursor: pointer;
}

.item-image {
    position: relative;
    width: 120px;
    height: 90px;
    flex-shrink: 0;
}

.item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
}

.item-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.item-badge.vip {
    background-color: #ff9500;
    color: #fff;
}

.item-badge.limited {
    background: linear-gradient(90deg, #FC00FF 0%, #00DBDE 100%);
    color: #fff;
}

.item-info {
    flex: 1;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.item-title {
    font-size: 16px;
    font-weight: bold;
    line-height: 1.3;
    margin-bottom: auto;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-meta {
    display: flex;
    flex-direction: column;
    margin-top: 10px;
}

.item-time {
    color: #999;
    font-size: 14px;
}

/* 空状态样式 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 160px;
}

.empty-text {
    margin-top: 20px;
    color: #666;
    font-size: 16px;
}
</style>