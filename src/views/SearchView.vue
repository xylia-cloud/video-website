<script setup lang="ts">
import { ref, onMounted, watchEffect, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VideoList from '@/components/VideoList.vue';
import { searchVideos } from '@/api/video';
import { fetchSearchVideos } from '@/api/fetch-api';
import { DEFAULT_PAGE_SIZE, BASE_URL } from '@/utils/config';
// 导入Vant组件
import { Icon, Loading } from 'vant';

// 定义视频数据接口
interface VideoItem {
  id: number;
  coverUrl: string;
  title: string;
  isVip?: boolean;
  isFree?: boolean;
  duration?: string;  // 视频时长
  class?: string;     // 视频分类
  time?: string;      // 发布时间
  points?: string;    // 积分信息
}

// 定义API返回的视频数据接口
interface ApiVideoItem {
  id?: number;
  vod_id?: number;
  vod_pic?: string;
  vod_pic_thumb?: string;
  coverUrl?: string;
  vod_name?: string;
  title?: string;
  name?: string;
  pic?: string;
  en?: string;
  vod_class?: string;
  vod_duration?: string;
  vod_time?: string;
  vod_time_add?: string;
  vod_copyright?: string | number;
  vod_pubdate?: string;
  vod_points_play?: number | string; // 添加积分字段
}

// 路由和导航
const route = useRoute();
const router = useRouter();

// 搜索相关
const searchKeyword = ref('');
const lastSearchKeyword = ref(''); // 记录上一次搜索的关键词
const searchResults = ref<VideoItem[]>([]);
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref<string>('');
const useFetch = true; // 是否使用原生fetch还是axios

// 分页相关
const currentPage = ref(1);
const totalPages = ref(1);
const totalResults = ref(0); // 添加总结果数量
const hasMoreData = ref(true);
const isLoadingMore = ref(false);

// 处理封面图片URL
const getCoverUrl = (url?: string) => {
  if (!url) return '';
  
  if (url.startsWith('http')) {
    return url;
  } else if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  } else {
    return `${BASE_URL}/${url}`;
  }
};

// 处理视频数据的函数 - 使用与其他页面一致的逻辑
const processVideoData = (item: ApiVideoItem): VideoItem => {
  // 处理封面图片URL
  const coverUrl = getCoverUrl(item.vod_pic || item.pic || item.coverUrl);
  
  // 根据vod_points_play字段判断是否收费
  const pointsPlay = item.vod_points_play !== undefined ? Number(item.vod_points_play) : 0;
  const isVip = pointsPlay > 0;
  const isFree = pointsPlay === 0;
  
  return {
    id: item.id || item.vod_id || 0,
    coverUrl: coverUrl,
    title: item.vod_name || item.name || item.title || '',
    isVip: isVip,
    isFree: isFree,
    duration: item.vod_duration || '',
    class: item.vod_class || '',
    time: item.vod_pubdate || item.vod_time || item.vod_time_add || '',
    points: isVip ? pointsPlay + '积分' : ''
  };
};

