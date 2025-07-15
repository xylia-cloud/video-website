<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Icon, Loading } from 'vant';
import { useRouter } from 'vue-router';
import { fetchPointsDetails } from '@/api/fetch-api';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};

// 积分明细数据接口
interface PointsRecord {
  plog_id: number;
  user_id: number;
  user_id_1: number;
  plog_type: number;
  plog_points: number;
  plog_time: number;
  plog_remarks: string;
  plog_type_cn: string;
  plog_is_inc: number;
}

// 积分明细数据
const pointsRecords = ref<PointsRecord[]>([]);
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref('');
const currentPage = ref(1);
const hasMoreData = ref(true);
const isLoadingMore = ref(false);

// 格式化时间戳
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取积分明细数据
const fetchPointsData = async (loadMore = false) => {
  try {
    if (loadMore) {
      isLoadingMore.value = true;
    } else {
      isLoading.value = true;
      hasError.value = false;
      errorMessage.value = '';
      currentPage.value = 1;
      pointsRecords.value = [];
    }

    const params = {
      limit: 20,
      page: currentPage.value
    };

    console.log('请求积分明细，参数:', params);
    const result = await fetchPointsDetails(params);
    console.log('积分明细接口返回:', result);

    if (result && result.code === 1) {
      let newRecords: PointsRecord[] = [];
      
      // 处理不同的数据结构
      if (result.data && Array.isArray(result.data.data)) {
        newRecords = result.data.data;
      } else if (result.data && Array.isArray(result.data)) {
        newRecords = result.data;
      } else if (Array.isArray(result.data)) {
        newRecords = result.data;
      }

      console.log('处理后的记录数据:', newRecords);

      // 过滤出消费的积分（plog_is_inc: 0）
      const consumeRecords = newRecords.filter(record => record.plog_is_inc === 0);
      console.log('过滤后的消费记录:', consumeRecords);

      if (loadMore) {
        pointsRecords.value = [...pointsRecords.value, ...consumeRecords];
      } else {
        pointsRecords.value = consumeRecords;
      }

      // 更新分页信息
      if (result.data && result.data.current_page !== undefined) {
        currentPage.value = result.data.current_page;
      }
      
      // 检查是否还有更多数据
      if (result.data && result.data.last_page !== undefined) {
        hasMoreData.value = currentPage.value < result.data.last_page;
      } else {
        // 如果没有分页信息，基于返回的数据量判断
        hasMoreData.value = consumeRecords.length >= 20;
      }

      // 为下次加载准备
      currentPage.value += 1;
    } else {
      hasError.value = true;
      errorMessage.value = result?.msg || '获取积分明细失败';
    }
  } catch (error: any) {
    console.error('获取积分明细失败:', error);
    hasError.value = true;
    errorMessage.value = error.message || '网络请求失败';
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

// 滚动加载更多
const handleScroll = () => {
  if (isLoadingMore.value || !hasMoreData.value) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // 距离底部100px时加载更多
  if (documentHeight - (scrollTop + windowHeight) < 100) {
    fetchPointsData(true);
  }
};

onMounted(() => {
  fetchPointsData();
  // 添加滚动监听
  window.addEventListener('scroll', handleScroll);
});

// 组件卸载时移除监听
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="points-details-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="nav-bar">
        <div class="back-button" @click="goBack">
          <Icon name="arrow-left" color="#fff" size="20" />
        </div>
        <div class="page-title">消费记录</div>
        <div class="right-placeholder"></div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading && pointsRecords.length === 0" class="loading-state">
      <Loading type="spinner" color="#ff9500" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError && pointsRecords.length === 0" class="error-state">
      <Icon name="warning-o" size="24" color="#ff9500" />
      <div class="error-text">{{ errorMessage || '加载失败，请稍后再试' }}</div>
      <div class="retry-btn" @click="() => fetchPointsData()">重试</div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="pointsRecords.length === 0" class="empty-state">
      <Icon name="orders-o" size="48" color="#999" />
      <div class="empty-text">暂无消费记录</div>
      <div class="empty-tip">快去观看精彩内容吧！</div>
    </div>

    <!-- 积分明细列表 -->
    <div v-else class="records-list">
      <div class="record-item" v-for="record in pointsRecords" :key="record.plog_id">
        <div class="record-left">
          <div class="record-title">{{ record.plog_type_cn || '积分消费' }}</div>
          <div class="record-date">{{ formatDate(record.plog_time) }}</div>
          <div v-if="record.plog_remarks" class="record-remarks">{{ record.plog_remarks }}</div>
        </div>
        <div class="record-right">
          <div class="record-amount">-{{ record.plog_points }} 积分</div>
          <div class="record-status minus">
            消费积分
          </div>
        </div>
      </div>

      <!-- 加载更多指示器 -->
      <div v-if="isLoadingMore" class="loading-more">
        <Loading type="spinner" color="#ff9500" size="20" />
        <span>正在加载更多...</span>
      </div>

      <!-- 没有更多数据提示 -->
      <div v-if="!hasMoreData && pointsRecords.length > 0" class="no-more-data">
        已经到底了~
      </div>
    </div>
  </div>
</template>

<style scoped>
.points-details-page {
  background-color: #111;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  padding: 10px 15px;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
}

.back-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.right-placeholder {
  width: 44px;
}

.records-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #222;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 10px;
}

.record-left {
  display: flex;
  flex-direction: column;
}

.record-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 5px;
}

.record-date {
  font-size: 14px;
  color: #999;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.record-amount {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.record-amount.add {
  color: #00C853;
}

.record-amount.minus {
  color: #FF3D00;
}

.record-status {
  font-size: 14px;
}

.record-status.add {
  color: #00C853;
}

.record-status.minus {
  color: #FF3D00;
}

.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading-text,
.error-text {
  margin-top: 10px;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 20px;
  background-color: #ff9500;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.loading-more span {
  margin-left: 8px;
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: #999;
}

.record-remarks {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.empty-text {
  margin-top: 15px;
  font-size: 16px;
  color: #999;
}

.empty-tip {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}
</style> 