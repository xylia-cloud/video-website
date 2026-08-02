<template>
  <van-popup
    :show="visible"
    teleport="body"
    :close-on-click-overlay="false"
    :lock-scroll="true"
    :overlay="true"
    overlay-class="daily-domain-overlay"
    class="daily-domain-popup"
    @update:show="handleUpdateShow"
  >
    <div class="daily-domain-card">
      <img class="daily-domain-image" src="@/assets/img/permanent-domain-name.webp" alt="永久域名" />
      <button class="daily-domain-close" type="button" @click="handleClose" aria-label="关闭">
        <van-icon name="close" size="36" />
      </button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(props.show)

watch(
  () => props.show,
  (newVal) => {
    visible.value = newVal
  },
)

const handleUpdateShow = (value: boolean) => {
  visible.value = value
  emit('update:show', value)
}

const handleClose = () => {
  handleUpdateShow(false)
}
</script>

<style scoped>
:global(.daily-domain-overlay) {
  background: rgba(0, 0, 0, 0.75);
}

:global(.van-popup.daily-domain-popup) {
  background: transparent;
  overflow: visible;
}

.daily-domain-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(84vw, 348px);
}

.daily-domain-image {
  width: 100%;
  border-radius: 12px;
  display: block;
}

.daily-domain-close {
  margin-top: 16px;
  padding: 0;
  width: auto;
  height: auto;
  border: none;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.daily-domain-close:active {
  opacity: 0.7;
}
</style>
