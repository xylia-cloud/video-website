<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import HeaderNav from '@/components/HeaderNav.vue';
import { getUserInfo, isLoggedIn } from '@/api/fetch-api';
import QRCode from 'qrcode';

const router = useRouter();

// 用户信息
const userInfo = ref<any>(null);
// 二维码数据URL
const qrCodeDataUrl = ref<string>('');
// 是否显示链接文本
const showLinkText = ref<boolean>(false);

// 获取当前域名
const getCurrentDomain = () => {
  // 在开发环境下使用localhost，生产环境使用实际域名
  const protocol = window.location.protocol;
  const host = window.location.host;
  
  console.log('当前协议:', protocol);
  console.log('当前主机:', host);
  console.log('完整域名:', `${protocol}//${host}`);
  
  return `${protocol}//${host}`;
};

// 获取用户信息
const fetchUserInfo = () => {
  if (!isLoggedIn()) {
    showToast({
      message: '请先登录',
      duration: 2000,
      position: 'top',
      className: 'custom-toast-info',
      icon: 'info'
    });
    router.push('/login');
    return;
  }
  
  const info = getUserInfo();
  if (info) {
    userInfo.value = info;
  }
};

// 生成邀请链接
const inviteLink = computed(() => {
  const currentDomain = getCurrentDomain();
  
  if (!userInfo.value || !userInfo.value.rec_code) {
    const link = `${currentDomain}/#/`;
    console.log('生成的基础主页链接:', link);
    return link;
  }
  
  const link = `${currentDomain}/#/?invite=${userInfo.value.rec_code}`;
  console.log('生成的邀请链接:', link);
  console.log('邀请码:', userInfo.value.rec_code);
  return link;
});

// 清理后的邀请链接（用于显示和复制）
const cleanInviteLink = computed(() => {
  const link = inviteLink.value.trim();
  console.log('原始邀请链接:', link);
  
  // 移除开头的特殊字符（如果有的话）
  const cleaned = link.replace(/^[@#]+/, '');
  console.log('清理后的邀请链接:', cleaned);
  
  return cleaned;
});

// 生成二维码
const generateQRCode = async (text: string) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    qrCodeDataUrl.value = dataUrl;
  } catch (error) {
    console.error('生成二维码失败:', error);
    showToast({
      message: '生成二维码失败',
      duration: 3000
    });
  }
};

// 监听邀请链接变化，重新生成二维码
watch(cleanInviteLink, (newLink) => {
  if (newLink) {
    generateQRCode(newLink);
  }
}, { immediate: true });

// 返回上一页
const goBack = () => {
  router.back();
};

// 复制链接
const copyLink = () => {
  const link = cleanInviteLink.value;
  
  console.log('要复制的链接:', link);
  
  // 优先使用传统的复制方法，更兼容
      try {
        const textArea = document.createElement('textarea');
        textArea.value = link;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
    textArea.focus();
        textArea.select();
    
    const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
    
    if (successful) {
        showToast({
          message: '邀请链接已复制',
          duration: 3000,
          position: 'top',
          className: 'custom-toast-success',
          icon: 'success'
        });
      console.log('复制成功的链接:', link);
    } else {
      throw new Error('execCommand failed');
    }
      } catch (err) {
    console.error('传统复制方法失败，尝试clipboard API:', err);
    
    // 如果传统方法失败，再尝试clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => {
          showToast({
            message: '邀请链接已复制',
            duration: 3000,
            position: 'top',
            className: 'custom-toast-success',
            icon: 'success'
          });
          console.log('clipboard API复制成功的链接:', link);
        })
        .catch((clipboardErr) => {
          console.error('clipboard API也失败:', clipboardErr);
          showToast({
            message: '复制失败，请手动复制链接',
            duration: 3000,
            position: 'top',
            className: 'custom-toast-error',
            icon: 'cross'
          });
          showLinkText.value = true; // 显示链接让用户手动复制
          console.log('邀请链接:', link);
        });
    } else {
      showToast({
        message: '复制失败，请手动复制链接',
        duration: 3000,
        position: 'top',
        className: 'custom-toast-error',
        icon: 'cross'
      });
      showLinkText.value = true; // 显示链接让用户手动复制
      console.log('邀请链接:', link);
    }
  }
};