// 执行搜索
const performSearch = async (keyword: string, page: number = 1, loadMore: boolean = false) => {
  if (!keyword.trim()) {
    return;
  }

  // 如果是新搜索（不是加载更多），检查关键词是否与上次相同
  if (!loadMore && keyword.trim() === lastSearchKeyword.value && page === 1) {
    return;
  }

  // 设置加载状态
  if (loadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
    hasError.value = false;
    errorMessage.value = '';
    // 重置分页状态
    currentPage.value = 1;
    totalResults.value = 0;
    hasMoreData.value = true;
    searchResults.value = [];
  }

  searchKeyword.value = keyword.trim();
  if (!loadMore) {
    lastSearchKeyword.value = searchKeyword.value; // 记录本次搜索关键词
  }
  
  try {
    // 构建请求参数
    const params = {
      mid: 1,
      wd: searchKeyword.value,
      limit: DEFAULT_PAGE_SIZE,
      page: page
    };
    
    console.log('搜索请求参数:', params);
    console.log('performSearch调用 - 是否加载更多:', loadMore, '请求页码:', page, '当前页码:', currentPage.value);
    
    // 选择使用哪种请求方法
    const result = useFetch 
      ? await fetchSearchVideos(params) 
      : await searchVideos(params);
      
    console.log('搜索返回数据:', result);
    
    // 处理API返回的数据
    let apiData: ApiVideoItem[] = [];
    
    // 适应不同的数据结构
    if (result.list) {
      apiData = result.list;
    } else if (result.data && result.data.list) {
      apiData = result.data.list;
    } else if (result.data) {
      apiData = Array.isArray(result.data) ? result.data : [];
    }
    
    // 更新分页信息
    if (result.pagecount) {
      totalPages.value = result.pagecount;
    }
    
    // 更新总结果数量（只在首次搜索或API返回时更新）
    if (result.total !== undefined) {
      totalResults.value = result.total;
      console.log('从result.total获取总数:', result.total);
    } else if (result.data && result.data.total !== undefined) {
      totalResults.value = result.data.total;
      console.log('从result.data.total获取总数:', result.data.total);
    } else if (!loadMore && result.list && result.list.length > 0) {
      // 如果API没有返回total字段，在首次搜索时估算
      totalResults.value = result.list.length * totalPages.value;
      console.log('估算总数:', totalResults.value, '(每页', result.list.length, '×', totalPages.value, '页)');
    } else {
      console.log('无法获取或估算总数，API返回结构:', {
        hasTotal: 'total' in result,
        hasDataTotal: result.data && 'total' in result.data,
        listLength: result.list ? result.list.length : 0,
        isLoadMore: loadMore
      });
    }
    
    // 映射字段
    const processedVideos = apiData.map(processVideoData);
    console.log('处理后的搜索结果:', processedVideos);
    
    if (loadMore) {
      // 加载更多模式：追加数据
      searchResults.value = [...searchResults.value, ...processedVideos];
      // 只有成功获取到数据时才更新当前页码
      if (processedVideos.length > 0) {
        console.log('加载更多成功，更新页码从', currentPage.value, '到', page);
        currentPage.value = page; // 使用传入的page参数，而不是递增
      }
    } else {
      // 首次搜索：替换数据
      searchResults.value = processedVideos;
      console.log('首次搜索，重置页码为1');
      currentPage.value = 1; // 首次搜索重置为第1页
    }
    
    // 检查是否还有更多数据
    hasMoreData.value = currentPage.value < totalPages.value;
    console.log('分页状态更新 - 当前页:', currentPage.value, '总页数:', totalPages.value, '是否有更多:', hasMoreData.value);
    
  } catch (error: any) {
    console.error('搜索失败:', error);
    hasError.value = true;
    hasMoreData.value = false;
    
    if (error.message) {
      console.error('错误详情:', error.message);
      errorMessage.value = error.message;
    }
    if (error.response) {
      console.error('服务器返回状态:', error.response.status);
      console.error('服务器返回数据:', error.response.data);
    }
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

// 滚动到底部检测
const checkScrollBottom = () => {
  // 获取滚动位置
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  // 获取视口高度
  const windowHeight = window.innerHeight;
  // 获取文档总高度
  const documentHeight = document.documentElement.scrollHeight;

  // 当距离底部不足100px时，加载更多
  if (documentHeight - (scrollTop + windowHeight) < 100) {
    loadMoreResults();
  }
};

// 加载更多搜索结果
const loadMoreResults = () => {
  // 防止重复加载或没有更多数据时加载
  if (isLoadingMore.value || !hasMoreData.value || !searchKeyword.value) {
    return;
  }
  
  const nextPage = currentPage.value + 1;
  console.log('加载更多搜索结果，当前页码:', currentPage.value, '下一页:', nextPage);
  performSearch(searchKeyword.value, nextPage, true);
};

// 返回首页
const goBack = () => {
  router.push('/');
};

// 监听路由参数变化，自动执行搜索
watchEffect(() => {
  const keyword = route.query.wd as string;
  if (keyword && keyword !== lastSearchKeyword.value) {
    performSearch(keyword);
  }
});

// 组件挂载时获取数据
onMounted(() => {
  const keyword = route.query.wd as string;
  if (keyword) {
    performSearch(keyword);
  }
  
  // 添加滚动事件监听
  window.addEventListener('scroll', checkScrollBottom);
});

// 组件卸载前移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('scroll', checkScrollBottom);
});
</script>

