<template>
  <div class="change-password-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="20" color="#fff" />
      </div>
      <div class="page-title">修改登录密码</div>
      <div class="header-right"></div>
    </div>

    <div class="password-form">
      <!-- 当前用户名显示 -->
      <div class="current-username-display">
        <span class="username-label">当前账号：</span>
        <span class="username-value">{{ displayUsername }}</span>
      </div>

      <!-- 游客默认密码提示 -->
      <div class="guest-pwd-tip" v-if="isGuest">
        <van-icon name="info-o" size="14" color="#ff9500" />
        <span>游客默认密码为：12345678</span>
      </div>

      <!-- 原密码 -->
      <div class="form-item">
        <div class="item-label">原密码</div>
        <div class="item-input">
          <input v-model="oldPwd" type="password" placeholder="请输入原密码" />
        </div>
      </div>

      <!-- 新密码 -->
      <div class="form-item">
        <div class="item-label">新密码</div>
        <div class="item-input">
          <input v-model="newPwd" type="password" placeholder="请输入新密码" @input="onNewPwdInput" />
        </div>
        <div class="input-tip" v-if="!pwdValidationMsg">密码需8位以上，包含大小写字母和数字</div>
        <div
          class="pwd-validation"
          :class="{
            valid: pwdValidationMsg.includes('✓'),
            invalid: pwdValidationMsg && !pwdValidationMsg.includes('✓'),
          }"
          v-if="pwdValidationMsg"
        >
          {{ pwdValidationMsg }}
        </div>
      </div>

      <!-- 确认新密码 -->
      <div class="form-item">
        <div class="item-label">确认密码</div>
        <div class="item-input">
          <input v-model="repeatPwd" type="password" placeholder="请重复新密码" />
        </div>
      </div>
    </div>

    <!-- 确认按钮 -->
    <div class="save-button" @click="changePassword">
      <van-loading v-if="loading" type="spinner" size="20" color="#fff" />
      <span v-else>确认修改</span>
    </div>

    <!-- 密码修改成功提示弹窗 -->
    <van-popup v-model:show="showPasswordSuccessPopup" :close-on-click-overlay="false" round>
      <div class="password-success-popup">
        <div class="success-icon">
          <van-icon name="success" size="48" color="#52c41a" />
        </div>
        <div class="success-title">密码修改成功</div>
        <div class="account-info-box">
          <div class="account-label">当前账号：</div>
          <div class="account-value-row">
            <span class="account-value">{{ displayUsername }}</span>
            <button class="copy-btn" @click="copyUsername">
              <van-icon name="notes-o" size="16" />
              <span>复制</span>
            </button>
          </div>
        </div>
        <div class="success-message">为了您的账号安全，请重新登录</div>
        <button class="success-confirm-btn" @click="handleLogoutAfterPasswordChange">确定</button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant'
import { updateUserInfo, getUserInfo, userLogout } from '@/api/fetch-api'

const router = useRouter()
const loading = ref(false)

// 密码字段
const oldPwd = ref('')
const newPwd = ref('')
const repeatPwd = ref('')
const pwdValidationMsg = ref('')

// 密码修改成功弹窗
const showPasswordSuccessPopup = ref(false)

// 计算属性：是否为游客
const isGuest = computed(() => {
  return localStorage.getItem('isGuest') === 'true'
})

