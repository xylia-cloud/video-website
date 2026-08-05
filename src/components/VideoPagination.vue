<template>
  <div class="video-pagination">
    <!-- 上一页 -->
    <button
      class="page-btn"
      :disabled="currentPage <= 1"
      @click="$emit('page-change', currentPage - 1)"
    >
      <van-icon name="arrow-left" size="14" />
    </button>

    <!-- 页码按钮 -->
    <div class="page-numbers">
      <button
        v-for="page in visiblePages"
        :key="page"
        class="page-number-btn"
        :class="{ active: page === currentPage, 'page-ellipsis': page === '...' }"
        :disabled="page === '...'"
        @click="page !== '...' && typeof page === 'number' && $emit('page-change', page)"
      >
        {{ page }}
      </button>
    </div>

    <!-- 下一页 -->
    <button
      class="page-btn"
      :disabled="currentPage >= totalPages"
      @click="$emit('page-change', currentPage + 1)"
    >
      <van-icon name="arrow" size="14" />
    </button>

    <!-- 跳转输入框 -->
    <div class="page-jump">
      <input
        v-model="jumpPageInput"
        type="text"
        class="jump-input"
        :min="1"
        :max="totalPages"
        inputmode="numeric"
        pattern="[0-9]*"
        enterkeyhint="done"
        aria-label="跳转页码"
        @keydown.enter.prevent="handleJumpPage"
        placeholder=""
      />
      <span class="jump-total">/{{ totalPages }}</span>
      <button class="jump-btn" type="button" @click="handleJumpPage">确定</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

const jumpPageInput = ref<number>(1)

// 计算可见的页码列表（紧凑显示，最多5个）
const visiblePages = computed(() => {
  const current = props.currentPage
  const total = props.totalPages

  if (total <= 5) {
    // 总页数少于等于5，显示所有页码
    const pages: number[] = []
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
    return pages
  }

  // 总页数大于5，仅显示当前页前后各1页 + 首页 + 尾页
  const pages: (number | string)[] = []
  pages.push(1)
  if (current > 3) {
    pages.push('...')
  }
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) {
    pages.push('...')
  }
  pages.push(total)
  return pages
})

// 处理跳转
const handleJumpPage = () => {
  const page = Number(jumpPageInput.value)
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  } else {
    // 重置为当前页
    jumpPageInput.value = props.currentPage
  }
}

// 监听当前页变化，同步跳转输入框
watch(
  () => props.currentPage,
  (newPage) => {
    jumpPageInput.value = newPage
  },
  { immediate: true },
)
</script>

<style scoped>
.video-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 15px 10px;
  margin: 15px 0;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* 隐藏滚动条但保持滚动功能 */
.video-pagination::-webkit-scrollbar {
  display: none;
}

.video-pagination {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.page-btn {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 149, 0, 0.2);
  border-color: #ff9500;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 1;
  min-width: 0;
}

.page-number-btn {
  min-width: 28px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.page-number-btn:hover:not(:disabled) {
  background: rgba(255, 149, 0, 0.2);
  border-color: #ff9500;
}

.page-number-btn.active {
  background: #ff9500;
  border-color: #ff9500;
  color: #fff;
  font-weight: 600;
}

.page-number-btn.page-ellipsis {
  border: none;
  background: transparent;
  cursor: default;
  padding: 0 4px;
  min-width: 20px;
}

.page-number-btn.page-ellipsis:hover {
  background: transparent;
  border: none;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  flex-shrink: 0;
}

.jump-total {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.jump-input {
  width: 34px;
  height: 30px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 12px;
  outline: none;
  padding: 0 2px;
}

.jump-input:focus {
  border-color: #ff9500;
  background: rgba(255, 149, 0, 0.1);
}

.jump-btn {
  height: 30px;
  padding: 0 12px;
  background: #ff9500;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.jump-btn:active {
  opacity: 0.8;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .video-pagination {
    gap: 4px;
    padding: 12px 8px;
  }

  .page-btn {
    width: 28px;
    height: 28px;
  }

  .page-number-btn {
    min-width: 26px;
    height: 28px;
    padding: 0 6px;
    font-size: 11px;
  }

  .page-jump {
    gap: 3px;
    margin-left: 2px;
  }

  .jump-total {
    font-size: 11px;
  }

  .jump-input {
    width: 30px;
    height: 28px;
    font-size: 11px;
  }

  .jump-btn {
    height: 28px;
    padding: 0 8px;
    font-size: 11px;
  }
}
</style>
