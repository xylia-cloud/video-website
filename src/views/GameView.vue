<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchAds } from '@/api/fetch-api';
import { BASE_URL } from '@/utils/config';
import { useRouter } from 'vue-router';

const router = useRouter();

// 广告数据接口
interface GameAd {
  id: number;
  imageUrl: string;
  title: string;
  link?: string;
}

// 广告数据
const gameAds = ref<GameAd[]>([]);
const isAdsLoading = ref(false);
const hasAdsError = ref(false);

// 获取游戏页面广告数据
const fetchGameAds = async () => {
  isAdsLoading.value = true;
  hasAdsError.value = false;
  
  try {
    // 请求游戏页面的广告数据 (ad_pos: 2 表示游戏页面)
    const result = await fetchAds({
      ad_pos: 6, // 游戏页面位置
      ad_type: 2 // 广告类型
    });
    
    console.log('获取游戏页面广告数据:', result);
    
    if (result && result.code === 1 && result.data && Array.isArray(result.data) && result.data.length > 0) {
      // 处理API返回的广告数据
      const apiAds = result.data.map((item: any) => {
        return {
          id: item.id || 0,
          imageUrl: processAdImageUrl(item.ad_img || ''),
          title: item.ad_name || '广告',
          link: item.ad_url || ''
        };
      });
      
      // 更新广告数据
      gameAds.value = apiAds;
      
      console.log('处理后的游戏广告数据:', gameAds.value);
    } else {
      console.log('没有获取到游戏页面广告数据');
      gameAds.value = [];
    }
  } catch (error) {
    console.error('获取游戏页面广告失败:', error);
    hasAdsError.value = true;
    gameAds.value = [];
  } finally {
    isAdsLoading.value = false;
  }
};

// 处理广告图片URL
const processAdImageUrl = (imgPath: string): string => {
  if (!imgPath) return '';
  
  let imageUrl = '';
  
  // 处理图片URL
  if (imgPath.startsWith('/')) {
    imageUrl = `${BASE_URL}${imgPath}`;
  } else if (imgPath.startsWith('http')) {
    imageUrl = imgPath;
  } else {
    imageUrl = `${BASE_URL}/${imgPath}`;
  }
  
  return imageUrl;
};

// 处理广告点击
const handleAdClick = (ad: GameAd) => {
  if (!ad.link) return;
  
  console.log(`游戏广告点击: ${ad.title}, 链接: ${ad.link}`);
  
  // 如果是内部链接，使用路由跳转
  if (ad.link.startsWith('/')) {
    router.push(ad.link);
  } else {
    // 外部链接，使用window.open打开
    window.open(ad.link, '_blank');
  }
};

// 处理广告图片加载错误
const handleAdImageError = (event: Event, ad: GameAd) => {
  console.error(`游戏广告图片加载失败: ${ad.title}, URL: ${ad.imageUrl}`);
  
  // 图片加载失败时从列表中移除该广告
  const index = gameAds.value.findIndex(item => item.id === ad.id);
  if (index > -1) {
    gameAds.value.splice(index, 1);
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchGameAds();
});
</script>

