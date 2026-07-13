<template>
  <div
    v-if="shouldShowMenu"
    ref="containerRef"
    class="floating-quick-menu"
    :style="containerStyle"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
  >
    <TransitionGroup name="quick-menu" tag="div" class="quick-menu-list">
      <template v-for="(item, index) in menuItems" :key="item.key">
        <div v-if="isExpanded" class="quick-menu-item" :style="{ '--menu-index': index }">
          <button
            type="button"
            class="quick-menu-action"
            :aria-label="item.ariaLabel"
            @click="handleMenuAction(item)"
          >
            <van-icon :name="item.icon" aria-hidden="true" />
          </button>
          <span class="quick-menu-label">{{ item.label }}</span>
        </div>
      </template>
    </TransitionGroup>

    <button
      type="button"
      class="quick-menu-toggle"
      :aria-expanded="isExpanded"
      :aria-label="isExpanded ? '收起快捷菜单' : '展开快捷菜单'"
      @click="onToggleClick"
    >
      <van-icon :name="isExpanded ? 'arrow-up' : 'arrow-left'" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isCustomerServiceModalOpen, openCustomerServiceModal } from '@/utils/customerService'

type QuickMenuAction = 'route' | 'customer-service'

interface QuickMenuItem {
  key: 'game' | 'recharge' | 'customer-service' | 'home'
  label: '大厅' | '充值' | '客服' | '视频'
  icon: string
  ariaLabel: string
  action: QuickMenuAction
  routeName?: 'game' | 'recharge' | 'home'
}

const route = useRoute()
const router = useRouter()
const isExpanded = ref(false)
const isNavigating = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const position = ref({ x: 0, y: 0 })
const hasMoved = ref(false)
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let initialPosX = 0
let initialPosY = 0
let isTouch = false

const menuItems: QuickMenuItem[] = [
  { key: 'game', label: '大厅', icon: 'home-o', ariaLabel: '进入游戏大厅', action: 'route', routeName: 'game' },
  { key: 'recharge', label: '充值', icon: 'gold-coin-o', ariaLabel: '进入充值页面', action: 'route', routeName: 'recharge' },
  { key: 'customer-service', label: '客服', icon: 'service-o', ariaLabel: '打开在线客服', action: 'customer-service' },
  { key: 'home', label: '视频', icon: 'play-circle-o', ariaLabel: '返回视频首页', action: 'route', routeName: 'home' },
]

const shouldShowMenu = computed(() => {
  return route.name !== 'game-play' && !isCustomerServiceModalOpen.value
})

const containerStyle = computed(() => {
  if (position.value.x === 0 && position.value.y === 0) {
    return {}
  }
  return {
    right: 'auto',
    bottom: 'auto',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
  }
})

const closeMenu = () => {
  isExpanded.value = false
}

const onToggleClick = () => {
  if (hasMoved.value) {
    hasMoved.value = false
    return
  }
  isExpanded.value = !isExpanded.value
}

const handleMenuAction = async (item: QuickMenuItem) => {
  if (isNavigating.value) return

  closeMenu()

  if (item.action === 'customer-service') {
    openCustomerServiceModal()
    return
  }

  if (!item.routeName || route.name === item.routeName) return

  isNavigating.value = true
  try {
    await router.push({ name: item.routeName })
  } finally {
    isNavigating.value = false
  }
}

const savePosition = () => {
  localStorage.setItem('floatingQuickMenuPosition', JSON.stringify(position.value))
}

const clampPosition = (x: number, y: number) => {
  const size = 52
  return {
    x: Math.max(0, Math.min(x, window.innerWidth - size)),
    y: Math.max(0, Math.min(y, window.innerHeight - size)),
  }
}

const startDrag = (clientX: number, clientY: number) => {
  if (isDragging) return
  isDragging = true
  hasMoved.value = false

  if (position.value.x === 0 && position.value.y === 0 && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    position.value = { x: rect.left, y: rect.top }
  }

  dragStartX = clientX - position.value.x
  dragStartY = clientY - position.value.y
  initialPosX = position.value.x
  initialPosY = position.value.y
}

const moveDrag = (clientX: number, clientY: number) => {
  if (!isDragging) return

  const newX = clientX - dragStartX
  const newY = clientY - dragStartY

  if (Math.abs(newX - initialPosX) > 3 || Math.abs(newY - initialPosY) > 3) {
    hasMoved.value = true
  }

  const clamped = clampPosition(newX, newY)
  position.value.x = clamped.x
  position.value.y = clamped.y
}

const endDrag = () => {
  isDragging = false
  if (hasMoved.value) {
    savePosition()
  }
}

const handleTouchStart = (e: TouchEvent) => {
  isTouch = true
  startDrag(e.touches[0].clientX, e.touches[0].clientY)
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging) return
  moveDrag(e.touches[0].clientX, e.touches[0].clientY)
  e.preventDefault()
}

const handleTouchEnd = () => {
  endDrag()
}

const handleMouseDown = (e: MouseEvent) => {
  if (isTouch) {
    isTouch = false
    return
  }
  startDrag(e.clientX, e.clientY)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  e.preventDefault()
}

const handleMouseMove = (e: MouseEvent) => {
  moveDrag(e.clientX, e.clientY)
}

const handleMouseUp = () => {
  endDrag()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isExpanded.value) closeMenu()
}

watch(() => route.fullPath, closeMenu)
watch(isCustomerServiceModalOpen, (isOpen) => {
  if (isOpen) closeMenu()
})

onMounted(() => {
  const saved = localStorage.getItem('floatingQuickMenuPosition')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      position.value = parsed
    } catch {
      // ignore
    }
  }
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.floating-quick-menu {
  position: fixed;
  right: max(12px, env(safe-area-inset-right));
  bottom: calc(64px + env(safe-area-inset-bottom));
  z-index: 1000;
  width: 52px;
  user-select: none;
  touch-action: none;
}

.quick-menu-toggle,
.quick-menu-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  color: #fff;
  background: #ff9500;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.quick-menu-toggle {
  position: relative;
  z-index: 1;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  font-size: 22px;
}

.quick-menu-toggle:active,
.quick-menu-action:active {
  transform: scale(0.96);
}

.quick-menu-toggle:focus-visible,
.quick-menu-action:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.quick-menu-list {
  position: absolute;
  right: 0;
  bottom: 60px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 108px;
}

.quick-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-direction: row-reverse;
}

.quick-menu-action {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  font-size: 20px;
}

.quick-menu-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 26px;
  border-radius: 13px;
  color: #fff;
  background: rgba(0, 0, 0, 0.86);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.quick-menu-enter-active {
  transition: opacity 240ms ease-out, transform 240ms ease-out;
  transition-delay: calc((3 - var(--menu-index)) * 40ms);
}

.quick-menu-leave-active {
  transition: opacity 180ms ease-in, transform 180ms ease-in;
  transition-delay: calc(var(--menu-index) * 40ms);
}

.quick-menu-enter-from,
.quick-menu-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .quick-menu-enter-active,
  .quick-menu-leave-active {
    transition: none;
  }
}
</style>
