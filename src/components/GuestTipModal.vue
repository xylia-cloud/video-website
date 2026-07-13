<template>
  <div class="guest-tip-overlay" v-if="visible" @click.self="handleDismiss">
    <div class="guest-tip-container">
      <div class="guest-tip-header">
        <h2>完善个人信息</h2>
        <div class="guest-tip-close" @click="handleDismiss">
          <van-icon name="cross" size="20" color="#999" />
        </div>
      </div>
      <div class="guest-tip-content">
        <div class="guest-tip-icon">
          <van-icon name="user-o" size="60" color="#ff9500" />
        </div>
        <div class="guest-tip-title">您当前是游客身份</div>
        <div class="guest-tip-desc">完善个人信息后，可以享受更多功能和服务</div>
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
        <button
          class="guest-tip-btn guest-tip-btn-secondary"
          :disabled="isSwitchingAccount"
          @click="handleExistingAccount"
        >
          {{ isSwitchingAccount ? '正在退出...' : '已有账号' }}
        </button>
        <button class="guest-tip-btn guest-tip-btn-primary" @click="handleConfirm">立即完善</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userLogout } from '@/api/fetch-api'

const router = useRouter()

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'confirm'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const isSwitchingAccount = ref(false)

const handleDismiss = () => {
  emit('update:visible', false)
  emit('close')
}

const handleExistingAccount = async () => {
  if (isSwitchingAccount.value) return
  isSwitchingAccount.value = true

  try {
    await userLogout()
  } finally {
    emit('update:visible', false)
    emit('close')
    router.replace('/login')
    isSwitchingAccount.value = false
  }
}

const handleConfirm = () => {
  emit('update:visible', false)
  emit('confirm')
  router.push('/edit-profile')
}
</script>

<style scoped>
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
  max-width: 300px;
  background-color: #222;
  border-radius: 12px;
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
  padding: 14px;
  text-align: center;
  border-bottom: 1px solid #333;
}

.guest-tip-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: bold;
  color: #fff;
}

.guest-tip-close {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.guest-tip-content {
  padding: 20px 16px;
  text-align: center;
}

.guest-tip-icon {
  margin-bottom: 12px;
}

.guest-tip-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 6px;
}

.guest-tip-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
  line-height: 1.5;
}

.guest-pwd-tip-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background-color: rgba(255, 149, 0, 0.1);
  border-radius: 8px;
  font-size: 12px;
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
  font-size: 13px;
  color: #ccc;
  padding: 6px 0;
  border-bottom: 1px solid #333;
}

.guest-tip-features li:last-child {
  border-bottom: none;
}

.guest-tip-buttons {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
}

.guest-tip-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 8px;
  font-size: 14px;
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
</style>
