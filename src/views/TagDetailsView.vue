<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import VideoList from '@/components/VideoList.vue'
import { API_PREFIX, BASE_URL, DEFAULT_PAGE_SIZE } from '@/utils/config'
import { createAuthHeaders } from '@/api/fetch-api'

// 获取路由参数
const route = useRoute()
const tagId = ref(parseInt(route.params.id as string))
const tagName = ref(decodeURIComponent((route.query.name as string) || ''))

// 视频和标签数据
interface VideoItem {
  id: number
  coverUrl: string
  title: string
  isVip?: boolean
  isFree?: boolean
  duration?: string
  class?: string
  time?: string
  points?: string
}

const videoData = ref<VideoItem[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const hasMoreVideos = ref(true)

// 页码信息
const currentPage = ref(1)
const totalPages = ref(1)

// 获取标签相关视频
const fetchTagVideos = async (page = 1) => {
  if (page === 1) {
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  hasError.value = false
  errorMessage.value = ''

  try {
    // 如果没有标签名称，无法请求
    if (!tagName.value) {
      throw new Error('标签名称不能为空')
    }

    // 构建请求参数
    const formData = new FormData()
    formData.append('tag_name', tagName.value)
    formData.append('limit', String(DEFAULT_PAGE_SIZE))
    formData.append('page', String(page))

    console.log('获取标签视频，参数:', {
      tag_name: tagName.value,
      limit: DEFAULT_PAGE_SIZE,
      page: page,
    })

    // 发起POST请求
    const response = await fetch(`${BASE_URL}/index.php/ajax/tagvod.html`, {
      method: 'POST',
      body: formData,
      headers: createAuthHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`)
    }

    const result = await response.json()
    console.log('标签视频数据:', result)

    // 更新页码信息
    if (result.page) {
      currentPage.value = parseInt(result.page)
    }
    if (result.pagecount) {
      totalPages.value = parseInt(result.pagecount)
    }

    // 检查是否还有更多数据
    hasMoreVideos.value = currentPage.value < totalPages.value

    // 处理API返回的数据
    let apiData = []

    // 适应不同的数据结构
    if (result.data && result.data.list) {
      // 新的数据结构 { data: { list: [...] } }
      apiData = result.data.list
    } else if (result.data) {
      // 直接返回数据列表 { data: [...] }
      apiData = Array.isArray(result.data) ? result.data : []
    } else if (result.list) {
      // 另一种结构 { list: [...] }
      apiData = result.list
    }

    // 映射字段
    const processedData = apiData.map((item: any) => {
      // 处理封面图片URL
      let coverUrl = ''
      if (item.vod_pic) {
        // 如果路径是相对路径，添加BASE_URL
        if (item.vod_pic.startsWith('/')) {
          coverUrl = `${BASE_URL}${item.vod_pic}`
        } else if (item.vod_pic.startsWith('http')) {
          coverUrl = item.vod_pic
        } else {
          // 相对路径，需要拼接BASE_URL和斜杠
          coverUrl = `${BASE_URL}/${item.vod_pic}`
        }
      } else {
        coverUrl = ''
      }

      // 判断是否付费内容
      const pointsPlay = item.vod_points_play !== undefined ? Number(item.vod_points_play) : 0
      const isVip = pointsPlay > 0
      const isFree = !isVip

      return {
        id: item.id || item.vod_id || 0,
        coverUrl: coverUrl,
        title: item.vod_name || item.title || '',
        isVip: isVip,
        isFree: isFree,
        duration: item.vod_duration || '',
        class: item.vod_class || item.type_name || '',
        time: item.vod_pubdate || item.vod_time || item.vod_time_add || '',
        points: isVip ? pointsPlay + '积分' : '',
      }
    })

    // 判断是加载更多还是第一页
    if (page > 1) {
      // 加载更多，将新数据追加到现有数据后面
      videoData.value = [...videoData.value, ...processedData]
    } else {
      // 第一页，直接替换数据
      videoData.value = processedData
    }

    // 自动增加页码，为下次加载做准备
    currentPage.value = page

    console.log('处理后的视频数据:', videoData.value)
  } catch (error: any) {
    console.error('获取标签视频失败:', error)
    hasError.value = true

    // 显示明确的错误信息
    if (error.message) {
      errorMessage.value = error.message
    }
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// 添加滚动监听，检测何时到达底部
const checkScrollBottom = () => {
  // 如果已经在加载，或者没有更多数据，或者有错误，则不处理
  if (isLoading.value || isLoadingMore.value || !hasMoreVideos.value || hasError.value) {
    return
  }

  // 获取滚动位置
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  // 获取视口高度
  const windowHeight = window.innerHeight
  // 获取文档总高度
  const documentHeight = document.documentElement.scrollHeight

  // 当距离底部不足100px时，加载更多
  if (documentHeight - (scrollTop + windowHeight) < 100) {
    loadMoreVideos()
  }
}

// 加载更多视频
const loadMoreVideos = () => {
  // 计算下一页，如果已到最后一页则不加载
  if (currentPage.value < totalPages.value && !isLoadingMore.value) {
    const nextPage = currentPage.value + 1
    console.log(`加载第 ${nextPage} 页数据`)
    fetchTagVideos(nextPage)
  } else {
    console.log('已经是最后一页了')
    hasMoreVideos.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  console.log('标签详情页面挂载，标签名称:', tagName.value)
  if (tagName.value) {
    fetchTagVideos(1)

    // 添加滚动监听
    window.addEventListener('scroll', checkScrollBottom)
  } else {
    hasError.value = true
    errorMessage.value = '标签名称不能为空'
  }
})

// 组件卸载前清理事件监听
onBeforeUnmount(() => {
  // 移除滚动事件监听
  window.removeEventListener('scroll', checkScrollBottom)
})
</script>

<template>
  <div class="tag-details-page">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <router-link to="/tags" class="back-btn">
        <van-icon name="arrow-left" color="#fff" size="20" />
      </router-link>
      <div class="page-title">{{ tagName || '标签' }} 视频</div>
      <div class="placeholder"></div>
    </div>

    <!-- 视频列表 -->
    <div class="content">
      <!-- 加载状态 -->
      <div v-if="isLoading && videoData.length === 0" class="loading-state">
        <van-loading type="spinner" color="#ff9500" />
        <div class="loading-text">加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="hasError" class="error-state">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载失败，请稍后再试</div>
        <div v-if="errorMessage" class="error-detail">{{ errorMessage }}</div>
      </div>

      <!-- 视频列表 -->
      <VideoList v-else-if="videoData.length > 0" :videos="videoData" returnPath="/tags" />

      <!-- 无数据状态 -->
      <div v-else class="empty-state">
        <van-icon name="info-o" size="24" color="#999" />
        <div class="empty-text">暂无相关视频</div>
      </div>

      <!-- 加载中状态 -->
      <div v-if="isLoadingMore" class="loading-more">
        <van-loading type="spinner" size="20" color="#ff9500" />
        <span>正在加载更多...</span>
      </div>

      <!-- 已全部加载 -->
      <div
        v-if="videoData.length > 0 && !hasMoreVideos && !isLoading && !isLoadingMore"
        class="all-loaded"
      >
        已经到底了~
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <router-link to="/" class="nav-item">
        <img src="@/assets/img/icon-tabbar-home-normal.svg" alt="首页" class="tabbar-icon" />
        <div class="nav-text">首页</div>
      </router-link>
      <router-link to="/live" class="nav-item">
        <img src="@/assets/img/icon-tabbar-live-normal.svg" alt="活动" class="tabbar-icon" />
        <div class="nav-text">活动</div>
      </router-link>
      <router-link to="/game" class="nav-item">
        <img src="@/assets/img/icon-tabbar-game-normal.svg" alt="游戏" class="tabbar-icon" />
        <div class="nav-text">游戏</div>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <img src="@/assets/img/icon-tabbar-account-normal.svg" alt="我的" class="tabbar-icon" />
        <div class="nav-text">我的</div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.tag-details-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 50px;
}

/* 顶部导航栏 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background-color: #222;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-title {
  font-size: 16px;
  font-weight: bold;
}

.placeholder {
  width: 24px;
}

/* 内容区域 */
.content {
  padding: 15px;
}

/* 加载状态 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-text,
.error-text,
.empty-text {
  margin-top: 15px;
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

/* 加载更多按钮 */
.load-more {
  margin-top: 15px;
  margin-bottom: 15px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
  color: #999;
  font-size: 12px;
}

.loading-more span {
  margin-left: 5px;
}

.all-loaded {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 15px 0;
}

/* 底部导航 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #222;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #333;
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
</style>
