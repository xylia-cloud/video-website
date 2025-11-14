<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NEW_API_BASE_URL } from '@/utils/config'
import { showToast, closeToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import { getUserInfo } from '@/api/fetch-api'

// 路由相关
const route = useRoute()

// 从路由参数获取信息
const topCategoryId = ref(route.params.topCategoryId as string)
const primaryCategoryId = ref(route.params.primaryCategoryId as string)
const topCategoryName = ref((route.query.topCategoryName as string) || '')
const primaryCategoryName = ref((route.query.primaryCategoryName as string) || '')

// 二级分类接口
interface SecondaryCategory {
  id: string
  name: string
  icon: string
  primary_id: string
  ismy?: number
  expanded?: boolean
  games?: Game[]
  loading?: boolean
  pagination?: PaginationInfo
  jumpPage?: number
}

// 游戏数据
interface Game {
  id: number
  name: string
  imageUrl: string
  biaoshi: string
  code?: string
  type?: string
}

// 分页信息接口
interface PaginationInfo {
  currentPage: number
  totalCount: number
  totalPages: number
  pageSize: number
}

// 二级分类数据
const secondaryCategories = ref<SecondaryCategory[]>([])
const isLoadingSecondaryCategories = ref(false)
const hasSecondaryCategoriesError = ref(false)

// 二级分类分页数据
const secondaryCategoriesPagination = ref({
  currentPage: 1,
  totalCount: 0,
  totalPages: 0,
  pageSize: 12,
})
const secondaryCategoriesJumpPage = ref(1)

// 全屏加载状态
const isGlobalLoading = ref(false)

// 防重复请求标记
const isSecondaryCategoriesLoading = ref(false)

// 搜索相关
const searchKeyword = ref('')
const isSearching = ref(false)
const searchResults = ref<Game[]>([])
const hasSearchResults = ref(false)

// 进入游戏接口
const enterGame = async (params: {
  uid: number
  token: string
  biaoshi: string
  type: string
  code: string
}) => {
  console.log('调用进入游戏接口，参数:', params)

  // 构建查询参数
  const queryParams = new URLSearchParams({
    service: 'gameapi.entergame',
  })

  // 构建POST请求体参数
  const formData = new URLSearchParams({
    uid: String(params.uid),
    token: params.token,
    biaoshi: params.biaoshi,
    type: params.type,
    code: params.code,
  })

  try {
    // 发起POST请求
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    console.log('进入游戏接口返回:', result)

    // 处理接口返回结果
    if (result && result.ret === 200 && result.data) {
      if (result.data.code === 0) {
        return {
          code: 1,
          data: result.data.info || {},
          msg: result.data.msg || '进入游戏成功',
        }
      } else {
        return {
          code: 0,
          data: null,
          msg: result.data.msg || '进入游戏失败',
        }
      }
    } else {
      return {
        code: 0,
        data: null,
        msg: result?.msg || '进入游戏失败',
      }
    }
  } catch (error) {
    console.error('进入游戏接口请求错误:', error)
    throw error
  }
}

// 搜索游戏
const searchGames = async (keyword: string) => {
  if (!keyword.trim()) {
    // 如果搜索关键词为空，清空搜索结果
    searchResults.value = []
    hasSearchResults.value = false
    return
  }

  isSearching.value = true
  // 显示搜索中的toast
  showToast({
    type: 'loading',
    message: '搜索中...',
    duration: 0, // 持续显示，直到手动关闭
    forbidClick: true, // 禁止点击
    loadingType: 'spinner',
  })

  try {
    console.log('🔍 开始搜索游戏，关键词:', keyword)

    // 构建查询参数 - 使用gettwoclass接口进行搜索
    const queryParams = new URLSearchParams({
      service: 'Caipiao.Gettwoclass',
    })

    // 构建GET请求参数
    const searchParams = new URLSearchParams({
      pid: topCategoryId.value,
      oneclass_id: primaryCategoryId.value,
      game_name: keyword.trim(),
    })

    // 发起GET请求（根据API示例使用GET方法）
    const response = await fetch(
      `${NEW_API_BASE_URL}/?${queryParams.toString()}&${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    console.log('🔍 搜索游戏结果:', result)

    if (result && result.ret === 200 && result.data && result.data.code === 0 && result.data.info) {
      // 处理搜索结果 - 兼容data为null的情况
      let games: Game[] = []

      if (result.data.info.data && Array.isArray(result.data.info.data)) {
        games = result.data.info.data.map((item: Record<string, unknown>) => ({
          id: Number(item.id) || 0,
          name: String(item.name || '未命名游戏'),
          imageUrl: String(item.icon || ''),
          biaoshi: String(item.biaoshi || ''),
          code: String(item.code || ''),
          type: String(item.type || ''),
        }))
      }

      searchResults.value = games
      hasSearchResults.value = true

      console.log('🔍 搜索到游戏数量:', games.length)

      // 不需要显示toast，让UI自然显示无结果状态
    } else {
      console.error('搜索游戏失败:', result)
      searchResults.value = []
      hasSearchResults.value = false
      showToast('搜索失败，请稍后重试')
    }
  } catch (error) {
    console.error('搜索游戏请求错误:', error)
    searchResults.value = []
    hasSearchResults.value = false
    showToast('搜索失败，请检查网络连接')
  } finally {
    isSearching.value = false
    // 关闭搜索中的toast
    closeToast()
  }
}

// 处理搜索输入
const handleSearchInput = () => {
  const keyword = searchKeyword.value.trim()
  if (keyword) {
    // 防抖处理，延迟搜索
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      searchGames(keyword)
    }, 500)
  } else {
    // 清空搜索结果
    searchResults.value = []
    hasSearchResults.value = false
  }
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  hasSearchResults.value = false
  clearTimeout(searchTimeout)
}

// 搜索防抖定时器
let searchTimeout: NodeJS.Timeout

// 获取游戏列表数据（直接获取该分类下的所有游戏）
const fetchGamesData = async (page: number = 1) => {
  if (isSecondaryCategoriesLoading.value) {
    console.log('🔄 游戏数据正在加载中，跳过重复请求')
    return
  }

  isSecondaryCategoriesLoading.value = true
  isGlobalLoading.value = true
  isLoadingSecondaryCategories.value = true
  hasSecondaryCategoriesError.value = false

  try {
    // 构建查询参数 - 使用gettwoclass获取游戏列表
    const queryParams = new URLSearchParams({
      service: 'caipiao.gettwoclass',
    })

    // 构建POST请求体参数
    const formData = new URLSearchParams({
      pid: topCategoryId.value,
      oneclass_id: primaryCategoryId.value,
      p: page.toString(),
      limit: '18',
    })

    // 发起POST请求
    const response = await fetch(`${NEW_API_BASE_URL}/?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    console.log('获取游戏列表数据:', result)

    if (
      result &&
      result.ret === 200 &&
      result.data &&
      result.data.code === 0 &&
      result.data.info &&
      Array.isArray(result.data.info.data)
    ) {
      // 处理游戏数据
      const games = result.data.info.data.map((item: Record<string, unknown>) => ({
        id: Number(item.id) || 0,
        name: String(item.name || '未命名游戏'),
        imageUrl: String(item.icon || ''),
        biaoshi: String(item.biaoshi || ''),
        code: String(item.code || ''),
        type: String(item.type || ''),
      }))

      // 创建一个虚拟的分类来包含所有游戏
      const gameCategory = {
        id: 'all-games',
        name: '全部游戏',
        icon: '',
        primary_id: primaryCategoryId.value,
        ismy: 0,
        expanded: true,
        games: games,
        loading: false,
        pagination: {
          currentPage: page,
          totalCount: parseInt(result.data.info.total || '0'),
          totalPages: Math.ceil(parseInt(result.data.info.total || '0') / 12),
          pageSize: 12,
        },
      }

      secondaryCategories.value = [gameCategory]

      // 从后端响应中获取分页信息
      const totalCount = parseInt(result.data.info.total || '0')
      const pageSize = 12
      const totalPages = Math.ceil(totalCount / pageSize)

      // 更新分页信息
      secondaryCategoriesPagination.value = {
        currentPage: page,
        totalCount,
        totalPages,
        pageSize,
      }
      console.log('处理后的游戏数据:', games)
    } else {
      console.log(`没有获取到分类 ${primaryCategoryId.value} 的游戏数据`)
      secondaryCategories.value = []
    }
  } catch (error) {
    console.error('获取游戏数据失败:', error)
    hasSecondaryCategoriesError.value = true
    secondaryCategories.value = []
  } finally {
    isSecondaryCategoriesLoading.value = false
    isGlobalLoading.value = false
    isLoadingSecondaryCategories.value = false
  }
}

// 处理二级分类点击（现在不需要，因为直接显示游戏）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleSecondaryCategoryClick = (secondaryCategory: SecondaryCategory) => {
  console.log('点击分类:', secondaryCategory)
  // 由于现在直接显示游戏列表，这个函数暂时不需要特殊处理
}

// 处理游戏点击
const handleGameClick = async (game: Game) => {
  console.log('点击游戏:', game)

  try {
    // 检查用户登录状态
    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.token) {
      showToast('请先登录再进入游戏')
      return
    }

    // 兼容游客用户和正式用户的数据结构
    const uid = userInfo.user_id || userInfo.id
    if (!uid) {
      showToast('用户信息不完整，请重新登录')
      return
    }

    // 显示加载提示
    showToast('正在进入游戏...')

    // 调用进入游戏接口
    const result = await enterGame({
      uid: uid,
      token: userInfo.token,
      biaoshi: game.biaoshi,
      type: game.type || '',
      code: game.code || String(game.id),
    })

    if (result && result.code === 1) {
      // 进入游戏成功
      console.log('进入游戏成功:', result)
      showToast(`成功进入游戏: ${game.name}`)

      // 处理游戏链接跳转 - 参考充值界面的iOS兼容方案
      if (result.data && result.data.purl) {
        const gameUrl = result.data.purl
        console.log('🔗 准备跳转到游戏页面:', gameUrl)

        // 使用 window.location.href 替代 window.open 以兼容iOS（参考充值界面实现）
        showToast('正在跳转到游戏...')

        // 延迟跳转，让用户看到提示
        setTimeout(() => {
          window.location.href = gameUrl
        }, 500)
      } else {
        console.warn('返回数据中没有找到游戏链接 (purl)')
        showToast('游戏启动成功，但未获取到游戏链接')
      }
    } else {
      // 进入游戏失败
      const errorMsg = result?.msg || '进入游戏失败'
      console.error('进入游戏失败:', errorMsg)
      showToast(errorMsg)
    }
  } catch (error) {
    console.error('进入游戏请求错误:', error)
    showToast('进入游戏失败，请稍后重试')
  }
}

