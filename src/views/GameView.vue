<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NEW_API_BASE_URL } from '@/utils/config';
import { getUserInfo, isLoggedIn, fetchNotices, type NoticeGroup } from '@/api/fetch-api';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';

// 顶级游戏分类接口
interface TopGameCategory {
  id: string;
  name: string;
  icon: string;
  status: string;
  paixu?: string;
  biaoshi?: string | null;
  code?: string | null;
  istry?: string | null;
}

// 分页信息接口
interface PaginationInfo {
  currentPage: number; // 当前页码
  totalCount: number; // 总条数
  totalPages: number; // 总页数
  pageSize: number; // 每页条数
}

// 一级游戏分类接口
interface SubGameCategory {
  id: string;
  name: string;
  icon: string;
  topclass_id: string;
  ismy?: number;
  expanded?: boolean; // 是否展开
  games?: Game[]; // 该分类下的游戏列表
  loading?: boolean; // 是否正在加载游戏
  pagination?: PaginationInfo; // 分页信息
  jumpPage?: number; // 跳转页码输入值
}

// 游戏数据
interface Game {
  id: number;
  name: string;
  imageUrl: string;
  biaoshi: string; // 必需字段，用于进入游戏
  code?: string; // 可选字段
  type?: string; // 可选字段
}

// 顶级游戏分类数据
const topCategories = ref<TopGameCategory[]>([]);
const selectedTopCategory = ref<string>('0');
const isLoadingTopCategories = ref(false);
const hasTopCategoriesError = ref(false);

// 二级游戏分类数据
const secondaryCategories = ref<SubGameCategory[]>([]);
const isLoadingSecondaryCategories = ref(false);
const hasSecondaryCategoriesError = ref(false);

// 二级分类分页数据
const secondaryCategoriesPagination = ref({
  currentPage: 1,
  totalCount: 0,
  totalPages: 0,
  pageSize: 12 // 后端每页返回12条数据
});
const secondaryCategoriesJumpPage = ref(1);

// 全屏加载状态
const isGlobalLoading = ref(false);

// 用户余额数据
const userBalance = ref(0);
const gameBalance = ref(0);

// 用户登录状态
const isUserLoggedIn = ref(false);

// 公告相关状态
const announcementText = ref('');
const isLoadingNotice = ref(false);
const hasNoticeError = ref(false);

// 获取充值公告数据
const fetchRechargeNotice = async () => {
  isLoadingNotice.value = true;
  hasNoticeError.value = false;

  try {
    const result = await fetchNotices();
    console.log('获取公告数据:', result);

    if (result && result.code === 1 && result.data) {
      // 查找充值公告分组
      const rechargeGroup = result.data.find((group: NoticeGroup) => group.name === '充值公告');

      if (rechargeGroup && rechargeGroup.list && rechargeGroup.list.length > 0) {
        // 获取第一条充值公告的内容
        const firstNotice = rechargeGroup.list[0];
        announcementText.value = firstNotice.content;
      } else {
        announcementText.value = '暂无充值公告';
      }
    } else {
      hasNoticeError.value = true;
      announcementText.value = '公告加载失败';
    }
  } catch (error) {
    console.error('获取充值公告失败:', error);
    hasNoticeError.value = true;
    announcementText.value = '公告加载失败';
  } finally {
    isLoadingNotice.value = false;
  }
};

// 防重复请求标记
const isTopCategoriesLoading = ref(false);
const isSecondaryCategoriesLoading = ref(false);

// 获取顶级游戏分类数据
const fetchTopCategories = async () => {
  // 防重复请求
  if (isTopCategoriesLoading.value) {
    console.log('🔄 顶级分类正在加载中，跳过重复请求');
    return;
  }

  isTopCategoriesLoading.value = true;
  isGlobalLoading.value = true;
  isLoadingTopCategories.value = true;
  hasTopCategoriesError.value = false;

  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      service: 'caipiao.topclass'
      // 不传递pid参数，根据接口要求
    });

    // 发起GET请求
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('获取顶级游戏分类数据:', result);

    if (result && result.ret === 200 && result.data && result.data.code === 0 && Array.isArray(result.data.info)) {
      // 按照paixu排序，并确保ID是字符串类型
      const sortedCategories = [...result.data.info].map(category => ({
        ...category,
        id: String(category.id) // 确保ID是字符串类型
      })).sort((a, b) => {
        const paixuA = a.paixu ? parseInt(a.paixu) : 999;
        const paixuB = b.paixu ? parseInt(b.paixu) : 999;
        return paixuA - paixuB;
      });

      topCategories.value = sortedCategories;

      // 默认选中第一个分类
      if (topCategories.value.length > 0) {
        selectedTopCategory.value = String(topCategories.value[0].id);
        // 加载第一个顶级分类的二级分类列表
        fetchSecondaryCategories(selectedTopCategory.value);
      }

      console.log('处理后的顶级游戏分类数据:', topCategories.value);
    } else {
      console.log('没有获取到顶级游戏分类数据');
      topCategories.value = [];
    }
  } catch (error) {
    console.error('获取顶级游戏分类失败:', error);
    hasTopCategoriesError.value = true;
    topCategories.value = [];
  } finally {
    isLoadingTopCategories.value = false;
    isGlobalLoading.value = false;
    isTopCategoriesLoading.value = false;
  }
};

