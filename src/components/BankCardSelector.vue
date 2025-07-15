<template>
  <van-popup
    :show="modelValue"
    @update:show="$emit('update:modelValue', $event)"
    round
    position="bottom"
  >
    <div class="bank-card-selector">
      <div class="selector-header">
        <div class="header-title">选择银行卡</div>
        <div class="close-button" @click="onClose">
          <van-icon name="cross" />
        </div>
      </div>

      <div class="card-list">
        <div
          v-for="(card, index) in bankCards"
          :key="index"
          class="bank-card"
          :class="{ active: selectedCardIndex === index }"
          @click="selectCard(index)"
        >
          <div class="card-info">
            <div class="card-name">{{ card.name }}</div>
            <div class="card-bank">{{ card.bank }}</div>
          </div>
          <div class="card-number">{{ card.cardNumber }}</div>
          <div class="remove-button" @click.stop="removeCard(index)">
            <van-icon name="delete" />删除
          </div>
        </div>
      </div>

      <div class="add-card-button" @click="openAddCardForm">
        <van-icon name="plus" />添加银行卡
      </div>

      <div class="confirm-button" @click="confirmSelection">确定</div>
    </div>
  </van-popup>

  <!-- 银行卡表单弹窗 -->
  <BankCardForm
    :show="showCardForm"
    @update:show="showCardForm = $event"
    :card="editingCard"
    :is-edit="isEditingCard"
    @submit="onCardFormSubmit"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Icon as VanIcon, Popup as VanPopup, showToast } from 'vant';
import BankCardForm from './BankCardForm.vue';

interface BankCard {
  name: string;
  bank: string;
  cardNumber: string;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialSelectedIndex: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:modelValue', 'select', 'add', 'remove']);

// 银行卡列表
const bankCards = ref<BankCard[]>([
  { name: '温雅然', bank: '工商银行', cardNumber: '6217178678109080027' },
  { name: '沈墨白', bank: '工商银行', cardNumber: '6226896111390135339' },
  { name: '苏念安', bank: '工商银行', cardNumber: '6217177226319044675' }
]);

// 当前选中的银行卡
const selectedCardIndex = ref(props.initialSelectedIndex);

// 银行卡表单弹窗显示状态
const showCardForm = ref(false);

// 当前编辑的银行卡
const editingCard = ref<BankCard | null>(null);

// 是否为编辑模式
const isEditingCard = ref(false);

// 选择银行卡
const selectCard = (index: number) => {
  selectedCardIndex.value = index;
};

// 删除银行卡
const removeCard = (index: number) => {
  if (bankCards.value.length <= 1) {
    showToast('至少保留一张银行卡');
    return;
  }
  
  bankCards.value.splice(index, 1);
  
  // 如果删除的是当前选中的卡，重置选中状态
  if (selectedCardIndex.value === index) {
    selectedCardIndex.value = 0;
  } else if (selectedCardIndex.value > index) {
    selectedCardIndex.value--;
  }
  
  emit('remove', index);
};

// 打开添加银行卡表单
const openAddCardForm = () => {
  isEditingCard.value = false;
  editingCard.value = null;
  showCardForm.value = true;
};

// 银行卡表单提交回调
const onCardFormSubmit = (formData: BankCard) => {
  if (isEditingCard.value) {
    // 编辑现有卡
    const index = bankCards.value.findIndex(
      (card) => card.cardNumber === editingCard.value?.cardNumber
    );
    if (index !== -1) {
      bankCards.value[index] = formData;
    }
  } else {
    // 添加新卡
    bankCards.value.push(formData);
    // 自动选中新添加的卡
    selectedCardIndex.value = bankCards.value.length - 1;
  }

  showToast('操作成功');
};

// 确认选择
const confirmSelection = () => {
  emit('select', bankCards.value[selectedCardIndex.value], selectedCardIndex.value);
  onClose();
};

// 关闭弹窗
const onClose = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
.bank-card-selector {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #111;
  color: #fff;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
}

.close-button {
  padding: 5px;
}

.card-list {
  flex: 1;
  overflow-y: auto;
}

.bank-card {
  background: linear-gradient(135deg, #8fc31f 0%, #41b53f 100%);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  position: relative;
  color: #000;
  overflow: hidden;
}

.bank-card.active {
  position: relative;
}

.bank-card.active::after {
  content: '';
  position: absolute;
  bottom: 15px;
  right: 15px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: transparent;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 12L10 17L19 8"/></svg>');
  background-size: 32px;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

.card-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 15px;
}

.card-name {
  font-size: 18px;
  font-weight: bold;
}

.card-bank {
  font-size: 16px;
}

.card-number {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1px;
}

.remove-button {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
}

.add-card-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #222;
  padding: 15px;
  border-radius: 10px;
  margin: 15px 0;
  font-size: 14px;
  color: #FF8F00;
}

.add-card-button .van-icon {
  margin-right: 5px;
}

.confirm-button {
  background-color: #FF8F00;
  color: #fff;
  text-align: center;
  padding: 15px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
}
</style> 