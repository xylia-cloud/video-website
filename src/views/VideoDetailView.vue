<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchVideoDetail,
  fetchRecommendVideos,
  fetchDetailRecommend,
  updateVideoHits,
  updateVideoDigg,
  updateUserLog,
  getUserInfo,
  isLoggedIn,
  setUserInfo,
  fetchUserDatas,
  fetchAds,
  userLogin,
  registerUser,
  createAuthHeaders,
  fetchUserPoints,
  touristLogin,
} from '@/api/fetch-api'
import type { VideoDetail } from '@/api/fetch-api'
import { BASE_URL } from '@/utils/config'
import { getDeviceIMEI } from '@/utils/device'
// 导入Vant组件
import { Icon, Loading, showToast, showDialog, closeToast } from 'vant'
// 导入hls.js
import Hls from 'hls.js'
// 导入视频列表组件
import VideoList from '@/components/VideoList.vue'

// 定义视频数据接口
interface VideoItem {
  id: number
  coverUrl: string
  title: string
  isVip?: boolean
  isFree?: boolean
  duration?: string // 视频时长
  class?: string // 视频分类
  time?: string // 发布时间
  points: string
}

// 列表广告数据
interface ListAd {
  id: number
  coverUrl: string
  title: string
  isVip?: boolean
  isFree?: boolean
  duration?: string
  class?: string
  link?: string
  isAd: boolean
}

const route = useRoute()
const router = useRouter()
const videoId = ref(route.params.id as string)
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const isPlaying = ref(false)

// 添加视频浮动状态
const isVideoFloating = ref(false)
const videoContainerRef = ref<HTMLElement | null>(null)

// HLS实例
const hls = ref<Hls | null>(null)
// 视频元素引用
const videoEl = ref<HTMLVideoElement | null>(null)

// 付费逻辑状态
const isNeedPay = ref(false)
const pointsNeeded = ref(0)
const isWatched = ref(false) // 用户是否已观看过此视频

const fromPath = computed(() => {
  const from = route.query.from
  return from ? from.toString() : '/'
})

// 视频详情数据
const videoDetail = ref<VideoDetail | null>(null)

// 推荐视频
const recommendVideos = ref<VideoItem[]>([])
const isRecommendLoading = ref(true)

// 用户信息
const userInfo = ref<any>(null)
// 是否正在获取用户信息
const isLoadingUserInfo = ref(false)

// 用户积分和VIP相关数据
const userVideoNums = ref(0) // 观影次数
const isVip = ref('0') // VIP状态
const vipEndtime = ref('') // VIP到期时间

const userPoints = computed(() => {
  return userVideoNums.value || 0
})

// VIP状态显示文本
const vipStatusDisplay = computed(() => {
  console.log(
    '🔍 VIP状态显示计算 - isVip:',
    isVip.value,
    '类型:',
    typeof isVip.value,
    'vipEndtime:',
    vipEndtime.value,
  )

  if (Number(isVip.value) === 1) {
    if (vipEndtime.value) {
      // 解析日期字符串或时间戳
      let endDate
      if (typeof vipEndtime.value === 'string' && vipEndtime.value.includes('-')) {
        // 字符串格式：2025-10-09 16:48:13
        endDate = new Date(vipEndtime.value)
      } else {
        // 时间戳格式
        endDate = new Date(parseInt(vipEndtime.value) * 1000)
      }
      const now = new Date()

      console.log(
        '📅 VIP时间检查 - 原始值:',
        vipEndtime.value,
        '解析后:',
        endDate,
        '当前时间:',
        now,
        '是否过期:',
        endDate <= now,
      )

      if (endDate > now) {
        // VIP未过期
        const year = endDate.getFullYear()
        const month = String(endDate.getMonth() + 1).padStart(2, '0')
        const day = String(endDate.getDate()).padStart(2, '0')
        return `VIP到期：${year}-${month}-${day}`
      } else {
        // VIP已过期，显示积分
        return `观影次数：${userVideoNums.value}`
      }
    } else {
      return 'VIP已开通'
    }
  } else {
    return `观影次数：${userVideoNums.value}`
  }
})

// 判断是否免费视频
const isFreeVideo = computed(() => {
  if (!videoDetail.value) return true // 默认视为免费

  // 如果存在付费字段且值大于0，则为付费视频
  if (
    videoDetail.value.vod_points_play !== undefined &&
    videoDetail.value.vod_points_play !== null
  ) {
    const pointsValue = Number(videoDetail.value.vod_points_play)
    return isNaN(pointsValue) || pointsValue <= 0
  }

  // 无付费字段，视为免费
  return true
})

// 判断视频标签类型
const videoTagType = computed(() => {
  if (!videoDetail.value) return 'limited' // 默认限免

  // 已购买/已观看的付费视频
  if (!isFreeVideo.value && isWatched.value) {
    return 'purchased'
  }

  // 未购买的付费视频
  if (!isFreeVideo.value) {
    return 'pay'
  }

  // 免费视频
  return 'limited'
})

// 播放源地址
const videoSrc = ref('')

// 定义视频播放状态
const isVideoPlayed = ref(false) // 记录视频是否已经播放过

// 广告弹窗相关状态
const showVideoAd = ref(false) // 是否显示视频广告弹窗

// 充值完成提示弹窗
const showChargeCompleteDialog = ref(false) // 是否显示充值完成提示弹窗

// 点赞状态
const isDiggLoading = ref(false)
const isDigged = ref(false) // 是否已点赞

// 收藏状态
const isCollectLoading = ref(false)
const isCollected = ref(false) // 是否已收藏

// 推荐视频状态变量
const isRefreshingRecommends = ref(false)