// 获取二级游戏分类数据
const fetchSecondaryCategories = async (topCategoryId: string, page: number = 1) => {
  // 防重复请求
  const requestKey = `${topCategoryId}-${page}`;
  if (isSecondaryCategoriesLoading.value) {
    console.log('🔄 二级分类正在加载中，跳过重复请求:', requestKey);
    return;
  }

  isSecondaryCategoriesLoading.value = true;
  isGlobalLoading.value = true;
  isLoadingSecondaryCategories.value = true;
  hasSecondaryCategoriesError.value = false;

  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      service: 'caipiao.twoclass',
      pid: topCategoryId
    });

    // 发起POST请求
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('获取二级游戏分类数据:', result);

    if (result && result.ret === 200 && result.data && result.data.code === 0 && result.data.info && Array.isArray(result.data.info.data)) {
      // 处理二级分类数据
      const allCategories = result.data.info.data.map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        name: String(item.name || '未命名分类'),
        icon: String(item.icon || ''),
        topclass_id: String(item.topclass_id || ''),
        ismy: Number(item.ismy) || 0,
        expanded: false, // 默认不展开
        games: [], // 初始化游戏列表
        loading: false, // 初始化加载状态
        pagination: { // 初始化分页信息
          currentPage: 1,
          totalCount: 0,
          totalPages: 0,
          pageSize: 12
        }
      }));

      // 直接使用后端返回的数据，不进行前端分页
      secondaryCategories.value = allCategories;

      // 从后端响应中获取分页信息
      const totalCount = parseInt(result.data.info.total || '0');
      const pageSize = 12; // 后端每页返回12条
      const totalPages = Math.ceil(totalCount / pageSize);

      // 更新分页信息
      secondaryCategoriesPagination.value = {
        currentPage: page,
        totalCount,
        totalPages,
        pageSize
      };
      console.log('处理后的二级游戏分类数据:', allCategories);
      console.log('二级分类数量:', allCategories.length);
      console.log('分页信息:', secondaryCategoriesPagination.value);

    } else {
      console.log('没有获取到二级游戏分类数据');
      secondaryCategories.value = [];
      secondaryCategoriesPagination.value = {
        currentPage: 1,
        totalCount: 0,
        totalPages: 0,
        pageSize: 12
      };
    }
  } catch (error) {
    console.error('获取二级游戏分类失败:', error);
    hasSecondaryCategoriesError.value = true;
    secondaryCategories.value = [];
    secondaryCategoriesPagination.value = {
      currentPage: 1,
      totalCount: 0,
      totalPages: 0,
      pageSize: 12
    };
  } finally {
    isLoadingSecondaryCategories.value = false;
    isGlobalLoading.value = false;
    isSecondaryCategoriesLoading.value = false;
  }
};

// 获取某个一级分类下的二级游戏
const fetchGamesForSubCategory = async (topCategoryId: string, subCategoryId: string, page: number = 1) => {
  // 找到对应的二级分类
  const subCategory = secondaryCategories.value.find(cat => cat.id === subCategoryId);
  if (!subCategory) return;

  // 设置局部加载状态
  subCategory.loading = true;

  try {
    // 构建查询参数，添加分页参数
    const queryParams = new URLSearchParams({
      service: 'caipiao.gettwoclass',
      pid: topCategoryId,
      oneclass_id: subCategoryId,
      p: page.toString() // 当前页数
    });

    // 发起POST请求
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`获取分类 ${subCategory.name} 的游戏列表:`, result);

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      // 检查新的数据结构：result.data.info.data
      const gameData = result.data.info?.data || result.data.info;
      const totalCount = result.data.info?.total || 0; // 获取总条数

      if (Array.isArray(gameData)) {
        // 处理游戏数据
        const gamesList = gameData.map((item: Record<string, unknown>) => ({
          id: Number(item.id) || 0,
          name: String(item.name || '未命名游戏'),
          imageUrl: String(item.icon || ''),
          biaoshi: String(item.biaoshi || ''), // 必需字段
          code: item.code ? String(item.code) : String(item.biaoshi || ''), // 优先使用code，否则使用biaoshi
          type: item.type ? String(item.type) : String(item.biaoshi || '') // 优先使用type，否则使用biaoshi
        }));

        // 计算分页信息
        const pageSize = 12; // 每页固定12条
        const totalPages = Math.ceil(totalCount / pageSize);

        // 直接替换当前页的游戏列表
        subCategory.games = gamesList;

        // 更新分页信息
        subCategory.pagination = {
          currentPage: page,
          totalCount: totalCount,
          totalPages: totalPages,
          pageSize: pageSize
        };

        console.log(`处理后的分类 ${subCategory.name} 游戏数据:`, gamesList);
        console.log(`分页信息:`, subCategory.pagination);
      } else {
        console.log(`分类 ${subCategory.name} 的游戏数据格式不正确:`, result.data.info);
        subCategory.games = [];
        subCategory.pagination = {
          currentPage: 1,
          totalCount: 0,
          totalPages: 0,
          pageSize: 12
        };
      }
    } else {
      console.log(`没有获取到分类 ${subCategory.name} 的游戏数据`);
      subCategory.games = [];
      subCategory.pagination = {
        currentPage: 1,
        totalCount: 0,
        totalPages: 0,
        pageSize: 12
      };
    }
  } catch (error) {
    console.error(`获取分类 ${subCategory.name} 的游戏失败:`, error);
    subCategory.games = [];
  } finally {
    // 关闭局部加载状态
    subCategory.loading = false;
  }
};





const router = useRouter();

// 处理顶级分类点击
const handleTopCategoryClick = (categoryId: string) => {
  console.log('点击顶级分类:', categoryId);

  // 如果点击的是当前选中的分类，不做任何操作
  if (selectedTopCategory.value === categoryId) return;

  // 更新选中的分类
  selectedTopCategory.value = categoryId;
  console.log('更新选中的顶级分类为:', categoryId);

  // 重置分页到第一页
  secondaryCategoriesPagination.value.currentPage = 1;
  secondaryCategoriesJumpPage.value = 1;

  // 获取该顶级分类下的二级分类列表
  fetchSecondaryCategories(categoryId, 1);
};

