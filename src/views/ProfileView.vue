<script setup lang="ts">
// 个人中心页面逻辑
import { ref, onMounted, computed, watch } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import {
  userLogout,
  getUserInfo,
  isLoggedIn,
  fetchAds,
  fetchNotices,
  fetchUserPoints,
  setUserInfo,
  applyAgent,
  type NoticeGroup,
} from '@/api/fetch-api'
import { BASE_URL } from '@/utils/config'
import QRCode from 'qrcode'
import BottomTabbar from '@/components/BottomTabbar.vue'

const router = useRouter()

// 控制账户凭证弹窗显示
const showCredential = ref(false)
const userId = ref('')
const isLoggingOut = ref(false)
const qrcodeDataUrl = ref('') // 二维码数据URL
const credentialTimestamp = ref('') // 凭证生成时间戳

// 控制游客提示弹窗
const showGuestTip = ref(false)

// 控制申请代理弹窗
const showAgentDialog = ref(false)
const isApplyingAgent = ref(false)

// 用户信息
const userInfo = ref<any>(null)

// 积分和VIP相关数据
const userVideoNums = ref(0) // 观影次数
const isVip = ref<number | string>(0) // VIP状态，可能是数字0/1或字符串'0'/'1'
const vipEndtime = ref('') // VIP到期时间

// 广告数据
const profileAds = ref<any[]>([])
const isAdLoading = ref(false)
const hasAdError = ref(false)

// 公告数据
const notices = ref<NoticeGroup[]>([])
const isNoticeLoading = ref(false)
const hasNoticeError = ref(false)
const noticeText = ref('')

// 默认头像URL
const defaultAvatarUrl = new URL('@/assets/img/img-avatar-default.png', import.meta.url).href

// 实际使用的头像URL（可以回退到默认头像）
const currentAvatarUrl = ref<string>('')

// 处理头像URL
const avatarUrl = computed(() => {
  try {
    console.log('获取头像URL，当前用户信息:', userInfo.value)

    // 如果用户信息不存在，返回默认头像
    if (!userInfo.value) {
      console.log('用户信息不存在，返回默认头像')
      return defaultAvatarUrl
    }

    // 优先使用 avatar 字段，其次 user_portrait，最后 avatar_thumb
    const portrait = userInfo.value.avatar || userInfo.value.user_portrait || userInfo.value.avatar_thumb
    console.log('获取到头像路径:', portrait)

    // 如果没有头像，返回默认头像
    if (!portrait) {
      console.log('未找到用户头像，返回默认头像')
      return defaultAvatarUrl
    }

    // 处理不同的头像路径格式
    let finalUrl: string
    if (portrait.startsWith('http://') || portrait.startsWith('https://')) {
      finalUrl = portrait
    } else if (portrait.startsWith('/')) {
      finalUrl = `${BASE_URL}${portrait}`
    } else {
      finalUrl = `${BASE_URL}/${portrait}`
    }

    console.log('生成的头像URL:', finalUrl)
    return finalUrl
  } catch (error) {
    console.error('处理头像URL时出错:', error)
    // 出错时返回默认头像
    return defaultAvatarUrl
  }
})

// 监听头像URL变化，更新当前使用的头像URL
watch(avatarUrl, (newUrl) => {
  if (newUrl && newUrl !== defaultAvatarUrl) {
    currentAvatarUrl.value = newUrl
  } else {
    currentAvatarUrl.value = defaultAvatarUrl
  }
}, { immediate: true })

// 处理头像图片加载错误
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.error('头像图片加载失败，URL:', img.src)
  console.error('用户信息:', userInfo.value)
  
  // 回退到默认头像
  console.log('回退到默认头像')
  currentAvatarUrl.value = defaultAvatarUrl
  img.src = defaultAvatarUrl
}

// 处理广告图片URL
const processAdImageUrl = (imgPath: string): string => {
  if (!imgPath) return ''

  if (imgPath.startsWith('http')) {
    return imgPath
  } else if (imgPath.startsWith('/')) {
    return `${BASE_URL}${imgPath}`
  } else {
    return `${BASE_URL}/${imgPath}`
  }
}

// 用户ID或昵称显示
const displayName = computed(() => {
  try {
    if (!userInfo.value) {
      console.log('用户信息不存在，返回空名称')
      return '未登录用户'
    }

    console.log('获取用户显示名称，可用字段:', {
      user_nick_name: userInfo.value.user_nick_name,
      user_name: userInfo.value.user_name,
      user_login: userInfo.value.user_login,
      id: userInfo.value.id,
    })

    // 统一使用 user_nick_name 字段（游客和正式用户已统一）
    const name =
      userInfo.value.user_nick_name ||
      userInfo.value.user_name ||
      userInfo.value.user_login ||
      userInfo.value.id ||
      '未知用户'
    console.log('最终显示名称:', name)
    return name
  } catch (error) {
    console.error('获取用户显示名称时出错:', error)
    return '用户'
  }
})

