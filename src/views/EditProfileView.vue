<template>
  <div class="edit-profile-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="20" color="#fff" />
      </div>
      <div class="page-title">编辑资料</div>
      <div class="header-right"></div>
    </div>

    <div class="profile-form">
      <!-- 头像上传区域 -->
      <div class="avatar-upload">
        <div class="current-avatar">
          <img :src="avatarUrl" alt="头像" />
        </div>
        <div class="upload-text">点击更换头像</div>
        <input
          type="file"
          accept="image/*"
          class="avatar-input"
          @change="handleAvatarChange"
          ref="fileInput"
        />
      </div>

      <!-- 账号信息 -->
      <div class="form-item">
        <div class="item-label">账号：</div>
        <div class="item-input" v-if="isGuest">
          <input type="text" v-model="userId" placeholder="请输入手机号码" />
        </div>
        <div class="item-value" v-else>{{ userId }}</div>
      </div>

      <!-- 昵称 -->
      <div class="form-item">
        <div class="item-label">昵称：</div>
        <div class="item-input">
          <input type="text" v-model="nickname" placeholder="如不修改则同步为手机号码" />
        </div>
      </div>

      <!-- 性别 -->
      <div class="form-item" @click="showSexSelector">
        <div class="item-label">性别：</div>
        <div class="item-value">{{ getSexText(sex) }}</div>
        <div class="item-arrow">
          <van-icon name="arrow" size="20" color="#ccc" />
        </div>
      </div>

      <!-- 生日 -->
      <div class="form-item" @click="showBirthdayPicker">
        <div class="item-label">生日：</div>
        <div class="item-value">{{ birthday || '请选择生日' }}</div>
        <div class="item-arrow">
          <van-icon name="arrow" size="20" color="#ccc" />
        </div>
      </div>

      <!-- 登录密码 -->
      <div class="form-item" @click="showChangePwdPopup">
        <div class="item-label">登录密码：</div>
        <div class="item-value">
          修改登录密码
          <span v-if="isGuest" class="pwd-init-tip">(初始密码：12345678)</span>
        </div>
        <div class="item-arrow">
          <van-icon name="arrow" size="20" color="#ccc" />
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-button" @click="saveProfile">保存</div>

    <!-- 修改密码弹窗 -->
    <van-popup
      v-model:show="pwdPopupVisible"
      position="bottom"
      round
      @click-overlay="pwdPopupVisible = false"
    >
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-title">修改登录密码</div>
          <div class="popup-close" @click="pwdPopupVisible = false">
            <van-icon name="cross" />
          </div>
        </div>
        <div class="popup-content">
          <!-- 游客默认密码提示 -->
          <div class="guest-pwd-tip" v-if="isGuest">
            <van-icon name="info-o" size="14" color="#ff9500" />
            <span>游客默认密码为：12345678</span>
          </div>
          <div class="input-row">
            <input v-model="oldPwd" type="password" class="pwd-input" placeholder="请输入原密码" />
          </div>
          <div class="input-row">
            <input
              v-model="newPwd"
              type="password"
              class="pwd-input"
              placeholder="请输入新密码"
              @input="onNewPwdInput"
            />
            <div class="input-tip" v-if="!pwdValidationMsg">
              密码需8位以上，包含大小写字母和数字
            </div>
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
          <div class="input-row">
            <input
              v-model="repeatPwd"
              type="password"
              class="pwd-input"
              placeholder="请重复新密码"
            />
          </div>
          <div class="confirm-button" @click="changePassword">确定</div>
        </div>
      </div>
    </van-popup>

    <!-- 性别选择弹窗 -->
    <van-popup
      v-model:show="sexPopupVisible"
      position="bottom"
      round
      @click-overlay="sexPopupVisible = false"
    >
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-title">选择性别</div>
          <div class="popup-close" @click="sexPopupVisible = false">
            <van-icon name="cross" />
          </div>
        </div>
        <div class="popup-content">
          <div class="sex-options">
            <div class="sex-option" :class="{ active: sex === 0 }" @click="selectSex(0)">保密</div>
            <div class="sex-option" :class="{ active: sex === 1 }" @click="selectSex(1)">男</div>
            <div class="sex-option" :class="{ active: sex === 2 }" @click="selectSex(2)">女</div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 生日选择弹窗 -->
    <van-popup
      v-model:show="birthdayPopupVisible"
      position="bottom"
      round
      @click-overlay="birthdayPopupVisible = false"
    >
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-title">选择生日</div>
          <div class="popup-close" @click="birthdayPopupVisible = false">
            <van-icon name="cross" />
          </div>
        </div>
        <div class="popup-content">
          <div class="birthday-inputs">
            <div class="birthday-row">
              <select v-model="tempYear" class="birthday-select">
                <option v-for="year in years" :key="year" :value="year">{{ year }}年</option>
              </select>
              <select v-model="tempMonth" class="birthday-select">
                <option v-for="month in months" :key="month" :value="month">{{ month }}月</option>
              </select>
              <select v-model="tempDay" class="birthday-select">
                <option v-for="day in days" :key="day" :value="day">{{ day }}日</option>
              </select>
            </div>
          </div>
          <div class="birthday-buttons">
            <div class="birthday-cancel" @click="birthdayPopupVisible = false">取消</div>
            <div class="birthday-confirm" @click="confirmBirthday">确定</div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, onActivated, onDeactivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant'