// 处理分页点击
const handlePageChange = (secondaryCategory: SecondaryCategory, page: number) => {
  if (page < 1 || page > (secondaryCategory.pagination?.totalPages || 1)) return
  if (page === secondaryCategory.pagination?.currentPage) return

  fetchGamesData(page)
}

// 处理跳转页码
const handleJumpPage = (secondaryCategory: SecondaryCategory) => {
  const jumpPage = secondaryCategory.jumpPage
  if (!jumpPage || !secondaryCategory.pagination) return

  const targetPage = Number(jumpPage)
  if (targetPage >= 1 && targetPage <= secondaryCategory.pagination.totalPages) {
    handlePageChange(secondaryCategory, targetPage)
  }

  secondaryCategory.jumpPage = undefined
}

// 处理游戏列表分页点击
const handleSecondaryCategoriesPageChange = (page: number) => {
  if (page < 1 || page > secondaryCategoriesPagination.value.totalPages) return
  if (page === secondaryCategoriesPagination.value.currentPage) return

  fetchGamesData(page)
}

// 处理二级分类跳转页面
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleSecondaryCategoriesJumpPage = () => {
  const jumpPage = secondaryCategoriesJumpPage.value
  if (jumpPage && jumpPage >= 1 && jumpPage <= secondaryCategoriesPagination.value.totalPages) {
    handleSecondaryCategoriesPageChange(jumpPage)
  } else {
    // 重置为当前页
    secondaryCategoriesJumpPage.value = secondaryCategoriesPagination.value.currentPage
  }
}

