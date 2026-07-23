import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  HOME_DETAIL_RETURN_STATE_KEY,
  HOME_DETAIL_RETURN_TTL,
  consumeHomeDetailReturnState,
  saveHomeDetailReturnState,
} from '@/utils/home-detail-return'

const createMemoryStorage = (): Storage => {
  const data = new Map<string, string>()

  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  }
}

describe('home detail return state', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', createMemoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('preserves the latest category whose typeId is zero', () => {
    const state = {
      source: 'home' as const,
      typeId: 0,
      subTypeId: null,
      expandedTypeId: null,
      page: 2,
      scrollPosition: 360,
      createdAt: Date.now(),
    }

    saveHomeDetailReturnState(state)

    expect(consumeHomeDetailReturnState()).toEqual(state)
    expect(sessionStorage.getItem(HOME_DETAIL_RETURN_STATE_KEY)).toBeNull()
    expect(consumeHomeDetailReturnState()).toBeNull()
  })

  it('rejects a negative category id', () => {
    sessionStorage.setItem(
      HOME_DETAIL_RETURN_STATE_KEY,
      JSON.stringify({
        source: 'home',
        typeId: -1,
        subTypeId: null,
        expandedTypeId: null,
        page: 1,
        scrollPosition: 0,
        createdAt: Date.now(),
      }),
    )

    expect(consumeHomeDetailReturnState()).toBeNull()
    expect(sessionStorage.getItem(HOME_DETAIL_RETURN_STATE_KEY)).toBeNull()
  })

  it('rejects an expired state', () => {
    sessionStorage.setItem(
      HOME_DETAIL_RETURN_STATE_KEY,
      JSON.stringify({
        source: 'home',
        typeId: 0,
        subTypeId: null,
        expandedTypeId: null,
        page: 1,
        scrollPosition: 0,
        createdAt: Date.now() - HOME_DETAIL_RETURN_TTL - 1,
      }),
    )

    expect(consumeHomeDetailReturnState()).toBeNull()
  })
})