// 添加一个专门用于解析URL中的邀请码的方法
const parseUrlInviteCode = () => {
  // 获取完整URL
  const fullUrl = window.location.href
  console.log('开始解析URL邀请码，完整URL:', fullUrl)

  // 尝试正则匹配invite参数
  // 这个正则会匹配 invite=xxxx 格式，无论它在哈希前还是哈希后
  const inviteRegex = /[?&]invite=([^&#]*)/
  const match = fullUrl.match(inviteRegex)

  if (match && match[1]) {
    const extractedInvite = decodeURIComponent(match[1])
    console.log('正则匹配到的邀请码:', extractedInvite)

    // 存储到localStorage以便后续使用
    localStorage.setItem('inviteCode', extractedInvite)

    return extractedInvite
  }

  return ''
}

// 从路由中获取邀请码和分享ID
const inviteCode = computed(() => {
  // 首先尝试从路由查询参数获取
  const routeInvite = route.query.invite as string
  if (routeInvite) {
    console.log('从路由查询参数获取邀请码:', routeInvite)
    return routeInvite
  }

  // 如果都没有找到，从localStorage尝试获取
  const storedInvite = localStorage.getItem('inviteCode')
  if (storedInvite) {
    console.log('从localStorage获取邀请码:', storedInvite)
    return storedInvite
  }

  return ''
})

// 是否是从分享链接进入
const isFromShare = computed(() => {
  return !!inviteCode.value
})

// 获取当前完整URL（用于分享）
const getCurrentShareUrl = () => {
  // 获取当前用户的邀请码
  const userRecCode = userInfo.value?.rec_code || ''

  // 构建带邀请码的URL
  const currentUrl = window.location.href
  const urlObj = new URL(currentUrl)

  // 清除已有的invite参数
  urlObj.searchParams.delete('invite')

  // 添加新的invite参数
  if (userRecCode) {
    urlObj.searchParams.append('invite', userRecCode)
  }

  return urlObj.toString()
}

// 添加登录/注册弹窗状态和控制变量
const showAuthModal = ref(false)
const authActiveTab = ref('login') // 'login' 或 'register'
const registerUsername = ref('')
const registerPassword = ref('')
const registerConfirmPassword = ref('')
const registerInviteCode = ref('') // 添加邀请码字段
const loginUsername = ref('')
const loginPassword = ref('')
const isAuthLoading = ref(false)
const authErrorMsg = ref('')

// 充值弹窗相关状态
const showChargeModal = ref(false)
const chargeOptions = ref<Array<{ price: number; type: number; desc: string }>>([])
const isLoadingChargeOptions = ref(false)
const selectedChargeOption = ref<{ price: number; type: number; desc: string } | null>(null)

// 添加一个方法用于处理显示登录/注册弹窗
const showAuthenticationModal = (defaultTab = 'login') => {
  // 设置默认显示的选项卡
  authActiveTab.value = defaultTab

  // 如果是注册选项卡，检查是否有邀请码
  if (defaultTab === 'register') {
    // 从各种可能的来源获取邀请码
    const urlInviteCode = parseUrlInviteCode() // 先尝试从URL中解析
    const computedInviteCode = inviteCode.value // 使用计算属性的值

    // 优先使用直接从URL解析的邀请码
    if (urlInviteCode) {
      registerInviteCode.value = urlInviteCode
      console.log('从URL直接解析并填充邀请码:', urlInviteCode)
    } else if (computedInviteCode) {
      registerInviteCode.value = computedInviteCode
      console.log('从计算属性填充邀请码:', computedInviteCode)
    }
  }

  // 显示弹窗
  showAuthModal.value = true
}

// 切换登录/注册选项卡
const switchAuthTab = (tab: string) => {
  authActiveTab.value = tab
  authErrorMsg.value = '' // 切换时清空错误信息

  // 如果切换到注册选项卡，尝试填充邀请码
  if (tab === 'register' && !registerInviteCode.value) {
    // 从各种可能的来源获取邀请码
    const urlInviteCode = parseUrlInviteCode() // 先尝试从URL中解析
    const computedInviteCode = inviteCode.value // 使用计算属性的值

    // 优先使用直接从URL解析的邀请码
    if (urlInviteCode) {
      registerInviteCode.value = urlInviteCode
      console.log('切换选项卡时从URL直接解析并填充邀请码:', urlInviteCode)
    } else if (computedInviteCode) {
      registerInviteCode.value = computedInviteCode
      console.log('切换选项卡时从计算属性填充邀请码:', computedInviteCode)
    }
  }
}

// 关闭登录/注册弹窗
const closeAuthModal = () => {
  showAuthModal.value = false
  // 清空表单
  loginUsername.value = ''
  loginPassword.value = ''
  registerUsername.value = ''
  registerPassword.value = ''
  registerConfirmPassword.value = ''
  registerInviteCode.value = ''
  authErrorMsg.value = ''
}

// 获取充值选项
const fetchChargeOptions = async () => {
  if (isLoadingChargeOptions.value) return

  isLoadingChargeOptions.value = true
  try {
    // 获取包含认证信息的请求头
    const authHeaders = createAuthHeaders(false) as any // 充值选项可能不需要强制登录，但需要认证信息

    // 构建充值选项接口URL，使用视频API的BASE_URL
    const chargeUrl = `${BASE_URL}/index.php/ajax/charge.html`
    console.log('🔍 充值选项接口请求URL:', chargeUrl)

    // 构建请求参数，包含reqTime和token（如果有）
    const queryParams = new URLSearchParams()
    if (authHeaders.reqTime) {
      queryParams.append('reqTime', authHeaders.reqTime.toString())
    }
    if (authHeaders.token) {
      queryParams.append('token', authHeaders.token.toString())
    }

    const finalUrl = queryParams.toString() ? `${chargeUrl}?${queryParams.toString()}` : chargeUrl

    console.log('📝 充值选项参数:', {
      reqTime: authHeaders.reqTime,
      token: authHeaders.token ? '***已设置***' : '未设置',
    })

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: authHeaders,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    console.log('💰 充值选项接口返回:', result)

    if (result.code === 1 && result.data) {
      chargeOptions.value = result.data
      console.log('✅ 充值选项加载成功，共', result.data.length, '个选项')
    } else {
      console.error('❌ 获取充值选项失败:', result.msg)
      chargeOptions.value = []
    }
  } catch (error) {
    console.error('🚫 获取充值选项请求失败:', error)
    chargeOptions.value = []
  } finally {
    isLoadingChargeOptions.value = false
  }
}

// 显示充值弹窗
const showChargeDialog = async () => {
  console.log('🔥 开始显示充值弹窗')

  // 显示加载提示
  showToast({
    message: '加载中...',
    position: 'top',
    duration: 0, // 不自动消失
    className: 'custom-toast-loading',
    icon: 'loading',
  })

  try {
    // 先获取充值选项
    await fetchChargeOptions()

    console.log('🔥 获取到的充值选项:', chargeOptions.value)

    // 关闭加载提示
    closeToast()

    // 默认选中第四个选项（索引为3）
    if (chargeOptions.value.length >= 4) {
      selectedChargeOption.value = chargeOptions.value[3]
      console.log('✅ 默认选中第四个充值选项:', selectedChargeOption.value)
    } else if (chargeOptions.value.length > 0) {
      // 如果没有第四个选项，选中最后一个
      selectedChargeOption.value = chargeOptions.value[chargeOptions.value.length - 1]
      console.log('✅ 默认选中最后一个充值选项:', selectedChargeOption.value)
    } else {
      selectedChargeOption.value = null
      console.log('❌ 没有可用的充值选项')
    }

    console.log('🔥 设置 showChargeModal = true')
    showChargeModal.value = true
    console.log('🔥 当前 showChargeModal 状态:', showChargeModal.value)

    // 额外调试：等一下再检查状态
    setTimeout(() => {
      console.log('🔥 延迟检查 showChargeModal 状态:', showChargeModal.value)
      console.log('🔥 DOM中是否存在充值弹窗元素:', document.querySelector('.charge-modal-overlay'))
    }, 100)
  } catch (error) {
    console.error('🚫 获取充值选项失败:', error)

    // 关闭加载提示
    closeToast()

    // 显示错误提示
    showToast({
      message: '获取充值选项失败，请稍后再试',
      position: 'top',
      duration: 3000,
      className: 'custom-toast-error',
      icon: 'cross',
    })
  }
}

// 测试函数：直接显示充值弹窗（用于调试）
const testShowChargeModal = () => {
  console.log('🧪 测试直接显示充值弹窗')
  // 添加一些假的充值选项
  chargeOptions.value = [
    { price: 10, type: 1, desc: '测试选项1' },
    { price: 20, type: 2, desc: '测试选项2' },
  ]
  selectedChargeOption.value = chargeOptions.value[0]
  showChargeModal.value = true
  console.log('🧪 测试弹窗状态:', showChargeModal.value)
}

// 显示充值完成提示弹窗
const showChargeCompletePrompt = () => {
  showChargeCompleteDialog.value = true
}

// 刷新积分
const refreshUserPoints = async () => {
  console.log('🔄 开始刷新用户积分...')

  try {
    // 显示加载提示
    showToast({
      message: '充值中...',
      position: 'top',
      duration: 0, // 不自动消失
      className: 'custom-toast-loading',
      icon: 'loading',
    })

    // 调用获取积分接口
    const pointsResult = await fetchUserPoints()

    // 关闭加载提示
    closeToast()

    if (pointsResult.code === 1 && pointsResult.data) {
      // 更新用户积分信息
      const userInfo = getUserInfo()
      if (userInfo) {
        // 更新本地存储的用户信息
        userInfo.user_points = pointsResult.data.points
        userInfo.points = pointsResult.data.points
        userInfo.video_nums = pointsResult.data.video_nums
        userInfo.is_vip = pointsResult.data.is_vip
        if (pointsResult.data.endtime) {
          userInfo.endtime = pointsResult.data.endtime
        }
        setUserInfo(userInfo)

        // 更新页面显示的数据
        userVideoNums.value = pointsResult.data.video_nums
        isVip.value = pointsResult.data.is_vip || 0
        vipEndtime.value = pointsResult.data.endtime || ''
      }

      // 显示成功提示
      showToast({
        message: `当前观看次数：${pointsResult.data.video_nums}`,
        position: 'top',
        duration: 2000,
        className: 'custom-toast-success',
        icon: 'success',
      })

      console.log('✅ 积分刷新完成，当前积分:', pointsResult.data.points)
      console.log('✅ 积分详情:', pointsResult.data)
    } else {
      // 显示失败提示
      showToast({
        message: pointsResult.msg || '积分刷新失败',
        position: 'top',
        duration: 3000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
    }

    // 关闭充值完成弹窗
    showChargeCompleteDialog.value = false
  } catch (error) {
    console.error('❌ 刷新积分失败:', error)

    // 关闭加载提示
    closeToast()

    showToast({
      message: '刷新积分失败，请稍后再试',
      position: 'top',
      duration: 3000,
      className: 'custom-toast-error',
      icon: 'cross',
    })
  }
}

// 关闭充值完成弹窗
const closeChargeCompleteDialog = () => {
  showChargeCompleteDialog.value = false
}

// 选择充值选项
const selectChargeOption = (option: { price: number; type: number; desc: string }) => {
  selectedChargeOption.value = option
}

// 确认充值
const confirmCharge = async () => {
  if (!selectedChargeOption.value) {
    showToast({
      message: '请选择充值选项',
      position: 'top',
      duration: 2000,
      className: 'custom-toast-error',
      icon: 'cross',
    })
    return
  }

  try {
    // 显示加载状态
    showToast({
      message: '正在处理充值...',
      position: 'top',
      duration: 0, // 不自动消失
      className: 'custom-toast-loading',
      icon: 'loading',
    })

    // 构建充值接口URL
    const buyUrl = `${BASE_URL}/index.php/ajax/buy.html`
    console.log('🔍 充值接口请求URL:', buyUrl)

    // 获取用户信息
    const userInfo = getUserInfo()
    if (!userInfo) {
      closeToast()
      showToast({
        message: '用户信息不存在，请刷新页面重试',
        position: 'top',
        duration: 3000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
      return
    }

    // 兼容游客用户和正式用户的数据结构
    const uid = userInfo.user_id || userInfo.id
    if (!uid) {
      closeToast()
      showToast({
        message: '用户ID不存在，请重新登录',
        position: 'top',
        duration: 3000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
      return
    }

    // 获取包含认证信息的请求头（token和reqTime会在请求头中）
    const authHeaders = createAuthHeaders(true) as any

    // 构建请求体参数 - 只需要 uid 和 type
    // token 和 reqTime 已经在请求头中，PHP代理会转发这些请求头
    const formData = new URLSearchParams()
    formData.append('uid', uid.toString())
    formData.append('type', selectedChargeOption.value.type.toString())

    console.log('📝 充值参数:')
    console.log('  请求头:', {
      token: authHeaders.token ? '***已设置***' : '未设置',
      reqTime: authHeaders.reqTime,
    })
    console.log('  请求体:', {
      uid: uid,
      type: selectedChargeOption.value.type,
    })

    const response = await fetch(buyUrl, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    console.log('💰 充值接口返回:', result)

    // 关闭加载提示
    closeToast()

    if (result.code === 1) {
      // 检查是否返回了支付链接
      if (result.data && result.data.payUrl) {
        // 使用直接跳转方式打开支付页面
        console.log('🔗 准备跳转到支付页面:', result.data.payUrl)

        showToast({
          message: '正在跳转到支付页面...',
          position: 'top',
          duration: 2000,
          className: 'custom-toast-info',
          icon: 'info-o',
        })

        // 延迟跳转，让用户看到提示
        setTimeout(() => {
          window.location.href = result.data.payUrl
        }, 500)

        // 关闭充值弹窗
        showChargeModal.value = false

        // 延迟显示充值完成提示弹窗
        setTimeout(() => {
          showChargeCompletePrompt()
        }, 1000)
      } else {
        // 充值成功（无需跳转支付页面）
        showToast({
          message: '充值成功！',
          position: 'top',
          duration: 2000,
          className: 'custom-toast-success',
          icon: 'success',
        })

        // 关闭充值弹窗
        showChargeModal.value = false

        // 刷新用户信息
        await getUserRealTimeInfo()

        // 可以在这里添加其他成功后的逻辑，比如重新检查积分并播放视频
      }
    } else if (result.code === 0 && result.msg === '请先登录') {
      // 需要登录
      showToast({
        message: '请先登录后再充值',
        position: 'top',
        duration: 2000,
        className: 'custom-toast-error',
        icon: 'cross',
      })

      // 关闭充值弹窗
      showChargeModal.value = false

      // 显示登录弹窗
      showAuthenticationModal('login')
    } else {
      // 充值失败
      showToast({
        message: result.msg || '充值失败，请重试',
        position: 'top',
        duration: 3000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
    }
  } catch (error) {
    console.error('🚫 充值请求失败:', error)

    // 关闭加载提示
    closeToast()

    showToast({
      message: '网络错误，请稍后再试',
      position: 'top',
      duration: 3000,
      className: 'custom-toast-error',
      icon: 'cross',
    })
  }
}

// 处理登录提交
const handleLogin = async () => {
  // 基本表单验证
  if (!loginUsername.value || !loginPassword.value) {
    authErrorMsg.value = '用户名和密码不能为空'
    return
  }

  isAuthLoading.value = true
  authErrorMsg.value = ''

  try {
    // 假设有一个login API
    const result = await userLogin({
      user_name: loginUsername.value,
      user_pwd: loginPassword.value,
    })

    console.log('登录结果:', result)

    if (result && result.code === 1) {
      // 登录成功
      showToast({
        message: '登录成功',
        position: 'top',
        duration: 2000,
        className: 'custom-toast-success',
        icon: 'success',
      })

      // 关闭弹窗
      closeAuthModal()

      // 获取用户信息并开始播放视频
      await fetchUserInfo()
      playVideo()
    } else {
      // 登录失败
      authErrorMsg.value = result?.msg || '登录失败，请检查账号密码'
    }
  } catch (error: any) {
    console.error('登录请求失败:', error)
    authErrorMsg.value = error.message || '网络请求失败，请稍后再试'
  } finally {
    isAuthLoading.value = false
  }
}

// 处理注册提交
const handleRegister = async () => {
  // 基本表单验证
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
    // 获取邀请码（优先使用表单中填写的邀请码）
    const inviteCodeValue = registerInviteCode.value || ''

    // 调用注册API
    const result = await registerUser({
      country_code: 86, // 固定为86
      user_login: registerUsername.value,
      user_pass: registerPassword.value,
      user_pass2: registerConfirmPassword.value,
      rec_code: inviteCodeValue || undefined,
    })

    console.log('注册结果:', result)

    if (result && result.code === 1 && result.data) {
      // 注册成功，自动保存用户信息（相当于自动登录）
      const userData = {
        user_id: result.data.user_id,
        user_name: result.data.user_name,
        token: result.data.token,
        user_portrait: result.data.user_portrait,
        user_points: result.data.user_points || 0,
        group_id: result.data.group_id,
        group_name: result.data.group_name,
        user_nick_name: result.data.user_nick_name,
        rec_code: result.data.rec_code,
      }

      // 保存用户信息到本地存储
      setUserInfo(userData)

      // 显示成功提示
      showToast({
        message: '注册成功',
        position: 'top',
        duration: 1500,
        className: 'custom-toast-success',
        icon: 'success',
      })

      // 关闭弹窗
      closeAuthModal()

      // 延迟一下再播放视频，确保用户能看到成功提示
      setTimeout(async () => {
        // 获取最新的用户信息
        await fetchUserInfo()
        // 开始播放视频
        playVideo()
      }, 500)
    } else {
      // 注册失败
      authErrorMsg.value = result?.msg || '注册失败，请稍后再试'
    }
  } catch (error: any) {
    console.error('注册请求失败:', error)
    authErrorMsg.value = error.message || '网络请求失败，请稍后再试'
  } finally {
    isAuthLoading.value = false
  }
}

// 监听路由参数变化
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      console.log('视频ID变化:', newId)
      videoId.value = newId as string

      // 重置播放状态
      isPlaying.value = false

      // 重置广告状态
      showVideoAd.value = false

      // 清理HLS实例
      if (hls.value) {
        hls.value.destroy()
        hls.value = null
      }

      // 重新获取视频详情
      fetchVideoDetailData()
    }
  },
)

// 处理封面图片URL
const getCoverUrl = (url?: string) => {
  if (!url) {
    return ''
  }

  if (url.startsWith('http')) {
    return url
  } else if (url.startsWith('/')) {
    return `${BASE_URL}${url}`
  } else {
    return `${BASE_URL}/${url}`
  }
}

// 设置视频源
const setupVideoSource = (src: string) => {
  // 清理之前的实例
  if (hls.value) {
    hls.value.destroy()
    hls.value = null
  }

  // 检查视频元素是否存在
  if (!videoEl.value) {
    console.error('视频元素不存在')
    return
  }

  console.log('设置视频源:', src)

  // 确保URL是绝对路径
  let videoUrl = src
  if (!videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
    // 如果是相对路径，添加BASE_URL
    videoUrl = `${BASE_URL}/${videoUrl}`
  }

  // 检查URL是否包含localhost，这通常表示相对路径被错误地解析
  if (videoUrl.includes('localhost') && !src.includes('localhost')) {
    console.warn('检测到可能的URL解析问题，尝试修正URL', src)
    // 尝试从原始URL中提取相对路径
    const pathParts = src.split('/')
    if (pathParts.length > 0) {
      // 重建URL，使用完整的BASE_URL
      videoUrl = `${BASE_URL}/${src}`
    }
  }

  console.log('最终视频URL:', videoUrl)

  // 重置播放状态
  isVideoPlayed.value = false

  // 设置iOS防止自动全屏的属性
  videoEl.value.setAttribute('playsinline', 'true')
  videoEl.value.setAttribute('webkit-playsinline', 'true')
  videoEl.value.setAttribute('x5-playsinline', 'true')
  videoEl.value.setAttribute('x5-video-player-type', 'h5')
  videoEl.value.setAttribute('x5-video-player-fullscreen', 'false')

  // 添加视频事件监听
  videoEl.value.addEventListener('play', handleVideoPlay)
  videoEl.value.addEventListener('ended', handleVideoEnded)

  // 判断是否是m3u8格式
  if (videoUrl.includes('.m3u8')) {
    console.log('检测到m3u8格式，使用HLS播放')

    // 检查浏览器是否原生支持HLS
    if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('浏览器原生支持HLS，直接播放')
      videoEl.value.src = videoUrl
    }
    // 使用HLS.js
    else if (Hls.isSupported()) {
      console.log('使用HLS.js播放')
      const newHls = new Hls({
        // 配置HLS.js
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        // 增加请求超时时间
        xhrSetup: function (xhr) {
          xhr.timeout = 10000 // 10秒超时
        },
      })
      hls.value = newHls

      // 先添加错误处理程序
      newHls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS播放错误:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('致命网络错误')

              // 检查错误响应是否包含HTML内容
              if (
                data.response &&
                data.response.data &&
                typeof data.response.data === 'string' &&
                data.response.data.includes('<!DOCTYPE html>')
              ) {
                console.error('服务器返回了HTML内容而不是视频流，URL可能有误')
                hasError.value = true
                errorMessage.value = '视频资源不可用或地址错误，请稍后再试'

                // 尝试显示更具体的错误信息
                const serverMessage = '服务器返回了网页而不是视频内容'
                errorMessage.value = serverMessage
              } else {
                // 尝试恢复一次
                console.log('尝试重新加载...')
                newHls.startLoad()
              }
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('致命媒体错误')
              newHls.recoverMediaError() // 尝试恢复
              break
            default:
              console.error('无法恢复的错误:', data)
              hasError.value = true
              errorMessage.value = '视频播放失败，格式可能不受支持'
              newHls.destroy()
              break
          }
        } else {
          // 非致命错误，记录但不中断
          console.warn('HLS非致命错误:', data)
        }
      })

      // 加载视频源
      try {
        newHls.loadSource(videoUrl)
        newHls.attachMedia(videoEl.value)

        newHls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS清单解析完成，开始播放')
          videoEl.value?.play().catch((e: Error) => {
            console.error('自动播放失败:', e)
          })
        })
      } catch (error: any) {
        console.error('加载视频源时出错:', error)
        hasError.value = true
        errorMessage.value = '加载视频源失败: ' + (error.message || '未知错误')
      }
    } else {
      console.error('浏览器不支持HLS.js')
      videoEl.value.src = videoUrl // 尝试直接播放
      hasError.value = true
      errorMessage.value = '您的浏览器不支持当前视频格式'
    }
  } else {
    // 普通视频格式
    console.log('普通视频格式，直接播放')
    videoEl.value.src = videoUrl
  }
}

