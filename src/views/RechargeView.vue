<script setup lang="ts">
// 充值页面逻辑
import { ref, onMounted, computed, nextTick, onActivated } from 'vue'
import { showToast, showDialog } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import {
  fetchPayChannels,
  fetchChargeRules,
  createChargeOrder,
  getUserInfo,
  fetchUserDatas,
  setUserInfo,
} from '@/api/fetch-api'
import HeaderNav from '@/components/HeaderNav.vue'

// 接口类型定义
interface PaymentChannel {
  id: string
  name: string
  status: string
  type: string
  payid: string
  selected: boolean
}

interface MoneyItem {
  id: string
  name: string
  coin: string
  coin_ios: string
  money: string
  product_id: string
  give: string
  list_order: string
  addtime: string
  coin_paypal: string
}

interface PaymentSubChannel {
  id: string
  name: string
  paycode?: string
  type?: string
  status?: string
  moneylist?: MoneyItem[]
  payid?: string
  paytypeid?: string
  bankare?: string
  bankno?: string
}

interface ChargeRulesResponse {
  ret: number
  data: {
    code: number
    msg: string
    info: {
      moneylist: MoneyItem[]
      list: PaymentSubChannel | PaymentSubChannel[]
    }
  }
  msg: string
}

interface ChargeRulesDisplay {
  type: 'simple' | 'channels' | 'unsupported'
  moneyList: MoneyItem[]
  accountInfo?: PaymentSubChannel | null
  channels?: PaymentSubChannel[]
  message?: string
}

const router = useRouter()
const route = useRoute()

// 温馨提醒弹窗状态
const showReminderDialog = ref(false)

// 检查今日是否已显示过提醒
const checkTodayReminder = () => {
  const today = new Date().toDateString()
  const lastShown = localStorage.getItem('rechargeReminderDate')
  return lastShown === today
}

// 关闭提醒并记录今日已显示
const closeReminder = (rememberToday: boolean = false) => {
  showReminderDialog.value = false
  if (rememberToday) {
    const today = new Date().toDateString()
    localStorage.setItem('rechargeReminderDate', today)
  }
}

// 修复返回按钮
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const goBack = () => {
  router.back()
}

// 处理广告点击
const handleAdClick = (ad: { id: number; name: string; icon: string; link: string }) => {
  console.log(`点击广告: ${ad.name}, 跳转到: ${ad.link}`)

  // 如果是内部链接，使用路由跳转
  if (ad.link.startsWith('/')) {
    router.push(ad.link)
  } else {
    // 外部链接，使用window.open打开
    window.open(ad.link, '_blank')
  }
}

// 钻石余额
const diamondBalance = ref(0)

// 选项卡状态
const activeTab = ref('game') // 'game' 或 'video'

// 切换选项卡
const switchTab = (tab: string) => {
  if (tab === 'video') {
    router.push('/vip-recharge')
  } else {
    activeTab.value = tab
  }
}

// 广告列表数据
const adsList = ref([
  {
    id: 1,
    name: '快帆加速VPN',
    icon: new URL('@/assets/img/icon-link-01.png', import.meta.url).href,
    link: 'https://www.kuaifan.co/',
  },
  {
    id: 2,
    name: '穿梭加速VPN',
    icon: new URL('@/assets/img/icon-link-02.png', import.meta.url).href,
    link: 'https://www.transocks.com.cn/',
  },
  {
    id: 3,
    name: 'imToken',
    icon: new URL('@/assets/img/icon-link-03.png', import.meta.url).href,
    link: 'https://token.im/download',
  },
  {
    id: 4,
    name: 'TOKEN POCKET',
    icon: new URL('@/assets/img/icon-link-04.png', import.meta.url).href,
    link: 'https://www.tokenpocket.pro/zh/download/app',
  },
  {
    id: 5,
    name: 'TronLink',
    icon: new URL('@/assets/img/icon-link-05.png', import.meta.url).href,
    link: 'https://www.tronlink.org/',
  },
  {
    id: 6,
    name: 'Bitpie',
    icon: new URL('@/assets/img/icon-link-06.png', import.meta.url).href,
    link: 'https://bitpie.com/',
  },
  {
    id: 7,
    name: 'wnbit',
    icon: new URL('@/assets/img/icon-link-07.png', import.meta.url).href,
    link: 'https://ownbit.io/en/download/',
  },
  {
    id: 8,
    name: 'Trust Wallet',
    icon: new URL('@/assets/img/icon-link-08.png', import.meta.url).href,
    link: 'https://trustwallet.com/zh_CN/',
  },
])

// 支付渠道数据
const paymentChannels = ref<PaymentChannel[]>([])
const isLoadingChannels = ref(false)

// 当前选中的支付方式
const selectedPaymentMethod = ref('')

// 充值金额
const rechargeAmount = ref('')
// 手动输入金额
const customAmount = ref('')
const isCustomAmount = ref(false)

// 当前充值规则数据
const chargeRules = ref<ChargeRulesResponse | null>(null)
const isLoadingRules = ref(false)

// 选中的金额项
const selectedMoneyItem = ref<MoneyItem | null>(null)

// 选中的子渠道
const selectedSubChannel = ref<PaymentSubChannel | null>(null)

// 转账账号（仅虚拟币显示）
const transferAccount = ref('')

// 创建订单加载状态
const isCreatingOrder = ref(false)

// 订单成功弹窗状态
const showOrderSuccessModal = ref(false)
// 支付成功弹窗状态
const showPaymentSuccessModal = ref(false)
// 支付失败弹窗状态
const showPaymentFailureModal = ref(false)
const orderInfo = ref({
  orderNumber: '',
  payUrl: '',
  qudaoid: 0,
})
const paymentCountdown = ref(0)
const paymentCountdownTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 计算渠道ID到类型的映射
const channelTypeMap: Record<string, number> = {
  '2': 2, // 虚拟币
  '3': 3, // 银行卡
  '4': 4, // 微信
  '5': 5, // 支付宝
}

