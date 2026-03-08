<template>
  <div
    v-if="shouldShowButton"
    ref="buttonRef"
    class="customer-service-button"
    :style="buttonStyle"
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
  
  // 如果没有拖动，触发点击
  if (!hasMoved.value) {
    handleClick()
  }
  
  // 保存位置到localStorage
  if (hasMoved.value) {
    localStorage.setItem('customerServiceButtonPosition', JSON.stringify(position.value))
  }
  
  hasMoved.value = false
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
  
  // 如果没有拖动，触发点击
  if (!hasMoved.value) {
    handleClick()
  }
  
  // 保存位置到localStorage
  if (hasMoved.value) {
    localStorage.setItem('customerServiceButtonPosition', JSON.stringify(position.value))
  }
  
  hasMoved.value = false
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

const handleClick = async () => {
  console.log('客服按钮被点击')
  
  try {
    console.log('开始处理客服跳转')
    
    showToast({
      message: '正在跳转客服...',
      duration: 1000,
    })

    // 获取或生成浏览器指纹
    let browserId = localStorage.getItem('browserId')
    
    if (!browserId) {
      console.log('生成新的浏览器指纹')
      // 生成简单的浏览器指纹（基于navigator信息）
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform
      ].join('|')
      
      // 简单hash函数
      let hash = 0
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      browserId = Math.abs(hash).toString(36)
      localStorage.setItem('browserId', browserId)
      console.log('新浏览器指纹已生成:', browserId)
    } else {
      console.log('使用已存在的浏览器指纹:', browserId)
    }

    console.log('准备调用RSA接口，浏览器指纹:', browserId)

    // 调用接口获取RSA密钥 - 使用表单格式
    const formData = new URLSearchParams()
    formData.append('murmur', browserId)
    
    const response = await fetch('https://help.186web.cc/admin/RSAEncrypt/gtRsP', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    console.log('接口响应状态:', response.status)
    
    const result = await response.json()
    console.log('接口返回结果:', result)
    
    if (result && result.data) {
      const rsaPassWord = result.data
      const customerServiceUrl = `https://help186.xuhgki.cn/index/index/home?code=${rsaPassWord}`
      
      console.log('客服链接已生成:', customerServiceUrl)
      
      // 移动端兼容性更好的跳转方式
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // 移动端直接跳转
        console.log('检测到移动端，使用 location.href 跳转')
        window.location.href = customerServiceUrl
      } else {
        // PC端尝试新窗口打开
        console.log('检测到PC端，尝试新窗口打开')
        const newWindow = window.open(customerServiceUrl, '_blank')
        // 如果被拦截，则直接跳转
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.log('新窗口被拦截，改用 location.href 跳转')
          window.location.href = customerServiceUrl
        }
      }
    } else {
      console.error('接口返回数据格式错误:', result)
      throw new Error('获取客服密钥失败')
    }
  } catch (error) {
    console.error('跳转客服失败，详细错误:', error)
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
