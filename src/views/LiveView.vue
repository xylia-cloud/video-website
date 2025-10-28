<script setup lang="ts">
// 活动页面逻辑
</script>

<template>
  <div class="live-page">
    <!-- 活动内容区域 -->
    <div class="live-content">
      <div class="coming-soon">
        <div class="coming-soon-text">敬请期待</div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <router-link to="/" class="nav-item">
        <img src="@/assets/img/icon-tabbar-home-normal.svg" alt="首页" class="tabbar-icon" />
        <div class="nav-text">首页</div>
      </router-link>
      <router-link to="/live" class="nav-item active">
        <img src="@/assets/img/icon-tabbar-live-active.svg" alt="活动" class="tabbar-icon" />
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
.live-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  padding-bottom: 50px;
  position: relative;
  max-width: 480px;
  margin: 0 auto;
}

.live-content {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 50px);
}

.coming-soon {
  text-align: center;
}

.coming-soon-text {
  font-size: 24px;
  color: #999;
  font-weight: 500;
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
  z-index: 30;
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
</style>