// 获取支付渠道数据
const fetchPaymentChannels = async () => {
  isLoadingChannels.value = true
  try {
    const result = await fetchPayChannels()
    if (result.ret === 200 && result.data && result.data.info && result.data.info.list) {
      paymentChannels.value = result.data.info.list.map(
        (item: { id: string; name: string; status: string; type: string; payid: string }) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          type: item.type,
          payid: item.payid,
          selected: false,
        }),
      )

      // 🔥 默认选中支付宝支付方式
      const alipayChannel = paymentChannels.value.find(
        (channel) =>
          channel.id === '5' ||
          channel.type === '5' ||
          (channel.type === '1' &&
            (channel.name.includes('支付宝') ||
              channel.name.toLowerCase().includes('alipay') ||
              channel.name.toLowerCase().includes('ali'))),
      )

      if (alipayChannel) {
        // 自动选中支付宝
        alipayChannel.selected = true
        selectedPaymentMethod.value = alipayChannel.id
        // 自动获取支付宝的充值规则
        await fetchRules(alipayChannel.id)
      }

      console.log('支付渠道数据:', paymentChannels.value)
    } else {
      console.error('获取支付渠道失败:', result)
      showToast({
        message: '获取支付渠道失败',
        duration: 2000,
      })
    }
  } catch (error) {
    console.error('获取支付渠道错误:', error)
    showToast({
      message: '网络错误，请重试',
      duration: 2000,
    })
  } finally {
    isLoadingChannels.value = false
  }
}

// 获取充值规则
const fetchRules = async (channelId: string) => {
  const qudaoid = channelTypeMap[channelId]
  if (!qudaoid) {
    console.error('未知的渠道类型:', channelId)
    return
  }

  isLoadingRules.value = true
  try {
    const result = await fetchChargeRules(qudaoid)
    chargeRules.value = result

    // 重置选择状态
    selectedMoneyItem.value = null
    selectedSubChannel.value = null
    rechargeAmount.value = ''
    isCustomAmount.value = false
    customAmount.value = ''
    // 🔥 清空转账账号，避免显示上一个支付方式的信息
    transferAccount.value = ''

    // 处理不同类型的返回数据
    if (result?.ret === 200 && result?.data?.info) {
      const info = result.data.info

      // 如果是虚拟币（类型2），设置转账账号
      if (qudaoid === 2 && !Array.isArray(info.list)) {
        transferAccount.value = info.list.bankno || ''
      }

      // 🔥 自动选中支付平台逻辑
      if (Array.isArray(info.list) && info.list.length > 0) {
        // 检查当前选中的支付方式是否是支付宝
        const currentChannel = paymentChannels.value.find((c) => c.id === channelId)
        const isAlipay =
          qudaoid === 5 ||
          currentChannel?.id === '5' ||
          currentChannel?.type === '5' ||
          (currentChannel?.type === '1' &&
            (currentChannel?.name.includes('支付宝') ||
              currentChannel?.name.toLowerCase().includes('alipay') ||
              currentChannel?.name.toLowerCase().includes('ali')))

        let targetPlatform = null

        // 如果是支付宝，优先尝试找到名称匹配的平台
        if (isAlipay) {
          targetPlatform = info.list.find(
            (platform: PaymentSubChannel) =>
              platform.name?.includes('支付宝') ||
              platform.name?.toLowerCase().includes('alipay') ||
              platform.name?.toLowerCase().includes('ali'),
          )
        }

        // 如果没找到匹配的（或者是其他支付方式），默认选中第一个
        if (!targetPlatform) {
          targetPlatform = info.list[0]
        }

        if (targetPlatform) {
          selectedSubChannel.value = targetPlatform
        }
      }

      console.log('充值规则数据:', result)
      
      // 🔥 自动滚动到底部，显示完整的充值金额
      nextTick(() => {
        setTimeout(() => {
          const scrollContainer = document.querySelector('.scrollable-content')
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth',
            })
          }
        }, 300) // 延迟300ms确保DOM完全渲染
      })
    }
  } catch (error) {
    console.error('获取充值规则错误:', error)
    showToast({
      message: '获取充值规则失败',
      duration: 2000,
    })
  } finally {
    isLoadingRules.value = false
  }
}

// 选择支付方式
const selectPaymentMethod = async (methodId: string) => {
  paymentChannels.value.forEach((method) => {
    method.selected = method.id === methodId
  })
  selectedPaymentMethod.value = methodId

  // 重置选择状态
  selectedSubChannel.value = null
  selectedMoneyItem.value = null
  rechargeAmount.value = ''
  isCustomAmount.value = false
  customAmount.value = ''

  // 获取该渠道的充值规则
  await fetchRules(methodId)

  // 如果是不需要选择平台的支付方式，直接显示金额选择
}

// 获取支付方式图标 - 通过TYPE和NAME字段组合判断
const getPaymentIcon = (type: string, name: string) => {
  switch (type) {
    case '2': // 虚拟币
      return new URL('@/assets/img/icon-usdt.png', import.meta.url).href
    case '3': // 银行卡
      return new URL('@/assets/img/icon-yl.png', import.meta.url).href
    case '1': // 微信和支付宝都是type=1，需要通过name区分
      const lowerName = name.toLowerCase()
      if (lowerName.includes('微信') || lowerName.includes('wechat') || lowerName.includes('wx')) {
        return new URL('@/assets/img/icon-wechat.png', import.meta.url).href
      } else if (
        lowerName.includes('支付宝') ||
        lowerName.includes('alipay') ||
        lowerName.includes('ali')
      ) {
        return new URL('@/assets/img/icon-alipay.png', import.meta.url).href
      } else {
        // type=1但无法识别名称时，默认微信图标
        return new URL('@/assets/img/icon-wechat.png', import.meta.url).href
      }
    default:
      return new URL('@/assets/img/icon-bankcard-orange.svg', import.meta.url).href
  }
}

// 选择平台
const selectPlatform = (platform: PaymentSubChannel | Record<string, unknown>) => {
  selectedSubChannel.value = platform as PaymentSubChannel

  // 重置金额选择
  selectedMoneyItem.value = null
  rechargeAmount.value = ''
  isCustomAmount.value = false
  customAmount.value = ''

  // 🔥 滚动到底部，方便用户看到金额选择
  nextTick(() => {
    const scrollContainer = document.querySelector('.scrollable-content')
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth',
      })
    }
  })
}

// 🔥 处理支付成功确认
const handleConfirmSuccess = () => {
  showPaymentSuccessModal.value = false
  // 可以刷新余额或跳转到其他页面
  showToast({
    message: '充值成功',
    duration: 2000,
  })
}

// 🔥 处理返回充值页
const handleReturnToRecharge = () => {
  showPaymentFailureModal.value = false
  // 关闭弹窗，用户可以重新选择充值
}