// 组件挂载时获取数据
onMounted(() => {
  console.log('二级分类页面参数:', {
    topCategoryId: topCategoryId.value,
    primaryCategoryId: primaryCategoryId.value,
    topCategoryName: topCategoryName.value,
    primaryCategoryName: primaryCategoryName.value,
  })

  if (primaryCategoryId.value) {
    fetchGamesData(1)
  }
})
</script>

<template>
  <div class="game-secondary">
    <!-- 全屏Loading -->
    <div v-if="isGlobalLoading" class="fullscreen-loading">
      <div class="custom-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 头部导航 -->
    <HeaderNav :title="primaryCategoryName" />

    <!-- 内容区域 -->
    <div class="content">
      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-input-container">
          <van-icon name="search" class="search-icon" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索游戏名称"
            class="search-input"
            @input="handleSearchInput"
            @keyup.enter="searchGames(searchKeyword)"
          />
          <van-icon v-if="searchKeyword" name="clear" class="clear-icon" @click="clearSearch" />
        </div>
      </div>

      <!-- 搜索结果区域 -->
      <div v-if="hasSearchResults" class="search-results-section">
        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div class="search-results-header">
            <span class="results-title">搜索结果 ({{ searchResults.length }})</span>
            <button class="clear-search-btn" @click="clearSearch">
              <van-icon name="cross" size="14" />
              清空
            </button>
          </div>

          <div class="games-grid">
            <div
              class="game-item"
              v-for="game in searchResults"
              :key="game.id"
              @click="handleGameClick(game)"
            >
              <div class="game-image">
                <img v-if="game.imageUrl" :src="game.imageUrl" :alt="game.name" />
              </div>
              <div class="game-name">{{ game.name }}</div>
            </div>
          </div>
        </div>

        <!-- 搜索无结果 -->
        <div v-else class="no-search-results">
          <van-icon name="search" size="48" color="#666" />
          <div class="no-results-text">未找到相关游戏</div>
          <div class="no-results-tip">请尝试其他关键词</div>
        </div>
      </div>

      <!-- 游戏列表加载状态 -->
      <div v-if="isLoadingSecondaryCategories && !hasSearchResults" class="secondary-loading">
        <div class="custom-spinner"></div>
        <div class="loading-text">加载游戏中...</div>
      </div>

      <!-- 游戏列表错误状态 -->
      <div v-else-if="hasSecondaryCategoriesError" class="error-state">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载游戏失败</div>
      </div>

      <!-- 当前选中二级分类的游戏展示区域 -->
      <div v-if="!hasSearchResults" class="selected-secondary-games">
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
                <div
                  class="game-item"
                  v-for="game in secondaryCategory.games"
                  :key="game.id"
                  @click="handleGameClick(game)"
                >
                  <div class="game-image">
                    <img v-if="game.imageUrl" :src="game.imageUrl" :alt="game.name" />
                  </div>
                  <div class="game-name">{{ game.name }}</div>
                </div>
              </div>

              <!-- 精简分页控件 -->
              <div
                v-if="secondaryCategory.pagination && secondaryCategory.pagination.totalPages > 1"
                class="pagination-compact"
              >
                <!-- 上一页 -->
                <button
                  class="page-btn-compact"
                  :disabled="secondaryCategory.pagination.currentPage <= 1"
                  @click="
                    handlePageChange(
                      secondaryCategory,
                      secondaryCategory.pagination.currentPage - 1,
                    )
                  "
                >
                  <van-icon name="arrow-left" size="14" />
                </button>

                <!-- 当前页信息 -->
                <span class="page-info-compact">
                  {{ secondaryCategory.pagination.currentPage }}/{{
                    secondaryCategory.pagination.totalPages
                  }}
                </span>

                <!-- 下一页 -->
                <button
                  class="page-btn-compact"
                  :disabled="
                    secondaryCategory.pagination.currentPage >=
                    secondaryCategory.pagination.totalPages
                  "
                  @click="
                    handlePageChange(
                      secondaryCategory,
                      secondaryCategory.pagination.currentPage + 1,
                    )
                  "
                >
                  <van-icon name="arrow" size="14" />
                </button>

                <!-- 跳转输入框 -->
                <div class="page-jump">
                  <span class="jump-label">跳转</span>
                  <input
                    v-model="secondaryCategory.jumpPage"
                    type="number"
                    class="jump-input"
                    :min="1"
                    :max="secondaryCategory.pagination.totalPages"
                    @keyup.enter="handleJumpPage(secondaryCategory)"
                    @blur="handleJumpPage(secondaryCategory)"
                    placeholder=""
                  />
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

      <!-- 无游戏时的提示 -->
      <div
        v-if="
          !isLoadingSecondaryCategories &&
          !hasSecondaryCategoriesError &&
          secondaryCategories.length === 0
        "
        class="no-selected-category"
      >
        <div class="no-selected-text">该分类下暂无游戏</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-secondary {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
}

