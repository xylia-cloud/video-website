/** 解耦 fetch-api 与 Pinia：localStorage 变更后通知 user store 同步 */
type HydrateFn = () => void

let hydrateFn: HydrateFn | null = null

export const registerUserStoreHydrate = (fn: HydrateFn) => {
  hydrateFn = fn
}

export const notifyUserStoreHydrate = () => {
  hydrateFn?.()
}