// 🔥 跳转到手动充值（客服）
const goToManualRecharge = async () => {
  try {
    showToast({
      message: '正在跳转客服...',
      duration: 1000,
    })

    // 获取或生成浏览器指纹
    let browserId = localStorage.getItem('browserId')
    
    if (!browserId) {
      // 生成简单的浏览器指纹
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform
      ].join('|')
      
      let hash = 0
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      browserId = Math.abs(hash).toString(36)
      localStorage.setItem('browserId', browserId)
    }

    // 调用接口获取RSA密钥
    const formData = new URLSearchParams()
    formData.append('murmur', browserId)
    
    const response = await fetch('https://help.186web.cc/admin/RSAEncrypt/gtRsP', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })
    
    const result = await response.json()
    
    if (result && result.data) {
      const rsaPassWord = result.data
      const customerServiceUrl = `https://help186.xuhgki.cn/index/index/home?code=${rsaPassWord}`
      
      // 移动端兼容性更好的跳转方式
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // 移动端直接跳转
        window.location.href = customerServiceUrl
      } else {
        // PC端尝试新窗口打开
        const newWindow = window.open(customerServiceUrl, '_blank')
        // 如果被拦截，则直接跳转
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = customerServiceUrl
        }
      }
    } else {
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

// 🔥 打开支付页面（兼容Safari）
const openPaymentPage = (payUrl: string) => {
  if (!payUrl) return

  try {
    // 检测是否为iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)

    if (isIOS && isSafari) {
      // iOS Safari: 使用location.href
      window.location.href = payUrl
    } else {
      // 其他浏览器: 尝试使用window.open
      const newWindow = window.open(payUrl, '_blank')
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // 如果window.open被阻止，降级使用location.href
        window.location.href = payUrl
      }
    }
  } catch (error) {
    console.error('打开支付页面失败:', error)
    // 降级处理
    window.location.href = payUrl
  }
}

// 选择金额
const selectAmount = (item: MoneyItem) => {
  selectedMoneyItem.value = item
  rechargeAmount.value = item.money
  isCustomAmount.value = false
  customAmount.value = ''
}

// 处理手动输入金额
const handleCustomAmountInput = (value: string) => {
  // 只允许数字和小数点
  const numericValue = value.replace(/[^\d.]/g, '')
  // 限制小数点后两位
  const parts = numericValue.split('.')
  if (parts.length > 2) {
    customAmount.value = parts[0] + '.' + parts.slice(1).join('')
  } else if (parts.length === 2 && parts[1].length > 2) {
    customAmount.value = parts[0] + '.' + parts[1].substring(0, 2)
  } else {
    customAmount.value = numericValue
  }

  if (customAmount.value && parseFloat(customAmount.value) > 0) {
    isCustomAmount.value = true
    selectedMoneyItem.value = null
    rechargeAmount.value = customAmount.value
  } else {
    isCustomAmount.value = false
    rechargeAmount.value = ''
  }
}

// 计算手动输入金额对应的钻石数
const calculateCustomCoin = computed(() => {
  if (!customAmount.value || !availableAmounts.value.length) return 0

  const amount = parseFloat(customAmount.value)
  if (amount <= 0) return 0

  // 从可用金额列表中计算比例（使用第一个金额项作为参考）
  const firstItem = availableAmounts.value[0]
  if (firstItem && firstItem.money && firstItem.coin) {
    const moneyRate = parseFloat(firstItem.money)
    const coinRate = parseFloat(firstItem.coin)
    if (moneyRate > 0) {
      return Math.floor((amount / moneyRate) * coinRate)
    }
  }
  return 0
})

// 复制转账账号
const copyTransferAccount = async () => {
  try {
    await navigator.clipboard.writeText(transferAccount.value)
    showToast({
      message: '✅ 钱包地址已复制到剪贴板',
      duration: 2000,
    })
  } catch (error) {
    console.error('复制失败:', error)
    // 降级处理：尝试使用旧版API
    try {
      const textArea = document.createElement('textarea')
      textArea.value = transferAccount.value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast({
        message: '✅ 钱包地址已复制到剪贴板',
        duration: 2000,
      })
    } catch {
      showToast({
        message: '复制失败，请手动复制地址',
        duration: 2000,
      })
    }
  }
}

// 创建充值订单并处理支付
const createOrder = async () => {
  if (isCreatingOrder.value) {
    return // 防止重复点击
  }

  if (!selectedMoneyItem.value && !isCustomAmount.value) {
    showToast({
      message: '请选择充值金额或输入自定义金额',
      duration: 2000,
    })
    return
  }

  // 如果是手动输入金额，需要创建一个临时的金额项
  if (isCustomAmount.value && !selectedMoneyItem.value) {
    const customMoney = parseFloat(customAmount.value)
    if (customMoney <= 0) {
      showToast({
        message: '请输入有效的充值金额',
        duration: 2000,
      })
      return
    }
    // 创建临时金额项用于订单创建
    selectedMoneyItem.value = {
      id: 'custom',
      name: `自定义${customMoney}元`,
      coin: calculateCustomCoin.value.toString(),
      coin_ios: calculateCustomCoin.value.toString(),
      money: customMoney.toString(),
      product_id: '',
      give: '0',
      list_order: '0',
      addtime: '',
      coin_paypal: calculateCustomCoin.value.toString(),
    }
  }

  // 🔥 智能验证支付方式：对于有子渠道的支付方式，检查是否选择了子渠道
  if (!selectedPaymentMethod.value && !selectedSubChannel.value) {
    showToast({
      message: '请选择支付方式',
      duration: 2000,
    })
    return
  }

  // 如果有选中的支付方式，验证其有效性
  let selectedChannel = null
  if (selectedPaymentMethod.value) {
    selectedChannel = paymentChannels.value.find((c) => c.id === selectedPaymentMethod.value)
    if (!selectedChannel) {
      showToast({
        message: '支付方式无效',
        duration: 2000,
      })
      return
    }
  }

  isCreatingOrder.value = true

  try {
    // 准备订单参数
    let qudaoid = 0
    let paytypecode = ''

    // 🔥 智能获取渠道类型：优先从selectedPaymentMethod，其次从selectedSubChannel
    if (selectedPaymentMethod.value) {
      qudaoid = channelTypeMap[selectedPaymentMethod.value]
    } else if (selectedSubChannel.value) {
      // 从子渠道的paytypeid获取渠道类型，或根据子渠道信息推断
      qudaoid = parseInt(selectedSubChannel.value.paytypeid || '1') // 微信/支付宝默认为1
    }

    // 根据不同渠道类型获取paytypecode
    if (qudaoid === 2) {
      // 虚拟币类型，使用默认值或从accountInfo获取
      paytypecode = chargeRulesDisplay.value?.accountInfo?.bankare || 'USDT-TRC20'
    } else if (selectedSubChannel.value) {
      // 微信/支付宝等有子渠道的，使用子渠道的paycode
      paytypecode = selectedSubChannel.value.paycode || ''
    }

    if (!paytypecode) {
      showToast({
        message: '支付通道信息缺失',
        duration: 2000,
      })
      return
    }

    // 此时 selectedMoneyItem.value 一定不为 null（前面已经检查并创建）
    if (!selectedMoneyItem.value) {
      showToast({
        message: '金额信息缺失',
        duration: 2000,
      })
      isCreatingOrder.value = false
      return
    }

    const orderParams = {
      qudaoid: qudaoid,
      money: selectedMoneyItem.value.money,
      paytypecode: paytypecode,
      moneylistid: parseInt(selectedMoneyItem.value.id),
    }

    console.log('创建订单参数:', orderParams)

    // 显示加载提示
    showToast({
      message: '正在创建订单...',
      duration: 1000,
    })

    // 调用创建订单接口
    const result = await createChargeOrder(orderParams)

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      const payUrl = result.data.info?.purl
      const orderNumber = result.data.info?.order_no || result.data.info?.orderid || ''

      // 🔥 设置订单信息并显示自定义弹窗
      orderInfo.value = {
        orderNumber: orderNumber,
        payUrl: payUrl || '',
        qudaoid: qudaoid,
      }
      showOrderSuccessModal.value = true

      // 🔥 自动打开支付页面（3秒后）
      if (payUrl) {
        paymentCountdown.value = 3
        if (paymentCountdownTimer.value) {
          clearInterval(paymentCountdownTimer.value)
        }
        paymentCountdownTimer.value = setInterval(() => {
          paymentCountdown.value--
          if (paymentCountdown.value <= 0) {
            if (paymentCountdownTimer.value) {
              clearInterval(paymentCountdownTimer.value)
              paymentCountdownTimer.value = null
            }
            openPaymentPage(payUrl)
          }
        }, 1000)
      }
    } else {
      // 订单创建失败
      showToast({
        message: result?.data?.msg || result?.msg || '订单创建失败，请重试',
        duration: 2000,
      })
    }
  } catch (error) {
    console.error('创建订单错误:', error)
    showToast({
      message: '网络错误，请重试',
      duration: 2000,
    })
  } finally {
    isCreatingOrder.value = false
  }
}

