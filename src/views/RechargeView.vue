<script setup lang="ts">
// 充值页面逻辑
import { ref, onMounted, computed } from 'vue';
import { showToast, showDialog } from 'vant';
import { useRouter } from 'vue-router';
import { fetchPayChannels, fetchChargeRules, createChargeOrder, getUserInfo, fetchUserDatas, setUserInfo } from '@/api/fetch-api';

// 接口类型定义
interface PaymentChannel {
  id: string;
  name: string;
  status: string;
  type: string;
  payid: string;
  selected: boolean;
}

interface MoneyItem {
  id: string;
  name: string;
  coin: string;
  coin_ios: string;
  money: string;
  product_id: string;
  give: string;
  list_order: string;
  addtime: string;
  coin_paypal: string;
}

interface PaymentSubChannel {
  id: string;
  name: string;
  paycode?: string;
  type?: string;
  status?: string;
  moneylist?: MoneyItem[];
  payid?: string;
  paytypeid?: string;
  bankare?: string;
  bankno?: string;
}

interface ChargeRulesResponse {
  ret: number;
  data: {
    code: number;
    msg: string;
    info: {
      moneylist: MoneyItem[];
      list: PaymentSubChannel | PaymentSubChannel[];
    };
  };
  msg: string;
}

const router = useRouter();

// 修复返回按钮
const goBack = () => {
  router.back();
};

// 处理广告点击
const handleAdClick = (ad: { id: number; name: string; icon: string; link: string }) => {
  console.log(`点击广告: ${ad.name}, 跳转到: ${ad.link}`);

  // 如果是内部链接，使用路由跳转
  if (ad.link.startsWith('/')) {
    router.push(ad.link);
  } else {
    // 外部链接，使用window.open打开
    window.open(ad.link, '_blank');
  }
};

// 钻石余额
const diamondBalance = ref(0);

// 广告列表数据
const adsList = ref([
  {
    id: 1,
    name: '快帆加速VPN',
    icon: new URL('@/assets/img/icon-link-01.png', import.meta.url).href,
    link: 'https://www.kuaifan.co/'
  },
  {
    id: 2,
    name: '穿梭加速VPN',
    icon: new URL('@/assets/img/icon-link-02.png', import.meta.url).href,
    link: 'https://www.transocks.com.cn/'
  },
  {
    id: 3,
    name: 'imToken',
    icon: new URL('@/assets/img/icon-link-03.png', import.meta.url).href,
    link: 'https://token.im/download'
  },
  {
    id: 4,
    name: 'TOKEN POCKET',
    icon: new URL('@/assets/img/icon-link-04.png', import.meta.url).href,
    link: 'https://www.tokenpocket.pro/zh/download/app'
  },
  {
    id: 5,
    name: 'TronLink',
    icon: new URL('@/assets/img/icon-link-05.png', import.meta.url).href,
    link: 'https://www.tronlink.org/'
  },
  {
    id: 6,
    name: 'Bitpie',
    icon: new URL('@/assets/img/icon-link-06.png', import.meta.url).href,
    link: 'https://bitpie.com/'
  },
  {
    id: 7,
    name: 'wnbit',
    icon: new URL('@/assets/img/icon-link-07.png', import.meta.url).href,
    link: 'https://ownbit.io/en/download/'
  },
  {
    id: 8,
    name: 'Trust Wallet',
    icon: new URL('@/assets/img/icon-link-08.png', import.meta.url).href,
    link: 'https://trustwallet.com/zh_CN/'
  }
]);

// 支付渠道数据
const paymentChannels = ref<PaymentChannel[]>([]);
const isLoadingChannels = ref(false);

// 当前选中的支付方式
const selectedPaymentMethod = ref('');

// 充值金额
const rechargeAmount = ref('');

// 当前充值规则数据
const chargeRules = ref<ChargeRulesResponse | null>(null);
const isLoadingRules = ref(false);

// 选中的金额项
const selectedMoneyItem = ref<MoneyItem | null>(null);

// 选中的子渠道
const selectedSubChannel = ref<PaymentSubChannel | null>(null);

// 转账账号（仅虚拟币显示）
const transferAccount = ref('');

// 创建订单加载状态
const isCreatingOrder = ref(false);

// 计算渠道ID到类型的映射
const channelTypeMap: Record<string, number> = {
  '2': 2, // 虚拟币
  '3': 3, // 银行卡
  '4': 4, // 微信
  '5': 5, // 支付宝
};

