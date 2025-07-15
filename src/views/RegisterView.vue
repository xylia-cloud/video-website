<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Icon as VanIcon, showDialog, showLoadingToast, closeToast } from 'vant';
import { registerUser, setUserInfo, type UserInfo } from '@/api/fetch-api';
import bgImage from '@/assets/img/img-live.jpg';

// 接收路由参数
const props = defineProps({
  invite: {
    type: String,
    default: ''
  },
  redirect: {
    type: String,
    default: '/'
  }
});

const router = useRouter();
const route = useRoute();
const userName = ref('');
const password = ref('');
const confirmPassword = ref('');
const inviteCode = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 注册表单提交
const handleRegister = async () => {
  if (!userName.value) {
    showDialog({
      title: '提示',
      message: '请输入用户名',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500'
    });
    return;
  }
  
  if (!password.value) {
    showDialog({
      title: '提示',
      message: '请输入密码',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500'
    });
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    showDialog({
      title: '提示',
      message: '两次输入的密码不一致',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500'
    });
    return;
  }
  
  // 构建注册参数
  interface RegisterParams {
    user_name: string;
    user_pwd: string;
    user_pwd2: string;
    invite_code: string;
    [key: string]: string | undefined;
  }
  
  const params: RegisterParams = {
    user_name: userName.value,
    user_pwd: password.value,
    user_pwd2: confirmPassword.value,
    invite_code: inviteCode.value
  };
  
  try {
    showLoadingToast({
      message: '正在注册...',
      forbidClick: true,
    });
    
    console.log('注册参数：', params);
    // 调用注册API
    const result = await registerUser(params);
    
    closeToast();
    
    if (result && result.code === 1 && result.data) {
      // 注册成功，直接使用返回的TOKEN数据进行自动登录
      const userInfo: UserInfo = {
        user_id: result.data.user_id,
        user_name: result.data.user_name,
        token: result.data.token,
        user_portrait: result.data.user_portrait,
        user_points: result.data.user_points,
        group_id: result.data.group_id,
        group_name: result.data.group_name,
        user_nick_name: result.data.user_nick_name,
        rec_code: result.data.rec_code
      };
      
      // 保存用户信息到本地存储
      setUserInfo(userInfo);
      
      // 获取重定向路径，如果有的话
      const redirectPath = props.redirect || route.query.redirect as string || '/';
      
      // 显示成功提示并跳转
      showDialog({
        title: '注册成功',
        message: `注册成功！${result.data.user_points ? `获得${result.data.user_points}积分` : ''}`,
        confirmButtonText: '确定',
        confirmButtonColor: '#ff9500'
      }).then(() => {
        // 跳转到重定向页面或首页
        console.log('注册成功，跳转到:', redirectPath);
        router.push(redirectPath);
      });
    } else if (result && result.code === 200) {
      // 兼容旧的返回码
      showDialog({
        title: '注册成功',
        message: result.msg || '注册成功，请手动登录',
        confirmButtonText: '去登录',
        confirmButtonColor: '#ff9500'
      }).then(() => {
        router.push('/login');
      });
    } else {
      showDialog({
        title: '注册失败',
        message: result?.msg || '注册失败，请稍后重试',
        confirmButtonText: '确定',
        confirmButtonColor: '#ff9500'
      });
    }
  } catch (error) {
    closeToast();
    console.error('注册失败:', error);
    showDialog({
      title: '注册失败',
      message: '网络连接失败，请检查网络连接或稍后重试',
      confirmButtonText: '确定',
      confirmButtonColor: '#ff9500'
    });
  }
};

// 切换密码显示
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 切换确认密码显示
const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// 返回登录页
const goToLogin = () => {
  router.push('/login');
};

