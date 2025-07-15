<script setup lang="ts">
// 个人中心页面逻辑
import { ref, onMounted, computed } from 'vue';
import html2canvas from 'html2canvas';
import { showToast } from 'vant';
import { useRouter } from 'vue-router';
import { userLogout, getUserInfo, isLoggedIn, fetchAds } from '@/api/fetch-api';
import { BASE_URL } from '@/utils/config';

const router = useRouter();

// 控制账户凭证弹窗显示
const showCredential = ref(false);
const userId = ref('');
const isLoggingOut = ref(false);

// 用户信息
const userInfo = ref<any>(null);

// 广告数据
const profileAds = ref<any[]>([]);
const isAdLoading = ref(false);
const hasAdError = ref(false);

// 处理头像URL
const avatarUrl = computed(() => {
  if (!userInfo.value || !userInfo.value.user_portrait) {
    return new URL('@/assets/img/img-avatar-default.png', import.meta.url).href;
  }
  
  const portrait = userInfo.value.user_portrait;
  if (portrait.startsWith('http')) {
    return portrait;
  } else if (portrait.startsWith('/')) {
    return `${BASE_URL}${portrait}`;
  } else {
    return `${BASE_URL}/${portrait}`;
  }
});

// 处理广告图片URL
const processAdImageUrl = (imgPath: string): string => {
  if (!imgPath) return '';
  
  if (imgPath.startsWith('http')) {
    return imgPath;
  } else if (imgPath.startsWith('/')) {
    return `${BASE_URL}${imgPath}`;
  } else {
    return `${BASE_URL}/${imgPath}`;
  }
};

// 用户ID或昵称显示
const displayName = computed(() => {
  if (!userInfo.value) return '';
  
  // 优先显示昵称，没有则显示用户名
  return userInfo.value.user_nick_name || userInfo.value.user_name || '';
});

// 用户账号显示
const userAccount = computed(() => {
  if (!userInfo.value) return '';
  return userInfo.value.user_name || '';
});

// 会员组名称
const groupName = computed(() => {
  if (!userInfo.value) return '普通会员';
  return userInfo.value.group_name || '普通会员';
});

// 用户积分
const userPoints = computed(() => {
  if (!userInfo.value) return 0;
  return userInfo.value.user_points || 0;
});

// 获取广告数据
const fetchProfileAd = async () => {
  isAdLoading.value = true;
  hasAdError.value = false;
  
  try {
    // 请求个人中心页面的广告数据 (ad_pos: 5 表示个人中心页面)
    const result = await fetchAds({
      ad_pos: 5, // 个人中心页面位置
      ad_type: 2 // 广告类型
    });
    
    console.log('获取个人中心页面广告数据:', result);
    
    if (result && result.code === 1 && result.data && Array.isArray(result.data) && result.data.length > 0) {
      // 显示所有广告
      profileAds.value = result.data.map((ad: any) => ({
        id: ad.id || 0,
        imageUrl: processAdImageUrl(ad.ad_img || ''),
        title: ad.ad_name || '广告',
        link: ad.ad_url || ''
      }));
      
      console.log(`获取到${result.data.length}张广告，全部显示:`, profileAds.value);
    } else {
      console.log('没有获取到个人中心页面广告数据');
      profileAds.value = [];
    }
  } catch (error) {
    console.error('获取个人中心页面广告失败:', error);
    hasAdError.value = true;
    profileAds.value = [];
  } finally {
    isAdLoading.value = false;
  }
};

// 处理广告点击
const handleAdClick = (ad: any) => {
  if (!ad || !ad.link) return;
  
  console.log(`个人中心广告点击: ${ad.title}, 链接: ${ad.link}`);
  
  // 如果是内部链接，使用路由跳转
  if (ad.link.startsWith('/')) {
    router.push(ad.link);
  } else {
    // 外部链接，使用window.open打开
    window.open(ad.link, '_blank');
  }
};

// 处理广告图片加载错误
const handleAdImageError = (event: Event, ad: any) => {
  console.error(`个人中心广告图片加载失败: ${ad?.imageUrl}`);
  
  // 图片加载失败时从数组中移除该广告
  const index = profileAds.value.findIndex(item => item.id === ad.id);
  if (index > -1) {
    profileAds.value.splice(index, 1);
  }
};

