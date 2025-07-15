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
        <div class="item-value">{{ userId }}</div>
      </div>

      <!-- 昵称 -->
      <div class="form-item">
        <div class="item-label">昵称：</div>
        <div class="item-input">
          <input type="text" v-model="nickname" placeholder="请输入昵称" />
        </div>
      </div>

      <!-- 登录密码 -->
      <div class="form-item" @click="showChangePwdPopup">
        <div class="item-label">登录密码：</div>
        <div class="item-value">修改登录密码</div>
        <div class="item-arrow">
          <van-icon name="arrow" size="20" color="#ccc" />
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-button" @click="saveProfile">
      保存
    </div>

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
          <div class="input-row">
            <input v-model="oldPwd" type="password" class="pwd-input" placeholder="请输入原密码" />
          </div>
          <div class="input-row">
            <input v-model="newPwd" type="password" class="pwd-input" placeholder="请输入新密码" />
          </div>
          <div class="input-row">
            <input v-model="repeatPwd" type="password" class="pwd-input" placeholder="请重复新密码" />
          </div>
          <div class="confirm-button" @click="changePassword">确定</div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, onActivated, onDeactivated, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { updateUserInfo, getUserInfo, isLoggedIn, updateUserPortrait } from '@/api/fetch-api';
import { BASE_URL } from '@/utils/config';

const router = useRouter();
const nickname = ref('');
const avatarUrl = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const userId = ref('');
const loading = ref(false);

// 密码修改相关
const pwdPopupVisible = ref(false);
const oldPwd = ref('');
const newPwd = ref('');
const repeatPwd = ref('');

// 返回上一页
const goBack = () => {
  router.back();
};

