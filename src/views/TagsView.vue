<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchTags } from '@/api/fetch-api'
import { BASE_URL } from '@/utils/config'

// 标签数据
interface TagData {
  tag_id: number
  tag_name: string
  tag_img: string
}

const tags = ref<TagData[]>([])
const isLoading = ref<boolean>(false)
const hasError = ref<boolean>(false)

// 获取标签数据
const fetchTagsData = async () => {
  isLoading.value = true
  hasError.value = false

  try {
    // 请求标签数据
    const result = await fetchTags()
    console.log('标签数据:', result)

    if (result.code === 1 && result.data && Array.isArray(result.data)) {
      // 处理API返回的标签数据
      const apiTags = result.data.map((item: any) => {
        return {
          tag_id: item.tag_id || 0,
          tag_name: item.tag_name || '',
          tag_img: processImageUrl(item.tag_img || ''),
        }
      })

      // 更新标签数据
      tags.value = apiTags

      console.log('处理后的标签数据:', tags.value)
    } else {
      console.log('没有获取到标签数据')
      tags.value = []
    }
  } catch (error) {
    console.error('获取标签数据请求失败:', error)
    hasError.value = true
    tags.value = []
  } finally {
    isLoading.value = false
  }
}

// 处理标签图片加载错误
const handleImageError = (event: Event, tag: TagData) => {
  console.error('标签图片加载失败:', tag.tag_name)

  // 图片加载失败时隐藏图片，但保留标签
  const imgElement = event.target as HTMLImageElement
  imgElement.style.display = 'none'
}

// 处理图片URL
const processImageUrl = (imgPath: string): string => {
  if (!imgPath) return ''

  let imageUrl = ''

  // 处理图片URL
  if (imgPath.startsWith('/')) {
    imageUrl = `${BASE_URL}${imgPath}`
  } else if (imgPath.startsWith('http')) {
    imageUrl = imgPath
  } else {
    imageUrl = `${BASE_URL}/${imgPath}`
  }

  return imageUrl
}

// 组件挂载时获取数据
onMounted(() => {
  fetchTagsData()
})
</script>

<template>
  <div class="tags-page">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <router-link to="/" class="back-btn">
        <van-icon name="arrow-left" color="#fff" size="20" />
      </router-link>
      <div class="page-title">全部分类</div>
      <div class="placeholder"></div>
    </div>

    <!-- 标签内容 -->
    <div class="tags-container">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <van-loading type="spinner" color="#ff9500" />
        <div class="loading-text">加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="hasError" class="error-state">
        <van-icon name="warning-o" size="24" color="#ff9500" />
        <div class="error-text">加载失败，请稍后再试</div>
      </div>

      <!-- 标签网格 -->
      <div v-else-if="tags.length > 0" class="tag-grid">
        <router-link
          v-for="tag in tags"
          :key="tag.tag_id"
          :to="`/tag/${tag.tag_id}?name=${encodeURIComponent(tag.tag_name)}`"
          class="tag-item"
        >
          <img
            :src="tag.tag_img"
            :alt="tag.tag_name"
            @error="(event) => handleImageError(event, tag)"
          />
          <div class="tag-overlay"></div>
          <div class="tag-content">{{ tag.tag_name }}</div>
        </router-link>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <van-icon name="photo-o" size="48" color="#666" />
        <div class="empty-text">暂无标签数据</div>
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
.tags-page {
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

/* 标签内容 */
.tags-container {
  padding: 15px;
}

/* 加载状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-text,
.error-text {
  margin-top: 15px;
  color: #999;
  font-size: 14px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.tag-item {
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 3/4;
  background-color: #333;
}

.tag-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.tag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
}

.tag-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  z-index: 1;
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

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.empty-text {
  margin-top: 15px;
  color: #999;
  font-size: 14px;
}
</style>
