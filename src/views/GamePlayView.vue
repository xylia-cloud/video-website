<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon, showDialog } from 'vant'

const route = useRoute()
const router = useRouter()

// 从路由参数获取游戏URL
const gameUrl = ref((route.query.url as string) || '')
const returnPath = ref((route.query.returnPath as string) || '/game')

// 悬浮按钮位置 - 默认在左上角
const buttonPosition = ref({
  x: 20,
  y: 20,
})

// 拖拽状态
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, startX: 0, startY: 0 })
const buttonRef = ref<HTMLElement | null>(null)
const dragThreshold = 10 // 拖拽阈值，超过这个距离才认为是拖拽

// 开始拖拽
const startDrag = (e: MouseEvent | TouchEvent) => {
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  isDragging.value = true
  dragStart.value = {
    x: clientX - buttonPosition.value.x,
    y: clientY - buttonPosition.value.y,
    startX: clientX,
    startY: clientY,
  }
  e.preventDefault()
}

// 拖拽中
const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  // 计算移动距离
  const moveDistance = Math.sqrt(
    Math.pow(clientX - dragStart.value.startX, 2) + Math.pow(clientY - dragStart.value.startY, 2),
  )

  // 如果移动距离超过阈值，才更新位置
  if (moveDistance > dragThreshold) {
    let newX = clientX - dragStart.value.x
    let newY = clientY - dragStart.value.y

    // 限制在可视区域内
    const maxX = window.innerWidth - 60
    const maxY = window.innerHeight - 60
    const minX = 0
    const minY = 0

    newX = Math.max(minX, Math.min(maxX, newX))
    newY = Math.max(minY, Math.min(maxY, newY))

    buttonPosition.value = { x: newX, y: newY }
  }

  e.preventDefault()
}

// 结束拖拽
const endDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return

  let clientX: number
  let clientY: number

  if ('touches' in e && e.touches.length > 0) {
    // TouchEvent
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if ('changedTouches' in e && e.changedTouches.length > 0) {
    // TouchEvent (touchend)
    clientX = e.changedTouches[0].clientX
    clientY = e.changedTouches[0].clientY
  } else {
    // MouseEvent
    clientX = (e as MouseEvent).clientX
    clientY = (e as MouseEvent).clientY
  }

  // 计算移动距离
  const moveDistance = Math.sqrt(
    Math.pow(clientX - dragStart.value.startX, 2) + Math.pow(clientY - dragStart.value.startY, 2),
  )

  isDragging.value = false

  // 如果移动距离小于阈值，认为是点击，触发返回
  if (moveDistance <= dragThreshold) {
    handleBackClick()
  }
}

// 处理返回点击
const handleBackClick = () => {
  showDialog({
    title: '确认返回',
    message: '确定要返回游戏列表吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    confirmButtonColor: '#ff9500',
  })
    .then(() => {
      // 用户点击确定
      router.push(returnPath.value)
    })
    .catch(() => {
      // 用户点击取消，什么都不做
    })
}

// 监听窗口大小变化
const handleResize = () => {
  // 确保按钮在可视区域内，并保持在左上角区域
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60
  const minX = 0
  buttonPosition.value.x = Math.max(minX, Math.min(buttonPosition.value.x, maxX))
  // 如果按钮位置太靠右（超过屏幕一半），重置到左上角
  if (buttonPosition.value.x > window.innerWidth / 2) {
    buttonPosition.value.x = 20
  }
  // 如果按钮位置太靠下（超过屏幕一半），重置到顶部
  if (buttonPosition.value.y > window.innerHeight / 2) {
    buttonPosition.value.y = 20
  }
  buttonPosition.value.y = Math.min(buttonPosition.value.y, maxY)
}

onMounted(() => {
  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('touchmove', onDrag)
  window.addEventListener('resize', handleResize)

  if (!gameUrl.value) {
    console.error('游戏URL不存在')
    router.push('/game')
  }
})

onUnmounted(() => {
  // 移除事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('touchmove', onDrag)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="game-play-page">
    <!-- 游戏iframe -->
    <iframe
      v-if="gameUrl"
      :src="gameUrl"
      class="game-iframe"
      frameborder="0"
      allowfullscreen
    ></iframe>

    <!-- 可拖动的悬浮返回按钮 -->
    <div
      ref="buttonRef"
      class="floating-back-button"
      :class="{ dragging: isDragging }"
      :style="{
        left: `${buttonPosition.x}px`,
        top: `${buttonPosition.y}px`,
      }"
      @mousedown="startDrag"
      @touchstart="startDrag"
      @mouseup="endDrag"
      @touchend="endDrag"
    >
      <Icon name="arrow-left" size="20" color="#fff" />
    </div>
  </div>
</template>

<style scoped>
.game-play-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  overflow: hidden;
}

.game-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.floating-back-button {
  position: fixed;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #ff9500 0%, #ff7700 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.floating-back-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(255, 149, 0, 0.5);
}

.floating-back-button:active {
  transform: scale(0.95);
}

.floating-back-button.dragging {
  transition: none;
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 149, 0, 0.6);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .floating-back-button {
    width: 45px;
    height: 45px;
  }
}
</style>
