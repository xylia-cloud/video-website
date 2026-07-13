<template>
  <div class="search-bar">
    <div class="app-download" @click="handleDomainClick">
      <img src="@/assets/img/icon-yjym.svg" alt="永久网址" />
      永久网址
    </div>
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
    <div class="app-download-btn" @click="handleAppDownload">
      <img src="@/assets/img/icon-download.svg" alt="APP下载" />
      <span>APP下载</span>
    </div>
  </div>

  <GuestTipModal v-model:visible="showGuestTip" />
  <DomainPopup :show="showDomainPopup" @update:show="showDomainPopup = $event" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import GuestTipModal from '@/components/GuestTipModal.vue'
import DomainPopup from '@/components/DomainPopup.vue'

const router = useRouter()
const userStore = useUserStore()

const APP_DOWNLOAD_URL = 'https://download.jiji8.cc'

interface Props {
  keyword?: string
  guestSessionState?: 'loading' | 'ready' | 'failed'
}

interface Emits {
  (e: 'search', keyword: string): void
}

const props = withDefaults(defineProps<Props>(), {
  keyword: '',
  guestSessionState: 'ready',
})

const emit = defineEmits<Emits>()

const searchKeyword = ref(props.keyword)
const showGuestTip = ref(false)
const showDomainPopup = ref(false)

const openAppDownload = () => {
  window.open(APP_DOWNLOAD_URL, '_blank')
}

const handleDomainClick = () => {
  showDomainPopup.value = true
}

const handleAppDownload = () => {
  userStore.hydrateFromStorage()

  if (props.guestSessionState === 'loading') {
    showToast('正在恢复游客身份，请稍后再试')
    return
  }

  if (props.guestSessionState === 'failed') {
    showToast('游客身份初始化失败，请刷新后重试')
    return
  }

  if (userStore.isGuest) {
    showGuestTip.value = true
  } else {
    openAppDownload()
  }
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    emit('search', searchKeyword.value.trim())
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
  margin-right: 10px;
}

.app-download img {
  width: 24px;
}

.app-download-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ff9500;
  font-size: 10px;
  margin-left: 10px;
  cursor: pointer;
}

.app-download-btn img {
  width: 24px;
}

.app-download-btn span {
  margin-top: 2px;
}

</style>
