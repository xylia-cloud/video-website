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
        @click="page !== '...' && $emit('page-change', page)"
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
      <span class="jump-label">跳转</span>
      <input
        v-model="jumpPageInput"
        type="number"
        class="jump-input"
        :min="1"
        :max="totalPages"
        @keyup.enter="handleJumpPage"
        @blur="handleJumpPage"
        placeholder=""
      />
      <span class="jump-total">页</span>
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

// 计算可见的页码列表（优化为更紧凑的显示）
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const current = props.currentPage
  const total = props.totalPages

  if (total <= 5) {
    // 总页数少于等于5，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总页数大于5，显示部分页码（更紧凑）
    if (current <= 2) {
      // 当前页在前2页
      for (let i = 1; i <= 3; i++) {
        pages.push(i)
      }
      if (total > 4) {
        pages.push('...')
        pages.push(total)
      }
    } else if (current >= total - 1) {
      // 当前页在后2页
      pages.push(1)
      if (total > 4) {
        pages.push('...')
      }
      for (let i = total - 2; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 当前页在中间
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }

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
  { immediate: true }
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
  margin-left: 6px;
  flex-shrink: 0;
}

.jump-label,
.jump-total {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.jump-input {
  width: 40px;
  height: 30px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 12px;
  outline: none;
  padding: 0 4px;
}

.jump-input:focus {
  border-color: #ff9500;
  background: rgba(255, 149, 0, 0.1);
}

.jump-input::-webkit-inner-spin-button,
.jump-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.jump-input[type='number'] {
  -moz-appearance: textfield;
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
    margin-left: 4px;
  }

  .jump-label,
  .jump-total {
    font-size: 11px;
  }

  .jump-input {
    width: 35px;
    height: 28px;
    font-size: 11px;
  }
}
</style>