// 计算属性：显示的用户名
const displayUsername = computed(() => {
  const userInfo = getUserInfo()
  if (!userInfo) return '未设置'
  return String(userInfo.user_name || userInfo.user_id || userInfo.user_nick_name || '未设置')
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 验证密码格式
const validatePassword = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const isLengthValid = password.length >= 8
  return hasUpperCase && hasLowerCase && hasNumbers && isLengthValid
}

// 实时验证密码
const validatePasswordRealtime = (password: string) => {
  if (!password) return ''

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const isLengthValid = password.length >= 8

  const missing = []
  if (!isLengthValid) missing.push('至少8位')
  if (!hasUpperCase) missing.push('大写字母')
  if (!hasLowerCase) missing.push('小写字母')
  if (!hasNumbers) missing.push('数字')

  if (missing.length > 0) {
    return `还需要：${missing.join('、')}`
  }

  return '✓ 密码强度符合要求'
}

// 监听新密码输入
const onNewPwdInput = () => {
  pwdValidationMsg.value = validatePasswordRealtime(newPwd.value)
}

// 修改密码
const changePassword = async () => {
  if (loading.value) return

  if (!oldPwd.value) {
    showDialog({
      title: '提示',
      message: '请输入原密码',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500',
    })
    return
  }
  if (!newPwd.value) {
    showDialog({
      title: '提示',
      message: '请输入新密码',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500',
    })
    return
  }
  if (!validatePassword(newPwd.value)) {
    showDialog({
      title: '提示',
      message: '新密码必须包含大小写字母和数字，且不少于8位',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500',
    })
    return
  }
  if (newPwd.value !== repeatPwd.value) {
    showDialog({
      title: '提示',
      message: '两次输入的新密码不一致',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500',
    })
    return
  }

  try {
    loading.value = true
    showLoadingToast({
      message: '修改中...',
      forbidClick: true,
    })

    // 调用API修改密码
    const result = await updateUserInfo({
      user_pwd: oldPwd.value,
      user_pwd1: newPwd.value,
      user_pwd2: repeatPwd.value,
    })

    if (result && result.code === 1) {
      // 修改密码成功后，如果是游客用户，将本地存储的用户改为非游客用户
      if (isGuest.value) {
        localStorage.setItem('isGuest', 'false')
        console.log('✅ 密码修改成功，将用户状态改为非游客用户 (isGuest=false)')
      }

      // 清空密码字段
      oldPwd.value = ''
      newPwd.value = ''
      repeatPwd.value = ''
      pwdValidationMsg.value = ''

      // 关闭加载提示
      loading.value = false
      closeToast()

      // 显示成功弹窗
      showPasswordSuccessPopup.value = true

      return
    } else {
      showDialog({
        title: '提示',
        message: result?.msg || '密码修改失败，请重试',
        confirmButtonText: '确定',
        confirmButtonColor: '#ff9500',
      })
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    showDialog({
      title: '提示',
      message: error.message || '修改失败，请稍后再试',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500',
    })
  } finally {
    loading.value = false
    closeToast()
  }
}

// 复制用户名
const copyUsername = async () => {
  try {
    await navigator.clipboard.writeText(displayUsername.value)
    showToast({
      message: '账号已复制',
      duration: 1500,
    })
  } catch (error) {
    console.error('复制失败:', error)
    try {
      const textArea = document.createElement('textarea')
      textArea.value = displayUsername.value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast({
        message: '账号已复制',
        duration: 1500,
      })
    } catch {
      showToast({
        message: '复制失败，请手动复制',
        duration: 1500,
      })
    }
  }
}

// 密码修改成功后处理退出登录
const handleLogoutAfterPasswordChange = async () => {
  showPasswordSuccessPopup.value = false

  showLoadingToast({
    message: '正在退出...',
    forbidClick: true,
    duration: 0,
  })

  try {
    await userLogout()
    closeToast()
    router.replace('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    closeToast()
    router.replace('/login')
  }
}
</script>

<style scoped>
.change-password-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 50px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #333;
  position: sticky;
  top: 0;
  background-color: #111;
  z-index: 10;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  flex: 1;
  text-align: center;
}

.back-button,
.header-right {
  width: 40px;
}

.password-form {
  padding: 20px 15px;
}

/* 当前用户名显示 */
.current-username-display {
  padding: 12px 15px;
  margin-bottom: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.username-label {
  font-size: 13px;
  color: #999;
  margin-right: 8px;
}

.username-value {
  font-size: 15px;
  color: #fff;
  font-weight: 500;
}

/* 游客默认密码提示 */
.guest-pwd-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 15px;
  margin-bottom: 20px;
  background-color: rgba(255, 149, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #ff9500;
}

.guest-pwd-tip span {
  flex: 1;
}

.form-item {
  margin-bottom: 20px;
}

.item-label {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 10px;
}

.item-input {
  position: relative;
}

.item-input input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  padding: 12px 15px;
  outline: none;
}

.item-input input::placeholder {
  color: #777;
}

.item-input input:focus {
  border-color: #ff9500;
}

.input-tip {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
  line-height: 1.4;
}

.pwd-validation {
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.pwd-validation.valid {
  color: #52c41a;
}

.pwd-validation.invalid {
  color: #ff9500;
}

.save-button {
  background-color: #ff9500;
  color: #fff;
  text-align: center;
  padding: 12px 0;
  margin: 30px 15px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.save-button:active {
  opacity: 0.8;
}

/* 密码修改成功弹窗样式 */
.password-success-popup {
  background-color: #1a1a1a;
  border-radius: 16px;
  padding: 30px 20px;
  width: 320px;
  text-align: center;
}

.success-icon {
  margin-bottom: 20px;
}

.success-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
}

.account-info-box {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.account-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 10px;
  text-align: left;
}

.account-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.account-value {
  flex: 1;
  font-size: 16px;
  color: #fff;
  font-weight: 500;
  text-align: left;
  word-break: break-all;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: rgba(255, 149, 0, 0.15);
  border: 1px solid rgba(255, 149, 0, 0.4);
  border-radius: 6px;
  color: #ff9500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.copy-btn:hover {
  background-color: rgba(255, 149, 0, 0.25);
  border-color: #ff9500;
}

.copy-btn:active {
  transform: scale(0.95);
}

.success-message {
  font-size: 14px;
  color: #999;
  line-height: 1.6;
  margin-bottom: 25px;
}

.success-confirm-btn {
  width: 100%;
  padding: 12px;
  background-color: #ff9500;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.success-confirm-btn:hover {
  background-color: #ff8500;
}

.success-confirm-btn:active {
  transform: scale(0.98);
}

:deep(.van-popup) {
  background-color: transparent;
}
</style>