// 处理二级分类点击
const handleSecondaryCategoryClick = (secondaryCategory: SubGameCategory) => {
  // 先关闭所有其他分类的展开状态
  secondaryCategories.value.forEach(cat => {
    cat.expanded = false;
  });

  // 展开当前选中的分类
  secondaryCategory.expanded = true;

  // 如果还没有加载过游戏，则加载游戏
  if (!secondaryCategory.games || secondaryCategory.games.length === 0) {
    fetchGamesForSubCategory(selectedTopCategory.value, secondaryCategory.id, 1);
  }
  // 如果已经有数据，直接展开，不做任何网络请求
};

// 处理分页点击
const handlePageChange = (subCategory: SubGameCategory, page: number) => {
  if (page < 1 || page > (subCategory.pagination?.totalPages || 1)) return;
  if (page === subCategory.pagination?.currentPage) return;

  fetchGamesForSubCategory(selectedTopCategory.value, subCategory.id, page);
};

// 处理跳转页面
const handleJumpPage = (subCategory: SubGameCategory) => {
  const jumpPage = subCategory.jumpPage;
  if (!jumpPage || !subCategory.pagination) return;

  const targetPage = parseInt(jumpPage.toString());
  if (isNaN(targetPage)) {
    subCategory.jumpPage = undefined;
    return;
  }

  const maxPage = subCategory.pagination.totalPages;
  if (targetPage < 1 || targetPage > maxPage) {
    subCategory.jumpPage = undefined;
    return;
  }

  if (targetPage !== subCategory.pagination.currentPage) {
    handlePageChange(subCategory, targetPage);
  }

  subCategory.jumpPage = undefined;
};

// 处理二级分类分页点击
const handleSecondaryCategoriesPageChange = (page: number) => {
  if (page < 1 || page > secondaryCategoriesPagination.value.totalPages) return;
  if (page === secondaryCategoriesPagination.value.currentPage) return;

  fetchSecondaryCategories(selectedTopCategory.value, page);
};

// 处理二级分类跳转页面
const handleSecondaryCategoriesJumpPage = () => {
  const jumpPage = secondaryCategoriesJumpPage.value;
  if (jumpPage && jumpPage >= 1 && jumpPage <= secondaryCategoriesPagination.value.totalPages) {
    handleSecondaryCategoriesPageChange(jumpPage);
  } else {
    // 重置为当前页
    secondaryCategoriesJumpPage.value = secondaryCategoriesPagination.value.currentPage;
  }
};

// 游戏确认弹窗状态
const showGameDialog = ref(false);
const currentGame = ref<Game | null>(null);
const currentGameUrl = ref('');

// 显示游戏确认弹窗
const showGameConfirmDialog = (game: Game, gameUrl: string) => {
  currentGame.value = game;
  currentGameUrl.value = gameUrl;
  showGameDialog.value = true;
};

// 确认开始游戏
const confirmStartGame = () => {
  if (currentGameUrl.value) {
    const newWindow = window.open(currentGameUrl.value, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      showToast('无法打开游戏窗口，请检查浏览器设置');
    }
  }
  showGameDialog.value = false;
};

// 取消开始游戏
const cancelStartGame = () => {
  showGameDialog.value = false;
  currentGame.value = null;
  currentGameUrl.value = '';
};







// 处理游戏点击
const handleGameClick = (game: Game) => {
  // 检查是否为占位数据
  if (game.id < 0) {
    return; // 占位数据不可点击
  }

  // 检查必要的游戏信息
  if (!game.biaoshi) {
    console.error('游戏信息不完整，无法进入游戏', game);
    return;
  }

  // 获取用户信息
  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.user_id || !userInfo.token) {
    // 用户未登录，跳转到登录页
    router.push('/login');
    return;
  }

  // 使用biaoshi作为所有必要参数
  const type = game.type || game.biaoshi;
  const code = game.code || game.biaoshi;

  // 进入游戏
  enterGame(userInfo.user_id, userInfo.token, game.biaoshi, type, code, game);
};

// 进入游戏接口
const enterGame = async (uid: number, token: string, biaoshi: string, type: string, code: string, game: Game) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      service: 'gameapi.entergame',
      uid: uid.toString(),
      token: token,
      biaoshi: biaoshi,
      type: type,
      code: code
    });

    // 发起POST请求
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('进入游戏结果:', result);

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      // 游戏链接
      const gameUrl = result.data.info?.purl;
      if (gameUrl) {
        // 显示游戏确认弹窗
        showGameConfirmDialog(game, gameUrl);
      } else {
        console.error('没有获取到游戏链接');
        showToast('获取游戏链接失败');
      }
    } else {
      console.error('进入游戏失败:', result?.data?.msg || '未知错误');
      showToast(result?.data?.msg || '进入游戏失败');
    }
  } catch (error) {
    console.error('进入游戏请求失败:', error);
    showToast('网络错误，请重试');
  }
};

// 页面跳转方法
const goToRecharge = () => {
  router.push('/recharge');
};

const goToWithdraw = () => {
  router.push('/withdraw');
};

const goToGameRecord = () => {
  // 检查登录状态
  if (!isLoggedIn()) {
    showToast('请先登录');
    return;
  }

  // 跳转到游戏记录页面
  router.push('/game-record');
};



// 跳转到登录页面
const goToLogin = () => {
  router.push('/login');
};

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register');
};

