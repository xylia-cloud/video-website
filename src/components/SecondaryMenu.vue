<template>
  <div
    v-if="expandedTypeId && typesList.find((t) => t.type_id === expandedTypeId)?.child"
    class="sub-nav-tabs"
  >
    <div
      v-for="subType in typesList.find((t) => t.type_id === expandedTypeId)?.child"
      :key="subType.type_id"
      :class="['sub-tab-item', activeSubTypeId === subType.type_id ? 'active' : '']"
      @click="handleSubTypeClick(subType)"
    >
      {{ subType.type_name }}
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
  expandedTypeId: number | null
  activeSubTypeId: number | null
}

interface Emits {
  (e: 'sub-type-click', subType: TypeItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleSubTypeClick = (subType: TypeItem) => {
  emit('sub-type-click', subType)
}
</script>

<style scoped>
/* 二级导航标签 */
.sub-nav-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 8px 15px 12px;
  background-color: #1a1a1a;
  border-top: 1px solid #333;
}

.sub-tab-item {
  padding: 6px 10px;
  font-size: 12px;
  color: #999;
  text-align: center;
  cursor: pointer;
  background-color: #2a2a2a;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-tab-item.active {
  color: #fff !important;
  font-weight: bold !important;
  background-color: #ff9500 !important;
  border-color: #ff9500 !important;
}

.sub-tab-item:hover {
  background-color: #3a3a3a;
  border-color: #555;
  color: #fff;
}
</style>
