<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUserLogList, updateUserLog, checkApiAuthError } from '@/api/fetch-api';
import { BASE_URL } from '@/utils/config';
import { Icon as VanIcon, showToast, showLoadingToast, closeToast } from 'vant';

const router = useRouter();
const activeTab = ref('watched'); // 默认选中"看过"标签
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

// 足迹数据
const footprintData = ref<VideoItem[]>([]);

const isLoginRequiredResult = (result: any): boolean => {
  if (!result) return false;
  if (checkApiAuthError(result)) return true;
  if (result.code === 1002) return true;
  const msg = String(result.msg || result.message || '');
  return msg.includes('请先登录') || msg.includes('重新登录');
};

// 获取足迹数据
const fetchFootprintData = async (type: string) => {
  isLoading.value = true;
  isEmpty.value = false;
  footprintData.value = [];
  
  try {
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    });
    
    // 根据标签类型设置请求参数
    let typeParam = 1; // 默认浏览历史
    
    switch (type) {
      case 'watched':
        typeParam = 1; // 浏览历史
        break;
      case 'liked':
        typeParam = 6; // 赞过
        break;
      case 'collected':
        typeParam = 2; // 收藏
        break;
    }
    
    console.log(`开始获取足迹数据，类型: ${type}, 参数: ${typeParam}`);
    
    const result = await fetchUserLogList({ type: typeParam });
    console.log('获取足迹数据结果:', result);
    
    if (result && result.code === 1 && result.list && result.list.length > 0) {
      // 转换API返回的数据为我们需要的格式
      footprintData.value = result.list.map((item: any) => {
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
    } else if (isLoginRequiredResult(result)) {
      // 未登录
      console.log('用户未登录，跳转到登录页面');
      showToast('请先登录再查看足迹');
      setTimeout(() => {
        router.push({
          path: '/login',
          query: { redirect: '/footprint' } // 登录后返回足迹页
        });
      }, 1500);
    } else {
      console.log('足迹数据为空或请求失败');
      isEmpty.value = true;
    }
  } catch (error: any) {
    console.error('获取足迹数据失败:', error);
    showToast(error?.message || '获取数据失败，请稍后再试');
    isEmpty.value = true;
    
    // 如果是认证问题，跳转到登录页
    if (error?.message?.includes('401') || error?.message?.includes('认证')) {
      setTimeout(() => {
        router.push({
          path: '/login',
          query: { redirect: '/footprint' }
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

// 切换标签
const switchTab = (tab: string) => {
  activeTab.value = tab;
  fetchFootprintData(tab);
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 跳转到视频详情页
const goToDetail = (id: number) => {
  router.push(`/video/${id}`);
};

// 监听组件挂载
onMounted(() => {
  // 初始加载看过的视频
  fetchFootprintData(activeTab.value);
});
</script>

<template>
  <div class="footprint-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="24" color="#fff" />
      </div>
      <div class="title">我的足迹</div>
      <div class="placeholder"></div>
    </div>

    <!-- 标签页导航 -->
    <div class="tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'watched' }" 
        @click="switchTab('watched')"
      >
        看过
        <div class="tab-indicator" v-if="activeTab === 'watched'"></div>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'liked' }" 
        @click="switchTab('liked')"
      >
        赞过
        <div class="tab-indicator" v-if="activeTab === 'liked'"></div>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'collected' }" 
        @click="switchTab('collected')"
      >
        收藏
        <div class="tab-indicator" v-if="activeTab === 'collected'"></div>
      </div>
    </div>

    <!-- 内容列表 -->
    <div class="content-list" v-if="!isEmpty">
      <div 
        class="list-item" 
        v-for="item in footprintData" 
        :key="item.id"
        @click="goToDetail(item.id)"
      >
        <div class="item-image">
          <img :src="item.coverUrl" alt="封面图片">
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
      <van-icon name="todo-list-o" size="48" color="#666" />
      <p class="empty-text">暂无{{ activeTab === 'watched' ? '观看' : activeTab === 'liked' ? '点赞' : '收藏' }}记录</p>
    </div>
  </div>
</template>

<style scoped>
.footprint-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
}

/* 顶部导航栏样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #111;
}

.back-button {
  width: 24px;
  height: 24px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.placeholder {
  width: 24px;
  height: 24px;
}

/* 标签页导航样式 */
.tabs {
  display: flex;
  justify-content: space-evenly;
  border-bottom: 1px solid #222;
  background-color: #111;
}

.tab-item {
  position: relative;
  flex: 1;
  text-align: center;
  padding: 15px 0;
  font-size: 16px;
  color: #999;
  cursor: pointer;
}

.tab-item.active {
  color: #fff;
  font-weight: bold;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background-color: #ff9500;
  border-radius: 3px 3px 0 0;
}

/* 内容列表样式 */
.content-list {
  padding: 10px 15px;
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
  padding: 12px;
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

.free-tag {
  display: inline-block;
  background-color: #ff9500;
  color: #fff;
  padding: 3px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  width: fit-content;
}

.item-author, .item-time {
  color: #999;
  font-size: 14px;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
}

.empty-text {
  margin-top: 20px;
  color: #666;
  font-size: 16px;
}
</style> 