// 视频开始播放事件处理
const handleVideoPlay = () => {
  console.log('视频开始播放')
  // 只有第一次播放时才更新播放次数
  if (!isVideoPlayed.value) {
    isVideoPlayed.value = true
    updatePlayCount()

    // 记录播放历史
    recordWatchHistory()

    // 如果是付费视频且之前未观看，则更新用户信息
    if (isNeedPay.value && pointsNeeded.value > 0) {
      console.log('付费视频播放开始，将在播放后更新用户积分信息')
      // 设置已观看状态，防止重复扣费
      isWatched.value = true

      // 延迟更新用户积分信息，确保后端扣费已完成
      setTimeout(async () => {
        await getUserRealTimeInfo()
      }, 2000)
    }
  }
}

// 视频播放结束事件处理
const handleVideoEnded = () => {
  console.log('视频播放结束')
  // 可以在这里添加播放完成后的逻辑
}

// 获取用户实时信息
const getUserRealTimeInfo = async () => {
  // 获取用户信息（游客用户也可以获取）
  const currentUserInfo = getUserInfo()
  if (!currentUserInfo) {
    console.log('没有用户信息，无法获取实时信息')
    return null
  }

  // 防止重复请求
  if (isLoadingUserInfo.value) {
    console.log('已有一个获取用户信息的请求正在进行中')
    return null
  }

  isLoadingUserInfo.value = true

  try {
    // 发起POST请求获取实时用户信息
    const result = await fetchUserDatas({})
    console.log('获取用户实时信息结果:', result)

    // 处理API响应，根据提供的数据结构
    if (result && result.code === 1 && result.data) {
      // API返回包含user_points的完整用户数据
      userInfo.value = result.data

      // 更新本地存储的用户信息
      const currentUserInfo = getUserInfo()
      if (currentUserInfo) {
        const updatedUserInfo = {
          ...currentUserInfo,
          user_points: result.data.user_points,
          // 同步其他可能更新的字段
          user_nick_name: result.data.user_nick_name,
          group_id: result.data.group_id,
          group_name: result.data.group_name,
          user_portrait: result.data.user_portrait,
          // 同步VIP相关字段
          video_nums: result.data.video_nums || currentUserInfo.video_nums || 0,
          is_vip: result.data.is_vip || currentUserInfo.is_vip || '0',
          endtime: result.data.endtime || currentUserInfo.endtime || '',
        }
        setUserInfo(updatedUserInfo)

        // 更新页面显示的VIP数据
        userVideoNums.value = updatedUserInfo.video_nums
        isVip.value = updatedUserInfo.is_vip
        vipEndtime.value = updatedUserInfo.endtime
      }

      console.log('更新用户实时积分:', result.data.user_points)
      return result.data
    } else {
      console.error('获取用户实时信息失败:', result)
      // 如果API失败，使用本地用户信息
      const localUserInfo = getUserInfo()
      if (localUserInfo) {
        userInfo.value = localUserInfo
        return localUserInfo
      }
      return null
    }
  } catch (error) {
    console.error('获取用户实时信息请求失败:', error)
    // 出错时使用本地用户信息
    const localUserInfo = getUserInfo()
    if (localUserInfo) {
      userInfo.value = localUserInfo
      return localUserInfo
    }
    return null
  } finally {
    isLoadingUserInfo.value = false
  }
}

// 播放视频
const playVideo = async () => {
  // 先显示广告弹窗
  showVideoAd.value = true
}

// 关闭广告弹窗并继续播放流程
const closeVideoAdAndPlay = () => {
  showVideoAd.value = false

  // 继续原来的播放逻辑
  proceedToPlay()
}

// 广告左侧点击跳转
const handleAdLeftClick = () => {
  window.open('https://fyf8.cc', '_blank')
}

// 广告右侧点击跳转
const handleAdRightClick = () => {
  window.open('https://186ab.cc', '_blank')
}

// 充值广告点击跳转
const handleChargeAdClick = () => {
  console.log('充值广告被点击，准备跳转到 68.fo')
  window.location.href = 'https://68.fo'
}

// 继续播放流程（原来的playVideo逻辑）
const proceedToPlay = async () => {
  // 先判断是否是免费视频
  if (isFreeVideo.value) {
    // 免费视频流程，直接继续播放
    continuePlay()
    return
  }

  // 如果是付费视频，直接继续付费流程（游客用户也可以观看）
  if (!isFreeVideo.value) {
    // 继续正常付费流程
    continuePlay()
    return
  }
}