// 获取支付渠道数据
const fetchPaymentChannels = async () => {
  isLoadingChannels.value = true;
  try {
    const result = await fetchPayChannels();
    if (result.ret === 200 && result.data && result.data.info && result.data.info.list) {
      paymentChannels.value = result.data.info.list.map((item: { id: string; name: string; status: string; type: string; payid: string }) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        type: item.type,
        payid: item.payid,
        selected: false
      }));

      // 默认选中第一个可用的支付方式
      if (paymentChannels.value.length > 0) {
        await selectPaymentMethod(paymentChannels.value[0].id);
      }

      console.log('支付渠道数据:', paymentChannels.value);
    } else {
      console.error('获取支付渠道失败:', result);
      showToast({
        message: '获取支付渠道失败',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('获取支付渠道错误:', error);
    showToast({
      message: '网络错误，请重试',
      duration: 2000
    });
  } finally {
    isLoadingChannels.value = false;
  }
};

// 获取充值规则
const fetchRules = async (channelId: string) => {
  const qudaoid = channelTypeMap[channelId];
  if (!qudaoid) {
    console.error('未知的渠道类型:', channelId);
    return;
  }

  isLoadingRules.value = true;
  try {
    const result = await fetchChargeRules(qudaoid);
    chargeRules.value = result;

    // 重置选择状态
    selectedMoneyItem.value = null;
    selectedSubChannel.value = null;
    rechargeAmount.value = '';

    // 处理不同类型的返回数据
    if (result?.ret === 200 && result?.data?.info) {
      const info = result.data.info;

      // 如果是虚拟币（类型2），设置转账账号
      if (qudaoid === 2 && !Array.isArray(info.list)) {
        transferAccount.value = info.list.bankno || '';
      }

      console.log('充值规则数据:', result);
    }
  } catch (error) {
    console.error('获取充值规则错误:', error);
    showToast({
      message: '获取充值规则失败',
      duration: 2000
    });
  } finally {
    isLoadingRules.value = false;
  }
};

// 选择支付方式
const selectPaymentMethod = async (methodId: string) => {
  paymentChannels.value.forEach(method => {
    method.selected = method.id === methodId;
  });
  selectedPaymentMethod.value = methodId;

  // 重置选择状态
  selectedSubChannel.value = null;
  selectedMoneyItem.value = null;
  rechargeAmount.value = '';

  // 获取该渠道的充值规则
  await fetchRules(methodId);
};

// 获取支付方式图标
const getPaymentIcon = (type: string) => {
  switch (type) {
    case '2': // 虚拟币
      return new URL('@/assets/img/icon-coin.png', import.meta.url).href;
    case '3': // 银行卡
      return new URL('@/assets/img/icon-bankcard-orange.svg', import.meta.url).href;
    case '4': // 微信
      return new URL('@/assets/img/icon-chongzhi.svg', import.meta.url).href;
    case '5': // 支付宝
      return new URL('@/assets/img/icon-chongzhi-orange.svg', import.meta.url).href;
    default:
      return new URL('@/assets/img/icon-bankcard-orange.svg', import.meta.url).href;
  }
};

// 选择平台
const selectPlatform = (platform: PaymentSubChannel | Record<string, unknown>) => {
  selectedSubChannel.value = platform as PaymentSubChannel;

  // 重置金额选择
  selectedMoneyItem.value = null;
  rechargeAmount.value = '';
};

// 选择金额
const selectAmount = (item: MoneyItem) => {
  selectedMoneyItem.value = item;
  rechargeAmount.value = item.money;
};

// 复制转账账号
const copyTransferAccount = async () => {
  try {
    await navigator.clipboard.writeText(transferAccount.value);
    showToast({
      message: '✅ 钱包地址已复制到剪贴板',
      duration: 2000
    });
  } catch (error) {
    console.error('复制失败:', error);
    // 降级处理：尝试使用旧版API
    try {
      const textArea = document.createElement('textarea');
      textArea.value = transferAccount.value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast({
        message: '✅ 钱包地址已复制到剪贴板',
        duration: 2000
      });
    } catch {
      showToast({
        message: '复制失败，请手动复制地址',
        duration: 2000
      });
    }
  }
};

// 创建充值订单并处理支付
const createOrder = async () => {
  if (isCreatingOrder.value) {
    return; // 防止重复点击
  }

  if (!selectedMoneyItem.value) {
    showToast({
      message: '请选择充值金额',
      duration: 2000
    });
    return;
  }

  if (!selectedPaymentMethod.value) {
    showToast({
      message: '请选择支付方式',
      duration: 2000
    });
    return;
  }

  const selectedChannel = paymentChannels.value.find(c => c.id === selectedPaymentMethod.value);
  if (!selectedChannel) {
    showToast({
      message: '支付方式无效',
      duration: 2000
    });
    return;
  }

  isCreatingOrder.value = true;

  try {
    // 准备订单参数
    const qudaoid = channelTypeMap[selectedPaymentMethod.value];
    let paytypecode = '';

    // 根据不同渠道类型获取paytypecode
    if (qudaoid === 2) {
      // 虚拟币类型，使用默认值或从accountInfo获取
      paytypecode = chargeRulesDisplay.value?.accountInfo?.bankare || 'USDT-TRC20';
    } else if (selectedSubChannel.value) {
      // 微信/支付宝等有子渠道的，使用子渠道的paycode
      paytypecode = selectedSubChannel.value.paycode || '';
    }

    if (!paytypecode) {
      showToast({
        message: '支付通道信息缺失',
        duration: 2000
      });
      return;
    }

    const orderParams = {
      qudaoid: qudaoid,
      money: selectedMoneyItem.value.money,
      paytypecode: paytypecode,
      moneylistid: parseInt(selectedMoneyItem.value.id)
    };

    console.log('创建订单参数:', orderParams);

    // 显示加载提示
    showToast({
      message: '正在创建订单...',
      duration: 1000
    });

    // 调用创建订单接口
    const result = await createChargeOrder(orderParams);

    if (result && result.ret === 200 && result.data && result.data.code === 0) {
      const payUrl = result.data.info?.purl;

      if (payUrl) {
        // 有支付链接，跳转到支付页面
        showDialog({
          title: '跳转支付',
          message: '订单创建成功，即将跳转到支付页面',
          confirmButtonText: '立即支付',
          cancelButtonText: '取消',
          confirmButtonColor: '#ff9500'
        }).then(() => {
          // 跳转到支付页面
          window.open(payUrl, '_blank');
        });
      } else {
        // 虚拟币等需要手动转账的
        showDialog({
          title: '订单创建成功',
          message: `订单创建成功，请按照页面提示完成${qudaoid === 2 ? '转账' : '支付'}`,
          confirmButtonText: '确定',
          confirmButtonColor: '#ff9500'
        });
      }
    } else {
      // 订单创建失败
      showToast({
        message: result?.data?.msg || result?.msg || '订单创建失败，请重试',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('创建订单错误:', error);
    showToast({
      message: '网络错误，请重试',
      duration: 2000
    });
  } finally {
    isCreatingOrder.value = false;
  }
};

// 确认充值
const confirmRecharge = () => {
  const selectedChannel = paymentChannels.value.find(c => c.id === selectedPaymentMethod.value);
  const channelType = selectedChannel?.type;

  if (channelType === '2') {
    // 虚拟币，先显示转账提示，然后创建订单
    showDialog({
      title: '确认转账',
      message: `确认充值 ${rechargeAmount.value} 元？\n\n请在创建订单后按照提示完成转账`,
      confirmButtonText: '确认充值',
      cancelButtonText: '取消',
      confirmButtonColor: '#ff9500'
    }).then(() => {
      createOrder();
    });
  } else {
    // 其他支付方式，直接创建订单
    createOrder();
  }
};

// 计算充值规则显示数据
const chargeRulesDisplay = computed(() => {
  if (!chargeRules.value?.data?.info) return null;

  const info = chargeRules.value.data.info;
  const qudaoid = channelTypeMap[selectedPaymentMethod.value];

  if (qudaoid === 2) {
    // 虚拟币类型，直接显示moneylist
    return {
      type: 'simple',
      moneyList: info.moneylist || [],
      accountInfo: Array.isArray(info.list) ? null : info.list
    };
  } else if (qudaoid === 3) {
    // 银行卡类型，显示不支持信息
    return {
      type: 'unsupported',
      moneyList: info.moneylist || [],
      message: Array.isArray(info.list) ? '暂不支持' : info.list?.name || '暂不支持'
    };
  } else {
    // 微信/支付宝类型，显示子渠道
    return {
      type: 'channels',
      moneyList: info.moneylist || [],
      channels: Array.isArray(info.list) ? info.list : []
    };
  }
});

// 计算是否显示金额选择
const showAmountSelection = computed(() => {
  if (!chargeRulesDisplay.value) return false;

  if (chargeRulesDisplay.value.type === 'simple') {
    // 虚拟币类型，直接显示金额选择
    return true;
  } else if (chargeRulesDisplay.value.type === 'channels') {
    // 微信/支付宝类型，需要先选择平台
    return selectedSubChannel.value !== null;
  }

  return false;
});

// 计算可用的充值金额
const availableAmounts = computed(() => {
  if (!chargeRulesDisplay.value) return [];

  if (chargeRulesDisplay.value.type === 'simple') {
    // 虚拟币类型，返回默认金额列表
    return chargeRulesDisplay.value.moneyList;
  } else if (chargeRulesDisplay.value.type === 'channels' && selectedSubChannel.value) {
    // 微信/支付宝类型，返回选中平台的金额列表
    return selectedSubChannel.value.moneylist || [];
  }

  return [];
});

// 获取用户钻石余额
const loadUserBalance = () => {
  const userInfo = getUserInfo();
  if (userInfo && userInfo.coin !== undefined) {
    diamondBalance.value = userInfo.coin;
  }
};

// 刷新用户余额（从服务器获取最新数据）
const refreshUserBalance = async () => {
  try {
    const result = await fetchUserDatas({});
    if (result && result.code === 1 && result.data) {
      // 更新本地用户信息
      const currentUserInfo = getUserInfo();
      if (currentUserInfo && result.data.coin !== undefined) {
        const updatedUserInfo = {
          ...currentUserInfo,
          coin: result.data.coin
        };
        setUserInfo(updatedUserInfo);
        diamondBalance.value = result.data.coin;
      }
    }
  } catch (error) {
    console.error('刷新用户余额失败:', error);
  }
};

onMounted(async () => {
  // 获取用户钻石余额
  loadUserBalance();
  // 刷新最新余额
  await refreshUserBalance();
  // 获取支付渠道数据
  fetchPaymentChannels();
});
</script>

<template>
  <div class="recharge-page">
    <!-- 固定顶部区域 -->
    <div class="fixed-top-section">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <div class="nav-bar">
          <div class="back-button" @click="goBack">
            <van-icon name="arrow-left" size="20" color="#fff" />
          </div>
          <div class="page-title">充值中心</div>
          <div class="right-placeholder"></div>
        </div>
      </div>

      <!-- 钻石余额区域 -->
      <div class="diamond-balance">
        <div class="balance-content">
          <img src="@/assets/img/icon-diamond.png" alt="钻石" class="diamond-icon-img">
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
          <div v-for="method in paymentChannels" :key="method.id" class="selection-item"
            :class="{ active: method.selected }" @click="selectPaymentMethod(method.id)">
            <div class="item-content">
              <div class="item-icon-container">
                <img :src="getPaymentIcon(method.type)" alt="支付方式图标" class="item-icon" />
              </div>
              <div class="item-name">{{ method.name }}</div>
            </div>
            <div v-if="method.selected" class="check-icon">
              <van-icon name="success" size="16" color="#fff" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="scrollable-content">
      <!-- 第二步：选择充值平台 -->
      <div v-if="selectedPaymentMethod" class="selection-section">
        <h3 class="section-title">
          <span class="step-number">2</span>
          选择充值平台
        </h3>

        <!-- 加载中 -->
        <div v-if="isLoadingRules" class="loading-rules">
          <van-loading type="spinner" color="#ff9500" />
          <span>加载充值平台中...</span>
        </div>

        <!-- 充值平台内容 -->
        <div v-else-if="chargeRulesDisplay" class="platform-content">

          <!-- 虚拟币类型 - 只有一个平台 -->
          <template v-if="chargeRulesDisplay.type === 'simple'">
            <div class="selection-grid platform-grid">
              <div class="selection-item active">
                <div class="item-content">
                  <div class="item-name">{{ chargeRulesDisplay.accountInfo?.name || '虚拟币充值' }}</div>
                </div>
                <div class="check-icon">
                  <van-icon name="success" size="16" color="#fff" />
                </div>
              </div>
            </div>

            <!-- 转账信息 -->
            <div v-if="chargeRulesDisplay.accountInfo && transferAccount" class="transfer-info">
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

              <div class="transfer-note">
                复制地址到钱包转账，完成后点击确认按钮
              </div>
            </div>
          </template>

          <!-- 银行卡类型（不支持） -->
          <template v-else-if="chargeRulesDisplay.type === 'unsupported'">
            <div class="unsupported-message">
              <van-icon name="info-o" size="24" color="#999" />
              <div class="message-text">{{ chargeRulesDisplay.message }}</div>
            </div>
          </template>

          <!-- 微信/支付宝类型 - 多个平台 -->
          <template v-else-if="chargeRulesDisplay.type === 'channels'">
            <div class="selection-grid platform-grid">
              <div v-for="channel in chargeRulesDisplay.channels" :key="channel.id" class="selection-item"
                :class="{ active: selectedSubChannel?.id === channel.id }" @click="selectPlatform(channel)">
                <div class="item-content">
                  <div class="item-name">{{ channel.name }}</div>
                </div>
                <div v-if="selectedSubChannel?.id === channel.id" class="check-icon">
                  <van-icon name="success" size="16" color="#fff" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 第三步：选择充值金额 -->
      <div v-if="showAmountSelection" class="selection-section">
        <h3 class="section-title">
          <span class="step-number">3</span>
          选择充值金额
        </h3>

        <div class="selection-grid amount-grid">
          <div v-for="item in availableAmounts" :key="item.id" class="selection-item amount-item"
            :class="{ active: selectedMoneyItem?.id === item.id }" @click="selectAmount(item)">
            <div class="item-content">
              <div class="amount-value">{{ item.money }}元</div>
              <div class="coin-value">{{ item.coin }}钻石</div>
              <div v-if="item.give && item.give !== '0'" class="bonus-tag">
                送{{ item.give }}
              </div>
            </div>
            <div v-if="selectedMoneyItem?.id === item.id" class="check-icon">
              <van-icon name="success" size="16" color="#fff" />
            </div>
          </div>
        </div>
      </div>



      <!-- 确认充值按钮 - 悬浮底部 -->
      <div class="confirm-section-fixed">
        <button class="confirm-button" :disabled="!selectedMoneyItem || isCreatingOrder" @click="confirmRecharge">
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
}

/* 可滚动内容区域 */
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

/* 页面标题 */
.page-header {
  background: #222;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 15px;
}

.back-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.right-placeholder {
  width: 44px;
}

/* 钻石余额区域 */
.diamond-balance {
  padding: 12px 20px;
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
  padding: 20px;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.selection-grid.platform-grid,
.selection-grid.amount-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.selection-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #222;
  border-radius: 12px;
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
  border: 2px solid #ff9500;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
}

/* 支付方式选择 - 保持原来的垂直布局 */
.selection-grid:not(.platform-grid):not(.amount-grid) .selection-item {
  flex-direction: column;
  padding: 15px 8px;
}

.selection-grid:not(.platform-grid):not(.amount-grid) .item-content {
  flex-direction: column;
  gap: 6px;
}

.selection-grid:not(.platform-grid):not(.amount-grid) .item-icon-container {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-bottom: 0;
}

.selection-grid:not(.platform-grid):not(.amount-grid) .item-name {
  font-size: 12px;
  text-align: center;
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
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
}

.selection-item.active .item-icon-container {
  background-color: rgba(255, 149, 0, 0.3);
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
  width: 16px;
  height: 16px;
  animation: checkIn 0.3s ease;
}

.check-icon::before {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  border-bottom: 24px solid #ff9500;
  border-left: 24px solid transparent;
  border-radius: 0 0 6px 0;
}

.check-icon .van-icon {
  position: absolute;
  bottom: 0px;
  right: 0px;
  font-size: 12px;
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
.amount-item .item-content {
  flex-direction: column;
  text-align: center;
  gap: 4px;
}

.amount-value {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.coin-value {
  font-size: 12px;
  color: #ccc;
}

.amount-item.active .coin-value {
  color: #fff;
}

.bonus-tag {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #ff4444;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
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
  space-y: 10px;
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
  background: linear-gradient(to top, rgba(17, 17, 17, 0.95) 0%, rgba(17, 17, 17, 0.9) 70%, transparent 100%);
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
}
</style>