<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

// 组件属性
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  showBack: {
    type: Boolean,
    default: true
  },
  rightText: {
    type: String,
    default: ''
  },
  customBack: {
    type: Boolean,
    default: false
  }
});

// 事件
const emit = defineEmits(['rightClick', 'back']);

// 返回上一页
const goBack = () => {
  if (props.customBack) {
    // 如果启用了自定义返回，触发 back 事件让父组件处理
    emit('back');
  } else {
    // 否则执行默认返回
    router.back();
  }
};

// 右侧按钮点击
const handleRightClick = () => {
  emit('rightClick');
};
</script>

<template>
  <div class="header-nav">
    <div class="header-content">
      <div class="left-area">
        <div v-if="showBack" class="back-button" @click="goBack">
          <van-icon name="arrow-left" size="24" color="#fff" />
        </div>
        <div v-else class="placeholder"></div>
      </div>
      <div class="title">{{ title }}</div>
      <div class="right-area">
        <div v-if="rightText" class="right-button" @click="handleRightClick">
          {{ rightText }}
        </div>
        <div v-else class="placeholder"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
}

.header-content {
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  width: 100%;
  max-width: 420px;
  background-color: #111;
}

.left-area, .right-area {
  width: 40px;
  display: flex;
  align-items: center;
}

.back-button {
  cursor: pointer;
  height: 40px;
  display: flex;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  flex: 1;
}

.right-button {
  color: #FF9500;
  font-size: 14px;
  cursor: pointer;
}

.placeholder {
  width: 40px;
}
</style> 