// 保存二维码
const saveQRCode = () => {
  if (!qrCodeDataUrl.value) {
    showToast({
      message: '二维码还未生成',
      duration: 2000,
      position: 'top',
      className: 'custom-toast-error',
      icon: 'cross'
    });
    return;
  }
  
  try {
    const link = document.createElement('a');
    link.download = '邀请二维码.png';
    link.href = qrCodeDataUrl.value;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      message: '二维码已保存',
      duration: 2000,
      position: 'top',
      className: 'custom-toast-success',
      icon: 'success'
    });
  } catch (error) {
    console.error('保存二维码失败:', error);
    showToast({
      message: '保存失败，请重试',
      duration: 2000,
      position: 'top',
      className: 'custom-toast-error',
      icon: 'cross'
    });
  }
};

// 选中链接文本
const selectLinkText = (event: Event) => {
  const target = event.target as HTMLElement;
  if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection?.removeAllRanges();
    selection?.addRange(range);
    showToast({
      message: '链接已选中，请使用Ctrl+C复制',
      duration: 2000,
      position: 'top',
      className: 'custom-toast-info',
      icon: 'info'
    });
  }
};

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo();
});
</script>

<template>
  <div class="share-page">
    <!-- 顶部导航 -->
    <HeaderNav title="分享好友" />
    
    <div class="page-content">
      <!-- 二维码区域 -->
      <div class="qrcode-section">

        
        <div class="qrcode-wrapper">
        <div class="qrcode-container">
          <img 
            v-if="qrCodeDataUrl" 
            :src="qrCodeDataUrl" 
            alt="分享二维码" 
            class="qrcode-image" 
          />
          <div v-else class="qrcode-loading">
            <div class="loading-text">生成二维码中...</div>
          </div>
        </div>
        </div>
        
        <div class="qrcode-tip">扫描二维码邀请好友</div>

        <div class="button-group">
          <button class="action-button copy-button" @click="copyLink">
            复制链接
          </button>
          <button class="action-button save-button" @click="saveQRCode" v-if="qrCodeDataUrl">
            保存二维码
          </button>
        </div>
        
        <!-- 链接显示区域 -->
        <div v-if="showLinkText" class="link-display">
          <div class="link-label">邀请链接（请手动复制）：</div>
          <div class="link-text" @click="selectLinkText">{{ cleanInviteLink }}</div>
          <div class="link-tips">好友访问链接后，系统会自动保存您的邀请码</div>
        </div>
      </div>

      <!-- 任务区域 -->
      <!-- <div class="task-section">
        <div class="section-title">做任务看视频</div>
        
        <div class="task-item">
          <div class="task-icon">
            <img src="@/assets/img/icon-gift.svg" alt="任务" />
          </div>
          <div class="task-info">
            <div class="task-name">累计邀请1位好友(0/1)</div>
            <div class="task-reward">奖励视频+1个</div>
          </div>
          <div class="task-status">
            <span>未完成</span>
          </div>
        </div>
        
        <div class="task-item">
          <div class="task-icon">
            <img src="@/assets/img/icon-gift.svg" alt="任务" />
          </div>
          <div class="task-info">
            <div class="task-name">累计邀请5位好友(0/5)</div>
            <div class="task-reward">奖励视频+1个</div>
          </div>
          <div class="task-status">
            <span>未完成</span>
          </div>
        </div>
        
        <div class="task-item">
          <div class="task-icon">
            <img src="@/assets/img/icon-gift.svg" alt="任务" />
          </div>
          <div class="task-info">
            <div class="task-name">累计邀请13位好友(0/13)</div>
            <div class="task-reward">奖励视频+1个</div>
          </div>
          <div class="task-status">
            <span>未完成</span>
          </div>
        </div>
        
        <div class="task-item">
          <div class="task-icon">
            <img src="@/assets/img/icon-gift.svg" alt="任务" />
          </div>
          <div class="task-info">
            <div class="task-name">累计邀请20位好友(0/20)</div>
            <div class="task-reward">奖励视频+1个</div>
          </div>
          <div class="task-status">
            <span>未完成</span>
          </div>
        </div>
        
        <div class="task-item">
          <div class="task-icon">
            <img src="@/assets/img/icon-gift.svg" alt="任务" />
          </div>
          <div class="task-info">
            <div class="task-name">累计邀请59位好友(0/59)</div>
            <div class="task-reward">奖励视频+1个</div>
          </div>
          <div class="task-status">
            <span>未完成</span>
          </div>
        </div>
      </div> -->
    </div>
  </div>
