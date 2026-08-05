<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isLoggedIn, isTokenExpired, syncTokenExpiryWatcher } from '@/api/session'
import { registerUserStoreHydrate } from '@/api/user-store-sync'
import { useUserStore } from '@/stores/user'
import TopLoading from '@/components/TopLoading.vue'
import CustomerServiceButton from '@/components/CustomerServiceButton.vue'
import InstallBanner from '@/components/InstallBanner.vue'
import DailyDomainPopup from '@/components/DailyDomainPopup.vue'
import { useDailyDomainPopup } from '@/composables/useDailyDomainPopup'
import {
  CUSTOMER_SERVICE_MODAL_EVENT,
  type CustomerServiceModalDetail,
} from '@/utils/customerService'

const GlobalAuthModal = defineAsyncComponent(() => import('@/components/GlobalAuthModal.vue'))
const GlobalCustomerServiceModal = defineAsyncComponent(
  () => import('@/components/GlobalCustomerServiceModal.vue'),
)

type AuthTab = 'login' | 'register'

interface AuthModalDetail {
  tab?: AuthTab
  message?: string
}

const mountAuthModal = ref(false)
const mountCustomerServiceModal = ref(false)
const authModalReady = ref(false)
const customerServiceModalReady = ref(false)
const { showDailyDomainPopup } = useDailyDomainPopup()

let pendingAuthDetail: AuthModalDetail | undefined
let pendingCustomerServiceDetail: CustomerServiceModalDetail | undefined

const dispatchAuthModalOpen = (detail?: AuthModalDetail) => {
  window.dispatchEvent(
    new CustomEvent<AuthModalDetail>('open-global-auth-modal', { detail }),
  )
}

const dispatchCustomerServiceOpen = (detail?: CustomerServiceModalDetail) => {
  window.dispatchEvent(
    new CustomEvent<CustomerServiceModalDetail>(CUSTOMER_SERVICE_MODAL_EVENT, {
      detail: detail ?? {},
    }),
  )
}

const handleAuthModalOpen = (event: Event) => {
  if (authModalReady.value) {
    return
  }

  const customEvent = event as CustomEvent<AuthModalDetail>
  pendingAuthDetail = customEvent.detail
  mountAuthModal.value = true
}

const handleCustomerServiceOpen = (event: Event) => {
  if (customerServiceModalReady.value) {
    return
  }

  const customEvent = event as CustomEvent<CustomerServiceModalDetail>
  pendingCustomerServiceDetail = customEvent.detail
  mountCustomerServiceModal.value = true
}

const onAuthModalMounted = async () => {
  await nextTick()
  authModalReady.value = true

  if (pendingAuthDetail !== undefined) {
    dispatchAuthModalOpen(pendingAuthDetail)
    pendingAuthDetail = undefined
  }
}

const onCustomerServiceModalMounted = async () => {
  await nextTick()
  customerServiceModalReady.value = true

  if (pendingCustomerServiceDetail !== undefined) {
    dispatchCustomerServiceOpen(pendingCustomerServiceDetail)
    pendingCustomerServiceDetail = undefined
  }
}

const DAILY_DOMAIN_POPUP_KEY = 'daily_domain_popup_last_shown'

const handleDailyDomainPopupClose = () => {
  try {
    localStorage.setItem(DAILY_DOMAIN_POPUP_KEY, getTodayDateString())
  } catch {
    // 忽略存储失败
  }
  showDailyDomainPopup.value = false
}

const getTodayDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const shouldShowDailyDomainPopup = () => {
  try {
    return localStorage.getItem(DAILY_DOMAIN_POPUP_KEY) !== getTodayDateString()
  } catch {
    return true
  }
}

const route = useRoute()

const maybeShowDailyDomainPopup = () => {
  if (route.name === 'home' && shouldShowDailyDomainPopup()) {
    showDailyDomainPopup.value = true
  }
}

watch(
  () => route.name,
  () => {
    if (route.name === 'home') {
      maybeShowDailyDomainPopup()
    }
  },
)

// 应用启动时同步登录过期监听
onMounted(() => {
  const userStore = useUserStore()
  registerUserStoreHydrate(() => userStore.hydrateFromStorage())
  userStore.hydrateFromStorage()

  window.addEventListener('open-global-auth-modal', handleAuthModalOpen as EventListener)
  window.addEventListener(CUSTOMER_SERVICE_MODAL_EVENT, handleCustomerServiceOpen as EventListener)

  console.log('应用启动，检查TOKEN状态...')
  syncTokenExpiryWatcher()

  // 每天第一次进入弹出永久域名提示
  maybeShowDailyDomainPopup()

  // 延迟打印当前登录状态，方便排查过期问题
  setTimeout(() => {
    if (isTokenExpired()) {
      console.log('检测到TOKEN已过期，已由全局过期监听接管')
    } else if (isLoggedIn()) {
      console.log('TOKEN有效，用户已登录')
    } else {
      console.log('用户未登录，但允许浏览公开内容')
    }
  }, 1000)
})

onBeforeUnmount(() => {
  window.removeEventListener('open-global-auth-modal', handleAuthModalOpen as EventListener)
  window.removeEventListener(CUSTOMER_SERVICE_MODAL_EVENT, handleCustomerServiceOpen as EventListener)
})
</script>

<template>
  <div class="app-container">
    <TopLoading />
    <RouterView v-slot="{ Component, route }">
      <KeepAlive include="HomeView">
        <component
          :is="Component"
          :key="route.name === 'home' ? 'home' : route.fullPath"
        />
      </KeepAlive>
    </RouterView>
    <GlobalAuthModal v-if="mountAuthModal" @vue:mounted="onAuthModalMounted" />
    <GlobalCustomerServiceModal
      v-if="mountCustomerServiceModal"
      @vue:mounted="onCustomerServiceModalMounted"
    />
    <CustomerServiceButton />
    <InstallBanner />
    <DailyDomainPopup
      :show="showDailyDomainPopup"
      @update:show="handleDailyDomainPopupClose"
    />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  font-family: 'PingFang SC', 'Helvetica Neue', Helvetica, 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #222;
  color: #333;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

@media screen and (min-width: 768px) {
  body:after {
    content: '';
    position: fixed;
    top: 20px;
    left: 0;
    right: 0;
    text-align: center;
    color: #666;
    font-size: 14px;
    z-index: 1000;
    pointer-events: none;
  }
}
</style>