<template>
  <div class="game-page">
    <!-- 删除原有的头部积分显示区域 -->
    <div class="page-header">
      <!-- 通知栏注释保留 -->
      <!-- <div class="notice-bar">
        <van-icon name="volume-o" color="#fff" size="20" />
        <div class="notice-wrapper">
          <div class="notice-text marquee">恭喜用户*****在三分赛车中奖985元，恭喜用户*****在三分赛车中奖985元，恭喜用户*****在三分赛车中奖985元，</div>
        </div>
      </div> -->
    </div>

    <!-- u6e38u620fu5206u7c7bu4e0eu5185u5bb9 -->
    <div class="game-container">
      <!-- 原游戏侧边栏和内容，注释掉但保留代码 -->
      <!--
      <div class="game-sidebar">
        <div class="sidebar-item active">
          <div class="sidebar-icon">
            <img src="@/assets/img/icon-game-frequently.png" alt="常玩" />
          </div>
          <div class="sidebar-text">常玩</div>
        </div>
        <div class="sidebar-item">
          <div class="sidebar-icon">
            <img src="@/assets/img/icon-game-hot.png" alt="热门" />
          </div>
          <div class="sidebar-text">热门</div>
        </div>
        <div class="sidebar-item">
          <div class="sidebar-icon">
            <img src="@/assets/img/icon-game-caipiao.png" alt="彩票" />
          </div>
          <div class="sidebar-text">彩票</div>
        </div>
        <div class="sidebar-item">
          <div class="sidebar-icon">
            <img src="@/assets/img/icon-game-tiyu.png" alt="体育" />
          </div>
          <div class="sidebar-text">体育</div>
        </div>
        <div class="sidebar-item">
          <div class="sidebar-icon">
            <img src="@/assets/img/icon-game-zhenren.png" alt="真人" />
          </div>
          <div class="sidebar-text">真人</div>
        </div>
        <div class="sidebar-item">
          <div class="sidebar-icon">
            <img src="@/assets/img/icon-game-pg.png" alt="PG" />
          </div>
          <div class="sidebar-text">PG</div>
        </div>
      </div>
      
      <div class="game-content">
        <div class="category-header">
          <img src="@/assets/img/icon-game-title-before.svg" alt="" class="title-icon-before" />
          <div class="category-title">常玩</div>
          <img src="@/assets/img/icon-game-title-after.svg" alt="" class="title-icon-after" />
        </div>
        
        <div class="games-grid">
          <div class="game-item" v-for="i in 12" :key="i">
            <div class="game-image">
              <img src="@/assets/img/icon-game-tiyu.png" alt="麻将胡了" />
            </div>
            <div class="game-name">麻将胡了</div>
          </div>
        </div>
      </div>
      -->
      
      <!-- 新的通栏广告位 -->
      <div class="ad-container">
        <!-- 添加标题和免责声明 -->
        <div class="ad-section-header">
          <div class="section-title">
            <div class="title-icon">🏆</div>
            <div class="title-text">官方推荐</div>
          </div>
          <div class="disclaimer">
            <div class="disclaimer-icon">⚠️</div>
            <div class="disclaimer-text">视频素材来源于网络，除官方推荐外，视频内一切广告行为与本站无关，已有多名用户被骗，请谨慎甄别。</div>
          </div>
        </div>
        
        <!-- 原有内容，注释保留但不显示 -->
        <!--
        <div class="ad-header">
          <div class="ad-title">精选应用</div>
          <div class="ad-more">更多</div>
        </div>
        
        <div class="ad-list">
          <div class="ad-item" v-for="i in 5" :key="i">
            <div class="ad-image">
              <img :src="`https://picsum.photos/800/300?random=${i}`" :alt="`广告${i}`" />
            </div>
            <div class="ad-content">
              <div class="ad-name">{{ ['热门博彩平台', '体育竞猜APP', '棋牌游戏大厅', '线上真人娱乐', '彩票投注站'][i-1] }}</div>
              <div class="ad-desc">{{ ['独家优惠·送1888元', '首存送300%·提款秒到', '注册送88·首存100送100', '真人美女荷官·在线发牌', '安全可靠·返水3.0%'][i-1] }}</div>
              <div class="ad-btn">立即体验</div>
            </div>
          </div>
        </div>
        -->
        
        <!-- 纯通栏图片广告 -->
        <div class="fullwidth-ads">
          <!-- 加载状态 -->
          <div v-if="isAdsLoading" class="ads-loading">
            <van-loading type="spinner" color="#ff9500" />
            <div class="loading-text">加载广告中...</div>
          </div>
          
          <!-- 错误状态 -->
          <div v-else-if="hasAdsError" class="ads-error">
            <van-icon name="warning-o" size="24" color="#ff9500" />
            <div class="error-text">广告加载失败</div>
          </div>
          
          <!-- 广告列表 -->
          <div v-else-if="gameAds.length > 0" class="ad-banner" v-for="ad in gameAds" :key="ad.id" @click="handleAdClick(ad)">
            <img :src="ad.imageUrl" :alt="ad.title" @error="handleAdImageError($event, ad)" />
          </div>
          
          <!-- 无广告状态 -->
          <div v-else class="no-ads">
            <div class="no-ads-text">暂无广告内容</div>
          </div>
        </div>
      </div>
    </div>
    
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
      <router-link to="/game" class="nav-item active">
        <img src="@/assets/img/icon-tabbar-game-active.svg" alt="游戏" class="tabbar-icon" />
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
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

.game-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 50px;
  max-width: 480px;
  margin: 0 auto;
}

.page-header {
  padding: 10px 0 0 0;
}

/* u9876u90e8u901au77e5u680f */
.notice-bar {
  display: flex;
  align-items: center;
  background-color: #222;
  padding: 10px 15px;
  border-radius: 8px;
  margin: 10px 10px 10px 10px;
  flex-shrink: 0;
}

.notice-wrapper {
  flex: 1;
  overflow: hidden;
  margin-left: 10px;
}

.notice-text {
  font-size: 14px;
  color: #ccc;
}

.marquee {
  display: inline-block;
  white-space: nowrap;
  animation: marquee 15s linear infinite;
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* u6e38u620fu533au57df */
.game-container {
  background-color: #222;
  margin: 0 15px 15px;
  border-radius: 8px;
  overflow: hidden;
}

/* 通栏广告位样式 */
.ad-container {
  padding: 15px;
}

/* 广告区域标题和免责声明样式 */
.ad-section-header {
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.1), rgba(255, 85, 0, 0.05));
  border-radius: 12px;
  border: 1px solid rgba(255, 149, 0, 0.2);
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.title-icon {
  font-size: 20px;
  margin-right: 8px;
}

.title-text {
  font-size: 18px;
  font-weight: bold;
  color: #ff9500;
  background: linear-gradient(135deg, #ff9500, #ff5500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.disclaimer {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  background-color: rgba(255, 193, 7, 0.1);
  border-radius: 8px;
  border-left: 3px solid #ffc107;
}

.disclaimer-icon {
  font-size: 16px;
  margin-right: 8px;
  margin-top: 1px;
  flex-shrink: 0;
}

.disclaimer-text {
  font-size: 13px;
  color: #ffc107;
  line-height: 1.4;
  flex: 1;
}

.ad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.ad-title {
  font-size: 18px;
  font-weight: bold;
  color: #ff9500;
}

.ad-more {
  font-size: 14px;
  color: #999;
}

.ad-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ad-item {
  background-color: #2d2d2d;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.ad-image {
  width: 100%;
  height: 120px;
  overflow: hidden;
}

.ad-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ad-content {
  padding: 15px;
}

.ad-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.ad-desc {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 15px;
}

.ad-btn {
  display: inline-block;
  background: linear-gradient(135deg, #FF9500, #FF5500);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
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

/* 纯通栏图片广告样式 */
.fullwidth-ads {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px 0;
}

.ad-banner {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.ad-banner img {
  width: 100%;
  display: block;
}

/* 广告加载和错误状态样式 */
.ads-loading,
.ads-error,
.no-ads {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
}

.loading-text,
.error-text,
.no-ads-text {
  margin-top: 10px;
  font-size: 14px;
}

.ad-banner {
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.ad-banner:hover {
  opacity: 0.8;
}
</style> 