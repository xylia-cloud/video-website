<template>
  <div
    v-if="shouldShowButton"
    ref="buttonRef"
    class="customer-service-button"
    :style="buttonStyle"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
  >
    <img src="@/assets/img/kefu.png" alt="客服" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getUserInfo } from '@/api/fetch-api'
import { generateCustomerServiceUrl } from '@/utils/rsa'

const route = useRoute()
const buttonRef = ref<HTMLElement | null>(null)

// 按钮位置状态
const position = ref({
  x: 0,
  y: 0,
})

// 拖动状态
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const hasMoved = ref(false) // 标记是否发生了拖动

// 判断是否应该显示客服按钮
const shouldShowButton = computed(() => {
  // 在游戏播放页面隐藏客服按钮
  return route.path !== '/game-play'
})

// 计算按钮样式
const buttonStyle = computed(() => {
  if (position.value.x === 0 && position.value.y === 0) {
    // 初始位置使用CSS定位
    return {}
  }
  return {
    right: 'auto',
    bottom: 'auto',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
  }
})

// 初始化位置
onMounted(() => {
  // 从localStorage读取上次保存的位置
  const savedPosition = localStorage.getItem('customerServiceButtonPosition')
  if (savedPosition) {
    try {
      const parsed = JSON.parse(savedPosition)
      position.value = parsed
    } catch (e) {
      console.error('解析客服按钮位置失败:', e)
    }
  }
})

// 触摸开始
const handleTouchStart = (e: TouchEvent) => {
  isDragging.value = true
  hasMoved.value = false
  const touch = e.touches[0]
  
  if (position.value.x === 0 && position.value.y === 0 && buttonRef.value) {
    // 首次拖动，获取当前位置
    const rect = buttonRef.value.getBoundingClientRect()
    position.value = {
      x: rect.left,
      y: rect.top,
    }
  }
  
  dragStart.value = {
    x: touch.clientX - position.value.x,
    y: touch.clientY - position.value.y,
  }
  
  e.preventDefault()
}

// 触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  
  hasMoved.value = true
  const touch = e.touches[0]
  
  let newX = touch.clientX - dragStart.value.x
  let newY = touch.clientY - dragStart.value.y
  
  // 限制在屏幕范围内
  const buttonSize = buttonRef.value?.offsetWidth || 60
  const maxX = window.innerWidth - buttonSize
  const maxY = window.innerHeight - buttonSize
  
  newX = Math.max(0, Math.min(newX, maxX))
  newY = Math.max(0, Math.min(newY, maxY))
  
  position.value = { x: newX, y: newY }
  
  e.preventDefault()
}

// 触摸结束
const handleTouchEnd = () => {
  isDragging.value = false
  
  // 保存位置到localStorage
  localStorage.setItem('customerServiceButtonPosition', JSON.stringify(position.value))
}

// 鼠标拖动支持（PC端）
const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  hasMoved.value = false
  
  if (position.value.x === 0 && position.value.y === 0 && buttonRef.value) {
    const rect = buttonRef.value.getBoundingClientRect()
    position.value = {
      x: rect.left,
      y: rect.top,
    }
  }
  
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  e.preventDefault()
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  
  hasMoved.value = true
  
  let newX = e.clientX - dragStart.value.x
  let newY = e.clientY - dragStart.value.y
  
  const buttonSize = buttonRef.value?.offsetWidth || 60
  const maxX = window.innerWidth - buttonSize
  const maxY = window.innerHeight - buttonSize
  
  newX = Math.max(0, Math.min(newX, maxX))
  newY = Math.max(0, Math.min(newY, maxY))
  
  position.value = { x: newX, y: newY }
}

const handleMouseUp = () => {
  isDragging.value = false
  
  localStorage.setItem('customerServiceButtonPosition', JSON.stringify(position.value))
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

const handleClick = () => {
  // 如果刚刚拖动过，不触发点击事件
  if (hasMoved.value) {
    hasMoved.value = false
    return
  }
  
  try {
    // 获取当前用户信息
    const currentUserInfo = getUserInfo()

    // 兼容游客用户和正式用户的数据结构
    const userId = currentUserInfo?.user_id || currentUserInfo?.id

    if (!currentUserInfo || !userId) {
      showToast({
        message: '请先登录后再使用客服功能',
        duration: 2000,
      })
      return
    }

    showToast({
      message: '正在跳转客服...',
      duration: 1000,
    })

    // 生成加密的客服链接
    const customerServiceUrl = generateCustomerServiceUrl(userId)

    // 在新窗口中打开客服链接
    window.open(customerServiceUrl, '_blank')

    console.log('客服链接已生成并打开:', customerServiceUrl)
  } catch (error) {
    console.error('跳转客服失败:', error)
    showToast({
      message: '客服功能暂时不可用，请稍后重试',
      duration: 2000,
    })
  }
}
</script>

<style scoped>
.customer-service-button {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 70px;
  height: 70px;
  cursor: pointer;
  z-index: 9999;
  transition: transform 0.2s ease;
  touch-action: none;
  user-select: none;
}

.customer-service-button:hover {
  transform: scale(1.1);
}

.customer-service-button:active {
  transform: scale(0.95);
}

.customer-service-button img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .customer-service-button {
    width: 60px;
    height: 60px;
    right: 15px;
    bottom: 70px;
  }
}
</style>
