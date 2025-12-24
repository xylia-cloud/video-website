<template>
  <div class="nav-tabs">
    <div
      v-for="type in typesList"
      :key="type.type_id"
      :class="[
        'tab-item',
        activeTypeId === type.type_id ||
        (type.child && type.child.some((child) => child.type_id === activeTypeId))
          ? 'active'
          : '',
        type.child && type.child.length > 0 ? 'has-children' : '',
      ]"
      @click="handlePrimaryTypeClick(type)"
      :data-type-id="type.type_id"
    >
      {{ type.type_name }}
      <van-icon
        v-if="type.child && type.child.length > 0"
        :name="expandedTypeId === type.type_id ? 'arrow-up' : 'arrow-down'"
        size="12"
        class="expand-icon"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义类型数据接口
interface TypeItem {
  type_id: number
  type_name: string
  type_pid?: number
  child?: TypeItem[]
}

interface Props {
  typesList: TypeItem[]
  activeTypeId: number
  expandedTypeId: number | null
}

interface Emits {
  (e: 'primary-type-click', type: TypeItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handlePrimaryTypeClick = (type: TypeItem) => {
  emit('primary-type-click', type)
}
</script>

<style scoped>
/* 一级导航标签 */
.nav-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px 15px;
}

.tab-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #ccc;
  text-align: center;
  cursor: pointer;
  background-color: #333;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-item.active {
  color: #fff !important;
  font-weight: bold !important;
  background-color: #ff9500 !important;
  border-color: #ff9500 !important;
}

.tab-item:hover {
  background-color: #444;
  border-color: #666;
  color: #fff;
}

.tab-item.has-children {
  position: relative;
}

.expand-icon {
  margin-left: 2px;
}
</style>