import { updateUserInfo, getUserInfo, isLoggedIn, updateUserPortrait } from '@/api/fetch-api'
import { BASE_URL } from '@/utils/config'

const router = useRouter()
const nickname = ref('')
const avatarUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const userId = ref('')
const loading = ref(false)

// 新增字段
const sex = ref(0) // 0保密 1男 2女
const birthday = ref('')

// 密码修改相关
const pwdPopupVisible = ref(false)
const oldPwd = ref('')
const newPwd = ref('')
const repeatPwd = ref('')
const pwdValidationMsg = ref('') // 密码验证提示信息

// 性别选择相关
const sexPopupVisible = ref(false)

// 生日选择相关
const birthdayPopupVisible = ref(false)
const tempYear = ref(new Date().getFullYear())
const tempMonth = ref(new Date().getMonth() + 1)
const tempDay = ref(new Date().getDate())

// 计算属性：是否为游客
const isGuest = computed(() => {
  const guestFlag = localStorage.getItem('isGuest')
  console.log('🔍 EditProfileView - isGuest 计算属性:', {
    guestFlag: guestFlag,
    isGuest: guestFlag === 'true',
  })
  return guestFlag === 'true'
})

// 计算属性：获取 localStorage 中的 isGuest 值（用于调试）
const guestFlagDebug = computed(() => {
  return localStorage.getItem('isGuest')
})

// 计算属性：年份选项
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearList = []
  for (let i = 1950; i <= currentYear; i++) {
    yearList.push(i)
  }
  return yearList.reverse()
})

// 计算属性：月份选项
const months = computed(() => {
  return Array.from({ length: 12 }, (_, i) => i + 1)
})

// 计算属性：日期选项
const days = computed(() => {
  const daysInMonth = new Date(tempYear.value, tempMonth.value, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => i + 1)
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取性别文本
const getSexText = (sexValue: number) => {
  switch (sexValue) {
    case 1:
      return '男'
    case 2:
      return '女'
    default:
      return '保密'
  }
}

// 显示性别选择器
const showSexSelector = () => {
  sexPopupVisible.value = true
}

// 选择性别
const selectSex = (sexValue: number) => {
  sex.value = sexValue
  sexPopupVisible.value = false
}

// 显示生日选择器
const showBirthdayPicker = () => {
  // 如果有现有生日，解析并设置临时值
  if (birthday.value) {
    const parts = birthday.value.split('-')
    if (parts.length === 3) {
      tempYear.value = parseInt(parts[0])
      tempMonth.value = parseInt(parts[1])
      tempDay.value = parseInt(parts[2])
    }
  }
  birthdayPopupVisible.value = true
}

// 确认生日选择
const confirmBirthday = () => {
  const formattedBirthday = `${tempYear.value}-${tempMonth.value.toString().padStart(2, '0')}-${tempDay.value.toString().padStart(2, '0')}`
  birthday.value = formattedBirthday
  birthdayPopupVisible.value = false
}

// 将文件转换为base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (reader.result) {
        // 移除数据URL前缀，例如 "data:image/jpeg;base64,"
        const base64String = reader.result.toString()
        const base64 = base64String.substring(base64String.indexOf(',') + 1)
        console.log('文件已转换为base64, 长度:', base64.length)
        resolve(base64)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = (error) => reject(error)
  })
}

