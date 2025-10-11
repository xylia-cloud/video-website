<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon, Loading, Tabs, Tab } from 'vant';
import { useRouter } from 'vue-router';
import { fetchVideoChargeLog, fetchGameChargeLog } from '@/api/fetch-api';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};

// 视频充值记录数据接口
interface ChargeRecord {
  order_id: number;
  user_id: number;
  order_status: number;
  order_code: string;
  pay_code: string;
  order_price: string;
  order_time: string;
  order_points: number;
  order_pay_type: string;
  order_pay_time: string;
  order_remarks: string;
  order_status_cn: string;
}

// 游戏充值记录数据接口
interface GameChargeRecord {
  id: string;
  money: string;
  coin: string;
  coin_give: string;
  orderno: string;
  trade_no: string;
  addtime: string;
  status_cn: string;
}

// 当前选项卡
const activeTab = ref(0);

// 视频充值记录
const videoRecords = ref<ChargeRecord[]>([]);
const isVideoLoading = ref(false);
const hasVideoError = ref(false);
const videoErrorMessage = ref('');
const videoCurrentPage = ref(1);
const hasMoreVideoData = ref(true);
const isLoadingMoreVideo = ref(false);

// 游戏充值记录
const gameRecords = ref<GameChargeRecord[]>([]);
const isGameLoading = ref(false);
const hasGameError = ref(false);
const gameErrorMessage = ref('');
const gameCurrentPage = ref(1);
const hasMoreGameData = ref(true);
const isLoadingMoreGame = ref(false);

// 获取视频充值记录
const fetchVideoRecords = async (loadMore = false) => {
  try {
    if (loadMore) {
      isLoadingMoreVideo.value = true;
    } else {
      isVideoLoading.value = true;
      hasVideoError.value = false;
      videoErrorMessage.value = '';
      videoCurrentPage.value = 1;
      videoRecords.value = [];
    }

    const params = {
      limit: 10,
      page: videoCurrentPage.value
    };

    console.log('请求视频充值记录，参数:', params);
    const result = await fetchVideoChargeLog(params);
    console.log('视频充值记录接口返回:', result);

    if (result && result.code === 1 && result.data) {
      const { list = [], page = 1, pagecount = 1 } = result.data;

      console.log('视频充值记录列表:', list);

      if (loadMore) {
        videoRecords.value = [...videoRecords.value, ...list];
      } else {
        videoRecords.value = list;
      }

      // 更新分页信息
      videoCurrentPage.value = page;
      hasMoreVideoData.value = page < pagecount;

      // 为下次加载准备
      if (hasMoreVideoData.value) {
        videoCurrentPage.value += 1;
      }
    } else {
      hasVideoError.value = true;
      videoErrorMessage.value = result?.msg || '获取视频充值记录失败';
    }
  } catch (error) {
    console.error('获取视频充值记录失败:', error);
    hasVideoError.value = true;
    videoErrorMessage.value = (error as Error).message || '网络请求失败';
  } finally {
    isVideoLoading.value = false;
    isLoadingMoreVideo.value = false;
  }
};

// 获取游戏充值记录
const fetchGameRecords = async (loadMore = false) => {
  try {
    if (loadMore) {
      isLoadingMoreGame.value = true;
    } else {
      isGameLoading.value = true;
      hasGameError.value = false;
      gameErrorMessage.value = '';
      gameCurrentPage.value = 1;
      gameRecords.value = [];
    }

    const params = {
      limit: 10,
      page: gameCurrentPage.value
    };

    console.log('请求游戏充值记录，参数:', params);
    const result = await fetchGameChargeLog(params);
    console.log('游戏充值记录接口返回:', result);

    if (result && result.code === 1 && result.data) {
      const { list = [], page = 1, pagecount = 1 } = result.data;

      console.log('游戏充值记录列表:', list);

      if (loadMore) {
        gameRecords.value = [...gameRecords.value, ...list];
      } else {
        gameRecords.value = list;
      }

      // 更新分页信息
      gameCurrentPage.value = page;
      hasMoreGameData.value = page < pagecount;

      // 为下次加载准备
      if (hasMoreGameData.value) {
        gameCurrentPage.value += 1;
      }
    } else {
      hasGameError.value = true;
      gameErrorMessage.value = result?.msg || '获取游戏充值记录失败';
    }
  } catch (error) {
    console.error('获取游戏充值记录失败:', error);
    hasGameError.value = true;
    gameErrorMessage.value = (error as Error).message || '网络请求失败';
  } finally {
    isGameLoading.value = false;
    isLoadingMoreGame.value = false;
  }
};

