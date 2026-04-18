<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { closeToast, showToast } from 'vant'
import { registerUser, userLogin } from '@/api/fetch-api'

type AuthTab = 'login' | 'register'

interface AuthModalDetail {
  tab?: AuthTab
  message?: string
}

const isVisible = ref(false)
const activeTab = ref<AuthTab>('login')
const authMessage = ref('')
const isAuthLoading = ref(false)
const authErrorMsg = ref('')

const loginUsername = ref('')
const loginPassword = ref('')
const registerUsername = ref('')
const registerPassword = ref('')
const registerConfirmPassword = ref('')
const registerInviteCode = ref('')

const resetForm = () => {
  authErrorMsg.value = ''
  loginUsername.value = ''
  loginPassword.value = ''
  registerUsername.value = ''
  registerPassword.value = ''
  registerConfirmPassword.value = ''
  registerInviteCode.value = ''
}

const closeModal = () => {
  isVisible.value = false
  authMessage.value = ''
  resetForm()
}

const switchTab = (tab: AuthTab) => {
  activeTab.value = tab
  authErrorMsg.value = ''
}

const openModal = (detail?: AuthModalDetail) => {
  activeTab.value = detail?.tab || 'login'
  authMessage.value = detail?.message || '登录状态已失效，请重新登录'
  authErrorMsg.value = ''
  isVisible.value = true
}

const handleOpenEvent = (event: Event) => {
  const customEvent = event as CustomEvent<AuthModalDetail>
  openModal(customEvent.detail)
}

const handleLogin = async () => {
  if (!loginUsername.value || !loginPassword.value) {
    authErrorMsg.value = '用户名和密码不能为空'
    return
  }

  isAuthLoading.value = true
  authErrorMsg.value = ''

  try {
    const result = await userLogin({
      user_name: loginUsername.value,
      user_pwd: loginPassword.value,
    })

    if (result && result.code === 1) {
      showToast({
        message: '登录成功',
        duration: 2000,
        icon: 'success',
      })
      closeModal()
    } else {
      authErrorMsg.value = result?.msg || '登录失败，请检查账号密码'
    }
  } catch (error: any) {
    authErrorMsg.value = error?.message || '网络请求失败，请稍后再试'
  } finally {
    isAuthLoading.value = false
  }
}

const handleRegister = async () => {
  if (!registerUsername.value || !registerPassword.value || !registerConfirmPassword.value) {
    authErrorMsg.value = '请填写完整注册信息'
    return
  }

  if (registerPassword.value !== registerConfirmPassword.value) {
    authErrorMsg.value = '两次输入的密码不一致'
    return
  }

  isAuthLoading.value = true
  authErrorMsg.value = ''

  try {
    const result = await registerUser({
      country_code: 86,
      user_login: registerUsername.value,
      user_pass: registerPassword.value,
      user_pass2: registerConfirmPassword.value,
      rec_code: registerInviteCode.value || undefined,
    })

    if (result && result.code === 1) {
      showToast({
        message: '注册成功，请登录',
        duration: 2000,
        icon: 'success',
      })
      closeToast()
      activeTab.value = 'login'
      authErrorMsg.value = ''
      loginUsername.value = registerUsername.value
      loginPassword.value = ''
      registerPassword.value = ''
      registerConfirmPassword.value = ''
    } else {
      authErrorMsg.value = result?.msg || '注册失败，请稍后再试'
    }
  } catch (error: any) {
    authErrorMsg.value = error?.message || '网络请求失败，请稍后再试'
  } finally {
    isAuthLoading.value = false
  }
}

onMounted(() => {
  window.addEventListener('open-global-auth-modal', handleOpenEvent as EventListener)
})

onBeforeUnmount(() => {
  window.removeEventListener('open-global-auth-modal', handleOpenEvent as EventListener)
})
</script>

<template>
  <div v-if="isVisible" class="auth-modal-overlay">
    <div class="auth-modal">
      <div class="auth-tabs">
        <div
          class="auth-tab"
          :class="{ 'auth-tab-active': activeTab === 'login' }"
          @click="switchTab('login')"
        >
          登录
        </div>
        <div
          class="auth-tab"
          :class="{ 'auth-tab-active': activeTab === 'register' }"
          @click="switchTab('register')"
        >
          注册
        </div>
      </div>

      <div class="auth-content">
        <div v-if="authMessage" class="auth-message">{{ authMessage }}</div>

        <div v-if="activeTab === 'login'" class="auth-form">
          <div class="form-group">
            <label>用户名</label>
            <input
              v-model="loginUsername"
              type="text"
              placeholder="请输入用户名"
              :disabled="isAuthLoading"
            />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input
              v-model="loginPassword"
              type="password"
              placeholder="请输入密码"
              :disabled="isAuthLoading"
            />
          </div>
          <div v-if="authErrorMsg" class="auth-error">{{ authErrorMsg }}</div>
          <button class="auth-submit-btn" @click="handleLogin" :disabled="isAuthLoading">
            {{ isAuthLoading ? '登录中...' : '登录' }}
          </button>
        </div>

        <div v-else class="auth-form">
          <div class="form-group">
            <label>用户名</label>
            <input
              v-model="registerUsername"
              type="text"
              placeholder="请输入用户名"
              :disabled="isAuthLoading"
            />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input
              v-model="registerPassword"
              type="password"
              placeholder="请输入密码"
              :disabled="isAuthLoading"
            />
          </div>
          <div class="form-group">
            <label>确认密码</label>
            <input
              v-model="registerConfirmPassword"
              type="password"
              placeholder="请再次输入密码"
              :disabled="isAuthLoading"
            />
          </div>
          <div class="form-group">
            <label>邀请码</label>
            <input
              v-model="registerInviteCode"
              type="text"
              placeholder="请输入邀请码(选填)"
              :disabled="isAuthLoading"
            />
          </div>
          <div v-if="authErrorMsg" class="auth-error">{{ authErrorMsg }}</div>
          <button class="auth-submit-btn" @click="handleRegister" :disabled="isAuthLoading">
            {{ isAuthLoading ? '注册中...' : '注册' }}
          </button>
        </div>
      </div>

      <div class="auth-modal-footer">
        <button class="auth-close-btn" @click="closeModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.auth-modal {
  background: linear-gradient(135deg, #2b2b2b 0%, #181818 100%);
  border-radius: 16px;
  width: min(350px, 86vw);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
}

.auth-tabs {
  display: flex;
  padding: 3px;
  background: rgba(0, 0, 0, 0.24);
}

.auth-tab {
  flex: 1;
  padding: 10px 0;
  text-align: center;
  color: #8d8d8d;
  font-size: 16px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.auth-tab-active {
  color: #fff;
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.28);
}

.auth-content {
  padding: 18px 20px;
}

.auth-message {
  margin-bottom: 14px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 149, 0, 0.12);
  color: #ffd699;
  font-size: 13px;
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: #ccc;
  font-size: 13px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 14px;
  outline: none;
}

.form-group input:focus {
  border-color: rgba(255, 149, 0, 0.65);
  box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.18);
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.auth-error {
  margin-bottom: 12px;
  padding: 7px 10px;
  border-left: 3px solid #ff5252;
  border-radius: 6px;
  background: rgba(255, 82, 82, 0.12);
  color: #ff7575;
  font-size: 13px;
}

.auth-submit-btn {
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  cursor: pointer;
}

.auth-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-modal-footer {
  padding: 12px 20px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.18);
}

.auth-close-btn {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: transparent;
  color: #ccc;
  padding: 8px 24px;
  border-radius: 24px;
  font-size: 14px;
  cursor: pointer;
}
</style>