// 自动显示账户凭证（2秒后）
onMounted(() => {
  // 检查登录状态
  if (!isLoggedIn()) {
    showToast({
      message: '请先登录',
      duration: 2000
    });
    router.push('/login');
  } else {
    const info = getUserInfo();
    if (info) {
      userInfo.value = info;
      userId.value = info.user_name;
      console.log('当前用户信息:', info);
    }
  }
  
  // 获取广告数据
  fetchProfileAd();
});

// 退出登录
const handleLogout = async () => {
  if (isLoggingOut.value) return;
  
  try {
    isLoggingOut.value = true;
    showToast({
      message: '正在退出登录...',
      duration: 2000
    });
    
    const success = await userLogout();
    
    if (success) {
      showToast({
        message: '已退出登录',
        duration: 2000
      });
      // 退出后返回登录页
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } else {
      showToast({
        message: '退出登录失败，请重试',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('退出登录错误:', error);
    showToast({
      message: '退出登录时发生错误',
      duration: 2000
    });
  } finally {
    isLoggingOut.value = false;
  }
};

// 保存凭证截图
const saveCredential = async () => {
  try {
    const element = document.getElementById('credential-card');
    if (element) {
      const canvas = await html2canvas(element);
      const link = document.createElement('a');
      link.download = '账户凭证.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast({
        message: '凭证已保存',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('保存凭证失败', error);
    showToast({
      message: '保存失败，请重试',
      duration: 2000
    });
  }
  showCredential.value = false;
};

// 关闭凭证弹窗
const closeCredential = () => {
  showCredential.value = false;
};

// 跳转到编辑资料页面
const goToEditProfile = () => {
  router.push('/edit-profile');
};

// 跳转到分享好友页面
const goToShareFriends = () => {
  router.push('/share-friends');
};

// 跳转到充值金币页面
const goToRecharge = () => {
  router.push('/recharge');
};

// 跳转到账户钱包页面
const goToWallet = () => {
  router.push('/wallet');
};

// 跳转到我的足迹页面
const goToFootprint = () => {
  router.push('/footprint');
};

// 跳转到系统设置页面
const goToSettings = () => {
  router.push('/settings');
};
</script>

<template>
  <div class="profile-page">
    <!-- u7528u6237u4fe1u606fu533au57df -->
    <div class="user-header" @click="goToEditProfile">
      <div class="user-info">
        <div class="avatar">
          <img :src="avatarUrl" :alt="displayName" />
        </div>
        <div class="user-details">
          <div class="username">
            {{ displayName }}
          </div>
          <div class="user-id">{{ userAccount }}</div>
        </div>
      </div>
      <div class="user-arrow">
        <van-icon name="arrow" size="20" color="#ccc" />
      </div>
    </div>

    <!-- VIPu5361u7247 -->
    <div class="vip-card" @click="goToShareFriends">
      <img src="@/assets/img/img-vip-enter.svg" alt="">
    </div>

    <!-- u8d26u6237u4fe1u606f -->
    <div class="account-info">
      <div class="info-item">
        <img src="@/assets/img/icon-zhje.svg" alt="">
        <span>积分余额</span>
        <span class="info-value">{{ userPoints }}</span>
      </div>
    </div>



    <!-- u5e38u7528u529fu80fdu533au57df -->
    <div class="common-section">
      <div class="common-grid">
        <div class="common-item" @click="goToWallet">
          <div class="common-icon">
            <img src="@/assets/img/icon-zhqb.svg" alt="" />
          </div>
          <div class="common-name">积分明细</div>
        </div>
        <div class="common-item" @click="goToFootprint">
          <div class="common-icon">
            <img src="@/assets/img/icon-wdzj.svg" alt="" />
          </div>
          <div class="common-name">我的足迹</div>
        </div>
        <!-- <div class="common-item" @click="goToSettings">
          <div class="common-icon">
            <img src="@/assets/img/icon-xtsz.svg" alt="" />
          </div>
          <div class="common-name">系统设置</div>
        </div> -->

        <!-- <div class="common-item">
          <div class="common-icon">
            <img src="@/assets/img/icon-zhzh.svg" alt="" />
          </div>
          <div class="common-name">找回账号</div>
        </div> -->
        <div class="common-item">
          <div class="common-icon">
            <img src="@/assets/img/icon-rgkf.svg" alt="" />
          </div>
          <div class="common-name">人工客服</div>
        </div>
        <!-- <div class="common-item" @click="goToEditProfile">
          <div class="common-icon">
            <img src="@/assets/img/icon-wsxx.svg" alt="" />
          </div>
          <div class="common-name">完善信息</div>
        </div> -->
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

    <!-- u5e95u90e8u5bfcu822a -->
    <div class="bottom-nav">
      <router-link to="/" class="nav-item">
        <img src="@/assets/img/icon-tabbar-home-normal.svg" alt="首页" class="tabbar-icon" />
        <div class="nav-text">首页</div>
      </router-link>
      <router-link to="/live" class="nav-item">
        <img src="@/assets/img/icon-tabbar-live-normal.svg" alt="直播" class="tabbar-icon" />
        <div class="nav-text">直播</div>
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
          <div class="credential-avatar">
            <img src="@/assets/img/icon-avatar-default.svg" alt="头像" />
          </div>
          <div class="credential-user-id">{{ userAccount }}</div>
          <div class="credential-qrcode">
            <!-- 使用临时二维码，实际项目中应该使用API生成 -->
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="qrcode-svg">
              <!-- 简化的二维码图形 -->
              <rect x="0" y="0" width="200" height="200" fill="white"/>
              <rect x="20" y="20" width="40" height="40" fill="black"/>
              <rect x="140" y="20" width="40" height="40" fill="black"/>
              <rect x="20" y="140" width="40" height="40" fill="black"/>
              <rect x="70" y="70" width="60" height="60" fill="black"/>
              <rect x="70" y="20" width="10" height="10" fill="black"/>
              <rect x="120" y="20" width="10" height="10" fill="black"/>
              <rect x="20" y="70" width="10" height="10" fill="black"/>
              <rect x="170" y="70" width="10" height="10" fill="black"/>
              <rect x="70" y="170" width="10" height="10" fill="black"/>
              <rect x="120" y="170" width="10" height="10" fill="black"/>
              <rect x="170" y="170" width="10" height="10" fill="black"/>
              <rect x="140" y="70" width="20" height="20" fill="black"/>
              <rect x="140" y="140" width="20" height="20" fill="black"/>
              <rect x="70" y="140" width="20" height="20" fill="black"/>
            </svg>
          </div>
          <div class="credential-website">永久网址: ym01.ch</div>
          <div class="credential-desc">我的一账户凭证</div>
          <div class="credential-tip">扫描账户凭证二维码可自动登录</div>
        </div>
        <div class="credential-button" @click="saveCredential">
          保存
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      
    }
  }
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
  padding: 20px 15px;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
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
}

.username {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.user-id {
  color: #999;
  font-size: 14px;
}

/* VIPu5361u7247 */
.vip-card {
  text-align: center;
  line-height: 1;
  padding: 16px;  
}
.vip-card img {
  width: 100%;
  object-fit: cover;
}

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
  margin: 0 15px 15px;
  padding: 15px;
  background-color: #222;
  border-radius: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  color: #ccc;
  font-size: 14px;
}

.info-value {
  margin-left: 5px;
  color: #fff;
  font-weight: bold;
  flex: 1;
  text-align: right;
}

.info-item img {
  width: 20px;
  height: 20px;
  margin-right: 8px;
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
  background-color: #222;
  margin: 0 15px 15px;
  border-radius: 10px;
  padding: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.common-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.common-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.common-icon {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #333;
  border-radius: 50%;
}

.common-icon img {
  width: 24px;
  height: 24px;
}

.common-name {
  font-size: 12px;
  color: #ccc;
  text-align: center;
}

/* 退出登录前的广告位样式 */
.profile-ads-container {
  margin: 0 15px 15px;
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
  padding: 12px 0;
  margin: 0 15px 15px;
  border-radius: 10px;
  font-size: 14px;
}

/* u5e95u90e8u5bfcu822a */
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

.nav-item.active,
.nav-item.router-link-active {
  color: #ff9500;
}

.nav-text {
  font-size: 12px;
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
  width: 85%;
  max-width: 320px;
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

.credential-website {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.credential-desc {
  color: #999;
  margin-bottom: 10px;
}

.credential-tip {
  color: #999;
  font-size: 14px;
}

.credential-button {
  background-color: #ff9500;
  color: #fff;
  padding: 12px 0;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}
</style> 