onMounted(() => {
  console.log('注册页面加载，路由参数:', route.query);
  
  // 检查是否有邀请码
  let hasInviteCode = false;
  
  // 1. 优先使用props中的邀请码
  if (props.invite) {
    inviteCode.value = props.invite;
    console.log('从props获取邀请码:', props.invite);
    hasInviteCode = true;
  } 
  // 2. 其次从URL参数中获取邀请码
  else {
    const inviteParam = route.query.invite as string;
    if (inviteParam) {
      inviteCode.value = inviteParam;
      console.log('从URL查询参数获取邀请码:', inviteParam);
      hasInviteCode = true;
    }
  }
  
  // 3. 如果上面方法都没获取到，但URL的根路径有invite参数(处理特殊情况)
  if (!hasInviteCode) {
    const urlParams = new URLSearchParams(window.location.search);
    const rootInviteCode = urlParams.get('invite');
    
    if (rootInviteCode) {
      inviteCode.value = rootInviteCode;
      console.log('从根路径获取邀请码:', rootInviteCode);
      hasInviteCode = true;
      
      // 可以选择清理URL，但这不是必须的
      // 这里不执行清理，因为可能会影响用户体验
    }
  }
  
  // 4. 如果以上方法都没获取到，从localStorage中获取
  if (!hasInviteCode) {
    const storedInviteCode = localStorage.getItem('inviteCode');
    if (storedInviteCode) {
      inviteCode.value = storedInviteCode;
      console.log('从localStorage获取邀请码:', storedInviteCode);
      hasInviteCode = true;
    }
  }
  
  // 打印最终邀请码状态
  console.log('注册页面最终邀请码:', inviteCode.value || '无邀请码');
});
</script>

<template>
  <div class="register-page">
    <!-- 图片背景 -->
    <div class="background-container">
      <div class="background-overlay"></div>
    </div>
    
    <!-- 应用图标和名称 -->
    <div class="app-logo">
      <div class="logo-container">
        <div class="logo-bg">
          <img src="@/assets/img/logo.png" alt="logo" class="logo-image">
        </div>
      </div>
    </div>
    
    <!-- 注册表单 -->
    <div class="register-form">
      <div class="input-group">
        <input 
          type="text" 
          v-model="userName" 
          placeholder="请输入用户名"
          class="form-input"
        />
      </div>
      
      <div class="input-group">
        <input 
          :type="showPassword ? 'text' : 'password'" 
          v-model="password" 
          placeholder="请输入密码"
          class="form-input"
        />
        <div class="password-toggle" @click="togglePasswordVisibility">
          <van-icon :name="showPassword ? 'eye-o' : 'closed-eye'" size="24" color="#999" />
        </div>
      </div>
      
      <div class="input-group">
        <input 
          :type="showConfirmPassword ? 'text' : 'password'" 
          v-model="confirmPassword" 
          placeholder="请确认密码"
          class="form-input"
        />
        <div class="password-toggle" @click="toggleConfirmPasswordVisibility">
          <van-icon :name="showConfirmPassword ? 'eye-o' : 'closed-eye'" size="24" color="#999" />
        </div>
      </div>
      
      <div class="input-group">
        <input 
          type="text" 
          v-model="inviteCode" 
          placeholder="请输入邀请码（选填）"
          class="form-input"
        />
        <div class="input-hint">邀请码可以帮助您获得额外奖励</div>
      </div>
      
      <button class="register-button" @click="handleRegister">注册</button>
    </div>
    
    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <div class="action-item" @click="goToLogin">
        <span class="action-text">返回登录</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  width: 100%;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  justify-content: center;
}

/* 背景样式 */
.background-container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
  /* background-image: url('@/assets/img/img-live.jpg'); */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.background-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2;
}

/* 应用logo样式 */
.app-logo {
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-bg {
  width: 343px;
  background-color: #000;
  border-radius: 20px;
}
.logo-bg img{
  width: 100%;
  border-radius: 20px;
}



/* 注册表单样式 - 深色模式 */
.register-form {
  width: 85%;
  z-index: 3;
  margin-top: 0;
  margin-bottom: 24px;
}

.input-group {
  position: relative;
  margin-bottom: 15px;
}

.form-input {
  width: 100%;
  height: 50px;
  background-color: rgba(40, 40, 40, 0.8);
  color: #fff;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 0 15px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #aaa;
}

.input-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  padding-left: 5px;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.register-button {
  width: 100%;
  height: 50px;
  background-color: #ff9500;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
}

/* 底部操作按钮 */
.bottom-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 15%;
  margin-top: 0;
  margin-bottom: 0;
  z-index: 3;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-text {
  color: #ff9500;
  font-size: 16px;
  margin-top: 5px;
}
</style> 