// 将文件转换为base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result) {
        // 移除数据URL前缀，例如 "data:image/jpeg;base64,"
        const base64String = reader.result.toString();
        const base64 = base64String.substring(base64String.indexOf(',') + 1);
        console.log('文件已转换为base64, 长度:', base64.length);
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// 上传头像 - base64方式
const uploadAvatarBase64 = async (file: File) => {
  try {
    loading.value = true;
    showLoadingToast({
      message: '上传中...',
      forbidClick: true,
    });
    
    console.log('开始上传头像, 文件大小:', file.size, '文件类型:', file.type);
    
    // 检查文件类型和大小
    if (!file.type.startsWith('image/')) {
      showToast({
        message: '请选择图片文件',
        duration: 2000
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB限制
      showToast({
        message: '图片大小不能超过5MB',
        duration: 2000
      });
      return;
    }
    
    // 转换文件为base64
    const base64Data = await fileToBase64(file);
    
    // 使用base64方式上传
    const result = await updateUserPortrait({
      imgdata: base64Data
    });
    
    console.log('头像上传结果:', result);
    
    if (result && result.code === 1) {
      // 显示预览
      avatarUrl.value = URL.createObjectURL(file);
      
      showToast({
        message: '头像上传成功',
        duration: 2000
      });
    } else {
      showToast({
        message: result?.msg || '头像上传失败，请重试',
        duration: 2000
      });
    }
  } catch (error: any) {
    console.error('头像上传失败:', error);
    showToast({
      message: error.message || '上传失败，请稍后再试',
      duration: 2000
    });
  } finally {
    loading.value = false;
    closeToast();
  }
};

// 上传头像 - 文件方式
const uploadAvatarFile = async (file: File) => {
  try {
    loading.value = true;
    showLoadingToast({
      message: '上传中...',
      forbidClick: true,
    });
    
    console.log('开始上传头像(文件方式), 文件大小:', file.size, '文件类型:', file.type);
    
    // 检查文件类型和大小
    if (!file.type.startsWith('image/')) {
      showToast({
        message: '请选择图片文件',
        duration: 2000
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB限制
      showToast({
        message: '图片大小不能超过5MB',
        duration: 2000
      });
      return;
    }
    
    // 使用文件方式上传
    const result = await updateUserPortrait({
      file: file
    });
    
    console.log('头像上传结果:', result);
    
    if (result && result.code === 1) {
      // 显示预览
      avatarUrl.value = URL.createObjectURL(file);
      
      showToast({
        message: '头像上传成功',
        duration: 2000
      });
    } else {
      showToast({
        message: result?.msg || '头像上传失败，请重试',
        duration: 2000
      });
    }
  } catch (error: any) {
    console.error('头像上传失败:', error);
    showToast({
      message: error.message || '上传失败，请稍后再试',
      duration: 2000
    });
  } finally {
    loading.value = false;
    closeToast();
  }
};

// 处理头像变更
const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    
    // 尝试两种上传方式
    // 先尝试文件方式上传
    await uploadAvatarFile(file);
    
    // 如果需要尝试base64方式，可以取消下面的注释
    // 通常只需要使用一种方式
    // await uploadAvatarBase64(file);
  }
};

// 保存个人资料
const saveProfile = async () => {
  if (loading.value) return;
  
  try {
    loading.value = true;
    showLoadingToast({
      message: '保存中...',
      forbidClick: true,
    });
    
    // 调用API保存数据，即使只修改昵称，也传递密码字段（空值）
    const result = await updateUserInfo({
      user_nick_name: nickname.value,
      user_pwd: '', // 原密码，不修改密码时传空字符串
      user_pwd1: '', // 新密码，不修改密码时传空字符串
      user_pwd2: ''  // 确认密码，不修改密码时传空字符串
    });
    
    if (result && result.code === 1) {
      showToast({
        message: '保存成功',
        duration: 2000
      });
      setTimeout(() => {
        router.back();
      }, 1000);
    } else {
      showToast({
        message: result?.msg || '保存失败，请重试',
        duration: 2000
      });
    }
  } catch (error: any) {
    console.error('保存个人资料失败:', error);
    showToast({
      message: error.message || '保存失败，请稍后再试',
      duration: 2000
    });
  } finally {
    loading.value = false;
    closeToast();
  }
};

// 显示修改密码弹窗
const showChangePwdPopup = () => {
  pwdPopupVisible.value = true;
  oldPwd.value = '';
  newPwd.value = '';
  repeatPwd.value = '';
};

// 修改密码
const changePassword = async () => {
  if (loading.value) return;
  
  if (!oldPwd.value) {
    showToast({
      message: '请输入原密码',
      duration: 2000
    });
    return;
  }
  if (!newPwd.value) {
    showToast({
      message: '请输入新密码',
      duration: 2000
    });
    return;
  }
  if (newPwd.value !== repeatPwd.value) {
    showToast({
      message: '两次输入的新密码不一致',
      duration: 2000
    });
    return;
  }
  
  try {
    loading.value = true;
    showLoadingToast({
      message: '修改中...',
      forbidClick: true,
    });
    
    // 调用API修改密码
    const result = await updateUserInfo({
      user_pwd: oldPwd.value,
      user_pwd1: newPwd.value,
      user_pwd2: repeatPwd.value
    });
    
    if (result && result.code === 1) {
      showToast({
        message: '密码修改成功',
        duration: 2000
      });
      pwdPopupVisible.value = false;
    } else {
      showToast({
        message: result?.msg || '密码修改失败，请重试',
        duration: 2000
      });
    }
  } catch (error: any) {
    console.error('修改密码失败:', error);
    showToast({
      message: error.message || '修改失败，请稍后再试',
      duration: 2000
    });
  } finally {
    loading.value = false;
    closeToast();
  }
};

onMounted(() => {
  // 检查登录状态
  if (!isLoggedIn()) {
    showToast({
      message: '请先登录',
      duration: 2000
    });
    router.push('/login');
    return;
  }
  
  // 获取用户资料
  const userInfo = getUserInfo();
  if (userInfo) {
    userId.value = userInfo.user_name;
    nickname.value = userInfo.user_nick_name || userInfo.user_name || '';
    
    // 处理头像URL
    if (userInfo.user_portrait) {
      const portrait = userInfo.user_portrait;
      if (portrait.startsWith('http')) {
        avatarUrl.value = portrait;
      } else if (portrait.startsWith('/')) {
        avatarUrl.value = `${BASE_URL}${portrait}`;
      } else {
        avatarUrl.value = `${BASE_URL}/${portrait}`;
      }
    } else {
      avatarUrl.value = new URL('@/assets/img/img-avatar-default.png', import.meta.url).href;
    }
  } else {
    avatarUrl.value = new URL('@/assets/img/img-avatar-default.png', import.meta.url).href;
  }
  
  console.log('页面加载完成');
});

onActivated(() => {
  // 页面被激活
});

onDeactivated(() => {
  // 页面被停用
});

onBeforeUnmount(() => {
  // 组件销毁前
});
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

.back-button, .header-right {
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
</style> 