// 确认充值
const confirmRecharge = () => {
  const selectedChannel = paymentChannels.value.find((c) => c.id === selectedPaymentMethod.value)
  const channelType = selectedChannel?.type

  if (channelType === '2') {
    // 虚拟币，先显示转账提示，然后创建订单
    showDialog({
      title: '确认转账',
      message: `确认充值 ${rechargeAmount.value} 元？\n\n请在创建订单后按照提示完成转账`,
      confirmButtonText: '确认充值',
      cancelButtonText: '取消',
      confirmButtonColor: '#ff9500',
    }).then(() => {
      createOrder()
    })
  } else {
    // 其他支付方式，直接创建订单
    createOrder()
  }
}

// 计算充值规则显示数据
const chargeRulesDisplay = computed((): ChargeRulesDisplay | null => {
  if (!chargeRules.value?.data?.info) return null

  const info = chargeRules.value.data.info
  const qudaoid = channelTypeMap[selectedPaymentMethod.value]

  if (qudaoid === 2) {
    // 虚拟币类型，直接显示moneylist
    return {
      type: 'simple',
      moneyList: info.moneylist || [],
      accountInfo: Array.isArray(info.list) ? null : info.list,
    }
  } else if (qudaoid === 3) {
    // 🔥 银行卡类型，暂不支持时不显示金额选择，只显示提示信息
    return {
      type: 'unsupported',
      moneyList: info.moneylist || [],
      message: Array.isArray(info.list) ? '暂不支持' : info.list?.name || '暂不支持',
    }
  } else {
    // 微信/支付宝类型，显示子渠道
    return {
      type: 'channels',
      moneyList: info.moneylist || [],
      channels: Array.isArray(info.list) ? info.list : [],
    }
  }
})

// 计算是否显示金额选择
const showAmountSelection = computed(() => {
  if (!chargeRulesDisplay.value) return false

  if (chargeRulesDisplay.value.type === 'simple') {
    // 虚拟币类型，直接显示金额选择
    return true
  } else if (chargeRulesDisplay.value.type === 'channels') {
    // 🔥 微信/支付宝类型，选择了平台后显示金额选择
    return selectedSubChannel.value !== null
  } else if (chargeRulesDisplay.value.type === 'unsupported') {
    // 🔥 不支持的支付方式，不显示金额选择
    return false
  }

  return false
})

// 计算可用的充值金额
const availableAmounts = computed(() => {
  if (!chargeRulesDisplay.value) return []

  if (chargeRulesDisplay.value.type === 'simple') {
    // 虚拟币类型，返回默认金额列表
    return chargeRulesDisplay.value.moneyList
  } else if (chargeRulesDisplay.value.type === 'channels' && selectedSubChannel.value) {
    // 微信/支付宝类型，返回选中平台的金额列表
    return selectedSubChannel.value.moneylist || []
  }

  return []
})

// 计算金额范围提示文本
const amountRangePlaceholder = computed(() => {
  const amounts = availableAmounts.value
  if (amounts.length === 0) {
    return '请输入金额'
  }
  
  // 获取所有金额并排序
  const moneyValues = amounts.map(item => parseFloat(item.money)).filter(val => !isNaN(val))
  if (moneyValues.length === 0) {
    return '请输入金额'
  }
  
  const minAmount = Math.min(...moneyValues)
  const maxAmount = Math.max(...moneyValues)
  
  return `请输入金额 (${minAmount}-${maxAmount}元)`
})

// 获取用户钻石余额
const loadUserBalance = () => {
  const userInfo = getUserInfo()
  if (userInfo && userInfo.coin !== undefined) {
    diamondBalance.value = userInfo.coin
  }
}

// 刷新用户余额（从服务器获取最新数据）
const refreshUserBalance = async () => {
  try {
    const result = await fetchUserDatas({})
    if (result && result.code === 1 && result.data) {
      // 更新本地用户信息
      const currentUserInfo = getUserInfo()
      if (currentUserInfo && result.data.coin !== undefined) {
        const updatedUserInfo = {
          ...currentUserInfo,
          coin: result.data.coin,
        }
        setUserInfo(updatedUserInfo)
        diamondBalance.value = result.data.coin
      }
    }
  } catch (error) {
    console.error('刷新用户余额失败:', error)
  }
}