// 切换选项卡
const handleTabChange = (index: number) => {
  activeTab.value = index;
  if (index === 0 && videoRecords.value.length === 0 && !hasVideoError.value) {
    fetchVideoRecords();
  } else if (index === 1 && gameRecords.value.length === 0 && !hasGameError.value) {
    fetchGameRecords();
  }
};

// 滚动加载更多
const handleScroll = () => {
  const isVideo = activeTab.value === 0;
  const isLoadingMore = isVideo ? isLoadingMoreVideo.value : isLoadingMoreGame.value;
  const hasMoreData = isVideo ? hasMoreVideoData.value : hasMoreGameData.value;

  if (isLoadingMore || !hasMoreData) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // 距离底部100px时加载更多
  if (documentHeight - (scrollTop + windowHeight) < 100) {
    if (isVideo) {
      fetchVideoRecords(true);
    } else {
      fetchGameRecords(true);
    }
  }
};

// 格式化支付方式
const formatPayType = (payType: string) => {
  const payTypeMap: { [key: string]: string } = {
    '1': '支付宝',
    '2': '微信支付',
    '3': '银联支付',
    '4': '其他'
  };
  return payTypeMap[payType] || '未知';
};

// 格式化订单状态样式类（视频充值）
const getStatusClass = (status: number) => {
  if (status === 0) return 'pending'; // 待支付
  if (status === 1) return 'success'; // 已支付
  return 'failed'; // 失败
};

// 格式化游戏充值订单状态样式类
const getGameStatusClass = (statusCn: string) => {
  if (statusCn === '未支付' || statusCn === '待支付') return 'pending';
  if (statusCn === '已支付' || statusCn === '成功' || statusCn === '已完成') return 'success';
  return 'failed'; // 失败、已取消等
};

onMounted(() => {
  // 默认加载视频充值记录
  fetchVideoRecords();
  // 添加滚动监听
  window.addEventListener('scroll', handleScroll);
});