// 继续播放流程
const continuePlay = async () => {
  // 显示加载状态
  showToast({
    message: '加载中',
    duration: 0,
    forbidClick: true,
  })

  try {
    // 获取用户最新积分信息
    console.log('正在获取用户最新积分信息...')
    const latestUserInfo = await getUserRealTimeInfo()

    // 同时获取最新的VIP和积分状态
    await fetchLatestPointsInfo()

    // 关闭加载提示
    closeToast()

    // 根据is_watched字段判断是否需要扣费
    // is_watched为1表示已观看，直接播放
    if (isWatched.value) {
      // 已观看过，直接播放
      console.log('用户已观看过此视频，直接播放')
      startVideoPlayback()
      return
    }

    // 未观看过，检查是否需要付费
    if (isNeedPay.value && pointsNeeded.value > 0) {
      // 付费视频，首先检查VIP状态
      console.log('付费视频且未观看，开始VIP和观看次数检查')

      // 1. 优先检查VIP状态
      const currentIsVip = Number(isVip.value) === 1

      console.log(
        '🎯 VIP状态检查 - isVip原始值:',
        isVip.value,
        '类型:',
        typeof isVip.value,
        '是否VIP:',
        currentIsVip,
      )

      if (currentIsVip) {
        // VIP用户，直接播放（不判断到期时间）
        console.log('✅ VIP用户，直接播放视频')
        startVideoPlayback()
        return
      } else {
        console.log('❌ 非VIP用户，继续观看次数检查流程')
      }

      // 2. 非VIP用户，先检查观看次数
      const currentVideoNums = userVideoNums.value || 0
      
      console.log('🎬 观看次数检查 - 当前次数:', currentVideoNums, '需要次数: 1')
      
      if (currentVideoNums >= 1) {
        // 观看次数足够，弹窗确认扣除次数
        console.log('✅ 观看次数充足，弹窗确认')
        showDialog({
          title: '付费确认',
          message: `观看此视频需要扣除 1 观影次数，确认观看吗？`,
          confirmButtonText: `扣除 1 观影次数观看`,
          cancelButtonText: '取消',
          showCancelButton: true,
          confirmButtonColor: '#ff9500',
        })
          .then(() => {
            // 用户确认扣费，开始播放视频
            console.log('用户确认扣除观看次数，开始播放视频')
            deductPointsAndPlay()
          })
          .catch(() => {
            // 用户取消扣费
          })
        return
      } else {
        console.log('❌ 观看次数不足，检查积分余额')
      }

      // 3. 观看次数不足，检查积分余额
      const currentPoints =
        latestUserInfo?.user_points !== undefined ? latestUserInfo.user_points : userPoints.value

      console.log('💰 积分检查 - 当前积分:', currentPoints, '需要积分:', pointsNeeded.value)
      
      if (currentPoints < pointsNeeded.value) {
        console.log('❌ 积分不足，显示充值弹窗')
        // 显示充值选项弹窗
        await showChargeDialog()
        return
      } else {
        console.log('✅ 积分充足，弹窗确认扣费')
      }

      // 积分足够，弹窗确认扣费
      showDialog({
        title: '付费确认',
        message: `观看此视频需要扣除 ${pointsNeeded.value} 积分，确认观看吗？`,
        confirmButtonText: `扣除 ${pointsNeeded.value} 积分观看`,
        cancelButtonText: '取消',
        showCancelButton: true,
        confirmButtonColor: '#ff9500',
      })
        .then(() => {
          // 用户确认扣费，开始播放视频
          console.log('用户确认扣除积分，开始播放视频')
          deductPointsAndPlay()
        })
        .catch(() => {
          // 用户取消扣费
        })
    } else {
      // 免费视频，直接播放
      console.log('免费视频，直接播放')
      startVideoPlayback()
    }
  } catch (error) {
    console.error('❌ 播放权限检查失败:', error)
    closeToast()
    showToast({
      message: '检查播放权限失败，请稍后重试',
      icon: 'fail',
    })
  }
}

// 扣除积分并播放视频
const deductPointsAndPlay = () => {
  // 直接播放视频，由后端处理扣费
  startVideoPlayback()

  // 记录视频已经播放，用于防止重复扣费
  isWatched.value = true

  // 视频开始播放后，延迟更新用户积分信息，确保扣费已完成
  setTimeout(async () => {
    await getUserRealTimeInfo()
  }, 2000)
}

// 开始视频播放的统一方法
const startVideoPlayback = () => {
  // 直接播放视频，不隐藏其他内容
  console.log('开始播放视频:', videoSrc.value)
  // 重置错误状态
  hasError.value = false
  errorMessage.value = ''
  isPlaying.value = true

  // 异步设置视频源，确保DOM已更新
  setTimeout(() => {
    setupVideoSource(videoSrc.value)
  }, 100)
}

// 添加更新播放次数的方法
const updatePlayCount = async () => {
  if (!videoDetail.value || !videoDetail.value.vod_id) return

  try {
    const params = {
      mid: 1, // 影片类型为1
      id: videoDetail.value.vod_id,
      type: 'update', // 更新播放次数
    }

    console.log('正在更新播放次数...')
    const result = await updateVideoHits(params)
    console.log('播放次数更新结果:', result)

    // 如果API返回新的播放次数，可以更新界面显示
    if (result && result.data && result.data.hits) {
      // 更新UI上的播放次数
      if (videoDetail.value) {
        videoDetail.value.vod_hits = result.data.hits
      }
    }
  } catch (error) {
    console.error('更新播放次数失败:', error)
    // 这里不需要向用户显示错误，静默失败
  }
}

// 记录播放历史
const recordWatchHistory = async () => {
  if (!videoDetail.value || !videoDetail.value.vod_id) return

  try {
    const params = {
      mid: 1, // 影片类型为1
      id: videoDetail.value.vod_id,
      type: 1, // 1表示浏览记录
      ac: 'set', // 设置记录
    }

    console.log('正在记录播放历史...')
    const result = await updateUserLog(params)
    console.log('记录播放历史结果:', result)

    if (result && result.code === 1) {
      console.log('播放历史记录成功')
    } else {
      console.error('播放历史记录失败:', result?.msg || '未知错误')
    }
  } catch (error) {
    console.error('记录播放历史失败:', error)
    // 静默失败，不影响用户体验
  }
}

// 获取视频详情
const fetchVideoDetailData = async () => {
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''

  // 重置点赞状态
  isDigged.value = false
  isDiggLoading.value = false

  // 重置收藏状态
  isCollected.value = false
  isCollectLoading.value = false

  // 重置付费状态
  isNeedPay.value = false
  pointsNeeded.value = 0

  try {
    // 获取用户实时信息
    await getUserRealTimeInfo()

    const result = await fetchVideoDetail(videoId.value)
    console.log('视频详情数据:', result)

    // 检查是否需要登录
    if (result.code === 0 && result.msg === '请先登录') {
      showDialog({
        title: '需要登录',
        message: '观看视频需要登录，是否前往登录？',
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        showCancelButton: true,
        confirmButtonColor: '#ff9500',
      })
        .then(() => {
          // 用户点击去登录，显示登录弹窗而不是跳转
          showAuthenticationModal('login')
        })
        .catch(() => {
          // 用户取消登录，返回上一页
          goBack()
        })
      return
    }

    if (result.code === 1 && result.data) {
      videoDetail.value = result.data

      // 打印所有视频信息用于调试
      console.log('视频完整信息:', JSON.stringify(result.data))

      // 设置视频播放地址
      if (result.data.vod_play_url) {
        // 尝试解析视频播放URL
        const playUrl = result.data.vod_play_url
        console.log('原始播放地址:', playUrl)

        // 验证URL是否有效
        if (!playUrl || playUrl === 'undefined' || playUrl === 'null') {
          console.error('视频播放地址无效')
          hasError.value = true
          errorMessage.value = '视频源不可用，请稍后再试'
          return
        }

        // 确保URL是有效的，使用直接提供的链接
        videoSrc.value = playUrl
        console.log('设置最终播放地址:', videoSrc.value)
      } else {
        console.error('视频播放地址为空')
        hasError.value = true
        errorMessage.value = '视频源不可用，请稍后再试'
      }

      // 检查是否付费视频
      if (result.data.vod_points_play !== undefined && result.data.vod_points_play !== null) {
        // 确保转换为数字，处理字符串、数字等各种情况
        const pointsValue = Number(result.data.vod_points_play)

        if (!isNaN(pointsValue) && pointsValue > 0) {
          isNeedPay.value = true
          pointsNeeded.value = pointsValue
          console.log('检测到付费视频，需要积分:', pointsNeeded.value)
        } else {
          // 确保免费视频不会被标记为付费
          isNeedPay.value = false
          pointsNeeded.value = 0
          console.log('检测到免费视频(积分值为0或无效)')
        }
      } else {
        // 字段不存在的情况，视为免费
        isNeedPay.value = false
        pointsNeeded.value = 0
        console.log('检测到免费视频(无积分字段)')
      }

      // 检查用户是否已观看过此视频
      if (result.data.is_watched !== undefined) {
        isWatched.value = result.data.is_watched === 1
        console.log('用户观看状态:', isWatched.value ? '已观看' : '未观看')
      }

      // 检查用户是否已点赞（如果API返回了该信息）
      if (result.data.user_digg === 1) {
        isDigged.value = true
      }

      // 检查用户是否已收藏（如果API返回了该信息）
      if (result.data.user_collect === 1) {
        isCollected.value = true
      }

      // 视频详情加载完成后，再获取推荐视频
      setTimeout(() => {
        fetchRecommendVideosData()
      }, 300)

      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      hasError.value = true
      errorMessage.value = result.msg || '获取视频详情失败'
    }
  } catch (error: any) {
    console.error('获取视频详情请求失败:', error)
    hasError.value = true
    errorMessage.value = error.message || '网络请求错误'
  } finally {
    isLoading.value = false
  }
}