onMounted(async () => {
  // 检查是否需要显示温馨提醒
  if (!checkTodayReminder()) {
    showReminderDialog.value = true
  }
  
  // 获取用户钻石余额
  loadUserBalance()
  // 刷新最新余额
  await refreshUserBalance()
  // 获取支付渠道数据
  fetchPaymentChannels()
  
  // 🔥 页面加载完成后，延迟滚动到底部（作为备用方案）
  nextTick(() => {
    setTimeout(() => {
      const scrollContainer = document.querySelector('.scrollable-content')
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        })
      }
    }, 1000) // 延迟1秒，等待数据加载完成
  })
  
  // 检查支付结果（从URL参数）
  checkPaymentResult()
})

// 页面激活时也检查支付结果
onActivated(() => {
  checkPaymentResult()
})

// 检查支付结果
const checkPaymentResult = () => {
  const paymentStatus = route.query.payment_status as string
  
  if (paymentStatus === 'success') {
    // 显示支付成功弹窗
    showPaymentSuccessModal.value = true
    // 清除URL参数
    router.replace({ query: {} })
  } else if (paymentStatus === 'failure' || paymentStatus === 'cancel') {
    // 显示支付失败弹窗
    showPaymentFailureModal.value = true
    // 清除URL参数
    router.replace({ query: {} })
  }
}
</script>

