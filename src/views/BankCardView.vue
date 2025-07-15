<script setup lang="ts">
import { ref } from 'vue';
import { Icon, Popup, Form, Field, CellGroup, Button, showToast } from 'vant';
import { useRouter } from 'vue-router';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};

// 银行卡数据
const bankCards = ref([
  { id: 1, name: '温雅然', bank: '工商银行', cardNumber: '6217178678109080027' },
  { id: 2, name: '沈墨白', bank: '工商银行', cardNumber: '6226896111390135339' },
  { id: 3, name: '苏念安', bank: '工商银行', cardNumber: '6217177226319044675' }
]);

// 弹出层控制
const showAddCard = ref(false);

// 表单数据
const newCard = ref({
  name: '',
  bank: '',
  cardNumber: ''
});

// 添加银行卡
const addBankCard = () => {
  showAddCard.value = true;
};

// 提交表单
const submitForm = () => {
  // 添加新卡
  const newId = bankCards.value.length > 0 ? Math.max(...bankCards.value.map(card => card.id)) + 1 : 1;
  bankCards.value.push({
    id: newId,
    name: newCard.value.name,
    bank: newCard.value.bank,
    cardNumber: newCard.value.cardNumber
  });
  
  // 重置表单并关闭弹窗
  resetForm();
  showAddCard.value = false;
  showToast('添加成功');
};

// 重置表单
const resetForm = () => {
  newCard.value = {
    name: '',
    bank: '',
    cardNumber: ''
  };
};

// 取消添加
const cancelAdd = () => {
  resetForm();
  showAddCard.value = false;
};

// 删除银行卡
const deleteBankCard = (id: number) => {
  // 实际应用中可能需要先确认再删除
  bankCards.value = bankCards.value.filter(card => card.id !== id);
};
</script>

<template>
  <div class="bank-card-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="nav-bar">
        <div class="back-button" @click="goBack">
          <Icon name="arrow-left" color="#fff" size="20" />
        </div>
        <div class="page-title">银行卡</div>
        <div class="right-placeholder"></div>
      </div>
    </div>

    <!-- 银行卡列表 -->
    <div class="cards-list">
      <div class="card-item" v-for="card in bankCards" :key="card.id">
        <div class="card-content">
          <div class="card-name">{{ card.name }}</div>
          <div class="card-bank">{{ card.bank }}</div>
          <div class="card-number">{{ card.cardNumber }}</div>
        </div>
        <div class="delete-button" @click="deleteBankCard(card.id)">
          <Icon name="cross" color="#fff" size="20" />
          <span>删除</span>
        </div>
      </div>
    </div>

    <!-- 添加银行卡按钮 -->
    <div class="add-card-button" @click="addBankCard">
      添加银行卡
    </div>
    
    <!-- 添加银行卡底部弹出层 -->
    <Popup
      v-model:show="showAddCard"
      position="bottom"
      round
    >
      <div class="bank-card-form">
        <div class="form-header">
          <div class="header-title">添加银行卡</div>
          <div class="close-button" @click="cancelAdd">
            <Icon name="cross" />
          </div>
        </div>
        
        <div class="form-content">
          <Form @submit="submitForm">
            <CellGroup inset>
              <Field
                v-model="newCard.name"
                name="name"
                label="持卡人"
                placeholder="请输入持卡人姓名"
                :rules="[{ required: true, message: '请填写持卡人姓名' }]"
              />
              
              <Field
                v-model="newCard.bank"
                name="bank"
                label="银行名称"
                placeholder="请输入银行名称"
                :rules="[{ required: true, message: '请填写银行名称' }]"
              />
              
              <Field
                v-model="newCard.cardNumber"
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
            </CellGroup>
            
            <div class="form-buttons">
              <Button round block type="primary" native-type="submit" color="#FF8F00">
                确认添加
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Popup>
  </div>
</template>

<style scoped>
.bank-card-page {
  background-color: #111;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  padding: 10px 15px;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
}

.back-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.right-placeholder {
  width: 44px;
}

.cards-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px;
}

.card-item {
  position: relative;
  margin-bottom: 15px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #cef000, #0f9d58);
}

.card-content {
  padding: 20px;
}

.card-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #000;
}

.card-bank {
  font-size: 16px;
  margin-bottom: 30px;
  color: #333;
}

.card-number {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  letter-spacing: 1px;
}

.delete-button {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-size: 12px;
  z-index: 2;
}

.add-card-button {
  margin: 20px 15px;
  padding: 15px 0;
  background-color: #FF8800;
  color: #fff;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  border-radius: 12px;
  cursor: pointer;
}

/* 弹出层样式 */
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

.form-buttons {
  margin: 16px 0;
  padding: 0 5px;
}

:deep(.van-cell) {
  background-color: #222;
  color: #fff;
  padding: 20px;
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