<template>
  <div class="search-page">
    <!-- 固定的顶部区域 -->
    <div class="fixed-header">
      <!-- 顶部搜索栏 -->
      <div class="search-header">
        <div class="back-button" @click="goBack">
          <Icon name="arrow-left" />
        </div>
        <div class="search-title">搜索: {{ searchKeyword }}</div>
      </div>

      <!-- 视频区域标题 -->
      <div class="section-header">
        <div class="section-title">搜索结果</div>
        <div v-if="totalResults > 0" class="result-count">共找到 {{ totalResults }} 个结果</div>
      </div>
    </div>

    <!-- 可滚动的内容区域 -->
    <div class="scrollable-content">
      <!-- 加载中状态 -->
      <div v-if="isLoading" class="loading-state">
        <Loading type="spinner" color="#ff9500" />
        <div class="loading-text">搜索中...</div>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="hasError && searchResults.length === 0" class="error-state">
        <Icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">搜索失败，请稍后再试</div>
        <div v-if="errorMessage" class="error-detail">{{ errorMessage }}</div>
      </div>
      
      <!-- 空结果状态 -->
      <div v-else-if="searchResults.length === 0 && !isLoading" class="empty-state">
        <Icon name="search" size="24" color="#999" />
        <div class="empty-text">没有找到相关视频</div>
      </div>
      
      <!-- 视频列表 -->
      <div v-else class="video-list-container">
        <VideoList :videos="searchResults" return-path="/search" />
      </div>
      
      <!-- 加载更多指示器 -->
      <div v-if="isLoadingMore" class="loading-more">
        <Loading type="spinner" color="#ff9500" size="24px" />
        <span>正在加载更多...</span>
      </div>
      
      <!-- 没有更多数据提示 -->
      <div v-if="!hasMoreData && searchResults.length > 0" class="no-more-data">
        已经到底了~
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 固定的顶部区域 */
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #111;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 搜索头部 */
.search-header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #222;
  border-bottom: 1px solid #333;
}

.back-button {
  padding: 5px;
  margin-right: 15px;
  color: #999;
  cursor: pointer;
}

.search-title {
  font-size: 16px;
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 视频区域标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #111;
}

/* 可滚动的内容区域 */
.scrollable-content {
  flex: 1;
  padding-top: 100px; /* 为固定头部留出空间 */
  padding-bottom: 60px; /* 为底部导航留出空间 */
  padding-left: 15px;
  padding-right: 15px;
  min-height: calc(100vh - 160px); /* 确保有足够的滚动空间 */
}

/* 视频列表容器 */
.video-list-container {
  padding-top: 15px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
}

.result-count {
  font-size: 12px;
  color: #999;
}

/* 加载状态 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-text,
.error-text,
.empty-text {
  margin-top: 10px;
  color: #999;
  font-size: 14px;
}

.error-detail {
  font-size: 12px;
  color: #ff6b6b;
  margin-top: 8px;
  text-align: center;
  max-width: 90%;
  word-break: break-word;
}

/* 加载更多指示器 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 15px auto;
  padding: 10px 0;
  color: #999;
  font-size: 14px;
}

.loading-more span {
  margin-left: 10px;
}

/* 没有更多数据提示 */
.no-more-data {
  text-align: center;
  color: #999;
  padding: 15px 0;
  font-size: 14px;
  border-top: 1px dashed #333;
  margin-top: 10px;
}
</style> 