<template>
  <div class="recharge-page">
    <!-- 头部导航 -->
    <HeaderNav title="充值中心" />

    <!-- 选项卡切换 -->
    <div class="nav-tabs">
      <div class="nav-tabs-wrapper">
        <div class="tab-container">
          <div
            class="tab-button"
            :class="{ active: activeTab === 'video' }"
            @click="switchTab('video')"
          >
            视频充值
          </div>
          <div
            class="tab-button"
            :class="{ active: activeTab === 'game' }"
            @click="switchTab('game')"
          >
            游戏充值
          </div>
        </div>
      </div>
    </div>

    <!-- 固定顶部区域 -->
    <div class="fixed-top-section">
      <!-- 钻石余额区域 -->
      <div class="diamond-balance">
        <div class="balance-content">
          <img src="@/assets/img/icon-diamond.png" alt="钻石" class="diamond-icon-img" />
          <div class="balance-info">
            <div class="balance-label">钻石余额</div>
            <div class="balance-amount">{{ diamondBalance }}</div>
          </div>
        </div>
      </div>

      <!-- 第一步：选择支付方式 -->
      <div class="selection-section">
        <h3 class="section-title">
          <span class="step-number">1</span>
          选择支付方式
        </h3>
        <div v-if="isLoadingChannels" class="loading-channels">
          <van-loading type="spinner" color="#ff9500" />
          <span>加载支付方式中...</span>
        </div>
        <div v-else class="selection-grid">
          <div
            v-for="method in paymentChannels"
            :key="method.id"
            class="selection-item"
            :class="{ active: method.selected }"
            @click="selectPaymentMethod(method.id)"
          >
            <div class="item-content">
              <div class="item-icon-container">
                <img
                  :src="getPaymentIcon(method.type, method.name)"
                  alt="支付方式图标"
                  class="item-icon"
                />
              </div>
              <div class="item-name">{{ method.name }}</div>
            </div>
            <div v-if="method.selected" class="check-icon">
              <van-icon name="success" size="10" color="#fff" />
            </div>
          </div>
          
          <!-- 手动充值选项 -->
          <div
            class="selection-item manual-recharge-item"
            @click="goToManualRecharge"
          >
            <div class="item-content">
              <div class="item-icon-container">
                <img
                  src="@/assets/img/icon-sd-recharge.svg"
                  alt="手动充值"
                  class="item-icon"
                />
              </div>
              <div class="item-name">手动充值</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="scrollable-content">
      <!-- 加载充值规则 -->
      <div v-if="isLoadingRules" class="loading-rules">
        <van-loading type="spinner" color="#ff9500" />
        <span>加载充值规则中...</span>
      </div>

      <!-- 第二步：选择支付平台 -->
      <div
        v-if="!isLoadingRules && chargeRulesDisplay?.type === 'channels'"
        class="selection-section platform-selection"
      >
        <h3 class="section-title">
          <span class="step-number">2</span>
          选择支付平台
        </h3>

        <div class="platform-grid">
          <div
            v-for="channel in chargeRulesDisplay.channels"
            :key="channel.id"
            class="platform-card"
            :class="{ active: selectedSubChannel?.id === channel.id }"
            @click="selectPlatform(channel)"
          >
            <div class="platform-card-content">
              <div class="platform-name">{{ channel.name }}</div>
            </div>
            <div v-if="selectedSubChannel?.id === channel.id" class="check-icon">
              <van-icon name="success" size="10" color="#fff" />
            </div>
          </div>
        </div>
      </div>

      <!-- 第三步：选择充值金额 -->
      <div v-if="!isLoadingRules && showAmountSelection" class="selection-section">
        <h3 class="section-title">
          <span class="step-number">{{ chargeRulesDisplay?.type === 'channels' ? 3 : 2 }}</span>
          选择充值金额
        </h3>

        <!-- 手动输入金额 -->
        <div class="custom-amount-section">
          <div class="custom-amount-input-wrapper">
            <input
              v-model="customAmount"
              type="text"
              inputmode="decimal"
              :placeholder="amountRangePlaceholder"
              class="custom-amount-input"
              @input="(e) => handleCustomAmountInput((e.target as HTMLInputElement).value)"
            />
            <span class="custom-amount-unit">元</span>
          </div>
          <div v-if="isCustomAmount && calculateCustomCoin > 0" class="custom-coin-display">
            可获得 {{ calculateCustomCoin }} 钻石
          </div>
        </div>

        <div class="selection-grid amount-grid">
          <div
            v-for="item in availableAmounts"
            :key="item.id"
            class="selection-item amount-item"
            :class="{ active: selectedMoneyItem?.id === item.id && !isCustomAmount }"
            @click="selectAmount(item)"
          >
            <div class="item-content">
              <div class="amount-value">{{ item.money }}元</div>
              <div class="coin-value">{{ item.coin }}钻石</div>
              <div v-if="item.give && item.give !== '0'" class="bonus-tag">送{{ item.give }}</div>
            </div>
            <div v-if="selectedMoneyItem?.id === item.id && !isCustomAmount" class="check-icon">
              <van-icon name="success" size="10" color="#fff" />
            </div>
          </div>
        </div>

        <!-- 🔥 转账信息或提示信息 -->
        <div
          v-if="chargeRulesDisplay?.type === 'simple' && chargeRulesDisplay.accountInfo"
          class="transfer-info"
        >
          <!-- 虚拟币转账信息 -->
          <template v-if="selectedPaymentMethod === '2' && transferAccount">
            <div class="transfer-header">
              <span class="transfer-title">转账信息</span>
            </div>

            <div class="account-card">
              <div class="account-type">{{ chargeRulesDisplay.accountInfo.name }}</div>
              <div class="account-number-container">
                <div class="account-number">{{ transferAccount }}</div>
                <button class="copy-btn" @click="copyTransferAccount" title="复制地址">
                  <van-icon name="notes" size="12" color="#fff" />
                </button>
              </div>
            </div>

            <div class="transfer-note">复制地址到钱包转账，完成后点击确认按钮</div>
          </template>

          <!-- 银行卡或其他不支持的支付方式信息 -->
          <template v-else-if="chargeRulesDisplay.message">
            <div class="unsupported-message">
              <van-icon name="info-o" size="24" color="#999" />
              <div class="message-text">{{ chargeRulesDisplay.message }}</div>
            </div>
          </template>
        </div>
      </div>

      <!-- 🔥 不支持的支付方式提示 -->
      <div v-if="chargeRulesDisplay?.type === 'unsupported'" class="selection-section">
        <div class="unsupported-message">
          <van-icon name="info-o" size="24" color="#999" />
          <div class="message-text">{{ chargeRulesDisplay.message }}</div>
        </div>
      </div>

      <!-- 确认充值按钮 - 悬浮底部 -->
      <div class="confirm-section-fixed">
        <button
          class="confirm-button"
          :disabled="(!selectedMoneyItem && !isCustomAmount) || isCreatingOrder"
          @click="confirmRecharge"
        >
          <van-loading v-if="isCreatingOrder" type="spinner" size="16" color="#fff" />
          <span v-else>确认充值 {{ rechargeAmount ? `￥${rechargeAmount}` : '' }}</span>
        </button>
      </div>

      <!-- 协议文本 -->
      <div class="agreement-section">
        <span class="agreement-text">
          已阅读并同意
          <span class="agreement-link">《用户充值协议》</span>
        </span>
      </div>

      <!-- 广告推荐区域 -->
      <div class="ads-section">
        <div class="ads-grid">
          <div v-for="ad in adsList" :key="ad.id" class="ad-item" @click="handleAdClick(ad)">
            <div class="ad-icon">
              <img :src="ad.icon" :alt="ad.name" />
            </div>
            <div class="ad-name">{{ ad.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 🔥 订单创建成功弹窗 -->
  <van-popup
    v-model:show="showOrderSuccessModal"
    :close-on-click-overlay="false"
    class="order-success-popup"
  >
    <div class="order-success-modal">
      <div class="success-header">
        <h2 class="success-title">订单创建成功</h2>
      </div>

      <div class="order-details">
        <div class="payment-status">
          <span class="status-text">正在跳转支付页面...</span>
          <span class="countdown" v-if="paymentCountdown > 0">{{ paymentCountdown }}s</span>
        </div>
      </div>
    </div>
  </van-popup>

  <!-- 支付成功弹窗 -->
  <van-popup
    v-model:show="showPaymentSuccessModal"
    :close-on-click-overlay="false"
    class="payment-result-popup"
  >
    <div class="payment-result-modal">
      <div class="result-header">
        <div class="result-icon success-icon">
          <van-icon name="checked" size="48" color="#52c41a" />
        </div>
        <h2 class="result-title">支付成功</h2>
      </div>

      <div class="result-content">
        <p class="result-message">您的充值已成功到账</p>
      </div>

      <div class="result-actions">
        <button class="result-btn primary-btn" @click="handleConfirmSuccess">确认</button>
      </div>
    </div>
  </van-popup>

  <!-- 支付失败弹窗 -->
  <van-popup
    v-model:show="showPaymentFailureModal"
    :close-on-click-overlay="false"
    class="payment-result-popup"
  >
    <div class="payment-result-modal">
      <div class="result-header">
        <div class="result-icon failure-icon">
          <van-icon name="close" size="48" color="#ff4d4f" />
        </div>
        <h2 class="result-title">支付失败</h2>
      </div>

      <div class="result-content">
        <p class="result-message">支付未完成，请重试</p>
      </div>

      <div class="result-actions">
        <button class="result-btn secondary-btn" @click="handleReturnToRecharge">返回</button>
      </div>
    </div>
  </van-popup>

  <!-- 充值温馨提醒弹窗 -->
  <div v-if="showReminderDialog" class="reminder-overlay" @click.self="closeReminder(false)">
    <div class="reminder-dialog">
      <div class="reminder-header">
        <div class="reminder-icon">
          <van-icon name="warning-o" size="32" color="#ff9500" />
        </div>
        <h3 class="reminder-title">充值温馨提醒</h3>
      </div>
      
      <div class="reminder-content">
        <div class="reminder-text">
          <p class="highlight-text">充值时请务必通过游戏内进行充值，不要直接给历史账户私下转账，否则会导致金币延迟到账7日以上。</p>
          <p class="normal-text">近期支付封控比较严重，建议使用<span class="emphasis">USDT</span>、<span class="emphasis">银行卡</span>或<span class="emphasis">数字人民币</span>充值。</p>
          <p class="normal-text">如遇充值问题，可找<span class="emphasis">客服线下充值</span>。</p>
        </div>
      </div>

      <div class="reminder-footer">
        <button class="reminder-btn secondary" @click="closeReminder(true)">
          今日不再提醒
        </button>
        <button class="reminder-btn primary" @click="closeReminder(false)">
          我知道了
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recharge-page {
  background-color: #111;
  color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 固定顶部区域 */
.fixed-top-section {
  flex-shrink: 0;
  background-color: #111;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 110px;
}

/* 可滚动内容区域 */
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

/* 🔥 导航选项卡 - 圆角按钮样式 */
.nav-tabs {
  position: fixed;
  top: 50px;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 99;
  display: flex;
  justify-content: center;
}

.nav-tabs-wrapper {
  width: 100%;
  max-width: 420px;
  padding: 10px 20px;
  background-color: #111;
}

.tab-container {
  display: flex;
  background-color: #333;
  border-radius: 20px;
  padding: 3px;
  gap: 3px;
  width: 100%;
}

.tab-button {
  flex: 1;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #999;
  background-color: transparent;
}

.tab-button.active {
  background: linear-gradient(135deg, #ff9500 0%, #ff7700 100%);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

/* 钻石余额区域 */
.diamond-balance {
  padding: 6px 20px 12px 20px;
}

.balance-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diamond-icon-img {
  width: 20px;
  filter: drop-shadow(0 0 6px rgba(255, 149, 0, 0.5));
  flex-shrink: 0;
}

.balance-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.balance-label {
  font-size: 12px;
  color: #ccc;
}

.balance-amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff9500;
}

/* 选择区域通用样式 */
.selection-section {
  padding: 10px 20px;
}

.section-title {
  font-size: 16px;
  margin-bottom: 15px;
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #ff9500;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.loading-channels,
.loading-rules {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #999;
  padding: 20px;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  grid-auto-rows: auto;
}

/* 确保支付方式选择保持3列 */
.selection-grid:not(.platform-grid):not(.amount-grid) {
  grid-template-columns: repeat(3, 1fr) !important;
}

.selection-grid.platform-grid,
.selection-grid.amount-grid {
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 8px;
}

.selection-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 6px;
  background-color: #222;
  border-radius: 8px;
  border: 1px solid #333;
  transition: all 0.3s ease;
  cursor: pointer;
}

.selection-item:hover {
  border-color: #ff9500;
  transform: translateY(-1px);
}

.selection-item.active {
  background-color: rgba(255, 149, 0, 0.1);
  border: 1px solid #ff9500;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
}

/* 支付方式选择 - 改为水平布局 */
.selection-grid:not(.platform-grid):not(.amount-grid) .selection-item {
  flex-direction: row;
  padding: 6px;
}

.selection-grid:not(.platform-grid):not(.amount-grid) .selection-item .item-content {
  flex-direction: row !important;
  gap: 6px;
  align-items: center;
  flex: 1;
  display: flex;
}

.selection-grid:not(.platform-grid):not(.amount-grid) .selection-item .item-icon-container {
  width: 20px;
  height: 20px;
  margin-bottom: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-grid:not(.platform-grid):not(.amount-grid) .selection-item .item-name {
  font-size: 12px;
  text-align: left;
  flex: 1;
  margin: 0;
}

/* 平台选择 - 居中布局 */
.platform-grid .item-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

/* 金额选择 - 水平布局 */
.amount-grid .item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.item-icon-container {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.item-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.check-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  animation: checkIn 0.3s ease;
}

.check-icon::before {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  border-bottom: 16px solid #ff9500;
  border-left: 16px solid transparent;
  border-radius: 0 0 4px 0;
}

.check-icon .van-icon {
  position: absolute;
  bottom: 0px;
  right: 0px;
  font-size: 8px;
  color: #fff;
  z-index: 10;
}

@keyframes checkIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 平台内容区域 */
.platform-content {
  margin-top: 10px;
}

/* 充值规则区域 */
.rules-section {
  padding: 0 20px 20px;
}

.rules-content {
  background-color: #222;
  border-radius: 12px;
  padding: 15px;
}

/* 金额选择项特殊样式 */
.amount-item {
  padding: 8px 4px;
  min-height: auto;
}

.amount-item .item-content {
  flex-direction: column;
  text-align: center;
  gap: 2px;
}

.amount-value {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
}

.coin-value {
  font-size: 11px;
  color: #ccc;
}

.amount-item.active .coin-value {
  color: #fff;
}

.bonus-tag {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #ff4444;
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 8px;
  font-weight: bold;
}

/* 手动输入金额区域 */
.custom-amount-section {
  margin-top: 12px;
  margin-bottom: 16px;
}

.custom-amount-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #222;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 0 12px;
  transition: all 0.3s ease;
}

.custom-amount-input-wrapper:focus-within {
  border-color: #ff9500;
  background-color: #2a2a2a;
}

.custom-amount-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 15px;
  padding: 12px 0;
  font-weight: 500;
}

.custom-amount-input::placeholder {
  color: #666;
}

.custom-amount-unit {
  color: #999;
  font-size: 14px;
  margin-left: 8px;
}

.custom-coin-display {
  margin-top: 8px;
  font-size: 12px;
  color: #ff9500;
  text-align: center;
}

/* 转账信息 */
.transfer-info {
  background-color: rgba(255, 149, 0, 0.08);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 149, 0, 0.2);
  margin-top: 12px;
}

.transfer-header {
  margin-bottom: 8px;
}

.transfer-title {
  font-size: 14px;
  font-weight: 600;
  color: #ff9500;
}

.account-card {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
}

.account-type {
  font-size: 12px;
  color: #ccc;
  margin-bottom: 6px;
}

.account-number-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-number {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 8px 10px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  color: #fff;
  word-break: break-all;
  line-height: 1.3;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.copy-btn {
  background-color: rgba(255, 255, 255, 0.15);
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.copy-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.copy-btn:active {
  transform: scale(0.95);
}

.transfer-note {
  font-size: 11px;
  color: #999;
  text-align: center;
  line-height: 1.3;
}

/* 不支持的支付方式 */
.unsupported-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
}

.message-text {
  font-size: 16px;
  color: #999;
}

/* 子渠道 */
.sub-channels {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sub-channel-item {
  border: 1px solid #444;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.channel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background-color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.channel-header:hover {
  background-color: #444;
}

.channel-header.active {
  background-color: #ff9500;
}

.channel-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.channel-amounts {
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.02);
}

/* 确认充值按钮 - 悬浮底部 */
.confirm-section-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  background: linear-gradient(
    to top,
    rgba(17, 17, 17, 0.95) 0%,
    rgba(17, 17, 17, 0.9) 70%,
    transparent 100%
  );
  backdrop-filter: blur(10px);
  z-index: 100;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 在大屏幕上与app容器宽度保持一致 */
@media screen and (min-width: 768px) {
  .confirm-section-fixed {
    width: var(--app-mobile-width);
    max-width: 100%;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
}

.confirm-button {
  width: 100%;
  background: linear-gradient(135deg, #ff9500 0%, #ff7700 100%);
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.confirm-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 149, 0, 0.4);
}

.confirm-button:disabled {
  background: #444;
  color: #999;
  cursor: not-allowed;
  box-shadow: none;
}

/* 广告推荐区域 */
.ads-section {
  display: none;
  padding: 0 20px 20px;
}

.ads-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.ad-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.ad-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 149, 0, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
}

.ad-item:active {
  transform: translateY(0);
}

.ad-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-icon img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.ad-name {
  font-size: 11px;
  color: #fff;
  text-align: center;
  font-weight: 500;
  line-height: 1.2;
}

/* 协议文本 */
.agreement-section {
  padding: 0 20px 20px;
  text-align: center;
}

.agreement-text {
  font-size: 12px;
  color: #999;
}

.agreement-link {
  color: #ff9500;
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .selection-grid:not(.platform-grid):not(.amount-grid) {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 375px) {
  .payment-methods {
    grid-template-columns: repeat(2, 1fr);
  }

  .amount-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .diamond-balance {
    padding: 10px 15px;
  }

  .balance-content {
    gap: 6px;
  }

  .diamond-icon-img {
    width: 24px;
    height: 24px;
  }

  .balance-info {
    gap: 4px;
  }

  .balance-label {
    font-size: 11px;
  }

  .balance-amount {
    font-size: 16px;
  }

  .account-number {
    font-size: 10px;
    padding: 6px 8px;
  }

  .copy-btn {
    width: 24px;
    height: 24px;
  }

  .transfer-note {
    font-size: 10px;
  }

  .confirm-section-fixed {
    padding: 10px 15px;
  }

  .confirm-button {
    padding: 14px;
    font-size: 15px;
  }

  .custom-amount-input {
    font-size: 14px;
    padding: 10px 0;
  }

  .amount-value {
    font-size: 12px;
  }

  .coin-value {
    font-size: 10px;
  }
}

/* 平台选择区域样式 */
.platform-selection {
  margin-bottom: 0px;
}

.platform-tip {
  font-size: 12px;
  color: #0b971c;
  margin-left: 10px;
  font-weight: normal;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 15px;
  max-height: 260px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

/* 自定义滚动条样式 */
.platform-grid::-webkit-scrollbar {
  width: 6px;
}

.platform-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.platform-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 149, 0, 0.5);
  border-radius: 3px;
}

.platform-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 149, 0, 0.7);
}

.platform-card {
  position: relative;
  background: #222;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 8px 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.platform-card:hover {
  background-color: #333;
}

.platform-card.active {
  background: rgba(255, 149, 0, 0.1);
  border: 1px solid #ff9500;
}

.platform-card-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: auto;
  height: auto;
}