// 获取推荐视频
const fetchRecommendVideosData = async (refresh = false) => {
  try {
    if (refresh) {
      isRefreshingRecommends.value = true
    } else {
      isRecommendLoading.value = true
    }

    // 清空现有推荐视频数据
    recommendVideos.value = []

    // 构建参数，传递当前视频ID和分类ID
    const params = {
      id: videoId.value,
      page: 1, // 固定为第1页，每次获取新的推荐
      type_id: videoDetail.value?.type_id || 1,
    }

    console.log('猜你喜欢请求参数:', params)
    console.log('当前视频type_id:', videoDetail.value?.type_id)

    // 使用详情页推荐接口
    const result = await fetchDetailRecommend(params)

    console.log('详情页推荐接口返回数据:', JSON.stringify(result))

    // 检查不同的返回结构
    let videoList = []
    if (result && result.data && Array.isArray(result.data)) {
      // 常见情况：data数组包含数据
      // 过滤掉非对象类型的数据项（如数字、字符串等）
      videoList = result.data.filter((item: any) => typeof item === 'object' && item !== null)
      console.log(
        '使用result.data结构，原始长度:',
        result.data.length,
        '过滤后长度:',
        videoList.length,
      )
    } else if (result && result.list && Array.isArray(result.list)) {
      // 备选结构1：list数组包含数据
      videoList = result.list.filter((item: any) => typeof item === 'object' && item !== null)
      console.log(
        '使用result.list结构，原始长度:',
        result.list.length,
        '过滤后长度:',
        videoList.length,
      )
    } else if (result && result.data && result.data.list && Array.isArray(result.data.list)) {
      // 备选结构2：data.list数组包含数据
      videoList = result.data.list.filter((item: any) => typeof item === 'object' && item !== null)
      console.log(
        '使用result.data.list结构，原始长度:',
        result.data.list.length,
        '过滤后长度:',
        videoList.length,
      )
    } else if (Array.isArray(result)) {
      // 备选结构3：直接返回数组
      videoList = result.filter((item: any) => typeof item === 'object' && item !== null)
      console.log('使用直接数组结构，原始长度:', result.length, '过滤后长度:', videoList.length)
    }

    console.log('过滤后的视频列表长度:', videoList.length)
    console.log('过滤后的视频列表前3项:', videoList.slice(0, 3))

    if (videoList.length > 0) {
      // 转换API返回的数据格式为VideoItem[]格式
      const videos = videoList.map((item: any) => {
        // 根据vod_points_play字段判断是否收费
        const isVip = item.vod_points_play > 0
        const isFree = item.vod_points_play === 0 || !item.vod_points_play
        const pointsPlay = item.vod_points_play !== undefined ? Number(item.vod_points_play) : 0

        const videoItem = {
          id: item.vod_id || item.id,
          coverUrl: getCoverUrl(item.vod_pic),
          title: item.vod_name || '',
          isVip: isVip,
          isFree: isFree,
          duration: item.vod_duration || '',
          class: item.vod_class || item.type_name || '',
          time: item.vod_pubdate || item.vod_time || '',
          points: isVip ? pointsPlay + '积分' : '',
        }

        // 调试封面URL问题
        console.log(`视频 ${videoItem.title} 的封面URL:`, videoItem.coverUrl)

        return videoItem
      })

      console.log('转换后的推荐视频数据:', videos.length, '个视频')

      // 处理视频列表并插入广告
      let processedVideos = [...videos]

      // 限制视频数量为10条（包含广告）
      if (processedVideos.length > 10) {
        processedVideos = processedVideos.slice(0, 10)
      }

      // 只有有广告数据时才插入广告
      if (listAds.value.length > 0) {
        const adsToUse = listAds.value.slice(0, 3)

        // 在特定位置插入广告
        for (let i = 0; i < Math.min(adPositions.value.length, adsToUse.length); i++) {
          const position = adPositions.value[i]
          // 确保位置在有效范围内
          if (processedVideos.length >= position) {
            processedVideos.splice(position, 0, adsToUse[i])
          }
        }
      }

      // 直接替换推荐视频数据
      recommendVideos.value = processedVideos
    } else {
      console.error('推荐视频数据格式错误或为空:', result)

      // 如果没有数据，使用测试数据
      if (recommendVideos.value.length === 0) {
        // 从服务器获取数据失败，创建测试数据
        // 使用数组生成10个不同的测试视频
        const testVideos = [
          {
            vod_id: 1179,
            type_id: 8,
            vod_name: '包臀裙妹子蹲着口交上位骑坐站立侧入抽插猛操',
            vod_class: '国产丝袜',
            vod_pic: 'upload/vod/20250401-1/96df3e7d5df6e0f2d927b386a7a8f0a1.jpg',
            vod_pubdate: '2025-04-01 13:39:53',
          },
          {
            vod_id: 1180,
            type_id: 9,
            vod_name: '性感美女制服诱惑高清视频',
            vod_class: '日韩精品',
            vod_pic: 'upload/vod/20250401-1/87df3e7d5df6e0f2d927b386a7a8f0b2.jpg',
            vod_pubdate: '2025-04-02 14:25:33',
          },
          {
            vod_id: 1181,
            type_id: 7,
            vod_name: '黑丝长腿模特户外露出大胆拍摄',
            vod_class: '欧美激情',
            vod_pic: 'upload/vod/20250401-1/65df3e7d5df6e0f2d927b386a7a8f0c3.jpg',
            vod_pubdate: '2025-04-03 09:15:22',
          },
          {
            vod_id: 1182,
            type_id: 6,
            vod_name: '双飞两个极品高颜值的美女',
            vod_class: '自拍偷拍',
            vod_pic: 'upload/vod/20250401-1/45df3e7d5df6e0f2d927b386a7a8f0d4.jpg',
            vod_pubdate: '2025-04-04 18:40:11',
          },
          {
            vod_id: 1183,
            type_id: 10,
            vod_name: '极品女神做爱实录高清无码',
            vod_class: '中文字幕',
            vod_pic: 'upload/vod/20250401-1/32df3e7d5df6e0f2d927b386a7a8f0e5.jpg',
            vod_pubdate: '2025-04-05 11:32:45',
          },
          {
            vod_id: 1184,
            type_id: 8,
            vod_name: '丝袜高跟OL制服诱惑私拍',
            vod_class: '国产丝袜',
            vod_pic: 'upload/vod/20250401-1/76df3e7d5df6e0f2d927b386a7a8f0f6.jpg',
            vod_pubdate: '2025-04-06 16:20:33',
          },
          {
            vod_id: 1185,
            type_id: 9,
            vod_name: '日本AV女优精选合集',
            vod_class: '日韩精品',
            vod_pic: 'upload/vod/20250401-1/54df3e7d5df6e0f2d927b386a7a8f0g7.jpg',
            vod_pubdate: '2025-04-07 12:45:22',
          },
          {
            vod_id: 1186,
            type_id: 7,
            vod_name: '欧美金发女郎激情演出',
            vod_class: '欧美激情',
            vod_pic: 'upload/vod/20250401-1/43df3e7d5df6e0f2d927b386a7a8f0h8.jpg',
            vod_pubdate: '2025-04-08 19:30:11',
          },
          {
            vod_id: 1187,
            type_id: 6,
            vod_name: '偷拍系列精品合集',
            vod_class: '自拍偷拍',
            vod_pic: 'upload/vod/20250401-1/32df3e7d5df6e0f2d927b386a7a8f0i9.jpg',
            vod_pubdate: '2025-04-09 10:15:45',
          },
          {
            vod_id: 1188,
            type_id: 10,
            vod_name: '中文字幕剧情片精选',
            vod_class: '中文字幕',
            vod_pic: 'upload/vod/20250401-1/21df3e7d5df6e0f2d927b386a7a8f0j0.jpg',
            vod_pubdate: '2025-04-10 14:25:33',
          },
        ]

        // 创建视频列表
        recommendVideos.value = testVideos.map((item) => {
          // 根据固定规则生成测试数据
          const isVip = false // 测试数据全部设为免费
          const isFree = true

          return {
            id: item.vod_id,
            coverUrl: getCoverUrl(item.vod_pic),
            title: item.vod_name,
            isVip: isVip,
            isFree: isFree,
            duration: '',
            class: item.vod_class,
            time: item.vod_pubdate,
            points: '',
          }
        })
      }
    }
  } catch (error) {
    console.error('获取推荐视频失败:', error)
  } finally {
    isRecommendLoading.value = false
    isRefreshingRecommends.value = false
  }
}

// 换一批推荐视频
const refreshRecommends = () => {
  // 防止重复加载
  if (isRefreshingRecommends.value) {
    return
  }

  console.log('换一批推荐视频')
  fetchRecommendVideosData(true)
}

// 分享方法
const shareVideo = () => {
  // 检查登录状态
  if (!isLoggedIn()) {
    showDialog({
      title: '提示',
      message: '分享功能需要登录，是否前往登录？',
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      showCancelButton: true,
      confirmButtonColor: '#ff9500',
    })
      .then(() => {
        // 用户点击确认，显示登录弹窗
        showAuthenticationModal('login')
      })
      .catch(() => {
        // 用户点击取消，关闭弹窗（自动处理）
      })
    return
  }

  // 获取分享链接
  const shareUrl = getCurrentShareUrl()
  console.log('生成的分享链接:', shareUrl)

  // 直接复制链接到剪贴板
  try {
    // 创建临时输入框
    const tempInput = document.createElement('input')
    tempInput.value = shareUrl
    document.body.appendChild(tempInput)
    tempInput.select()

    // 复制到剪贴板
    const successful = document.execCommand('copy')
    document.body.removeChild(tempInput)

    if (successful) {
      showToast({
        message: '复制成功',
        position: 'top',
        duration: 3000,
        className: 'custom-toast',
        icon: 'success',
      })
      console.log('成功复制的链接:', shareUrl)
    } else {
      throw new Error('复制操作失败')
    }
  } catch (err) {
    console.error('传统复制方法失败，尝试clipboard API:', err)

    // 尝试使用现代的clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          showToast({
            message: '分享链接已复制，可以发送给好友了',
            position: 'top',
            duration: 3000,
            className: 'custom-toast',
            icon: 'success',
          })
          console.log('clipboard API复制成功:', shareUrl)
        })
        .catch((clipErr) => {
          console.error('clipboard API也失败:', clipErr)
          showToast({
            message: '复制失败，请手动分享链接',
            position: 'top',
            duration: 3000,
            className: 'custom-toast-error',
            icon: 'cross',
          })
        })
    } else {
      showToast({
        message: '复制失败，请手动分享链接',
        position: 'top',
        duration: 3000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
    }
  }
}

// 检查是否需要显示注册提示
const checkShareAndRegister = () => {
  // 从分享链接进入的逻辑已移除，不再显示注册即送积分的弹窗
  // 登录和注册操作已通过其他方式（如点击播放时）处理
  return
}

// 返回上一页
const goBack = () => {
  // 如果正在播放视频，停止播放
  if (isPlaying.value) {
    console.log('停止播放视频并返回上一页')
    isPlaying.value = false

    // 清理视频资源
    if (videoEl.value) {
      videoEl.value.pause()
      videoEl.value.src = ''
    }

    if (hls.value) {
      hls.value.destroy()
      hls.value = null
    }
  }

  // 使用浏览器的历史记录返回上一页
  console.log('返回上一页')
  router.back()
}

// 处理滚动事件
const handleScroll = () => {
  if (!videoContainerRef.value || !isPlaying.value) return

  const scrollY = window.scrollY || document.documentElement.scrollTop

  // 当滚动超过一定距离时，启用浮动模式
  if (scrollY > 100) {
    isVideoFloating.value = true
  } else {
    isVideoFloating.value = false
  }
}