</template>

<style scoped>
.share-page {
  background-image: url('@/assets/img/bg-share.webp');
  background-size: 100% auto;
  background-position: top center;
  background-repeat: no-repeat;
  background-color: #111;
  color: #fff;
  min-height: 100vh;
  position: relative;
}

/* 添加半透明遮罩层，确保内容可读 */
.share-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 0;
}

.page-content {
  padding-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.qrcode-section {
  width: 100%;
  max-width: 400px;
  padding: 260px 20px 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.share-title {
  text-align: center;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-text {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(45deg, #FF9500, #FF5722);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle-text {
  font-size: 14px;
  color: #999;
}

.qrcode-wrapper {
  background: linear-gradient(145deg, #1a1a1a, #222);
  padding: 16px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin-bottom: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  border: 2px solid transparent;
  background-image: 
    linear-gradient(145deg, #1a1a1a, #222),
    linear-gradient(to right, #5D370C 0%, #F2E49C 50%, #5D370C 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.qrcode-container {
  width: 200px;
  height: 200px;
  background-color: #fff;
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
}

.qrcode-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qrcode-tip {
  color: #999;
  font-size: 14px;
  text-align: center;
}

.button-group {
  display: flex;
  gap: 15px;
  width: 100%;
  padding: 0 20px;
  margin-top:16px;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 0;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-icon {
  font-style: normal;
  font-size: 18px;
}

.copy-button {
  background: linear-gradient(135deg, #FF9500, #FF5722);
  color: #fff;
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
}

.save-button {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.action-button:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.action-button:active {
  transform: translateY(0);
}

.qrcode-loading {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  font-size: 14px;
  color: #666;
}

@media (max-width: 320px) {
  .button-group {
    flex-direction: column;
  }
  
  .qrcode-container {
    width: 180px;
    height: 180px;
  }
  
  .title-text {
    font-size: 20px;
  }
}

.task-section {
  background-color: #222;
  margin: 0 15px;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  position: relative;
  padding-left: 12px;
}

.section-title:before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #FF9500, #FF5722);
  border-radius: 2px;
}

.task-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  background-color: #333;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
  border: 1px solid #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: #555;
}

.task-icon {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 149, 0, 0.1);
  border-radius: 50%;
  padding: 6px;
}

.task-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.task-info {
  flex: 1;
  margin-left: 12px;
}

.task-name {
  font-size: 14px;
  margin-bottom: 5px;
  font-weight: 500;
}

.task-reward {
  font-size: 12px;
  color: #FF9500;
  opacity: 0.8;
}

.task-status {
  background-color: #FF9500;
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(255, 149, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  text-align: center;
  background-image: linear-gradient(135deg, #FF9500, #FF5722);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.task-status:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(255, 149, 0, 0.4);
}

.link-display {
  margin-top: 15px;
  padding: 15px;
  background-color: #222;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid #333;
}

.link-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #ccc;
}

.link-text {
  font-size: 13px;
  color: #FF9500;
  cursor: pointer;
  padding: 8px;
  background-color: #333;
  border-radius: 4px;
  border: 1px dashed #FF9500;
  word-break: break-all;
  user-select: all;
  transition: all 0.3s ease;
}

.link-text:hover {
  background-color: #444;
  border-color: #FFB84D;
}

.link-tips {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
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
  background-color: #4CAF50;
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
  background-color: #2196F3;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style> 