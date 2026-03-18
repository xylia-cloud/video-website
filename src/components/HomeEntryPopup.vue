<template>
  <van-popup
    :show="show"
    teleport="body"
    :close-on-click-overlay="false"
    :lock-scroll="true"
    :overlay="true"
    overlay-class="home-entry-popup-overlay"
    class="home-entry-popup"
    @click-overlay="$emit('close')"
  >
    <div class="home-entry-popup-card">
      <button class="home-entry-popup-close" type="button" @click="$emit('close')">×</button>
      <div class="home-entry-popup-hero">
        <slot name="hero">
          <img class="home-entry-popup-hero-img" src="@/assets/img/img-popup-hyjh.webp" alt="" />
        </slot>
      </div>
      <div class="home-entry-popup-body">
        <div class="home-entry-popup-title">合营计划 诚邀各路有志之士</div>
        <div class="home-entry-popup-desc">
          <div>参与365直线代理计划 直招100位 官方直招</div>
          <div>教你引流赚钱 招募下级 强者从不抱怨环境</div>
          <div>365娱乐、金满楼、186、带你解锁未来！</div>
          <div>联系方式复制下方telegram号</div>
        </div>
      </div>
      <div class="home-entry-popup-actions">
        <button
          class="home-entry-popup-btn home-entry-popup-btn-left"
          type="button"
          @click="$emit('left')"
        >
          合营计划
        </button>
        <button
          class="home-entry-popup-btn home-entry-popup-btn-right"
          type="button"
          @click="$emit('right')"
        >
          复制telegram号
        </button>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
}

defineProps<Props>()

defineEmits<{
  (e: 'close'): void
  (e: 'left'): void
  (e: 'right'): void
}>()
</script>

<style scoped>
:global(.home-entry-popup-overlay) {
  background: rgba(0, 0, 0, 0.75);
}

.home-entry-popup {
  background: transparent;
}

.home-entry-popup-card {
  width: min(86vw, 360px);
  border-radius: 14px;
  background:
    linear-gradient(#0d0c0b, #0d0c0b) padding-box,
    linear-gradient(180deg, #553713 0%, #f0e5a3 50%, #553713 100%) border-box;
  border: 2px solid transparent;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
}

.home-entry-popup-close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 34px;
  line-height: 40px;
  cursor: pointer;
}

.home-entry-popup-hero {
  background: rgba(255, 255, 255, 0.04);
}

.home-entry-popup-hero-img {
  width: 100%;
  display: block;
  height: auto;
}

.home-entry-popup-body {
  padding: 14px 14px 0;
}

.home-entry-popup-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #ff9500;
  text-align: left;
  margin-bottom: 10px;
}

.home-entry-popup-desc {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
}

.home-entry-popup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 16px;
  padding: 0 14px 14px;
}

.home-entry-popup-btn {
  height: 44px;
  border-radius: 8px;
  border: none;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.home-entry-popup-btn-left {
  background: #ff9500;
}

.home-entry-popup-btn-right {
  background: #1fb954;
}
</style>