// 点赞方法
const handleDigg = async () => {
  // 防止重复点赞
  if (isDiggLoading.value || isDigged.value) {
    showToast({
      message: '您已经点过赞了',
      position: 'top',
      duration: 2000,
      className: 'custom-toast-info',
    })
    return
  }

  if (!videoDetail.value || !videoDetail.value.vod_id) {
    showToast({
      message: '获取视频信息失败',
      position: 'top',
      duration: 2000,
      className: 'custom-toast-error',
      icon: 'cross',
    })
    return
  }

  try {
    isDiggLoading.value = true

    const params = {
      mid: 1, // 影片模型ID为1
      id: videoDetail.value.vod_id,
      type: 'up', // 点赞操作
    }

    console.log('正在进行点赞操作...')
    const result = await updateVideoDigg(params)
    console.log('点赞结果:', result)

    if (result && result.code === 1) {
      isDigged.value = true
      showToast({
        message: '点赞成功',
        position: 'top',
        duration: 2000,
        className: 'custom-toast-success',
        icon: 'checked',
      })

      // 如果API返回新的点赞数，更新UI显示
      if (result.data && result.data.up) {
        if (videoDetail.value) {
          videoDetail.value.vod_up = result.data.up
        }
      } else if (videoDetail.value) {
        // 如果API没有返回新的点赞数，手动+1
        videoDetail.value.vod_up = (Number(videoDetail.value.vod_up) || 0) + 1
      }
    } else {
      showToast({
        message: result?.msg || '点赞失败，请稍后再试',
        position: 'top',
        duration: 2000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
    }
  } catch (error: any) {
    console.error('点赞请求失败:', error)
    showToast({
      message: error.message || '点赞失败，请稍后再试',
      position: 'top',
      duration: 2000,
      className: 'custom-toast-error',
      icon: 'cross',
    })
  } finally {
    isDiggLoading.value = false
  }
}

// 处理收藏
const handleCollect = async () => {
  // 防止重复操作
  if (isCollectLoading.value) {
    return
  }

  if (!videoDetail.value || !videoDetail.value.vod_id) {
    showToast({
      message: '获取视频信息失败',
      position: 'top',
      duration: 2000,
      className: 'custom-toast-error',
      icon: 'cross',
    })
    return
  }

  try {
    isCollectLoading.value = true

    const action = isCollected.value ? 'del' : 'set'
    const params = {
      mid: 1, // 影片模型ID为1
      id: videoDetail.value.vod_id,
      type: 2, // 2表示收藏
      ac: action, // set添加收藏，del取消收藏
    }

    console.log(`正在${isCollected.value ? '取消' : '添加'}收藏...`)
    const result = await updateUserLog(params)
    console.log('收藏操作结果:', result)

    if (result && result.code === 1) {
      isCollected.value = !isCollected.value
      showToast({
        message: isCollected.value ? '已加入收藏' : '已取消收藏',
        position: 'top',
        duration: 2000,
        className: isCollected.value ? 'custom-toast-success' : 'custom-toast-info',
        icon: isCollected.value ? 'success' : 'info',
      })
    } else if (result && result.code === 1002) {
      // 假设1002是需要登录的错误码
      showDialog({
        title: '提示',
        message: '收藏功能需要登录，是否前往登录？',
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
      })
        .then(() => {
          // 用户点击确认，显示登录弹窗
          showAuthenticationModal('login')
        })
        .catch(() => {
          // 用户点击取消
        })
    } else {
      showToast({
        message: result?.msg || '操作失败，请稍后再试',
        position: 'top',
        duration: 2000,
        className: 'custom-toast-error',
        icon: 'cross',
      })
    }
  } catch (error: any) {
    console.error('收藏操作失败:', error)
    showToast({
      message: error.message || '操作失败，请稍后再试',
      position: 'top',
      duration: 2000,
      className: 'custom-toast-error',
      icon: 'cross',
    })
  } finally {
    isCollectLoading.value = false
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  // 游客用户也可以获取用户信息
  console.log('获取用户信息（包括游客用户）')

  // 显示加载状态
  showToast({
    message: '加载中',
    duration: 0,
    forbidClick: true,
  })

  // 首先从本地获取用户信息
  const info = getUserInfo()
  if (info) {
    userInfo.value = info
    console.log('视频详情页获取本地用户信息:', info)

    // 初始化VIP相关数据
    userVideoNums.value = info.video_nums || 0
    isVip.value = info.is_vip || 0
    vipEndtime.value = info.endtime || ''
  }

  // 获取实时用户信息
  await getUserRealTimeInfo()

  // 关闭加载提示
  closeToast()
}

// 获取最新的积分和VIP信息
const fetchLatestPointsInfo = async () => {
  try {
    // 显示加载状态
    showToast({
      message: '加载中',
      duration: 0,
      forbidClick: true,
    })

    const pointsResult = await fetchUserPoints()
    if (pointsResult.code === 1 && pointsResult.data) {
      // 更新用户积分信息
      const userInfo = getUserInfo()
      if (userInfo) {
        // 更新本地存储的用户信息
        userInfo.user_points = pointsResult.data.points
        userInfo.points = pointsResult.data.points
        userInfo.video_nums = pointsResult.data.video_nums
        userInfo.is_vip = pointsResult.data.is_vip
        if (pointsResult.data.endtime) {
          userInfo.endtime = pointsResult.data.endtime
        }
        setUserInfo(userInfo)

        // 更新页面显示的数据
        userVideoNums.value = pointsResult.data.video_nums
        isVip.value = pointsResult.data.is_vip || 0
        vipEndtime.value = pointsResult.data.endtime || ''

        console.log('✅ 视频详情页积分信息获取成功:', pointsResult.data)
      }
    }
  } catch (error) {
    console.error('❌ 视频详情页获取积分信息失败:', error)
    // 静默失败，不显示错误提示，避免影响页面正常加载
  } finally {
    // 关闭加载提示
    closeToast()
  }
}

// 跳转到登录页
const goToLogin = () => {
  // 显示登录弹窗而不是跳转到登录页
  showAuthenticationModal('login')
}

// 组件卸载前清理HLS实例和事件监听
onBeforeUnmount(() => {
  if (hls.value) {
    hls.value.destroy()
    hls.value = null
  }

  // 移除视频事件监听
  if (videoEl.value) {
    videoEl.value.removeEventListener('play', handleVideoPlay)
    videoEl.value.removeEventListener('ended', handleVideoEnded)
  }

  // 重置广告状态
  showVideoAd.value = false

  // 移除滚动事件监听
  window.removeEventListener('scroll', handleScroll)
})

// 游客自动登录函数
const performTouristLogin = async () => {
  console.log('=== 视频详情页游客登录开始 ===')

  // 检查本地是否已有用户信息
  const localUserInfo = getUserInfo()

  if (localUserInfo) {
    console.log('✅ 本地已有用户信息，跳过游客登录')
    return
  }

  // 检查是否已登录
  if (isLoggedIn()) {
    console.log('✅ 用户已登录，跳过游客登录')
    return
  }

  try {
    console.log('🔄 开始游客登录流程...')

    const deviceIMEI = getDeviceIMEI()
    console.log('📱 使用设备IMEI进行游客登录:', deviceIMEI)

    // 获取邀请码（优先从URL参数获取，其次从localStorage获取）
    const recCode = inviteCode.value || localStorage.getItem('inviteCode') || undefined
    if (recCode) {
      console.log('📝 检测到邀请码，将在游客登录时传递:', recCode)
    }

    const result = await touristLogin(deviceIMEI, recCode)
    console.log('📥 游客登录API响应:', result)

    if (result.code === 1 && result.data) {
      // 游客登录成功，保存用户信息
      console.log('✅ 游客登录成功，用户信息已保存到本地')

      showToast({
        message: '已获取游客信息',
        duration: 1000,
      })
      
      // 游客登录成功后，重新获取用户信息
      await fetchUserInfo()
    } else {
      // 游客登录失败
      console.error('❌ 游客登录失败:', result)
    }
  } catch (error) {
    console.error('❌ 游客登录异常:', error)
  }

  console.log('=== 视频详情页游客登录结束 ===')
}

onMounted(async () => {
  // 首先执行游客登录（如果需要的话）
  await performTouristLogin()
  
  // 尝试解析URL中的邀请码
  const urlInviteCode = parseUrlInviteCode()
  if (urlInviteCode) {
    console.log('组件挂载时从URL成功解析到邀请码:', urlInviteCode)
  }

  // 将测试函数暴露给全局作用域（仅开发环境）
  if (import.meta.env.DEV) {
    ;(window as any).testShowChargeModal = testShowChargeModal
    console.log('🧪 测试函数已暴露：window.testShowChargeModal()')
  }

  // 打印URL相关信息用于调试
  console.log('完整URL:', window.location.href)
  console.log('URL查询部分:', window.location.search)
  console.log('URL哈希部分:', window.location.hash)
  console.log('路由查询参数:', route.query)
  console.log('计算得到的邀请码:', inviteCode.value)

  // 获取页面数据
  fetchVideoDetailData()
  fetchUserInfo()
  fetchListAds() // 获取广告数据

  // 获取最新的积分和VIP信息
  fetchLatestPointsInfo()

  // 添加滚动事件监听
  window.addEventListener('scroll', handleScroll)
})

// 列表广告数据
const listAds = ref<ListAd[]>([])

// 存储广告位置信息，用于插入广告
const adPositions = ref<number[]>([3, 6, 11])

// 获取列表广告数据
const fetchListAds = async () => {
  try {
    // 请求详情页列表广告数据
    const result = await fetchAds({
      ad_pos: 4, // 详情页推荐位置
      ad_type: 2, // 单图类型
    })

    console.log('获取详情页列表广告数据:', result)

    // 处理API返回的广告数据
    if (
      result &&
      result.code === 1 &&
      result.data &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      // 将API返回的广告数据转换为VideoItem格式
      const apiAds = result.data.map((item: any) => {
        const adItem: ListAd = {
          id: item.id || 0,
          coverUrl: processAdImageUrl(item.ad_img || ''),
          title: item.ad_name || '广告',
          isVip: false,
          isFree: true,
          class: '广告',
          link: item.ad_url || '',
          isAd: true,
        }

        console.log('处理后的详情页列表广告项:', adItem)
        return adItem
      })

      // 更新列表广告数据
      console.log('更新详情页列表广告数据:', apiAds)
      listAds.value = apiAds
    } else {
      console.log('没有获取到详情页列表广告数据，不显示广告')
      listAds.value = []
    }
  } catch (error) {
    console.error('获取详情页列表广告失败:', error)
    listAds.value = []
  }
}

// 处理广告图片路径
const processAdImageUrl = (imgPath: string) => {
  console.log('原始广告图片路径:', imgPath)

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

  console.log('处理后的图片路径:', imageUrl)
  return imageUrl
}

// 处理广告点击
const handleAdClick = (ad: ListAd) => {
  if (!ad.link) return

  console.log(`广告点击: ${ad.title}, 链接: ${ad.link}`)

  // 如果是内部链接，使用路由跳转
  if (ad.link.startsWith('/')) {
    router.push(ad.link)
  } else {
    // 外部链接，使用window.open打开
    window.open(ad.link, '_blank')
  }
}
</script>

<template>
  <div class="video-detail-page">
    <!-- 登录/注册弹窗 -->
    <div v-if="showAuthModal" class="auth-modal-overlay">
      <div class="auth-modal">
        <!-- 选项卡头部，移到最上面 -->
        <div class="auth-tabs">
          <div
            class="auth-tab"
            :class="{ 'auth-tab-active': authActiveTab === 'login' }"
            @click="switchAuthTab('login')"
          >
            登录
          </div>
          <div
            class="auth-tab"
            :class="{ 'auth-tab-active': authActiveTab === 'register' }"
            @click="switchAuthTab('register')"
          >
            注册
          </div>
        </div>

        <!-- 登录表单 -->
        <div v-if="authActiveTab === 'login'" class="auth-content">
          <div class="auth-form">
            <div class="form-group">
              <label>用户名</label>
              <input
                type="text"
                v-model="loginUsername"
                placeholder="请输入用户名"
                :disabled="isAuthLoading"
              />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input
                type="password"
                v-model="loginPassword"
                placeholder="请输入密码"
                :disabled="isAuthLoading"
              />
            </div>
            <div v-if="authErrorMsg" class="auth-error">{{ authErrorMsg }}</div>
            <button class="auth-submit-btn" @click="handleLogin" :disabled="isAuthLoading">
              {{ isAuthLoading ? '登录中...' : '登录' }}
            </button>
          </div>
        </div>

        <!-- 注册表单 -->
        <div v-else-if="authActiveTab === 'register'" class="auth-content">
          <div class="auth-form">
            <div class="form-group">
              <label>用户名</label>
              <input
                type="text"
                v-model="registerUsername"
                placeholder="请输入用户名"
                :disabled="isAuthLoading"
              />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input
                type="password"
                v-model="registerPassword"
                placeholder="请输入密码"
                :disabled="isAuthLoading"
              />
            </div>
            <div class="form-group">
              <label>确认密码</label>
              <input
                type="password"
                v-model="registerConfirmPassword"
                placeholder="请再次输入密码"
                :disabled="isAuthLoading"
              />
            </div>
            <div class="form-group">
              <label>邀请码</label>
              <input
                type="text"
                v-model="registerInviteCode"
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

        <!-- 关闭按钮，移到底部 -->
        <div class="auth-modal-footer">
          <button class="auth-close-btn" @click="closeAuthModal">关闭</button>
        </div>
      </div>
    </div>

    <!-- 充值选项弹窗 -->
    <div v-if="showChargeModal" class="charge-modal-overlay" @click.self="showChargeModal = false">
      <div class="charge-modal">
        <!-- 广告位 -->
        <a href="https://68.fo" target="_blank" class="charge-ad-banner">
          <img 
            src="@/assets/img/recharge-ad.webp" 
            alt="充值广告"
          />
        </a>

        <div class="charge-content">
          <div v-if="isLoadingChargeOptions" class="charge-loading">
            <Loading type="spinner" color="#ff9500" />
            <div>加载充值选项中...</div>
          </div>

          <div v-else-if="chargeOptions.length === 0" class="charge-empty">
            <Icon name="warning-o" size="24" color="#ff9500" />
            <div>暂无充值选项</div>
          </div>

          <div v-else class="charge-options">
            <div
              v-for="option in chargeOptions"
              :key="option.type"
              :class="['charge-option', { selected: selectedChargeOption?.type === option.type }]"
              @click="selectChargeOption(option)"
            >
              <div class="option-price">¥{{ option.price }}</div>
              <div class="option-desc">{{ option.desc }}</div>
            </div>
          </div>
        </div>

        <div class="charge-footer">
          <button class="charge-cancel-btn" @click="showChargeModal = false">取消</button>
          <button
            class="charge-confirm-btn"
            @click="confirmCharge"
            :disabled="!selectedChargeOption"
          >
            确认充值
          </button>
        </div>
      </div>
    </div>

    <!-- 充值完成提示弹窗 -->
    <div v-if="showChargeCompleteDialog" class="charge-complete-overlay">
      <div class="charge-complete-modal">
        <div class="complete-icon">
          <Icon name="success" size="48" color="#ff9500" />
        </div>
        <div class="complete-title">支付提示</div>
        <div class="complete-content">
          <p>如果您已完成支付，请点击已完成充值按钮</p>
        </div>
        <div class="complete-buttons">
          <button class="complete-confirm-btn" @click="refreshUserPoints">已完成充值</button>
        </div>
      </div>
    </div>

    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="back-btn" @click="goBack">
        <Icon name="arrow-left" color="#fff" size="20" />
      </div>
      <div class="page-title">{{ videoDetail?.vod_name || '视频详情' }}</div>
      <div class="placeholder"></div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <Loading type="spinner" color="#ff9500" />
      <div class="loading-text">加载中...</div>
    </div>

    <div v-else-if="hasError && !isPlaying" class="error-state">
      <Icon name="warning-o" size="24" color="#ff9500" />
      <div class="error-text">加载失败，请稍后再试</div>
      <div v-if="errorMessage" class="error-detail">{{ errorMessage }}</div>
    </div>

    <template v-else-if="videoDetail">
      <!-- 视频播放器 - 始终显示，根据状态控制是否显示封面或播放器 -->
      <div
        ref="videoContainerRef"
        :class="['video-container', { 'video-floating': isVideoFloating && isPlaying }]"
      >
        <!-- 四个矩形显示 -->
        <div class="corner-rectangles">
          <div class="corner-rectangle top-left">
            <div class="shape-model"></div>
          </div>
          <div class="corner-rectangle top-right">
            <div class="shape-model"></div>
          </div>
          <div class="corner-rectangle bottom-left">
            <div class="shape-model"></div>
          </div>
          <div class="corner-rectangle bottom-right">
            <div class="shape-model"></div>
          </div>
        </div>
        <!-- 视频广告弹窗 -->
        <div v-if="showVideoAd" class="video-ad-overlay">
          <div class="video-ad-modal">
            <!-- 关闭按钮 -->
            <div class="ad-close-btn" @click="closeVideoAdAndPlay">
              <Icon name="cross" size="20" color="#fff" />
            </div>

            <!-- 广告图片 -->
            <div class="ad-content">
              <img src="@/assets/img/ad-video-cover.jpeg" alt="广告" class="ad-image" />

              <!-- 左侧点击区域 -->
              <div class="ad-click-area ad-left" @click="handleAdLeftClick"></div>

              <!-- 右侧点击区域 -->
              <div class="ad-click-area ad-right" @click="handleAdRightClick"></div>
            </div>
          </div>
        </div>

        <!-- 视频播放器 -->
        <template v-if="isPlaying">
          <!-- 视频顶部横条 -->
          <div class="video-top-banner">
            <div class="banner-text">365娱乐永久网址：68.fo 十年品牌 大额提现秒到账</div>
          </div>
          <div v-if="hasError" class="play-error">
            <Icon name="warning-o" size="50" color="#ff6b6b" />
            <div class="error-msg">{{ errorMessage || '视频播放失败' }}</div>
            <div class="retry-btn" @click="playVideo">重试</div>
          </div>
          <video
            v-else
            ref="videoEl"
            controls
            autoplay
            playsinline
            webkit-playsinline
            x5-playsinline
            x5-video-player-type="h5"
            x5-video-player-fullscreen="false"
            class="video-player"
            @error="
              (e) => {
                console.error('视频加载错误:', e)
                hasError = true
                errorMessage = '视频加载失败，播放地址可能无效'
              }
            "
            @play="handleVideoPlay"
            @ended="handleVideoEnded"
          >
            您的浏览器不支持 HTML5 视频播放
          </video>

          <!-- 视频右下角半透明色块 -->
          <div class="video-bottom-right-banner">
            <div class="banner-text">68.fo</div>
          </div>

          <!-- 🔥 装饰性圆形元素 -->
          <div class="video-decorations">
            <div class="decoration-circle circle-top-left"></div>
            <div class="decoration-circle circle-top-right"></div>
            <div class="decoration-circle circle-bottom-right"></div>
          </div>

          <!-- 🔥 左下角广告图 -->
          <div class="video-ad-corner">
            <img src="@/assets/img/icon-video-ad.gif" alt="广告" class="ad-corner-image" />
          </div>

          <!-- 浮动状态下的关闭按钮 -->
          <div v-if="isVideoFloating" class="floating-close" @click="isPlaying = false">
            <Icon name="cross" size="20" color="#fff" />
          </div>
        </template>

        <!-- 视频封面 -->
        <div v-else class="main-video-cover">
          <img :src="getCoverUrl(videoDetail.vod_pic)" alt="视频封面" />
          <div class="play-btn" @click="playVideo">
            <Icon name="play-circle-o" size="48" color="#fff" />
            <div v-if="isNeedPay" class="pay-badge">VIP</div>
          </div>
        </div>
      </div>

      <!-- 浮动状态下的占位元素 -->
      <div v-if="isVideoFloating && isPlaying" class="video-placeholder"></div>

      <!-- 视频内容详情 -->
      <div class="video-main">
        <!-- 观看限制提示 -->
        <div class="watch-limit-box">
          <div class="watch-text" v-if="isLoggedIn()">{{ vipStatusDisplay }}</div>
          <div class="watch-text" v-else>登录后查看积分</div>
          <div class="share-btn" @click="shareVideo" v-if="isLoggedIn()">分享免费观看2部</div>
          <div class="share-btn" @click="goToLogin" v-else>登录</div>
        </div>

        <!-- 视频标题和信息 -->
        <h1 class="main-video-title">{{ videoDetail.vod_name }}</h1>
        <div class="video-meta-tag">
          <!-- 根据观看状态和付费状态显示不同标签 -->
          <div v-if="videoTagType === 'purchased'" class="meta-tag purchased">已购买</div>
          <div v-else-if="videoTagType === 'pay'" class="meta-tag pay">VIP</div>
          <div v-else class="meta-tag limited">限免</div>
          <div class="meta-views">{{ videoDetail.vod_hits }}次播放</div>
          <div class="meta-date">{{ videoDetail.vod_pubdate }}</div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <div class="action-btn" @click="handleDigg" :class="{ active: isDigged }">
            <Icon
              :name="isDigged ? 'good-job' : 'good-job-o'"
              size="16"
              :color="isDigged ? '#ff9500' : ''"
            />
            <div class="action-text">
              {{ isDiggLoading ? '点赞中...' : `点赞 (${videoDetail.vod_up || 0})` }}
            </div>
          </div>
          <div class="action-btn" @click="handleCollect" :class="{ active: isCollected }">
            <Icon
              :name="isCollected ? 'star' : 'star-o'"
              size="16"
              :color="isCollected ? '#ff9500' : ''"
            />
            <div class="action-text">
              {{ isCollectLoading ? '收藏中...' : '收藏' }}
            </div>
          </div>
          <div class="action-btn" @click="shareVideo">
            <Icon name="share-o" size="16" />
            <div class="action-text">分享</div>
          </div>
        </div>
      </div>

      <!-- 推荐视频 -->
      <div class="recommended-section">
        <!-- 相关推荐标题 -->
        <div class="section-divider">
          <div class="section-line"></div>
          <div class="section-label">猜你喜欢</div>
          <div class="section-line"></div>
        </div>

        <div v-if="isRecommendLoading" class="loading-state">
          <Loading type="spinner" color="#ff9500" />
          <div class="loading-text">加载中...</div>
        </div>
        <div v-else-if="hasError" class="error-state">
          <Icon name="warning-o" size="24" color="#ff9500" />
          <div class="error-text">加载失败，请稍后再试</div>
          <div v-if="errorMessage" class="error-detail">{{ errorMessage }}</div>
        </div>
        <template v-else-if="recommendVideos.length > 0">
          <VideoList :videos="recommendVideos" return-path="/" />

          <!-- 换一批按钮 -->
          <div class="refresh-btn" @click="refreshRecommends">
            <Icon name="replay" />
            <span>换一批</span>
          </div>
        </template>
        <div v-else class="empty-recommend">暂无推荐视频</div>
      </div>
    </template>

    <!-- 底部导航 - 始终显示 -->
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
.video-detail-page {
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
  cursor: pointer;
}

.page-title {
  font-size: 16px;
  font-weight: bold;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder {
  width: 24px;
}

/* 视频容器 */
.video-container {
  width: 100%;
  position: relative;
  aspect-ratio: 16/9;
  background-color: #000;
  transition: all 0.3s ease;
  overflow: hidden;
  /* iOS兼容性 */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);

  /* 四个矩形样式 */
  .corner-rectangles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
    display: none;
  }

  .corner-rectangle {
    position: absolute;
    width: 80px;
    height: 20px;

    &::before {
      content: '';
      position: absolute;
      top: -5px;
      left: -5px;
      right: -5px;
      bottom: -5px;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 4px;
      z-index: -1;
    }

    &.top-left {
      top: 16px;
      left: 16px;
      border-right: none;
      border-bottom: none;
    }

    &.top-right {
      top: 16px;
      right: 16px;
      border-left: none;
      border-bottom: none;
    }

    &.bottom-left {
      bottom: 16px;
      left: 16px;
      border-right: none;
      border-top: none;
    }

    &.bottom-right {
      bottom: 16px;
      right: 16px;
      border-left: none;
      border-top: none;
    }
  }
}

/* 视频浮动样式 */
.video-floating {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99;
  max-height: 30vh;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* 浮动状态下的关闭按钮 */
.floating-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: pointer;
}

/* 视频占位元素 */
.video-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #111;
}

/* 视频播放错误 */
.play-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
}

