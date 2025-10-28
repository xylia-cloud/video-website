<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon as VanIcon, showToast, showLoadingToast, closeToast, showDialog } from 'vant'
import { userLogin, isLoggedIn, touristLogin } from '@/api/fetch-api'
import { getDeviceIMEI } from '@/utils/device'
import bgImage from '@/assets/img/img-live.jpg'

const router = useRouter()
const route = useRoute()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

// 获取重定向地址
const redirectUrl = computed(() => {
  return (route.query.redirect as string) || '/'
})

// 从URL中获取邀请码
const inviteCode = computed(() => {
  return (route.query.invite as string) || ''
})

// 登录表单提交
const handleLogin = async () => {
  if (!username.value) {
    showToast({
      message: '请输入用户名',
      duration: 2000,
    })
    return
  }

  if (!password.value) {
    showToast({
      message: '请输入密码',
      duration: 2000,
    })
    return
  }

  try {
    isLoading.value = true
    showLoadingToast({
      message: '正在登录...',
      forbidClick: true,
    })

    const result = await userLogin({
      user_name: username.value,
      user_pwd: password.value,
    })

    if (result && result.code === 1) {
      console.log('登录成功，准备跳转到:', redirectUrl.value)
      showToast({
        message: '登录成功',
        duration: 2000,
      })

      // 登录成功后跳转到重定向地址或首页
      setTimeout(() => {
        console.log('开始跳转到:', redirectUrl.value)
        router.push(redirectUrl.value)
      }, 500)
    } else {
      showDialog({
        title: '登录失败',
        message: result?.msg || '请检查用户名和密码',
        confirmButtonText: '确定',
        confirmButtonColor: '#ff9500',
      })
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    showDialog({
      title: '登录失败',
      message: error.message || '网络连接失败，请稍后再试',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500',
    })
  } finally {
    isLoading.value = false
    closeToast()
  }
}

// 切换密码显示
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 跳转到注册页
const goToRegister = () => {
  // 修改注册页面跳转方式，确保参数正确传递
  const params: Record<string, string> = {}

  // 传递重定向地址
  if (redirectUrl.value && redirectUrl.value !== '/') {
    params['redirect'] = redirectUrl.value
  }

  // 优先使用URL中的邀请码
  if (inviteCode.value) {
    params['invite'] = inviteCode.value
    console.log('从登录页传递邀请码到注册页:', inviteCode.value)
  }

  // 使用replace而不是push，避免返回时回到带邀请码的登录页
  router.replace({
    path: '/register',
    query: params,
  })
}

// 跳转到找回账号页
const goToRecovery = () => {
  router.push('/recover')
}

// 跳转到忘记密码页
const goToForgotPassword = () => {
  router.push('/forgot-password')
}

// 游客登录
const handleGuestLogin = async () => {
  console.log('🎯 用户点击游客登录，开始执行游客登录流程')

  try {
    showLoadingToast({
      message: '正在进入游客模式...',
      forbidClick: true,
    })

    const deviceIMEI = getDeviceIMEI()
    console.log('📱 使用设备IMEI进行游客登录:', deviceIMEI)

    const result = await touristLogin(deviceIMEI)
    console.log('📥 游客登录API响应:', result)

    if (result.code === 1 && result.data) {
      // 游客登录成功
      console.log('✅ 游客登录成功，用户信息已保存到本地')

      closeToast()
      showToast({
        message: '游客登录成功',
        duration: 1000,
      })

      // 登录成功后跳转到个人中心
      setTimeout(() => {
        router.push('/profile')
      }, 1000)
    } else {
      // 游客登录失败
      closeToast()
      console.error('❌ 游客登录失败:', result)
      showDialog({
        title: '游客登录失败',
        message: result?.msg || '无法获取游客信息，请稍后重试',
        confirmButtonText: '确定',
        confirmButtonColor: '#ff9500',
      })
    }
  } catch (error) {
    console.error('❌ 游客登录异常:', error)
    closeToast()
    showDialog({
      title: '游客登录失败',
      message: (error as Error).message || '网络连接失败，请稍后再试',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500',
    })
  }
}

// 检查是否已登录
onMounted(() => {
  // 如果已经登录，直接跳转到重定向地址或首页
  if (isLoggedIn()) {
    router.push(redirectUrl.value)
    return
  }

  // 如果URL中有邀请码，需要处理一下特殊情况
  if (inviteCode.value) {
    console.log('登录页检测到邀请码:', inviteCode.value)

    // 如果当前URL的路径是/，但hash是#/login，这时邀请码在根路径上
    // 需要手动处理这种情况，直接跳转到注册页
    const currentHash = window.location.hash
    const rootInvite = window.location.search.includes('invite=')

    if (currentHash === '#/login' && rootInvite) {
      console.log('检测到邀请码在根路径，直接跳转到注册页')
      goToRegister()
    }
  }
})
</script>

<template>
  <div class="login-page">
    <!-- 图片背景 -->
    <div class="background-container">
      <div class="background-overlay"></div>
    </div>

    <!-- 应用图标和名称 -->
    <div class="app-logo">
      <div class="logo-container">
        <div class="logo-bg">
          <img src="@/assets/img/logo.png" alt="logo" class="logo-image" />
        </div>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="login-form">
      <div class="input-group">
        <input type="text" v-model="username" placeholder="请输入用户名" class="form-input" />
      </div>

      <div class="input-group">
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          placeholder="请输入密码"
          class="form-input"
        />
        <div class="password-toggle" @click="togglePasswordVisibility">
          <van-icon :name="showPassword ? 'eye-o' : 'closed-eye'" size="24" color="#999" />
        </div>
      </div>

      <button class="login-button" @click="handleLogin" :disabled="isLoading">
        {{ isLoading ? '登录中...' : '登录' }}
      </button>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <div class="action-item" @click="goToForgotPassword">
        <span class="action-text">忘记密码</span>
      </div>

      <div class="action-item guest-login" @click="handleGuestLogin">
        <span class="action-text">游客登录</span>
      </div>

      <div class="action-item" @click="goToRegister">
        <span class="action-text">注册账号</span>
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
      <router-link to="/profile" class="nav-item active">
        <img src="@/assets/img/icon-tabbar-account-active.svg" alt="我的" class="tabbar-icon" />
        <div class="nav-text">我的</div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  justify-content: center;
  padding-bottom: 50px;
  /* 为底部导航栏留出空间 */
}