/* 内容区域 */
.content {
  padding: 15px;
  margin-top: 50px; /* 为固定定位的HeaderNav留出空间 */
}

/* 搜索区域 */
.search-section {
  margin-bottom: 20px;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #2c2c2c;
  border-radius: 25px;
  padding: 0 15px;
  height: 44px;
}

.search-icon {
  color: #999;
  margin-right: 10px;
  font-size: 16px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 14px;
  height: 100%;
}

.search-input::placeholder {
  color: #999;
}

.clear-icon {
  color: #999;
  margin-left: 10px;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

.clear-icon:hover {
  color: #ff9500;
}

/* 搜索结果区域 */
.search-results-section {
  margin-bottom: 20px;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 5px;
}

.results-title {
  color: #ff9500;
  font-size: 16px;
  font-weight: bold;
}

.clear-search-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 149, 0, 0.1);
  border: 1px solid rgba(255, 149, 0, 0.3);
  border-radius: 15px;
  padding: 4px 8px;
  color: #ff9500;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: rgba(255, 149, 0, 0.2);
  border-color: rgba(255, 149, 0, 0.5);
}

.no-search-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-results-text {
  margin-top: 15px;
  color: #999;
  font-size: 16px;
  font-weight: 500;
}

.no-results-tip {
  margin-top: 8px;
  color: #666;
  font-size: 14px;
}