.error-msg {
  margin-top: 20px;
  color: #fff;
  font-size: 16px;
  text-align: center;
}

.retry-btn {
  margin-top: 20px;
  background-color: #ff9500;
  color: #000;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

/* 视频顶部横条 */
.video-top-banner {
  display: none;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 82%;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  padding: 2px 15px;
  text-align: center;
  z-index: 5;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 4px 4px;
}

.banner-text {
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 视频右下角半透明色块 */
.video-bottom-right-banner {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  padding: 4px 12px;
  text-align: center;
  z-index: 5;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
}

/* 视频播放器 */
.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* iOS防止自动全屏的样式 */
  -webkit-playsinline: true;
  -webkit-appearance: none;
  background-color: #000;
}

/* 🔥 视频水印遮挡正方形 */
.video-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* 不阻挡视频控件 */
  z-index: 1;
  /* 在视频上方，但不影响控件 */
}

.decoration-circle {
  /* 隐藏装饰性正方形 */
  display: none;
}

/* 左下角正方形 - 只显示四分之一 */
.circle-top-left {
  bottom: -50px;
  left: -50px;
  width: 100px;
  height: 100px;
}

/* 右上角正方形 - 只显示四分之一 */
.circle-top-right {
  top: -50px;
  right: -50px;
  width: 100px;
  height: 100px;
}

