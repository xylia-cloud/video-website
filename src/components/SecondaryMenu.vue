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
  background: linear-gradient(180deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 149, 0, 0.08) 100%);
  border-top: 1px solid rgba(255, 149, 0, 0.3);
  border-bottom: 1px solid rgba(255, 149, 0, 0.2);
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.1);
  position: relative;
}

.sub-nav-tabs::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 149, 0, 0.5) 50%, transparent 100%);
}

.sub-tab-item {
  padding: 6px 10px;
  font-size: 12px;
  color: #fff;
  text-align: center;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-radius: 6px;
  border: 1px solid rgba(255, 149, 0, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.sub-tab-item.active {
  color: #fff !important;
  font-weight: bold !important;
  background: linear-gradient(135deg, #ff9500 0%, #ff8500 100%) !important;
  border-color: #ff9500 !important;
  box-shadow: 0 2px 6px rgba(255, 149, 0, 0.4) !important;
}

.sub-tab-item:hover {
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.25) 0%, rgba(255, 149, 0, 0.15) 100%);
  border-color: rgba(255, 149, 0, 0.5);
  color: #fff;
  box-shadow: 0 2px 4px rgba(255, 149, 0, 0.2);
}
</style>