// 上传头像 - base64方式
const uploadAvatarBase64 = async (file: File) => {
  try {
    loading.value = true
    showLoadingToast({
      message: '上传中...',
      forbidClick: true,
    })

    console.log('开始上传头像, 文件大小:', file.size, '文件类型:', file.type)

    // 检查文件类型和大小
    if (!file.type.startsWith('image/')) {
      showToast({
        message: '请选择图片文件',
        duration: 2000,
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB限制
      showToast({
        message: '图片大小不能超过5MB',
        duration: 2000,
      })
      return
    }

    // 转换文件为base64
    const base64Data = await fileToBase64(file)

    // 使用base64方式上传
    const result = await updateUserPortrait({
      imgdata: base64Data,
    })

    console.log('头像上传结果:', result)

    if (result && result.code === 1) {
      // 显示预览
      avatarUrl.value = URL.createObjectURL(file)

      showToast({
        message: '头像上传成功',
        duration: 2000,
      })
    } else {
      showToast({
        message: result?.msg || '头像上传失败，请重试',
        duration: 2000,
      })
    }
  } catch (error: any) {
    console.error('头像上传失败:', error)
    showToast({
      message: error.message || '上传失败，请稍后再试',
      duration: 2000,
    })
  } finally {
    loading.value = false
    closeToast()
  }
}

// 上传头像 - 文件方式
const uploadAvatarFile = async (file: File) => {
  try {
    loading.value = true
    showLoadingToast({
      message: '上传中...',
      forbidClick: true,
    })

    console.log('开始上传头像(文件方式), 文件大小:', file.size, '文件类型:', file.type)

    // 检查文件类型和大小
    if (!file.type.startsWith('image/')) {
      showToast({
        message: '请选择图片文件',
        duration: 2000,
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB限制
      showToast({
        message: '图片大小不能超过5MB',
        duration: 2000,
      })
      return
    }

    // 使用文件方式上传
    const result = await updateUserPortrait({
      file: file,
    })

    console.log('头像上传结果:', result)

    if (result && result.code === 1) {
      // 显示预览
      avatarUrl.value = URL.createObjectURL(file)

      showToast({
        message: '头像上传成功',
        duration: 2000,
      })
    } else {
      showToast({
        message: result?.msg || '头像上传失败，请重试',
        duration: 2000,
      })
    }
  } catch (error: any) {
    console.error('头像上传失败:', error)
    showToast({
      message: error.message || '上传失败，请稍后再试',
      duration: 2000,
    })
  } finally {
    loading.value = false
    closeToast()
  }
}

// 处理头像变更
const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]

    // 尝试两种上传方式
    // 先尝试文件方式上传
    await uploadAvatarFile(file)

    // 如果需要尝试base64方式，可以取消下面的注释
    // 通常只需要使用一种方式
    // await uploadAvatarBase64(file);
  }
}

// 保存个人资料
const saveProfile = async () => {
  if (loading.value) return

  try {
    loading.value = true
    showLoadingToast({
      message: '保存中...',
      forbidClick: true,
    })

    // 调用API保存数据，包含新字段
    const updateParams: any = {
      user_nick_name: nickname.value,
      sex: sex.value.toString(),
      birthday: birthday.value,
      user_pwd: '', // 原密码，不修改密码时传空字符串
      user_pwd1: '', // 新密码，不修改密码时传空字符串
      user_pwd2: '', // 确认密码，不修改密码时传空字符串
    }

    // 🔥 只有游客用户才可以修改账号，使用 user_login 字段
    if (isGuest.value) {
      updateParams.user_login = userId.value
      console.log('🎯 游客修改账号，API会自动添加 isyouke=1 参数')
    }

    const result = await updateUserInfo(updateParams)

    if (result && result.code === 1) {
      // 🔥 修改账号成功后，如果是游客用户，将本地存储的用户改为非游客用户
      if (isGuest.value) {
        localStorage.setItem('isGuest', 'false')
        console.log('✅ 账号修改成功，将用户状态改为非游客用户 (isGuest=false)')
      }

      showDialog({
        title: '提示',
        message: '保存成功',
        confirmButtonText: '确定',
        confirmButtonColor: '#ff9500',
      }).then(() => {
        router.back()
      })
    } else {
      showDialog({
        title: '提示',
        message: result?.msg || '保存失败，请重试',
        confirmButtonText: '确定',
        confirmButtonColor: '#ff9500',
      })
    }
  } catch (error: any) {
    console.error('保存个人资料失败:', error)
    showToast({
      message: error.message || '保存失败，请稍后再试',
      duration: 2000,
    })
  } finally {
    loading.value = false
    closeToast()
  }
}

// 显示修改密码弹窗
const showChangePwdPopup = () => {
  pwdPopupVisible.value = true
  oldPwd.value = ''
  newPwd.value = ''
  repeatPwd.value = ''
  pwdValidationMsg.value = '' // 重置验证提示
}

// 验证密码格式（8位以上，包含大小写字母和数字）
const validatePassword = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const isLengthValid = password.length >= 8

  return hasUpperCase && hasLowerCase && hasNumbers && isLengthValid
}