/* 右下角正方形 - 只显示四分之一 */
.circle-bottom-right {
  bottom: -50px;
  right: -50px;
  width: 100px;
  height: 100px;
}

/* 🔥 左上角广告图 */
.video-ad-corner {
  /* 隐藏左上角广告图片 */
  display: none;
}

.ad-corner-image {
  display: block;
  width: auto;
  height: 80px;
  /* 广告图高度 */
  max-width: 150px;
  /* 最大宽度限制 */
  object-fit: contain;
}

/* 视频主要内容 */
.video-main {
  padding: 15px;
  border-bottom: 8px solid #222;
}

/* 主视频封面 */
.main-video-cover {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.main-video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  cursor: pointer;
}

.pay-badge {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  color: #333;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

/* 观看限制提示 */
.watch-limit-box {
  display: flex;
  align-items: center;
  background-image: url('@/assets/img/bg-share.svg');
  background-size: cover;
  background-repeat: no-repeat;
  padding: 6px 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.watch-icon {
  margin-right: 10px;
}

.watch-text {
  flex: 1;
  font-size: 14px;
  color: #8a4d31;
  font-weight: bold;
}

.share-btn {
  background-color: #b66d39;

  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  min-width: 80px;
  text-align: center;
}

/* 视频标题 */
.main-video-title {
  font-size: 20px;
  margin: 0 0 12px 0;
  line-height: 1.4;
  font-weight: bold;
}

/* 视频元数据标签 */
.video-meta-tag {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 20px;
}

.meta-tag {
  background-color: #ff9800;
  color: #000;
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 12px;
}

.meta-tag.limited {
  color: #fff;
  background: linear-gradient(90deg, #fc00ff 0%, #00dbde 100%);
}

.meta-tag.pay {
  color: #333;
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  font-weight: bold;
}

.meta-tag.purchased {
  color: #fff;
  background-color: #4caf50;
  /* 绿色表示已购买 */
}

.meta-views {
  margin-right: 15px;
}

.meta-date {
  flex: 1;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: space-around;
}

.action-btn {
  display: flex;
  align-items: center;
  color: #aaa;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-btn.active {
  color: #ff9500;
}

.action-text {
  font-size: 14px;
}

/* 推荐视频部分 */
.recommended-section {
  padding: 15px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.section-title {
  font-size: 16px;
  margin-bottom: 15px;
}

.empty-recommend {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 14px;
}

/* 换一批按钮 */
.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff9500;
  font-size: 14px;
  padding: 10px 0;
  margin-bottom: 15px;
}

.refresh-btn span {
  margin-left: 5px;
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

.nav-text {
  font-size: 12px;
}

/* 加载状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.loading-text,
.error-text {
  margin-top: 10px;
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

/* 相关推荐标题 */
.section-divider {
  display: flex;
  align-items: center;
  margin: 0px 0 20px;
}

.section-line {
  flex: 1;
  height: 1px;
  background-color: #333;
}

.section-label {
  padding: 0 15px;
  font-size: 16px;
  color: #ff9800;
  font-weight: bold;
}

/* 自定义Toast样式 */
:deep(.custom-toast) {
  min-width: 260px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.custom-toast-success) {
  min-width: 260px;
  background-color: #4caf50;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.custom-toast-error) {
  min-width: 260px;
  background-color: #ff5252;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.custom-toast-info) {
  min-width: 260px;
  background-color: #2196f3;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 登录/注册弹窗样式 */
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.auth-modal {
  background: linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%);
  border-radius: 16px;
  width: 85%;
  max-width: 350px;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(255, 149, 0, 0.15);
  overflow: hidden;
  position: relative;
  animation: slideUp 0.4s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  /* 移除顶部内边距 */
  padding-top: 0;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 移除原来的关闭按钮样式 */
.auth-modal-close {
  display: none;
}

.auth-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  margin-top: 0;
  padding: 3px;
  position: relative;
  z-index: 100;
}

/* 底部关闭按钮样式 */
.auth-modal-footer {
  padding: 12px 20px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.2);
}

.auth-close-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ccc;
  padding: 8px 25px;
  border-radius: 30px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.auth-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.auth-tab {
  flex: 1;
  padding: 10px 0;
  font-size: 16px;
  font-weight: bold;
  color: #888;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 8px;
}

.auth-tab.auth-tab-active {
  color: #fff;
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
}

.auth-content {
  padding: 18px 20px;
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 14px;
  position: relative;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  display: block;
  color: #ccc;
  letter-spacing: 0.5px;
}

.form-group input[type='text'],
.form-group input[type='password'] {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input[type='text']:focus,
.form-group input[type='password']:focus {
  border-color: rgba(255, 149, 0, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.2);
  outline: none;
}

.form-group input[type='text']::placeholder,
.form-group input[type='password']::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.auth-error {
  color: #ff5252;
  font-size: 13px;
  margin-bottom: 12px;
  background-color: rgba(255, 82, 82, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
  border-left: 3px solid #ff5252;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.auth-submit-btn {
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 5px;
  position: relative;
  overflow: hidden;
}

.auth-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 149, 0, 0.4);
}

.auth-submit-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(255, 149, 0, 0.3);
}

.auth-submit-btn:disabled {
  background: linear-gradient(90deg, #9e9e9e, #616161);
  cursor: not-allowed;
  box-shadow: none;
}

.auth-tips {
  font-size: 14px;
  color: #aaa;
  margin-top: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 12px 15px;
  border-radius: 10px;
  border-left: 3px solid #ff9500;
}

.auth-tips p {
  margin: 5px 0;
  position: relative;
  padding-left: 15px;
}

.auth-tips p:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #ff9500;
}

/* 充值弹窗样式 */
.charge-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.charge-modal {
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 70vh;
  overflow-y: auto;
}

.charge-ad-banner {
  width: 100%;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
  cursor: pointer;
  display: block;
  text-decoration: none;
}

.charge-ad-banner img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  cursor: pointer;
  pointer-events: auto;
}

.charge-content {
  padding: 8px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-left: 1px solid rgba(255, 149, 0, 0.2);
  border-right: 1px solid rgba(255, 149, 0, 0.2);
}

.charge-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #aaa;
}

.charge-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #aaa;
}

.charge-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.charge-option {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 50px;
  justify-content: center;
}

.charge-option:hover {
  border-color: rgba(255, 149, 0, 0.5);
  background: rgba(255, 149, 0, 0.1);
}

.charge-option.selected {
  border-color: #ff9500;
  background: rgba(255, 149, 0, 0.15);
  box-shadow: 0 0 20px rgba(255, 149, 0, 0.3);
}

.option-price {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 2px;
  transition: color 0.3s ease;
}

.charge-option.selected .option-price {
  color: #ff9500;
}

.option-desc {
  color: #fff;
  font-size: 11px;
  line-height: 1.2;
}

.charge-footer {
  padding: 8px 16px 8px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid rgba(255, 149, 0, 0.2);
  border-radius: 0 0 16px 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.charge-cancel-btn {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.charge-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.charge-confirm-btn {
  padding: 10px 16px;
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
}

.charge-confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 149, 0, 0.4);
}

.charge-confirm-btn:disabled {
  background: linear-gradient(90deg, #666, #555);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .charge-modal {
    margin: 10px;
    max-width: none;
  }

  .charge-ad-banner img {
    border-radius: 12px 12px 0 0;
  }

  .charge-content {
    padding: 8px;
  }

  .charge-options {
    gap: 8px;
  }

  .charge-option {
    padding: 6px;
  }

  .charge-footer {
    padding: 8px;
    gap: 8px;
  }

  .option-price {
    font-size: 14px;
  }

  .option-desc {
    font-size: 12px;
  }
}

/* 视频广告弹窗样式 */
.video-ad-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.video-ad-modal {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ad-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
}

.ad-close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.ad-content {
  position: relative;
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ad-click-area {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  cursor: pointer;
  background: transparent;
  transition: background-color 0.3s ease;
  z-index: 1;
}

.ad-click-area:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ad-left {
  left: 0;
}

.ad-right {
  right: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .ad-close-btn {
    width: 32px;
    height: 32px;
    top: 10px;
    right: 10px;
  }
}

/* 充值完成提示弹窗样式 */
.charge-complete-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  /* 比充值弹窗高一层 */
  padding: 20px;
}

.charge-complete-modal {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.complete-icon {
  margin-bottom: 20px;
}

.complete-title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20px;
}

.complete-content {
  margin-bottom: 30px;
}

.complete-content p {
  color: #ccc;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.complete-note {
  font-size: 12px !important;
  color: #999 !important;
}

.complete-buttons {
  display: flex;
  justify-content: center;
}

.complete-confirm-btn {
  padding: 12px 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
}

.complete-confirm-btn {
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
}

.complete-confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 149, 0, 0.4);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .charge-complete-modal {
    max-width: 300px;
    padding: 25px 15px;
  }

  .complete-title {
    font-size: 18px;
  }

  .complete-confirm-btn {
    padding: 10px 30px;
    font-size: 13px;
    min-width: 120px;
  }
}
</style>