.platform-name {
  color: #fff;
  font-size: 13px;
  text-align: center;
  line-height: 1.4;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
}

/* 重复的check-icon样式已在上面定义，这里移除重复 */
.platform-modal {
  background-color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fff;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-tip {
  color: #0b971c;
  font-size: 12px;
  line-height: 1.4;
  flex: 1;
  margin-right: 16px;
}

.close-icon {
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.modal-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background-color: #f8f8f8;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.platform-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.platform-item:hover {
  background-color: #f8f8f8;
}

.platform-item:last-child {
  border-bottom: none;
}

.platform-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.platform-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
}

.platform-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.platform-name {
  color: #fff;
  font-size: 11px;
  font-weight: 500;
}

.platform-tip {
  color: #b3b3b3;
  font-size: 12px;
}

/* 🔥 订单成功弹窗样式 */
.order-success-popup {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.order-success-modal {
  width: 320px;
  background: #2a2a2a;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.success-header {
  background: #333;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #444;
}

.success-title {
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.order-details {
  padding: 24px 20px;
  text-align: center;
}

.order-number {
  margin-bottom: 20px;
}

.order-label {
  color: #ff6b6b;
  font-size: 16px;
  font-weight: 500;
}

.payment-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-size: 14px;
}

.status-text {
  color: #fff;
}

.countdown {
  color: #ff9500;
  font-weight: 500;
}

.status-color {
  color: #fff;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  border-top: 1px solid #444;
}

.cancel-btn,
.continue-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-btn {
  border-right: 1px solid #444;
  color: #999;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.continue-btn {
  color: #ff9500;
  font-weight: 500;
}

.continue-btn:hover {
  background: rgba(255, 149, 0, 0.1);
}

.cancel-btn:active,
.continue-btn:active {
  opacity: 0.8;
}

/* 支付结果弹窗样式 */
.payment-result-popup {
  background: transparent;
}

.payment-result-modal {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border-radius: 16px;
  padding: 32px 24px 24px;
  min-width: 300px;
  max-width: 90vw;
}

.result-header {
  text-align: center;
  margin-bottom: 24px;
}

.result-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  background: rgba(82, 196, 26, 0.1);
}