// 用户账号显示
const userAccount = computed(() => {
  if (!userInfo.value) return ''

  // 显示用户ID
  return userInfo.value.user_id || userInfo.value.id || ''
})

// 用户名（不是昵称）- 用于账户凭证显示
const userName = computed(() => {
  if (!userInfo.value) return ''

  // 优先使用 user_name（账号），如果没有则使用 user_login 或 id
  return userInfo.value.user_name || userInfo.value.user_login || userInfo.value.id || ''
})

// 会员组名称
const groupName = computed(() => {
  if (!userInfo.value) return '普通会员'
  return userInfo.value.group_name || '普通会员'
})

// 用户积分（观影次数）
const userPoints = computed(() => {
  return userVideoNums.value || 0
})

// 观影次数
const watchCount = computed(() => {
  if (!userInfo.value) return 0
  return userInfo.value.watch_count || 0
})

// VIP到期时间
const vipExpireTime = computed(() => {
  // is_vip 可能是数字或字符串，统一转换为数字比较
  const vipStatus = Number(isVip.value)
  
  if (vipStatus === 1) {
    if (vipEndtime.value) {
      // 解析日期字符串或时间戳
      let endDate
      if (typeof vipEndtime.value === 'string' && vipEndtime.value.includes('-')) {
        // 字符串格式：2026-03-14 00:00:00
        endDate = new Date(vipEndtime.value)
      } else {
        // 时间戳格式
        endDate = new Date(parseInt(vipEndtime.value) * 1000)
      }
      
      const now = new Date()

      if (endDate > now) {
        // VIP未过期
        const year = endDate.getFullYear()
        const month = String(endDate.getMonth() + 1).padStart(2, '0')
        const day = String(endDate.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } else {
        // VIP已过期
        return '已过期'
      }
    } else {
      return '已开通'
    }
  } else {
    return '未开通'
  }
})

// 判断是否是VIP用户
const isVipUser = computed(() => {
  // is_vip 可能是数字或字符串，统一转换为数字比较
  const vipStatus = Number(isVip.value)
  
  if (vipStatus !== 1) return false
  
  if (!vipEndtime.value) return true // 如果是VIP但没有到期时间，认为是永久VIP
  
  // 解析日期字符串或时间戳
  let endDate
  if (typeof vipEndtime.value === 'string' && vipEndtime.value.includes('-')) {
    // 字符串格式：2026-03-14 00:00:00
    endDate = new Date(vipEndtime.value)
  } else {
    // 时间戳格式
    endDate = new Date(parseInt(vipEndtime.value) * 1000)
  }
  
  const now = new Date()
  return endDate > now
})

// 获取积分和VIP信息
const fetchPointsAndVipInfo = async () => {
  try {
    const pointsResult = await fetchUserPoints()
    if (pointsResult.code === 1 && pointsResult.data) {
      // 更新用户积分信息
      const localUserInfo = getUserInfo()
      if (localUserInfo) {
        // 更新本地存储的用户信息
        localUserInfo.user_points = pointsResult.data.points
        localUserInfo.points = pointsResult.data.points
        localUserInfo.video_nums = pointsResult.data.video_nums
        localUserInfo.is_vip = pointsResult.data.is_vip
        if (pointsResult.data.endtime) {
          localUserInfo.endtime = pointsResult.data.endtime
        }

        // 保存到本地存储
        setUserInfo(localUserInfo)

        // 更新页面显示的数据
        userInfo.value = localUserInfo
        userVideoNums.value = pointsResult.data.video_nums
        isVip.value = pointsResult.data.is_vip !== undefined ? pointsResult.data.is_vip : 0
        vipEndtime.value = pointsResult.data.endtime || ''

        console.log('✅ 个人中心积分信息获取成功:', pointsResult.data)
      }
    }
  } catch (error) {
    console.error('❌ 个人中心获取积分信息失败:', error)
    // 静默失败，不显示错误提示
  }
}

// 获取广告数据
const fetchProfileAd = async () => {
  isAdLoading.value = true
  hasAdError.value = false

  try {
    // 请求个人中心页面的广告数据 (ad_pos: 5 表示个人中心页面)
    const result = await fetchAds({
      ad_pos: 5, // 个人中心页面位置
      ad_type: 2, // 广告类型
    })

    console.log('获取个人中心页面广告数据:', result)

    if (
      result &&
      result.code === 1 &&
      result.data &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      // 显示所有广告
      profileAds.value = result.data.map((ad: any) => ({
        id: ad.id || 0,
        imageUrl: processAdImageUrl(ad.ad_img || ''),
        title: ad.ad_name || '广告',
        link: ad.ad_url || '',
      }))

      console.log(`获取到${result.data.length}张广告，全部显示:`, profileAds.value)
    } else {
      console.log('没有获取到个人中心页面广告数据')
      profileAds.value = []
    }
  } catch (error) {
    console.error('获取个人中心页面广告失败:', error)
    hasAdError.value = true
    profileAds.value = []
  } finally {
    isAdLoading.value = false
  }
}

// 获取公告数据
const fetchNoticeData = async () => {
  isNoticeLoading.value = true
  hasNoticeError.value = false

  try {
    const result = await fetchNotices()
    console.log('获取公告数据:', result)

    if (result && result.code === 1 && result.data && Array.isArray(result.data)) {
      notices.value = result.data
      // 只取首页公告的第一条（最新的一条）
      const homeNoticeGroup = result.data.find((group: NoticeGroup) => group.id === 1)

      if (homeNoticeGroup && homeNoticeGroup.list && homeNoticeGroup.list.length > 0) {
        // 只取第一条公告
        noticeText.value = homeNoticeGroup.list[0].content
      }
      // 如果没有获取到公告，保持默认文本不变
    } else {
      console.log('没有获取到公告数据，保持默认公告显示')
      notices.value = []
    }
  } catch (error) {
    console.error('获取公告失败:', error)
    hasNoticeError.value = true
    notices.value = []
  } finally {
    isNoticeLoading.value = false
  }
}

// 处理广告点击
const handleAdClick = (ad: any) => {
  if (!ad || !ad.link) return

  console.log(`个人中心广告点击: ${ad.title}, 链接: ${ad.link}`)

  // 如果是内部链接，使用路由跳转
  if (ad.link.startsWith('/')) {
    router.push(ad.link)
  } else {
    // 外部链接，使用window.open打开
    window.open(ad.link, '_blank')
  }
}

// 处理广告图片加载错误
const handleAdImageError = (event: Event, ad: any) => {
  console.error(`个人中心广告图片加载失败: ${ad?.imageUrl}`)

  // 图片加载失败时从数组中移除该广告
  const index = profileAds.value.findIndex((item) => item.id === ad.id)
  if (index > -1) {
    profileAds.value.splice(index, 1)
  }
}

// 自动显示账户凭证（2秒后）
onMounted(async () => {
  console.log('=== ProfileView onMounted 开始 ===')

  // 优先从本地获取用户信息（无论是游客还是正式用户）
  const localUserInfo = getUserInfo()

  // 🔥 根据本地存储判断是否为游客用户
  const isGuest = localStorage.getItem('isGuest') === 'true'

  console.log('📦 本地用户信息检查:', {
    hasLocalUserInfo: !!localUserInfo,
    isGuest: isGuest,
    isGuestFromStorage: localStorage.getItem('isGuest'),
    isyouke: localUserInfo?.isyouke,
    userInfo: localUserInfo,
  })

  if (localUserInfo) {
    // 本地有用户信息，直接使用（游客或正式用户）
    console.log('✅ 使用本地缓存的用户信息 - 类型:', isGuest ? '游客' : '正式用户')
    console.log('本地用户信息详情:', JSON.stringify(localUserInfo, null, 2))

    // 确保用户信息是响应式的
    userInfo.value = { ...localUserInfo }

    // 统一使用 user_name 字段（游客和正式用户已统一）
    userId.value = localUserInfo.user_name || localUserInfo.user_id || localUserInfo.id || ''
    console.log('设置用户ID:', userId.value)

    // 初始化积分和VIP数据
    userVideoNums.value = localUserInfo.video_nums || 0
    isVip.value = localUserInfo.is_vip !== undefined ? localUserInfo.is_vip : 0
    vipEndtime.value = localUserInfo.endtime || ''

    console.log('初始化用户数据:', {
      userVideoNums: userVideoNums.value,
      isVip: isVip.value,
      vipEndtime: vipEndtime.value,
    })

    // 只有真正的游客用户才显示提示弹窗
    if (isGuest) {
      console.log('🎯 检测到游客用户 (isyouke=1)，准备显示提示弹窗')
      setTimeout(() => {
        showGuestTip.value = true
        console.log('🎬 弹窗已显示')
      }, 500) // 延迟500ms显示，让页面先加载
    } else {
      console.log('✅ 检测到正式用户 (isyouke!=1)，不显示游客弹窗')
    }
  } else {
    // 本地没有用户信息，跳转到登录页
    console.log('❌ 本地没有用户信息，跳转到登录页')
    showToast({
      message: '请先登录',
      duration: 2000,
    })
    router.push('/login')
    return
  }

  console.log('=== ProfileView onMounted 结束 ===')

  // 获取广告数据
  fetchProfileAd()

  // 获取公告数据
  fetchNoticeData()

  // 获取最新的积分和VIP信息
  fetchPointsAndVipInfo()
})

// 退出登录
const handleLogout = async () => {
  if (isLoggingOut.value) return

  try {
    isLoggingOut.value = true
    showToast({
      message: '正在退出登录...',
      duration: 2000,
    })

    const success = await userLogout()

    if (success) {
      showToast({
        message: '已退出登录',
        duration: 2000,
      })
      // 退出后返回登录页
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    } else {
      showToast({
        message: '退出登录失败，请重试',
        duration: 2000,
      })
    }
  } catch (error) {
    console.error('退出登录错误:', error)
    showToast({
      message: '退出登录时发生错误',
      duration: 2000,
    })
  } finally {
    isLoggingOut.value = false
  }
}

// 关闭凭证弹窗
const closeCredential = () => {
  showCredential.value = false
}

// 关闭游客提示弹窗
const closeGuestTip = () => {
  showGuestTip.value = false
}

// 跳转到完善信息页面
const goToCompleteProfile = () => {
  showGuestTip.value = false
  router.push('/edit-profile')
}

// 跳转到编辑资料页面
const goToEditProfile = () => {
  router.push('/edit-profile')
}

// 跳转到分享好友页面
const goToShareFriends = () => {
  router.push('/share-friends')
}

// 跳转到充值金币页面
const goToRecharge = () => {
  router.push('/recharge')
}

// 跳转到账户钱包页面
const goToWallet = () => {
  router.push('/wallet')
}

// 跳转到账目明细页面
const goToAccountDetails = () => {
  router.push('/account-details')
}

// 跳转到提现页面
const goToWithdraw = () => {
  router.push('/withdraw')
}

// 跳转到VIP充值页面
const goToVipRecharge = () => {
  router.push('/vip-recharge')
}

// 跳转到充值记录页面
const goToRechargeRecord = () => {
  router.push('/recharge-record')
}

// 跳转到关注列表页面
const goToFollowList = () => {
  router.push('/follow-list')
}

// 跳转到收藏页面
const goToCollection = () => {
  router.push('/collection')
}

// 跳转到看片足迹页面
const goToWatchHistory = () => {
  router.push('/watch-history')
}

// 跳转到游戏记录页面
const goToGameRecord = () => {
  // 检查登录状态
  if (!isLoggedIn()) {
    showToast('请先登录')
    return
  }

  // 跳转到游戏记录页面
  router.push('/game-record')
}

// 跳转到系统设置页面（暂时未使用）
// const goToSettings = () => {
//   router.push('/settings');
// };

// 跳转到人工客服
// 跳转到我的代理页面
const goToMyAgent = () => {
  // 检查登录状态
  if (!isLoggedIn()) {
    showToast({
      message: '请先登录后再访问代理页面',
      duration: 2000,
    })
    return
  }

  // 跳转到我的代理页面
  router.push('/my-agent')
}

// 跳转到我的收藏页面
const goToMyCollection = () => {
  router.push('/collection')
}

// 跳转到已购影片页面（观看历史）
const goToPurchasedVideos = () => {
  router.push('/watch-history')
}

// 跳转到推广记录页面
const goToPromotionRecord = () => {
  router.push('/promotion-record')
}

// 生成二维码
const generateQRCode = async (url: string) => {
  try {
    const qrCodeUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
    qrcodeDataUrl.value = qrCodeUrl
  } catch (error) {
    console.error('生成二维码失败:', error)
    showToast({
      message: '生成二维码失败',
      duration: 2000,
    })
  }
}

// 跳转到账户凭证页面
const goToAccountCredential = async () => {
  // 生成当前时间戳作为防伪标识
  const now = new Date()
  credentialTimestamp.value = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

  // 生成网址的二维码（可以根据实际需求修改网址）
  const websiteUrl = window.location.origin || 'https://sese1188.cc'
  await generateQRCode(websiteUrl)
  showCredential.value = true
}

const goToCustomerService = async () => {
  try {
    showToast({
      message: '正在跳转客服...',
      duration: 1000,
    })

    // 获取或生成浏览器指纹
    let browserId = localStorage.getItem('browserId')
    
    if (!browserId) {
      console.log('生成新的浏览器指纹')
      // 生成简单的浏览器指纹（基于navigator信息）
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform
      ].join('|')
      
      // 简单hash函数
      let hash = 0
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      browserId = Math.abs(hash).toString(36)
      localStorage.setItem('browserId', browserId)
      console.log('新浏览器指纹已生成:', browserId)
    } else {
      console.log('使用已存在的浏览器指纹:', browserId)
    }

    console.log('准备调用RSA接口，浏览器指纹:', browserId)

    // 调用接口获取RSA密钥 - 使用表单格式
    const formData = new URLSearchParams()
    formData.append('murmur', browserId)
    
    const response = await fetch('https://help.186web.cc/admin/RSAEncrypt/gtRsP', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    console.log('接口响应状态:', response.status)
    
    const result = await response.json()
    console.log('接口返回结果:', result)
    
    if (result && result.data) {
      const rsaPassWord = result.data
      const customerServiceUrl = `https://help186.xuhgki.cn/index/index/home?code=${rsaPassWord}`
      
      console.log('人工客服链接已生成:', customerServiceUrl)
      
      // 移动端兼容性更好的跳转方式
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // 移动端直接跳转
        console.log('检测到移动端，使用 location.href 跳转')
        window.location.href = customerServiceUrl
      } else {
        // PC端尝试新窗口打开
        console.log('检测到PC端，尝试新窗口打开')
        const newWindow = window.open(customerServiceUrl, '_blank')
        // 如果被拦截，则直接跳转
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.log('新窗口被拦截，改用 location.href 跳转')
          window.location.href = customerServiceUrl
        }
      }
    } else {
      console.error('接口返回数据格式错误:', result)
      throw new Error('获取客服密钥失败')
    }
  } catch (error) {
    console.error('跳转客服失败:', error)
    showToast({
      message: '客服功能暂时不可用，请稍后重试',
      duration: 2000,
    })
  }
}

