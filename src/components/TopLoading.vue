<template>
    <div v-if="isLoading" class="top-loading">
        <div class="loading-bar"></div>
        <div class="loading-toast">
            <div class="toast-content">
                <div class="loading-icon"></div>
                <span class="loading-text">加载中...</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isLoading = ref(false)

// 显示loading
const show = () => {
    isLoading.value = true
}

// 隐藏loading
const hide = () => {
    isLoading.value = false
}

// 暴露方法给父组件
defineExpose({
    show,
    hide
})

// 监听全局loading事件
const handleShowLoading = () => {
    show()
}

const handleHideLoading = () => {
    hide()
}

onMounted(() => {
    // 监听全局事件
    window.addEventListener('show-top-loading', handleShowLoading)
    window.addEventListener('hide-top-loading', handleHideLoading)
})

onUnmounted(() => {
    // 清理事件监听
    window.removeEventListener('show-top-loading', handleShowLoading)
    window.removeEventListener('hide-top-loading', handleHideLoading)
})
</script>

<style scoped>
.top-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 9999;
    background-color: rgba(0, 0, 0, 0.1);
}

.loading-bar {
    height: 100%;
    background: linear-gradient(90deg, #ff9500, #ffb84d);
    animation: loading-progress 1.5s ease-in-out infinite;
    border-radius: 0 3px 3px 0;
}

@keyframes loading-progress {
    0% {
        width: 0%;
        opacity: 1;
    }

    50% {
        width: 70%;
        opacity: 0.8;
    }

    100% {
        width: 100%;
        opacity: 0.6;
    }
}

/* Toast样式 */
.loading-toast {
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    animation: toast-slide-in 0.3s ease-out;
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-icon {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid #ff9500;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-text {
    font-weight: 500;
    white-space: nowrap;
}

@keyframes toast-slide-in {
    0% {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
    }

    100% {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
    .top-loading {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .loading-bar {
        background: linear-gradient(90deg, #00d4aa, #00b894);
    }

    .toast-content {
        background: rgba(40, 40, 40, 0.9);
        color: #fff;
    }

    .loading-icon {
        border-top-color: #00d4aa;
    }
}

/* 移动端适配 */
@media (max-width: 768px) {
    .loading-toast {
        top: 8px;
    }

    .toast-content {
        padding: 6px 12px;
        font-size: 13px;
    }

    .loading-icon {
        width: 14px;
        height: 14px;
    }
}
</style>
