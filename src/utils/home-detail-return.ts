export const HOME_DETAIL_RETURN_STATE_KEY = 'homeDetailReturnState'
export const HOME_DETAIL_RETURN_TTL = 10 * 60 * 1000

export interface HomeDetailReturnState {
  source: 'home'
  typeId: number
  subTypeId: number | null
  expandedTypeId: number | null
  page: number
  scrollPosition: number
  createdAt: number
}

export interface HomeDetailReturnContext {
  typeId: number
  subTypeId: number | null
  expandedTypeId: number | null
  page: number
}

export const saveHomeDetailReturnState = (state: HomeDetailReturnState): void => {
  sessionStorage.setItem(HOME_DETAIL_RETURN_STATE_KEY, JSON.stringify(state))
}

export const consumeHomeDetailReturnState = (): HomeDetailReturnState | null => {
  const raw = sessionStorage.getItem(HOME_DETAIL_RETURN_STATE_KEY)
  sessionStorage.removeItem(HOME_DETAIL_RETURN_STATE_KEY)

  if (!raw) return null

  try {
    const value = JSON.parse(raw) as Partial<HomeDetailReturnState>
    const isValid =
      value.source === 'home' &&
      Number.isInteger(value.typeId) && (value.typeId as number) >= 0 &&
      Number.isInteger(value.page) && (value.page as number) > 0 &&
      Number.isFinite(value.scrollPosition) &&
      Number.isFinite(value.createdAt) &&
      Date.now() - (value.createdAt as number) <= HOME_DETAIL_RETURN_TTL

    if (!isValid) return null

    return {
      source: 'home',
      typeId: value.typeId as number,
      subTypeId: Number.isInteger(value.subTypeId) ? (value.subTypeId as number) : null,
      expandedTypeId: Number.isInteger(value.expandedTypeId)
        ? (value.expandedTypeId as number)
        : null,
      page: value.page as number,
      scrollPosition: value.scrollPosition as number,
      createdAt: value.createdAt as number,
    }
  } catch {
    return null
  }
}
