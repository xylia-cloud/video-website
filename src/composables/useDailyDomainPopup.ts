import { ref } from 'vue'

/** 每日永久域名图片弹窗：App 自动弹窗与首页点击弹窗共用的全局状态 */
const showDailyDomainPopup = ref(false)

/** 打开永久域名图片弹窗（点击触发，不受每天一次限制） */
export const openDailyDomainPopup = () => {
  showDailyDomainPopup.value = true
}

/** 每日永久域名图片弹窗状态 */
export const useDailyDomainPopup = () => {
  return { showDailyDomainPopup, openDailyDomainPopup }
}