// 实时验证密码并返回提示信息
const validatePasswordRealtime = (password: string) => {
  if (!password) {
    return ''
  }

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

// 监听新密码输入，实时验证
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
      // 先关闭加载提示
      loading.value = false
      closeToast()

      // 显示成功弹窗
      showDialog({
        title: '提示',
        message: '密码修改成功',
        confirmButtonText: '确定',
        confirmButtonColor: '#ff9500',
      })
      pwdPopupVisible.value = false
      return // 成功时直接返回，不执行finally
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

// 加载用户信息的通用函数
const loadUserInfo = () => {
  console.log('🔄 开始加载用户信息...')

  // 从localStorage获取用户资料（支持游客和正式用户）
  const userInfo = getUserInfo()
  const isGuestUser = localStorage.getItem('isGuest') === 'true'

  console.log('📋 编辑资料页面 - 用户信息:', {
    hasUserInfo: !!userInfo,
    isGuest: isGuestUser,
    isLoggedIn: isLoggedIn(),
    userInfo: userInfo,
  })

  // 如果既没有用户信息也没有登录，则跳转到登录页
  if (!userInfo && !isLoggedIn()) {
    showToast({
      message: '请先登录',
      duration: 2000,
    })
    router.push('/login')
    return
  }

  if (userInfo) {
    console.log('👤 加载用户信息 - 类型:', isGuestUser ? '游客' : '正式用户')

    // 根据用户类型处理信息
    if (isGuestUser) {
      // 游客：设置空值
      userId.value = ''
      nickname.value = ''
    } else {
      // 正式用户：使用现有信息
      userId.value = String(userInfo.user_name || userInfo.user_id || '')
      nickname.value = userInfo.user_nick_name || userInfo.user_name || ''
    }

    // 通用字段处理
    sex.value = userInfo.sex ? parseInt(userInfo.sex) : 0
    birthday.value = userInfo.birthday || ''

    // 统一头像处理
    console.log('🖼️ 头像字段检查:', {
      user_portrait: userInfo.user_portrait,
      avatar: userInfo.avatar,
      avatar_thumb: userInfo.avatar_thumb,
    })

    // 优先使用 user_portrait，然后是 avatar
    const avatarField = userInfo.user_portrait || userInfo.avatar || userInfo.avatar_thumb

    if (avatarField) {
      if (avatarField.startsWith('http://') || avatarField.startsWith('https://')) {
        avatarUrl.value = avatarField
        console.log('✅ 使用完整URL头像:', avatarUrl.value)
      } else if (avatarField.startsWith('/')) {
        avatarUrl.value = `${BASE_URL}${avatarField}`
        console.log('✅ 使用相对路径头像（带/）:', avatarUrl.value)
      } else {
        avatarUrl.value = `${BASE_URL}/${avatarField}`
        console.log('✅ 使用相对路径头像（不带/）:', avatarUrl.value)
      }
    } else {
      avatarUrl.value = new URL('@/assets/img/img-avatar-default.png', import.meta.url).href
      console.log('⚠️ 未找到头像，使用默认头像')
    }

    console.log('✅ 用户信息加载完成:', {
      userType: isGuestUser ? '游客' : '正式用户',
      userId: userId.value,
      nickname: nickname.value,
      sex: sex.value,
      birthday: birthday.value,
      avatarUrl: avatarUrl.value,
    })
  } else {
    console.log('⚠️ 未找到用户信息，使用默认头像')
    avatarUrl.value = new URL('@/assets/img/img-avatar-default.png', import.meta.url).href
  }

  console.log('✅ 页面加载完成，用户类型:', isGuestUser ? '游客' : '正式用户')
}

onMounted(() => {
  console.log('🎬 EditProfileView - onMounted 触发')
  loadUserInfo()
})

onActivated(() => {
  console.log('🎬 EditProfileView - onActivated 触发（页面被激活）')
  // 页面被激活时重新加载用户信息（比如从其他页面返回时）
  loadUserInfo()
})

onDeactivated(() => {
  // 页面被停用
})

onBeforeUnmount(() => {
  // 组件销毁前
})
</script>

<style scoped>
.edit-profile-page {
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

.profile-form {
  padding: 20px 15px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
}

.current-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
  background-color: #333;
}

.current-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-text {
  color: #ff9500;
  font-size: 14px;
}

.avatar-input {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #333;
}

.item-label {
  width: 80px;
  font-size: 16px;
  color: #ccc;
}

.item-value {
  flex: 1;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pwd-init-tip {
  font-size: 13px;
  color: #ff9500;
  font-weight: normal;
  margin-left: auto;
}

.item-input {
  flex: 1;
}

.item-input input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 16px;
  outline: none;
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

.item-arrow {
  margin-left: 10px;
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
}

/* 弹窗样式 */
.popup-container {
  padding: 25px 20px;
  color: #fff;
  background-color: #111;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 40px;
}

.popup-title {
  font-size: 22px;
  font-weight: 500;
}

.popup-close {
  padding: 5px;
}

.popup-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.guest-pwd-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 15px;
  margin-bottom: 15px;
  background-color: rgba(255, 149, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #ff9500;
}

.guest-pwd-tip span {
  flex: 1;
}

.confirm-button {
  background-color: #ff9500;
  color: #fff;
  text-align: center;
  padding: 14px 0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  margin-top: auto;
  margin-bottom: 20px;
}

:deep(.van-field) {
  background-color: transparent;
}

:deep(.van-cell) {
  background-color: transparent;
  color: #fff;
}

:deep(.van-popup) {
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

:deep(.van-overlay) {
  z-index: 1900;
}

:deep(.van-popup--bottom) {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.input-row {
  margin-bottom: 18px;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
}

.pwd-input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 16px;
  outline: none;
  height: 40px;
  padding: 0;
}

.pwd-input::placeholder {
  color: #777;
}

/* 性别选择样式 */
.sex-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 0;
}

.sex-option {
  padding: 15px 20px;
  background-color: #222;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sex-option.active {
  background-color: #ff9500;
  color: #fff;
}

.sex-option:hover {
  background-color: #333;
}

.sex-option.active:hover {
  background-color: #ff9500;
}

/* 生日选择样式 */
.birthday-inputs {
  padding: 20px 0;
}

.birthday-row {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.birthday-select {
  flex: 1;
  padding: 12px;
  background-color: #222;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  outline: none;
}

.birthday-select option {
  background-color: #222;
  color: #fff;
}

.birthday-buttons {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.birthday-cancel,
.birthday-confirm {
  flex: 1;
  padding: 12px 0;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.birthday-cancel {
  background-color: #333;
  color: #ccc;
}

.birthday-confirm {
  background-color: #ff9500;
  color: #fff;
}
</style>