.failure-icon {
  background: rgba(255, 77, 79, 0.1);
}

.result-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.result-content {
  text-align: center;
  margin-bottom: 24px;
}

.result-message {
  font-size: 14px;
  color: #999;
  margin: 0;
  line-height: 1.6;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.result-btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.primary-btn {
  background: linear-gradient(135deg, #ff9500 0%, #ff7700 100%);
  color: #fff;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
}

.primary-btn:active {
  transform: translateY(0);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.secondary-btn:active {
  opacity: 0.8;
}

/* 充值温馨提醒弹窗样式 */
.reminder-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
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

.reminder-dialog {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 149, 0, 0.3);
  animation: slideUp 0.3s ease;
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

.reminder-header {
  padding: 24px 20px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 149, 0, 0.2);
}

.reminder-icon {
  margin-bottom: 12px;
}

.reminder-title {
  font-size: 20px;
  font-weight: bold;
  color: #ff9500;
  margin: 0;
}

.reminder-content {
  padding: 20px;
}

.reminder-text p {
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.reminder-text p:last-child {
  margin-bottom: 0;
}

.highlight-text {
  color: #ff9500;
  font-size: 15px;
  font-weight: 500;
  background: rgba(255, 149, 0, 0.1);
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #ff9500;
}

.normal-text {
  color: #ccc;
  font-size: 14px;
}

.emphasis {
  color: #ff9500;
  font-weight: bold;
}

.reminder-footer {
  padding: 16px 20px 20px;
  display: flex;
  gap: 12px;
}

.reminder-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reminder-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.reminder-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.reminder-btn.primary {
  background: linear-gradient(90deg, #ff9500, #ff6d00);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
}

.reminder-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 149, 0, 0.4);
}

.reminder-btn:active {
  transform: translateY(0);
}

/* 移动端适配 */
@media (max-width: 480px) {
  .reminder-dialog {
    max-width: none;
    margin: 0 10px;
  }

  .reminder-title {
    font-size: 18px;
  }

  .highlight-text {
    font-size: 14px;
  }

  .normal-text {
    font-size: 13px;
  }

  .reminder-btn {
    font-size: 14px;
    padding: 10px 16px;
  }
}
</style>