// 获取用户余额和登录状态
const fetchUserBalance = () => {
  const userInfo = getUserInfo();
  if (userInfo && userInfo.token) {
    // 用户已登录
    isUserLoggedIn.value = true;
    userBalance.value = userInfo.coin || 0; // 账户余额改为使用coin字段
    gameBalance.value = userInfo.coin || 0; // 游戏余额也使用coin字段
  } else {
    // 用户未登录
    isUserLoggedIn.value = false;
    userBalance.value = 0;
    gameBalance.value = 0;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  // 获取顶级分类数据
  fetchTopCategories();
  // 获取用户余额
  fetchUserBalance();
  // 获取充值公告
  fetchRechargeNotice();
  // 顶级分类数据加载后会自动加载一级分类列表
});
</script>

<template>
  <div class="game-page">

    <!-- 全屏加载状态 -->
    <div v-if="isGlobalLoading" class="global-loading">
      <div class="custom-spinner"></div>
    </div>

    <!-- 公告版块 -->
    <div class="announcement-section">
      <div class="announcement-icon">
        <img src="@/assets/img/icon-notice.svg" alt="">
      </div>
      <div class="announcement-content">
        <div class="announcement-text">{{ announcementText }}</div>
      </div>
    </div>

    <!-- 充值版块 -->
    <div class="recharge-section">
      <!-- 三个点装饰 -->
      <div class="dots-decoration">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>

      <!-- 已登录状态 - 显示余额和操作按钮 -->
      <div v-if="isUserLoggedIn">
        <!-- 余额显示区域 -->
        <div class="balance-display-section">
          <div class="balance-item">
            <span class="balance-label">账户余额：</span>
            <span class="balance-value">{{ userBalance.toFixed(2) }}</span>
          </div>
          <div class="balance-item">
            <span class="balance-label">游戏余额：</span>
            <span class="balance-value">{{ gameBalance.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="action-buttons-section">
          <button class="action-btn recharge-btn" @click="goToRecharge">
            <van-icon name="plus" />
            <span>充值</span>
          </button>
          <button class="action-btn withdraw-btn" @click="goToWithdraw">
            <van-icon name="credit-pay" />
            <span>提现</span>
          </button>
          <button class="action-btn record-btn" @click="goToGameRecord">
            <van-icon name="orders-o" />
            <span>游戏记录</span>
          </button>
        </div>
      </div>

      <!-- 未登录状态 - 显示登录提示 -->
      <div v-else class="login-prompt-section">
        <!-- 登录提示信息 -->
        <div class="login-prompt-content">
          <div class="login-icon">
            <van-icon name="user-o" size="32" color="#ff9500" />
          </div>
          <div class="login-message">
            <div class="login-title">您还未登录</div>
            <div class="login-subtitle">登录后可享受充值、游戏等完整功能</div>
          </div>
        </div>

        <!-- 登录注册按钮 -->
        <div class="login-actions">
          <button class="login-btn" @click="goToLogin">
            <span>立即登录</span>
          </button>
          <button class="register-btn" @click="goToRegister">
            <span>免费注册</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 游戏分类与内容 -->
    <div class="game-container">
      <!-- 错误状态 -->
      <div v-if="hasTopCategoriesError" class="error-container">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载游戏分类失败</div>
      </div>

      <!-- 游戏内容 -->
      <div v-else-if="!isGlobalLoading" class="game-content-wrapper">
        <!-- 顶级分类横向列表 -->
        <div class="top-categories-horizontal">
          <!-- 顶级分类错误状态 -->
          <div v-if="hasTopCategoriesError" class="error-state">
            <van-icon name="warning-o" size="24" color="#ff9500" />
            <div class="error-text">加载分类失败</div>
          </div>

          <!-- 顶级分类横向滚动列表 -->
          <div v-else-if="topCategories.length > 0" class="top-categories-scroll">
            <div class="top-categories-list">
              <div v-for="category in topCategories" :key="category.id" class="top-category-horizontal-item"
                :class="{ active: selectedTopCategory === category.id }" @click="handleTopCategoryClick(category.id)">
                <div class="top-category-horizontal-icon">
                  <img v-if="category.icon" :src="category.icon" :alt="category.name" />
                  <div v-else class="placeholder-icon"></div>
                </div>
                <div class="top-category-horizontal-name">{{ category.name }}</div>
              </div>
            </div>
          </div>

          <!-- 无顶级分类时的提示 -->
          <div v-else class="no-categories">
            <div class="no-categories-text">暂无分类</div>
          </div>
        </div>

        <!-- 游戏内容区域 -->
        <div class="game-content-area">

          <!-- 二级分类加载状态 -->
          <div v-if="isLoadingSecondaryCategories" class="secondary-loading">
            <div class="custom-spinner"></div>
            <div class="loading-text">加载分类中...</div>
          </div>

          <!-- 二级分类错误状态 -->
          <div v-else-if="hasSecondaryCategoriesError" class="error-state">
            <van-icon name="warning-o" size="24" color="#ff9500" />
            <div class="error-text">加载二级分类失败</div>
          </div>

          <!-- 二级分类网格 -->
          <div v-if="!isLoadingSecondaryCategories && !hasSecondaryCategoriesError && secondaryCategories.length > 0"
            class="secondary-categories-grid">
            <div v-for="secondaryCategory in secondaryCategories" :key="secondaryCategory.id"
              class="secondary-category-item" @click="handleSecondaryCategoryClick(secondaryCategory)">
              <div class="secondary-category-icon">
                <img v-if="secondaryCategory.icon" :src="secondaryCategory.icon" :alt="secondaryCategory.name" />
                <div v-else class="placeholder-icon"></div>
              </div>
              <div class="secondary-category-name">{{ secondaryCategory.name }}</div>
            </div>
          </div>

          <!-- 二级分类分页控件 -->
          <div
            v-if="!isLoadingSecondaryCategories && !hasSecondaryCategoriesError && secondaryCategoriesPagination.totalPages > 1"
            class="pagination-compact secondary-pagination">
            <!-- 上一页 -->
            <button class="page-btn-compact" :disabled="secondaryCategoriesPagination.currentPage <= 1"
              @click="handleSecondaryCategoriesPageChange(secondaryCategoriesPagination.currentPage - 1)">
              <van-icon name="arrow-left" size="14" />
            </button>

            <!-- 当前页信息 -->
            <span class="page-info-compact">
              {{ secondaryCategoriesPagination.currentPage }}/{{ secondaryCategoriesPagination.totalPages }}
            </span>

            <!-- 下一页 -->
            <button class="page-btn-compact"
              :disabled="secondaryCategoriesPagination.currentPage >= secondaryCategoriesPagination.totalPages"
              @click="handleSecondaryCategoriesPageChange(secondaryCategoriesPagination.currentPage + 1)">
              <van-icon name="arrow" size="14" />
            </button>

            <!-- 跳转输入框 -->
            <div class="page-jump">
              <span class="jump-label">跳转</span>
              <input v-model="secondaryCategoriesJumpPage" type="number" class="jump-input" :min="1"
                :max="secondaryCategoriesPagination.totalPages" @keyup.enter="handleSecondaryCategoriesJumpPage"
                @blur="handleSecondaryCategoriesJumpPage" placeholder="" />
              <span class="jump-total">页</span>
            </div>

            <!-- 总数信息 -->
            <span class="total-info">共{{ secondaryCategoriesPagination.totalCount }}项</span>
          </div>

          <!-- 当前选中二级分类的游戏展示区域 -->
          <div class="selected-secondary-games">
            <div v-for="secondaryCategory in secondaryCategories" :key="secondaryCategory.id">
              <!-- 只显示展开的分类的游戏 -->
              <div v-if="secondaryCategory.expanded" class="games-section">
                <!-- 游戏加载状态 -->
                <div v-if="secondaryCategory.loading" class="games-loading">
                  <div class="custom-spinner"></div>
                  <div class="loading-text">加载游戏中...</div>
                </div>

                <!-- 游戏网格 -->
                <div v-else-if="secondaryCategory.games && secondaryCategory.games.length > 0">
                  <div class="games-grid">
                    <div class="game-item" v-for="game in secondaryCategory.games" :key="game.id"
                      @click="handleGameClick(game)">
                      <div class="game-image">
                        <img v-if="game.imageUrl" :src="game.imageUrl" :alt="game.name" />
                      </div>
                      <div class="game-name">{{ game.name }}</div>
                    </div>
                  </div>

                  <!-- 精简分页控件 -->
                  <div v-if="secondaryCategory.pagination && secondaryCategory.pagination.totalPages > 1"
                    class="pagination-compact">
                    <!-- 上一页 -->
                    <button class="page-btn-compact" :disabled="secondaryCategory.pagination.currentPage <= 1"
                      @click="handlePageChange(secondaryCategory, secondaryCategory.pagination.currentPage - 1)">
                      <van-icon name="arrow-left" size="14" />
                    </button>

                    <!-- 当前页信息 -->
                    <span class="page-info-compact">
                      {{ secondaryCategory.pagination.currentPage }}/{{ secondaryCategory.pagination.totalPages }}
                    </span>

                    <!-- 下一页 -->
                    <button class="page-btn-compact"
                      :disabled="secondaryCategory.pagination.currentPage >= secondaryCategory.pagination.totalPages"
                      @click="handlePageChange(secondaryCategory, secondaryCategory.pagination.currentPage + 1)">
                      <van-icon name="arrow" size="14" />
                    </button>

                    <!-- 跳转输入框 -->
                    <div class="page-jump">
                      <span class="jump-label">跳转</span>
                      <input v-model="secondaryCategory.jumpPage" type="number" class="jump-input" :min="1"
                        :max="secondaryCategory.pagination.totalPages" @keyup.enter="handleJumpPage(secondaryCategory)"
                        @blur="handleJumpPage(secondaryCategory)" placeholder="" />
                      <span class="jump-total">页</span>
                    </div>

                    <!-- 总数信息 -->
                    <span class="total-info">共{{ secondaryCategory.pagination.totalCount }}项</span>
                  </div>
                </div>

                <!-- 无游戏状态 -->
                <div v-else class="no-games">
                  <div class="no-games-text">暂无游戏</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 无二级分类时的提示 -->
          <div v-if="!isLoadingSecondaryCategories && !hasSecondaryCategoriesError && secondaryCategories.length === 0"
            class="no-selected-category">
            <div class="no-selected-text">该分类下暂无游戏</div>
          </div>
        </div>
      </div>
    </div>

    <!-- u5e95u90e8u5bfcu822a -->
    <div class="bottom-nav">
      <router-link to="/" class="nav-item">
        <img src="@/assets/img/icon-tabbar-home-normal.svg" alt="首页" class="tabbar-icon" />
        <div class="nav-text">首页</div>
      </router-link>
      <router-link to="/live" class="nav-item">
        <img src="@/assets/img/icon-tabbar-live-normal.svg" alt="直播" class="tabbar-icon" />
        <div class="nav-text">直播</div>
      </router-link>
      <router-link to="/game" class="nav-item active">
        <img src="@/assets/img/icon-tabbar-game-active.svg" alt="游戏" class="tabbar-icon" />
        <div class="nav-text">游戏</div>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <img src="@/assets/img/icon-tabbar-account-normal.svg" alt="我的" class="tabbar-icon" />
        <div class="nav-text">我的</div>
      </router-link>
    </div>

    <!-- 游戏确认弹窗 -->
    <van-popup v-model:show="showGameDialog" class="game-confirm-popup">
      <div class="game-confirm-content" v-if="currentGame">
        <div class="game-confirm-header">
          <h3>开始游戏</h3>
          <Icon name="cross" size="20" color="#999" @click="cancelStartGame" />
        </div>

        <div class="game-confirm-body">
          <div class="game-image-container">
            <img v-if="currentGame.imageUrl" :src="currentGame.imageUrl" :alt="currentGame.name"
              class="game-preview-image" />
            <div v-else class="game-placeholder">
              <Icon name="photo" size="48" color="#666" />
            </div>
          </div>

          <div class="game-info">
            <div class="game-title">{{ currentGame.name }}</div>
            <div class="game-description">确定要开始这个游戏吗？</div>
          </div>
        </div>

        <div class="game-confirm-actions">
          <button class="cancel-game-btn" @click="cancelStartGame">取消</button>
          <button class="confirm-game-btn" @click="confirmStartGame">开始游戏</button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.game-page {
  background-color: #111;
  color: #fff;
  height: 100vh;
  padding-bottom: 50px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  /* 防止横向滚动 */
  display: flex;
  flex-direction: column;
}

/* 全屏加载状态 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(17, 17, 17, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

/* 自定义旋转加载图标 */
.custom-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 149, 0, 0.3);
  border-top: 3px solid #ff9500;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 公告版块样式 */
.announcement-section {
  background: #2C2C2C;
  margin: 12px 12px 0 12px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  min-height: 48px;
}

.announcement-icon {
  color: #ffffff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.announcement-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 20px;
}

.announcement-text {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
  position: absolute;
  top: 0;
  left: 0;
  width: max-content;
  animation: scrollText 20s linear infinite;
}

@keyframes scrollText {
  0% {
    transform: translateX(100%);
  }

  100% {
    transform: translateX(-100%);
  }
}

/* 充值版块样式 */
.recharge-section {
  background: #2C2C2C;
  padding: 26px 16px 16px 16px;
  margin: 12px;
  flex-shrink: 0;
  position: relative;
  border-radius: 8px;
}

/* 三个点装饰 */
.dots-decoration {
  position: absolute;
  top: 12px;
  left: 15px;
  display: flex;
  gap: 6px;
  z-index: 1;
}

.dots-decoration .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dots-decoration .dot:first-child {
  background-color: #ff9500;
}

.dots-decoration .dot:nth-child(2) {
  background-color: #ffffff;
}

.dots-decoration .dot:last-child {
  background-color: #ffffff;
}



/* 余额显示区域 */
.balance-display-section {
  padding: 0 0px 10px 0px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.balance-item {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.balance-label {
  font-size: 14px;
  color: #ffffff;
  font-weight: normal;
}

.balance-value {
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
}

/* 操作按钮区域 */
.action-buttons-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0;
}

.action-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 50px;
}

/* 充值按钮 - 绿色 */
.recharge-btn {
  background: #ff9500;
}

.recharge-btn:hover {
  background: #ff9500;
  transform: translateY(-2px);
}

/* 提现按钮 - 红色 */
.withdraw-btn {
  background: #ff9500;
}

.withdraw-btn:hover {
  background: #ff9500;
  transform: translateY(-2px);
}

/* 记录按钮 - 蓝色 */
.record-btn {
  background: #ff9500;
}

.record-btn:hover {
  background: #ff9500;
  transform: translateY(-2px);
}

.action-btn span {
  white-space: nowrap;
}

.action-btn .van-icon {
  font-size: 18px;
}

/* 移动端按钮响应式 */
@media (max-width: 768px) {
  .action-buttons-section {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .action-btn {
    font-size: 13px;
    padding: 10px 12px;
    gap: 6px;
    min-height: 45px;
    border-radius: 8px;
  }

  .action-btn .van-icon {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .action-buttons-section {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .action-btn {
    font-size: 12px;
    padding: 8px 10px;
    gap: 5px;
    min-height: 40px;
    border-radius: 8px;
  }

  .action-btn .van-icon {
    font-size: 14px;
  }
}

@media (max-width: 375px) {
  .action-buttons-section {
    gap: 6px;
  }

  .action-btn {
    font-size: 11px;
    padding: 6px 8px;
    gap: 4px;
    min-height: 36px;
  }

  .action-btn .van-icon {
    font-size: 12px;
  }

  .action-btn span {
    font-size: 13px;
  }
}

/* 未登录状态样式 */
.login-prompt-section {
  padding: 15px 0px 0px 0px;
}

.login-prompt-content {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.login-icon {
  flex-shrink: 0;
}

.login-message {
  flex: 1;
}

.login-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
}

.login-subtitle {
  font-size: 14px;
  color: #cccccc;
  line-height: 1.4;
}

.login-actions {
  display: flex;
  gap: 10px;
}

.login-btn,
.register-btn {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn {
  background: linear-gradient(135deg, #ff9500 0%, #ff8c00 100%);
  color: white;
}

.login-btn:hover {
  background: linear-gradient(135deg, #ff8c00 0%, #ff7700 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 149, 0, 0.3);
}

.register-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.register-btn:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.login-btn:active,
.register-btn:active {
  transform: translateY(1px);
}

.login-btn span,
.register-btn span {
  white-space: nowrap;
}

.page-header {
  padding: 0;
}



/* 游戏区域 */
.game-container {
  background: #2C2C2C;
  box-sizing: border-box;
  margin: 12px;
  margin-top: 0;
  padding: 12px;
  border-radius: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* 加载和错误状态 */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
  width: 100%;
  min-height: 300px;
  /* 确保有足够的高度 */
  min-width: 200px;
  /* 确保有最小宽度 */
}

.games-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
  background-color: #2a2a2a;
  border-radius: 8px;
  margin: 10px 0;
}

.loading-text {
  margin-top: 15px;
  font-size: 14px;
  color: #ff9500;
}

.no-games {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.error-text,
.no-games-text,
.no-categories-text {
  margin-top: 15px;
  font-size: 14px;
  color: #ff9500;
  font-weight: bold;
}

/* 游戏内容布局 */
.game-content-wrapper {
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* 顶级分类横向布局 */
.top-categories-horizontal {
  width: 100%;
  flex-shrink: 0;
  padding-bottom: 15px;
  border-bottom: 1px solid #111;
}

.top-categories-scroll {
  width: 100%;
  overflow: visible;
}

.top-categories-list {
  display: flex;
  gap: 8px;
  width: 100%;
}

.top-category-horizontal-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 12px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.top-category-horizontal-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 149, 0, 0.3);
}

.top-category-horizontal-item.active {
  background: rgba(255, 149, 0, 0.1);
  border-color: #ff9500;
  color: #ff9500;
}

.top-category-horizontal-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.top-category-horizontal-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.top-category-horizontal-name {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  color: #ccc;
}

.top-category-horizontal-item.active .top-category-horizontal-name {
  color: #fff;
}

/* 游戏内容区域 */
.game-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* 游戏侧边栏 */
.game-sidebar {
  width: 90px;
  min-width: 90px;
  /* 确保侧边栏不会被压缩 */
  background-color: #1a1a1a;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  overflow-y: auto;
  /* 如果分类过多，可以滚动 */
  height: 100%;
  /* 确保侧边栏填充整个高度 */
  /* 隐藏滚动条但保持滚动功能 */
  -ms-overflow-style: none;
  /* IE和Edge */
  scrollbar-width: none;
  /* Firefox */
}

/* 隐藏游戏侧边栏的Webkit滚动条 */
.game-sidebar::-webkit-scrollbar {
  display: none;
}

.sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-item.active {
  background-color: #333;
  position: relative;
}

.sidebar-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: #ff9500;
}

.sidebar-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
}

.sidebar-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.sidebar-text {
  font-size: 12px;
  color: #ccc;
  text-align: center;
}

.sidebar-item.active .sidebar-text {
  color: #ff9500;
}



/* 游戏内容区域 */
.game-content {
  flex: 1;
  padding: 15px;
  width: 100%;
  /* 确保内容区域占满可用空间 */
  min-width: 250px;
  /* 设置最小宽度，确保即使没有内容也能保持一定宽度 */
  display: flex;
  flex-direction: column;
  height: 100%;
  /* 确保内容区域填充整个高度 */
  overflow: hidden;
  /* 防止整个内容区域滚动 */
  min-height: 0;
  /* 允许flex收缩 */
}

/* 分类标题 */
.category-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 12px;
}

.title-icon-before {
  width: 16px;
  height: 16px;
}

.category-title {
  font-size: 18px;
  font-weight: bold;
  color: #ff9500;
  margin: 0 4px;
}

/* 游戏列表容器 - 包含所有状态 */
.games-container {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  /* 为绝对定位的子元素提供参考 */
  min-height: 0;
  /* 允许flex收缩 */
  min-width: 200px;
  /* 设置最小宽度，确保容器不会完全收缩 */
  overflow-y: auto;
  /* 垂直滚动 */
  overflow-x: hidden;
  /* 隐藏水平滚动 */

  /* 隐藏滚动条但保持滚动功能 */
  -ms-overflow-style: none;
  /* IE和Edge */
  scrollbar-width: none;
  /* Firefox */
}

/* 隐藏Webkit滚动条 */
.games-container::-webkit-scrollbar {
  display: none;
}

/* 一级分类列表容器 */
.categories-container {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 200px;
  overflow-y: auto;
  overflow-x: hidden;

  /* 隐藏滚动条但保持滚动功能 */
  -ms-overflow-style: none;
  /* IE和Edge */
  scrollbar-width: none;
  /* Firefox */
}

/* 隐藏Webkit滚动条 */
.categories-container::-webkit-scrollbar {
  display: none;
}

/* 一级分类列表 */
.sub-categories-list {
  width: 100%;
  padding-bottom: 15px;
}

/* 一级分类项 */
.sub-category-item {
  margin-bottom: 10px;
  background-color: #333;
  border-radius: 8px;
  overflow: hidden;
}

/* 一级分类头部 */
.sub-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
}

.sub-category-header:hover {
  background-color: #444;
}

.sub-category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sub-category-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sub-category-icon img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.sub-category-name {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.expand-icon {
  font-size: 18px;
  color: #ccc;
  transition: color 0.3s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.sub-category-header:hover .expand-icon {
  color: #ff9500;
  background-color: rgba(255, 149, 0, 0.1);
}

.custom-arrow {
  font-size: 14px;
  font-weight: bold;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* 游戏区域 */
.games-section {
  border-top: 1px solid #444;
  padding: 0;
}

/* 新的加载和错误状态 */
.loading-state,
.error-state,
.no-categories {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  min-height: 200px;
}



/* 游戏列表网格 */
.games-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  padding: 10px 0;
  min-width: 200px;
}

/* 精简分页控件样式 */
.pagination-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-btn-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #333;
  color: #fff;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn-compact:hover:not(:disabled) {
  background-color: #444;
  border-color: #ff9500;
  color: #ff9500;
}

.page-btn-compact:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #2a2a2a;
  color: #666;
}

.page-info-compact {
  font-size: 13px;
  color: #ccc;
  white-space: nowrap;
  min-width: 60px;
  text-align: center;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ccc;
}

.jump-label {
  white-space: nowrap;
}

.jump-input {
  width: 40px;
  height: 24px;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 12px;
  padding: 0 4px;
}

.jump-input:focus {
  outline: none;
  border-color: #ff9500;
}

.jump-total {
  white-space: nowrap;
}

.total-info {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .pagination-compact {
    gap: 8px;
    padding: 10px 0;
    font-size: 11px;
  }

  .page-btn-compact {
    width: 28px;
    height: 28px;
  }

  .page-info-compact {
    font-size: 12px;
    min-width: 50px;
  }

  .page-jump {
    font-size: 11px;
    gap: 3px;
  }

  .jump-input {
    width: 35px;
    height: 22px;
    font-size: 11px;
  }

  .total-info {
    font-size: 11px;
  }

  /* 在极小屏幕上隐藏总数信息 */
  @media (max-width: 360px) {
    .total-info {
      display: none;
    }
  }
}

.game-item {
  background: linear-gradient(135deg, #333 0%, #444 100%);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  border: 1px solid #555;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.game-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(255, 149, 0, 0.3);
  border-color: #ff9500;
}

.game-item:active {
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

.game-item::after {
  content: 'Play';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 149, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.game-item:hover::after {
  opacity: 1;
}

/* 占位项样式 */
.placeholder-item {
  background-color: #2a2a2a;
  cursor: default;
  opacity: 0.5;
}

.placeholder-item:hover {
  transform: none;
  box-shadow: none;
}

.placeholder-item::after {
  display: none;
}

.game-image {
  width: 100%;
  height: 70px;
  overflow: hidden;
  background-color: #444;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-name {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.8) 100%);
  transition: all 0.3s ease;
}

.game-item:hover .game-name {
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.8) 0%, rgba(255, 119, 0, 0.9) 100%);
  color: #fff;
}

/* 底部导航 */
.bottom-nav {
  height: 50px;
  background-color: #222;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #333;
  flex-shrink: 0;
  /* 不允许收缩 */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  /* 确保始终显示在最上层 */
  width: 100%;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  text-decoration: none;
}

.tabbar-icon {
  width: 24px;
  height: 24px;

}

.nav-item.active,
.nav-item.router-link-active {
  color: #ff9500;
}

.nav-text {
  font-size: 12px;
}

/* 游戏确认弹窗样式 */
.game-confirm-popup {
  background-color: #222;
  border-radius: 12px;
  color: #fff;
  max-width: 350px;
  width: 90%;
}

.game-confirm-content {
  padding: 0;
}

.game-confirm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 15px;
  border-bottom: 1px solid #333;
}

.game-confirm-header h3 {
  margin: 0;
  font-size: 18px;
  color: #fff;
}

.game-confirm-body {
  padding: 20px;
  text-align: center;
}

.game-image-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.game-preview-image {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid #444;
}

.game-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #444;
}

.game-info {
  text-align: center;
}

.game-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.game-description {
  font-size: 14px;
  color: #ccc;
  line-height: 1.5;
}

.game-confirm-actions {
  display: flex;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid #333;
}

.cancel-game-btn,
.confirm-game-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-game-btn {
  background-color: #333;
  color: #ccc;
}

.cancel-game-btn:hover {
  background-color: #444;
}

.confirm-game-btn {
  background: linear-gradient(135deg, #ff9500 0%, #ff8c00 100%);
  color: #fff;
}

.confirm-game-btn:hover {
  background: linear-gradient(135deg, #ff8c00 0%, #ff7700 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
}

.cancel-game-btn:active,
.confirm-game-btn:active {
  transform: translateY(0);
}

/* ==========新布局样式========== */




/* 选中分类的游戏展示区域 */
.selected-category-games {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.selected-category-games::-webkit-scrollbar {
  display: none;
}

/* 无选中分类提示 */
.no-selected-category {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.no-selected-text {
  font-size: 14px;
  text-align: center;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .top-categories-list {
    gap: 8px;
  }

  .top-category-horizontal-item {
    padding: 10px 6px;
  }

  .top-category-horizontal-icon {
    width: 35px;
    height: 35px;
    margin-bottom: 5px;
  }

  .top-category-horizontal-name {
    font-size: 13px;
  }

  .games-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .top-categories-list {
    gap: 8px;
  }

  .top-category-horizontal-item {
    padding: 8px 4px;
  }

  .top-category-horizontal-icon {
    width: 30px;
    height: 30px;
    margin-bottom: 4px;
  }

  .top-category-horizontal-name {
    font-size: 12px;
  }

  .games-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}

/* 二级分类网格 */
.secondary-categories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 15px 0;
  /* 4行3列，每页最多显示12个 */
}

.secondary-category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-category-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 149, 0, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
}

.secondary-category-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.secondary-category-icon img {
  border-radius: 6px;
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.secondary-category-name {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

/* 二级分类加载状态 */
.secondary-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 15px;
}

/* 选中的二级分类游戏区域 */
.selected-secondary-games {
  margin-top: 20px;
}

/* 二级分类分页样式 */

/* 占位符图标 */
.placeholder-icon {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon::before {
  content: '🎮';
  font-size: 16px;
}
</style>