// 关闭申请代理弹窗
const closeAgentDialog = () => {
  showAgentDialog.value = false
}

// 确认申请代理
const confirmApplyAgent = async () => {
  if (isApplyingAgent.value) return

  try {
    isApplyingAgent.value = true

    const result = await applyAgent()

    if (result.code === 1) {
      showToast({
        message: result.msg || '申请成功',
        duration: 2000,
      })
      showAgentDialog.value = false
    } else {
      showToast({
        message: result.msg || '申请失败，请重试',
        duration: 2000,
      })
    }
  } catch (error) {
    console.error('申请代理失败:', error)
    showToast({
      message: '申请失败，请稍后重试',
      duration: 2000,
    })
  } finally {
    isApplyingAgent.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- u7528u6237u4fe1u606fu533au57df -->
    <div class="user-header" @click="goToEditProfile">
      <div class="user-info">
        <div class="avatar">
          <img 
            :src="currentAvatarUrl || defaultAvatarUrl" 
            :alt="displayName" 
            @error="handleAvatarError" 
          />
        </div>
        <div class="user-details">
          <div class="username">
            {{ displayName }}
          </div>
          <div class="user-id">
            用户ID：{{ userAccount }}
            <span v-if="isVipUser" class="vip-badge">VIP</span>
          </div>
        </div>
      </div>
      <div class="user-arrow">
        <div>我的信息</div>
        <van-icon name="arrow" size="20" color="#ccc" />
      </div>
    </div>

    <!-- u8d26u6237u4fe1u606f -->
    <div class="account-info">
      <div class="info-item">
        <span>观影次数</span>
        <span class="info-value">{{ userPoints || '0' }}</span>
      </div>
      <div class="info-item">
        <span>VIP到期时间</span>
        <span class="info-value">{{ vipExpireTime || '未开通' }}</span>
      </div>
    </div>

    <!-- u5e38u7528u529fu80fdu533au57df -->
    <div class="common-section">
      <div class="common-grid">
        <!-- 隐藏的功能项 -->
        <!-- <div class="common-item" @click="goToFollowList">
          <div class="common-icon">
            <img src="@/assets/img/icon-guanzhu.svg" alt="" />
          </div>
          <div class="common-name">关注</div>
        </div>
        <div class="common-item" @click="goToCollection">
          <div class="common-icon">
            <img src="@/assets/img/icon-shoucang.svg" alt="" />
          </div>
          <div class="common-name">收藏</div>
        </div>
        <div class="common-item" @click="goToWatchHistory">
          <div class="common-icon">
            <img src="@/assets/img/icon-wdzj.svg" alt="" />
          </div>
          <div class="common-name">看片足迹</div>
        </div> -->

        <div class="common-item" @click="goToVipRecharge">
          <div class="common-icon">
            <img src="@/assets/img/icon-user-chongzhi.png" alt="" />
          </div>
        </div>

        <div class="common-item" @click="goToWithdraw">
          <div class="common-icon">
            <img src="@/assets/img/icon-user-tixian.png" alt="" />
          </div>
        </div>

        <div class="common-item" @click="goToShareFriends">
          <div class="common-icon">
            <img src="@/assets/img/icon-user-tuiguang.png" alt="" />
          </div>
        </div>

        <!-- <div class="common-item" @click="goToWallet">
          <div class="common-icon">
            <img src="@/assets/img/icon-zscz.svg" alt="" />
          </div>
          <div class="common-name">钱包</div>
        </div> -->

        <div class="common-item" @click="goToCustomerService">
          <div class="common-icon">
            <img src="@/assets/img/icon-user-zaixiankefu.png" alt="" />
          </div>
        </div>
      </div>
    </div>

    <!-- 公告版块 -->
    <div v-if="noticeText" class="notice-section">
      <div class="notice-header">
        <div class="notice-icon">
          <img src="@/assets/img/icon-notice.svg" alt="" />
        </div>
        <div class="notice-content">
          <div class="notice-text">{{ noticeText }}</div>
        </div>
      </div>
    </div>

    <!-- 记录列表 -->
    <div class="record-list-section">
      <div class="record-item" @click="goToPurchasedVideos">
        <div class="record-icon">
          <img src="@/assets/img/icon-ygyp.svg" alt="已购影片" />
        </div>
        <div class="record-name">已购影片</div>
        <div class="record-arrow">
          <van-icon name="arrow" size="16" color="#ccc" />
        </div>
      </div>

      <div class="record-item" @click="goToMyCollection">
        <div class="record-icon">
          <img src="@/assets/img/icon-wdsc.svg" alt="我的收藏" />
        </div>
        <div class="record-name">我的收藏</div>
        <div class="record-arrow">
          <van-icon name="arrow" size="16" color="#ccc" />
        </div>
      </div>

      <div class="record-item" @click="goToRechargeRecord">
        <div class="record-icon">
          <img src="@/assets/img/icon-czjl.svg" alt="充值记录" />
        </div>
        <div class="record-name">充值记录</div>
        <div class="record-arrow">
          <van-icon name="arrow" size="16" color="#ccc" />
        </div>
      </div>

      <div class="record-item" @click="goToGameRecord">
        <div class="record-icon">
          <img src="@/assets/img/icon-tzjl.svg" alt="投注记录" />
        </div>
        <div class="record-name">游戏记录</div>
        <div class="record-arrow">
          <van-icon name="arrow" size="16" color="#ccc" />
        </div>
      </div>

      <div class="record-item" @click="goToMyAgent">
        <div class="record-icon">
          <img src="@/assets/img/icon-wddl.svg" alt="我的代理" />
        </div>
        <div class="record-name">我的代理</div>
        <div class="record-arrow">
          <van-icon name="arrow" size="16" color="#ccc" />
        </div>
      </div>

      <div class="record-item" @click="goToPromotionRecord">
        <div class="record-icon">
          <img src="@/assets/img/icon-tgjl.svg" alt="推广记录" />
        </div>
        <div class="record-name">推广记录</div>
        <div class="record-arrow">
          <van-icon name="arrow" size="16" color="#ccc" />
        </div>
      </div>

      <div class="record-item" @click="goToAccountCredential">
        <div class="record-icon">
          <img src="@/assets/img/icon-zhpz2.svg" alt="账户凭证" />
        </div>
        <div class="record-name">账户凭证</div>
        <div class="record-arrow">
          <van-icon name="arrow" size="16" color="#ccc" />
        </div>
      </div>
    </div>

    <!-- 退出登录前的广告位 -->
    <div class="profile-ads-container" v-if="profileAds.length > 0">
      <div v-if="isAdLoading" class="ad-loading">加载中...</div>
      <div v-else-if="hasAdError" class="ad-error">广告加载失败</div>
      <div v-else class="profile-ads-list">
        <div
          v-for="ad in profileAds"
          :key="ad.id"
          class="profile-ad-banner"
          @click="handleAdClick(ad)"
        >
          <img
            :src="ad.imageUrl"
            :alt="ad.title"
            @error="(event) => handleAdImageError(event, ad)"
          />
        </div>
      </div>
    </div>

    <!-- u9000u51fau767bu5f55u6309u94ae -->
    <div class="logout-button" @click="handleLogout">退出登录</div>

    <!-- 底部导航 -->
    <BottomTabbar />

    <!-- 游客提示弹窗 -->
    <div class="guest-tip-overlay" v-if="showGuestTip" @click.self="closeGuestTip">
      <div class="guest-tip-container">
        <div class="guest-tip-header">
          <h2>完善个人信息</h2>
          <div class="guest-tip-close" @click="closeGuestTip">
            <van-icon name="cross" size="20" color="#999" />
          </div>
        </div>
        <div class="guest-tip-content">
          <div class="guest-tip-icon">
            <van-icon name="user-o" size="60" color="#ff9500" />
          </div>
          <div class="guest-tip-title">您当前是游客身份</div>
          <div class="guest-tip-desc">完善个人信息后，可以享受更多功能和服务</div>
          <!-- 游客默认密码提示 -->
          <div class="guest-pwd-tip-box">
            <van-icon name="info-o" size="14" color="#ff9500" />
            <span>游客默认密码：12345678 请尽快修改</span>
          </div>
          <ul class="guest-tip-features">
            <li>✓ 保存观看记录和收藏</li>
            <li>✓ 获取积分和奖励</li>
            <li>✓ 升级VIP会员</li>
          </ul>
        </div>
        <div class="guest-tip-buttons">
          <button class="guest-tip-btn guest-tip-btn-secondary" @click="closeGuestTip">
            稍后再说
          </button>
          <button class="guest-tip-btn guest-tip-btn-primary" @click="goToCompleteProfile">
            立即完善
          </button>
        </div>
      </div>
    </div>

    <!-- 账户凭证弹窗 -->
    <div class="credential-overlay" v-if="showCredential" @click.self="closeCredential">
      <div class="credential-container" id="credential-card">
        <div class="credential-header">
          <h2>账户凭证</h2>
          <div class="credential-close" @click="closeCredential">
            <van-icon name="cross" size="24" color="#fff" />
          </div>
        </div>
        <div class="credential-content">
          <!-- 使用背景图片的凭证内容区 -->
          <div class="credential-main-content">
            <div class="credential-avatar">
              <img 
                :src="currentAvatarUrl || defaultAvatarUrl" 
                alt="头像" 
                @error="handleAvatarError" 
              />
            </div>
            <div class="credential-username">{{ userName }}</div>
            <div class="credential-id">ID：{{ userInfo?.user_id || userInfo?.id || '未知' }}</div>
            <div class="credential-qrcode">
              <!-- 使用本地二维码图片 -->
              <img src="@/assets/img/qrcode-profile.png" alt="二维码" class="qrcode-img" />
            </div>
            <div class="credential-website">永久网址: sese1188.cc</div>
            <div class="credential-desc">
              账户凭证为唯一防失联和恢复账户依据<br /><span style="color: #ff4d4f"
                >请截图妥善保存</span
              >
            </div>
          </div>
        </div>
        <div class="credential-buttons">
          <div class="credential-button" @click="closeCredential">关闭</div>
        </div>
      </div>
    </div>

    <!-- 申请代理弹窗 -->
    <div class="agent-dialog-overlay" v-if="showAgentDialog" @click.self="closeAgentDialog">
      <div class="agent-dialog-container">
        <div class="agent-dialog-header">
          <h2>申请代理</h2>
          <div class="agent-dialog-close" @click="closeAgentDialog">
            <van-icon name="cross" size="20" color="#999" />
          </div>
        </div>
        <div class="agent-dialog-content">
          <div class="agent-dialog-icon">
            <van-icon name="user-circle-o" size="60" color="#ff9500" />
          </div>
          <div class="agent-dialog-title">申请成为代理</div>
          <div class="agent-dialog-desc">成为代理后，您可以享受更多收益和特权</div>
          <ul class="agent-dialog-features">
            <li>✓ 获得推广佣金</li>
            <li>✓ 享受专属优惠</li>
            <li>✓ 获得更多权限</li>
          </ul>
        </div>
        <div class="agent-dialog-buttons">
          <button class="agent-dialog-btn agent-dialog-btn-secondary" @click="closeAgentDialog">
            取消
          </button>
          <button
            class="agent-dialog-btn agent-dialog-btn-primary"
            @click="confirmApplyAgent"
            :disabled="isApplyingAgent"
          >
            {{ isApplyingAgent ? '申请中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {}
  },
}
</script>

<style scoped>
.profile-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 50px;
}

/* u7528u6237u4fe1u606fu533au57df */
.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 15px 10px;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 12px;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.user-id {
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vip-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  color: #333;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}

.user-arrow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.user-arrow div {
  font-size: 12px;
  color: #fff;
}

/* VIP图标样式 */
.vip-icon {
  color: #000;
  font-weight: bold;
  font-style: italic;
  background-color: transparent;
  margin-right: 10px;
}

.vip-content {
  flex: 1;
}

.vip-title {
  font-size: 16px;
  font-weight: bold;
  color: #3a2208;
  margin-bottom: 5px;
}

.vip-desc {
  font-size: 12px;
  color: #634b2b;
}

.vip-button {
  background-color: #8c5a2c;
  color: #fff;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
}

/* u8d26u6237u4fe1u606f */
.account-info {
  display: flex;
  gap: 10px;
  margin: 0 15px 10px;
  padding: 12px;
  background-color: #222;
  border-radius: 10px;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #ccc;
  font-size: 12px;
}

.info-value {
  margin-top: 4px;
  color: #fff;
  font-weight: bold;
  font-size: 14px;
}

.info-item img {
  width: 20px;
  height: 20px;
  margin-bottom: 5px;
}

/* u529fu80fdu5361u7247 */
.feature-cards {
  display: flex;
  margin: 0 15px 15px;
  gap: 10px;
}

.feature-card {
  flex: 1;
  background-color: #222;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
}

.feature-icon {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.feature-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.feature-title {
  font-size: 14px;
  margin-bottom: 5px;
}

.feature-desc {
  font-size: 12px;
  color: #999;
}

/* u5e38u7528u529fu80fdu533au57df */
.common-section {
  margin: 0 15px 10px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.common-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.common-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  padding: 0px;
}

.common-icon {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0;
}

.common-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.common-name {
  font-size: 12px;
  color: #ccc;
  text-align: center;
}

/* 公告版块样式 */
.notice-section {
  background: #2c2c2c;
  margin: 0 15px 10px;
  padding: 10px 16px;
  border-radius: 8px;
  overflow: hidden;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notice-icon {
  color: #ff9500;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.notice-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 20px;
}

.notice-text {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
  position: absolute;
  top: 0;
  left: 0;
  animation: scrollNoticeText 20s linear infinite;
  width: max-content;
}

@keyframes scrollNoticeText {
  0% {
    transform: translateX(100%);
  }

  100% {
    transform: translateX(-100%);
  }
}

/* 记录列表样式 */
.record-list-section {
  background: #2c2c2c;
  margin: 0 15px 10px;
  border-radius: 8px;
  overflow: hidden;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-bottom: 1px solid #333;
}

.record-item:last-child {
  border-bottom: none;
}

.record-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.record-icon {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.record-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.record-name {
  flex: 1;
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.record-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 退出登录前的广告位样式 */
.profile-ads-container {
  margin: 0 15px 10px;
  border-radius: 10px;
  overflow: hidden;
  background-color: #222;
  cursor: pointer;
}

.profile-ads-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.profile-ad-banner {
  width: 100%;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: opacity 0.3s ease;
}

.profile-ad-banner:hover {
  opacity: 0.8;
}

.profile-ad-banner img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.ad-loading,
.ad-error {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

/* u9000u51fau767bu5f55u6309u94ae */
.logout-button {
  background-color: #ff9500;
  color: #fff;
  text-align: center;
  padding: 10px 0;
  margin: 0 15px 20px;
  border-radius: 10px;
  font-size: 14px;
}

/* 底部导航样式已移至 BottomTabbar 组件 */

/* 游客提示弹窗 */
.guest-tip-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.guest-tip-container {
  width: 85%;
  max-width: 360px;
  background-color: #222;
  border-radius: 15px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.guest-tip-header {
  position: relative;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #333;
}

.guest-tip-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.guest-tip-close {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.guest-tip-content {
  padding: 30px 20px;
  text-align: center;
}

.guest-tip-icon {
  margin-bottom: 20px;
}

.guest-tip-title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10px;
}

.guest-tip-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
  line-height: 1.6;
}

.guest-pwd-tip-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 15px;
  margin-bottom: 20px;
  background-color: rgba(255, 149, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #ff9500;
}

.guest-pwd-tip-box span {
  font-weight: 500;
}

.guest-tip-features {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.guest-tip-features li {
  font-size: 14px;
  color: #ccc;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

.guest-tip-features li:last-child {
  border-bottom: none;
}

.guest-tip-buttons {
  display: flex;
  gap: 10px;
  padding: 0 20px 20px;
}

.guest-tip-btn {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.guest-tip-btn-secondary {
  background-color: #333;
  color: #999;
}

.guest-tip-btn-secondary:hover {
  background-color: #444;
}

.guest-tip-btn-primary {
  background-color: #ff9500;
  color: #fff;
}

.guest-tip-btn-primary:hover {
  background-color: #ff8800;
}

/* 账户凭证弹窗 */
.credential-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.credential-container {
  width: 90%;
  max-width: 360px;
  background-color: #222;
  border-radius: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.credential-header {
  position: relative;
  padding: 15px 0;
  text-align: center;
  border-bottom: 1px solid #333;
}

.credential-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.credential-close {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.credential-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  background-image: url('@/assets/img/bg-certificate.jpeg');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.credential-main-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.credential-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 15px;
}

.credential-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.credential-user-id {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.credential-username {
  font-size: 16px;
  font-weight: bold;
}

.credential-id {
  text-align: center;
  margin: 5px 0 15px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 15px;
  display: inline-block;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-weight: 500;
}

.credential-qrcode {
  width: 180px;
  height: 180px;
  background-color: #fff;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qrcode-svg {
  width: 100%;
  height: 100%;
}

.qrcode-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qrcode-loading {
  color: #333;
  font-size: 14px;
}

.credential-website {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.credential-desc {
  color: #999;
  margin-bottom: 10px;
  text-align: center;
}

.credential-tip {
  color: #999;
  font-size: 14px;
}

.credential-buttons {
  display: flex;
  gap: 10px;
  padding: 15px;
}

.credential-button {
  flex: 1;
  color: #fff;
  padding: 12px 0;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.credential-button {
  background-color: #444;
}

.credential-button:hover {
  background-color: #555;
}

/* 申请代理弹窗样式 */
.agent-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1002;
  display: flex;
  justify-content: center;
  align-items: center;
}

.agent-dialog-container {
  width: 85%;
  max-width: 360px;
  background-color: #222;
  border-radius: 15px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.agent-dialog-header {
  position: relative;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #333;
}

.agent-dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.agent-dialog-close {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.agent-dialog-content {
  padding: 30px 20px;
  text-align: center;
}

.agent-dialog-icon {
  margin-bottom: 20px;
}

.agent-dialog-title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10px;
}

.agent-dialog-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
  line-height: 1.6;
}

.agent-dialog-features {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.agent-dialog-features li {
  font-size: 14px;
  color: #ccc;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

.agent-dialog-features li:last-child {
  border-bottom: none;
}

.agent-dialog-buttons {
  display: flex;
  gap: 10px;
  padding: 0 20px 20px;
}

.agent-dialog-btn {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.agent-dialog-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.agent-dialog-btn-secondary {
  background-color: #333;
  color: #999;
}

.agent-dialog-btn-secondary:hover:not(:disabled) {
  background-color: #444;
}

.agent-dialog-btn-primary {
  background-color: #ff9500;
  color: #fff;
}

.agent-dialog-btn-primary:hover:not(:disabled) {
  background-color: #ff8800;
}
</style>