/* 全屏Loading */
.fullscreen-loading {
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
}

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

.loading-text {
  margin-top: 15px;
  color: #ff9500;
  font-size: 16px;
  font-weight: 500;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.error-text {
  margin-top: 15px;
  font-size: 14px;
  color: #ff9500;
  font-weight: bold;
}

/* 二级分类网格 */
.secondary-categories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 15px 0;
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

.placeholder-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #333, #555);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.secondary-category-name {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
  color: #fff;
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

/* 分页控件 */
.pagination-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 0;
  margin: 15px 0;
}

.page-btn-compact {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn-compact:hover:not(:disabled) {
  background: rgba(255, 149, 0, 0.2);
  border-color: #ff9500;
}

.page-btn-compact:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info-compact {
  font-size: 14px;
  color: #fff;
  min-width: 60px;
  text-align: center;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 5px;
}

.jump-label,
.jump-total {
  font-size: 12px;
  color: #999;
}

.jump-input {
  width: 50px;
  height: 28px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 12px;
}

.total-info {
  font-size: 12px;
  color: #999;
}

/* 游戏区域 */
.selected-secondary-games {
  margin-top: 20px;
}

.games-section {
  margin-bottom: 20px;
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

.games-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.game-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.game-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.game-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-name {
  font-size: 12px;
  color: #fff;
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
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

.no-games-text {
  font-size: 14px;
  color: #999;
}

.no-selected-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.no-selected-text {
  font-size: 14px;
  color: #999;
}
</style>
