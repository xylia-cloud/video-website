import { ref } from 'vue'

/**
 * 全局客服弹窗：通过自定义事件打开，避免 window.open 新窗口
 */
export const CUSTOMER_SERVICE_MODAL_EVENT = 'open-customer-service-modal'

/** 客服弹窗是否打开，用于隐藏悬浮客服按钮等 */
export const isCustomerServiceModalOpen = ref(false)

export interface CustomerServiceModalDetail {
  url?: string
}

export const openCustomerServiceModal = (detail?: CustomerServiceModalDetail) => {
  window.dispatchEvent(
    new CustomEvent<CustomerServiceModalDetail>(CUSTOMER_SERVICE_MODAL_EVENT, {
      detail: detail ?? {},
    }),
  )
}
