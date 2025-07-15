<template>
  <van-popup
    :show="show"
    @update:show="$emit('update:show', $event)"
    round
    position="bottom"
  >
    <div class="bank-card-form">
      <div class="form-header">
        <div class="header-title">{{ isEdit ? '编辑银行卡' : '添加银行卡' }}</div>
        <div class="close-button" @click="onClose">
          <van-icon name="cross" />
        </div>
      </div>

      <div class="form-content">
        <van-form @submit="onSubmit">
          <van-cell-group inset>
            <van-field
              v-model="formData.name"
              name="name"
              label="持卡人"
              placeholder="请输入持卡人姓名"
              :rules="[{ required: true, message: '请填写持卡人姓名' }]"
            />
            
            <van-field
              v-model="formData.bank"
              name="bank"
              label="银行名称"
              placeholder="请输入银行名称"
              :rules="[{ required: true, message: '请填写银行名称' }]"
            />
            
            <van-field
              v-model="formData.cardNumber"
              name="cardNumber"
              label="银行卡号"
              placeholder="请输入银行卡号"
              :rules="[
                { required: true, message: '请填写银行卡号' },
                { pattern: /^\d{16,19}$/, message: '请输入正确的银行卡号' }
              ]"
              type="number"
              maxlength="19"
            />
          </van-cell-group>
          
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit" color="#FF8F00">
              确认
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { 
  Icon as VanIcon, 
  Popup as VanPopup, 
  Form as VanForm, 
  Field as VanField, 
  CellGroup as VanCellGroup,
  Button as VanButton
} from 'vant';

interface BankCardFormData {
  name: string;
  bank: string;
  cardNumber: string;
}

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  card: {
    type: Object as () => BankCardFormData | null,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:show', 'submit']);

// 表单数据
const formData = ref<BankCardFormData>({
  name: '',
  bank: '',
  cardNumber: ''
});

// 重置表单 - 将函数定义移到 watch 之前
const resetForm = () => {
  formData.value = {
    name: '',
    bank: '',
    cardNumber: ''
  };
};

// 当传入card属性变化时，更新表单数据
watch(() => props.card, (newCard) => {
  if (newCard) {
    formData.value = { ...newCard };
  } else {
    resetForm();
  }
}, { immediate: true });

// 提交表单
const onSubmit = () => {
  emit('submit', { ...formData.value });
  onClose();
};

// 关闭弹窗
const onClose = () => {
  resetForm();
  emit('update:show', false);
};
</script>

<style scoped>
.bank-card-form {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #111;
  color: #fff;
}

.form-header {
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

.form-content {
  flex: 1;
  overflow-y: auto;
}

:deep(.van-cell) {
  padding: 20px;
  background-color: #222;
  color: #fff;
}

:deep(.van-field__label) {
  color: #ccc;
}

:deep(.van-cell-group--inset) {
  margin: 0;
  border-radius: 10px;
  overflow: hidden;
}

:deep(.van-field__control) {
  color: #fff;
}

:deep(.van-field__control::placeholder) {
  color: #666;
}
</style> 