/* 背景样式 */
.background-container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
  /* background-image: url('@/assets/img/img-live.jpg'); */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.background-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2;
}

/* 应用logo样式 */
.app-logo {
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-bg {
  width: 343px;
  background-color: #000;
  border-radius: 20px;
}

.logo-bg img {
  width: 100%;
  border-radius: 20px;
}

.app-name {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-top: 10px;
}

/* 登录表单样式 - 深色模式 */
.login-form {
  width: 85%;
  z-index: 3;
  margin-top: 0;
  margin-bottom: 24px;
}

.input-group {
  position: relative;
  margin-bottom: 15px;
}

.form-input {
  width: 100%;
  height: 50px;
  background-color: rgba(40, 40, 40, 0.8);
  color: #fff;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 0 15px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #aaa;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.login-button {
  width: 100%;
  height: 50px;
  background-color: #ff9500;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
}

/* 底部操作按钮 */
.bottom-actions {
  width: 100%;
  display: flex;
  justify-content: space-around;
  padding: 0 10%;
  margin-top: 0;
  margin-bottom: 20px;
  /* 增加与底部导航的间距 */
  z-index: 3;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.action-item:active {
  transform: scale(0.95);
}

.action-text {
  color: #ff9500;
  font-size: 16px;
  margin-top: 5px;
}

/* 游客登录按钮特殊样式 */
.action-item.guest-login .action-text {
  color: #00d4aa;
  font-weight: 500;
}

.action-item.guest-login:hover .action-text {
  color: #00b894;
}

/* 底部导航样式 */
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
  z-index: 10;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-item.active {
  color: #ff9500;
}

.nav-item.active .nav-text {
  color: #ff9500;
}

.tabbar-icon {
  width: 24px;
  height: 24px;
}

.nav-text {
  font-size: 12px;
  color: inherit;
}
</style>
