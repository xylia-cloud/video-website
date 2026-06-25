import type { VideoDetail } from '@/api/fetch-api'

export interface VideoItem {
  id: number
  coverUrl: string
  title: string
  isVip?: boolean
  isFree?: boolean
  duration?: string
  class?: string
  time?: string
  points: string
}

export interface ListAd {
  id: number
  coverUrl: string
  title: string
  isVip?: boolean
  isFree?: boolean
  duration?: string
  class?: string
  link?: string
  points: string
  isAd: true
}

export interface ChargeOption {
  price: number
  type: number
  desc: string
}

export type VideoDetailRef = VideoDetail | null

export const ENABLE_PLAY_VIDEO_AD = false

export const AD_POSITIONS = [3, 6, 11] as const
