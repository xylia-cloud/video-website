<template>
  <div class="search-bar">
    <div class="search-input">
      <van-icon name="search" color="#999" />
      <input
        type="text"
        placeholder="影片名称"
        class="search-field"
        v-model="searchKeyword"
        @keyup.enter="handleSearch"
      />
      <van-icon
        v-if="searchKeyword"
        name="clear"
        color="#999"
        class="clear-icon"
        @click="clearSearch"
      />
    </div>
    <div class="app-download" @click="showDomainPopup = true">
      <img src="@/assets/img/icon-yjym.svg" alt="永久域名" />
      永久域名
    </div>

    <!-- 域名弹窗 -->
    <DomainPopup v-model:show="showDomainPopup" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DomainPopup from './DomainPopup.vue'

const router = useRouter()

interface Props {
  keyword?: string
}

interface Emits {
  (e: 'search', keyword: string): void
}

const props = withDefaults(defineProps<Props>(), {
  keyword: '',
})

const emit = defineEmits<Emits>()

const searchKeyword = ref(props.keyword)
const showDomainPopup = ref(false)

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    emit('search', searchKeyword.value.trim())
    // 跳转到搜索页面，并传递搜索关键词作为查询参数
    router.push({
      name: 'search',
      query: { wd: searchKeyword.value.trim() },
    })
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
}
</script>

<style scoped>
/* 顶部搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #111;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #333;
  border-radius: 20px;
  padding: 8px 15px;
  margin-right: 10px;
}

.search-field {
  flex: 1;
  background-color: transparent;
  border: none;
  outline: none;
  color: #fff;
  margin-left: 5px;
  font-size: 14px;
}

.search-field::placeholder {
  color: #999;
}

.clear-icon {
  cursor: pointer;
}

.app-download {
  color: #ff9500;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-download img {
  width: 24px;
}
</style>