// 组件卸载时移除监听
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="recharge-record-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="nav-bar">
        <div class="back-button" @click="goBack">
          <Icon name="arrow-left" color="#fff" size="20" />
        </div>
        <div class="page-title">充值记录</div>
        <div class="right-placeholder"></div>
      </div>
    </div>

    <!-- 选项卡 -->
    <div class="tabs-container">
      <Tabs v-model:active="activeTab" @change="handleTabChange" background="#111" color="#ff9500"
        title-active-color="#ff9500" title-inactive-color="#999">
        <Tab title="视频充值记录">
          <!-- 加载状态 -->
          <div v-if="isVideoLoading && videoRecords.length === 0" class="loading-state">
            <Loading type="spinner" color="#ff9500" />
            <div class="loading-text">加载中...</div>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="hasVideoError && videoRecords.length === 0" class="error-state">
            <Icon name="warning-o" size="24" color="#ff9500" />
            <div class="error-text">{{ videoErrorMessage || '加载失败，请稍后再试' }}</div>
            <div class="retry-btn" @click="() => fetchVideoRecords()">重试</div>
          </div>

          <!-- 空状态 -->
          <div v-else-if="videoRecords.length === 0" class="empty-state">
            <Icon name="orders-o" size="48" color="#999" />
            <div class="empty-text">暂无视频充值记录</div>
          </div>

          <!-- 视频充值记录列表 -->
          <div v-else class="records-list">
            <div class="record-item" v-for="record in videoRecords" :key="record.order_id">
              <div class="record-header">
                <div class="record-title">订单号：{{ record.order_code }}</div>
                <div class="record-status" :class="getStatusClass(record.order_status)">
                  {{ record.order_status_cn }}
                </div>
              </div>
              <div class="record-body">
                <div class="record-info">
                  <div class="info-row">
                    <span class="info-label">充值金额：</span>
                    <span class="info-value amount">¥{{ record.order_price }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">支付方式：</span>
                    <span class="info-value">{{ formatPayType(record.order_pay_type) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">创建时间：</span>
                    <span class="info-value">{{ record.order_time }}</span>
                  </div>
                  <div v-if="record.order_pay_time" class="info-row">
                    <span class="info-label">支付时间：</span>
                    <span class="info-value">{{ record.order_pay_time }}</span>
                  </div>
                  <div v-if="record.order_remarks" class="info-row">
                    <span class="info-label">备注：</span>
                    <span class="info-value">{{ record.order_remarks }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 加载更多指示器 -->
            <div v-if="isLoadingMoreVideo" class="loading-more">
              <Loading type="spinner" color="#ff9500" size="20" />
              <span>正在加载更多...</span>
            </div>

            <!-- 没有更多数据提示 -->
            <div v-if="!hasMoreVideoData && videoRecords.length > 0" class="no-more-data">
              已经到底了~
            </div>
          </div>
        </Tab>

        <Tab title="游戏充值记录">
          <!-- 加载状态 -->
          <div v-if="isGameLoading && gameRecords.length === 0" class="loading-state">
            <Loading type="spinner" color="#ff9500" />
            <div class="loading-text">加载中...</div>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="hasGameError && gameRecords.length === 0" class="error-state">
            <Icon name="warning-o" size="24" color="#ff9500" />
            <div class="error-text">{{ gameErrorMessage || '加载失败，请稍后再试' }}</div>
            <div class="retry-btn" @click="() => fetchGameRecords()">重试</div>
          </div>

          <!-- 空状态 -->
          <div v-else-if="gameRecords.length === 0" class="empty-state">
            <Icon name="orders-o" size="48" color="#999" />
            <div class="empty-text">暂无游戏充值记录</div>
          </div>

          <!-- 游戏充值记录列表 -->
          <div v-else class="records-list">
            <div class="record-item" v-for="record in gameRecords" :key="record.id">
              <div class="record-header">
                <div class="record-title">订单号：{{ record.orderno }}</div>
                <div class="record-status" :class="getGameStatusClass(record.status_cn)">
                  {{ record.status_cn }}
                </div>
              </div>
              <div class="record-body">
                <div class="record-info">
                  <div class="info-row">
                    <span class="info-label">充值金额：</span>
                    <span class="info-value amount">¥{{ record.money }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">获得钻石：</span>
                    <span class="info-value">{{ record.coin }} 钻石</span>
                  </div>
                  <div v-if="parseFloat(record.coin_give) > 0" class="info-row">
                    <span class="info-label">赠送钻石：</span>
                    <span class="info-value">{{ record.coin_give }} 钻石</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">创建时间：</span>
                    <span class="info-value">{{ record.addtime }}</span>
                  </div>
                  <div v-if="record.trade_no" class="info-row">
                    <span class="info-label">交易流水号：</span>
                    <span class="info-value">{{ record.trade_no }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 加载更多指示器 -->
            <div v-if="isLoadingMoreGame" class="loading-more">
              <Loading type="spinner" color="#ff9500" size="20" />
              <span>正在加载更多...</span>
            </div>

            <!-- 没有更多数据提示 -->
            <div v-if="!hasMoreGameData && gameRecords.length > 0" class="no-more-data">
              已经到底了~
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
.recharge-record-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 20px;
}

.page-header {
  padding: 10px 15px;
  background-color: #111;
  position: sticky;
  top: 0;
  z-index: 100;
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
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.right-placeholder {
  width: 44px;
}

.tabs-container {
  margin-top: 10px;
}

.tabs-container :deep(.van-tabs__wrap) {
  background-color: #111;
}

.tabs-container :deep(.van-tabs__nav) {
  background-color: #222;
}

.tabs-container :deep(.van-tab) {
  color: #999;
  font-size: 16px;
}

.tabs-container :deep(.van-tab--active) {
  color: #ff9500;
  font-weight: bold;
}

.tabs-container :deep(.van-tabs__line) {
  background-color: #ff9500;
}

.records-list {
  padding: 15px;
}

.record-item {
  background-color: #222;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.record-title {
  font-size: 14px;
  color: #999;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-status {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
  margin-left: 10px;
  flex-shrink: 0;
}

.record-status.pending {
  color: #ff9500;
  background-color: rgba(255, 149, 0, 0.1);
}

.record-status.success {
  color: #00C853;
  background-color: rgba(0, 200, 83, 0.1);
}

.record-status.failed {
  color: #FF3D00;
  background-color: rgba(255, 61, 0, 0.1);
}

.record-body {
  display: flex;
  flex-direction: column;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.info-label {
  color: #999;
}

.info-value {
  color: #fff;
  text-align: right;
}

.info-value.amount {
  color: #ff9500;
  font-size: 18px;
  font-weight: bold;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  min-height: 300px;
}

.loading-text,
.error-text {
  margin-top: 10px;
  margin-bottom: 20px;
  color: #999;
}

.retry-btn {
  padding: 10px 30px;
  background-color: #ff9500;
  border-radius: 20px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:active {
  opacity: 0.8;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  gap: 10px;
  color: #999;
  font-size: 14px;
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.empty-text {
  margin-top: 15px;
  font-size: 16px;
  color: #999;
}
</style>
