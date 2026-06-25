import { computed, ref, type Ref } from 'vue'
import type Hls from 'hls.js'
import { BASE_URL } from '@/utils/config'
import type { VideoDetailRef } from '../types'

export function useVideoPlayer(videoDetail: Ref<VideoDetailRef>, videoSrc: Ref<string>) {
  const isPlaying = ref(false)
  const isVideoFloating = ref(false)
  const videoContainerRef = ref<HTMLElement | null>(null)
  const videoEl = ref<HTMLVideoElement | null>(null)
  const hls = ref<Hls | null>(null)
  const hasVideoError = ref(false)
  const videoErrorMessage = ref('')
  const isVideoPlayed = ref(false)

  let playbackSetupTimer: ReturnType<typeof setTimeout> | null = null

  const canShowDownload = computed(
    () => isPlaying.value && !!videoSrc.value && !hasVideoError.value,
  )

  const cleanupVideoPlayer = () => {
    if (playbackSetupTimer !== null) {
      clearTimeout(playbackSetupTimer)
      playbackSetupTimer = null
    }
    if (hls.value) {
      hls.value.destroy()
      hls.value = null
    }
    if (videoEl.value) {
      videoEl.value.pause()
      videoEl.value.removeAttribute('src')
      videoEl.value.load()
    }
  }

  const stopPlayback = () => {
    cleanupVideoPlayer()
    isPlaying.value = false
  }

  const setupVideoSource = async (src: string) => {
    cleanupVideoPlayer()
    if (!videoEl.value) return

    let videoUrl = src
    if (!videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
      videoUrl = `${BASE_URL}/${videoUrl}`
    }
    if (videoUrl.includes('localhost') && !src.includes('localhost')) {
      videoUrl = `${BASE_URL}/${src}`
    }

    isVideoPlayed.value = false

    videoEl.value.setAttribute('playsinline', 'true')
    videoEl.value.setAttribute('webkit-playsinline', 'true')
    videoEl.value.setAttribute('x5-playsinline', 'true')
    videoEl.value.setAttribute('x5-video-player-type', 'h5')
    videoEl.value.setAttribute('x5-video-player-fullscreen', 'false')

    if (videoUrl.includes('.m3u8')) {
      if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.value.src = videoUrl
        return
      }

      const { default: HlsLib } = await import('hls.js')
      if (!HlsLib.isSupported()) {
        videoEl.value.src = videoUrl
        hasVideoError.value = true
        videoErrorMessage.value = '您的浏览器不支持当前视频格式'
        return
      }

      const newHls = new HlsLib({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        xhrSetup(xhr) {
          xhr.timeout = 10000
        },
      })
      hls.value = newHls

      newHls.on(HlsLib.Events.ERROR, (_event, data) => {
        if (!data.fatal) return
        switch (data.type) {
          case HlsLib.ErrorTypes.NETWORK_ERROR:
            if (
              data.response?.data &&
              typeof data.response.data === 'string' &&
              data.response.data.includes('<!DOCTYPE html>')
            ) {
              hasVideoError.value = true
              videoErrorMessage.value = '服务器返回了网页而不是视频内容'
            } else {
              newHls.startLoad()
            }
            break
          case HlsLib.ErrorTypes.MEDIA_ERROR:
            newHls.recoverMediaError()
            break
          default:
            hasVideoError.value = true
            videoErrorMessage.value = '视频播放失败，格式可能不受支持'
            newHls.destroy()
        }
      })

      try {
        newHls.loadSource(videoUrl)
        newHls.attachMedia(videoEl.value)
        newHls.on(HlsLib.Events.MANIFEST_PARSED, () => {
          videoEl.value?.play().catch(() => {})
        })
      } catch (error: unknown) {
        hasVideoError.value = true
        videoErrorMessage.value =
          '加载视频源失败: ' + (error instanceof Error ? error.message : '未知错误')
      }
    } else {
      videoEl.value.src = videoUrl
    }
  }

  const beginPlayback = async (recordWatchHistory: () => Promise<boolean>) => {
    const canPlay = await recordWatchHistory()
    if (!canPlay) return false

    hasVideoError.value = false
    videoErrorMessage.value = ''
    isPlaying.value = true

    playbackSetupTimer = setTimeout(() => {
      playbackSetupTimer = null
      void setupVideoSource(videoSrc.value)
    }, 100)

    return true
  }

  const handleVideoError = () => {
    hasVideoError.value = true
    videoErrorMessage.value = '视频加载失败，播放地址可能无效'
  }

  const handleDownloadVideo = () => {
    if (!videoSrc.value) {
      showToast('暂无可下载地址')
      return
    }
    const a = document.createElement('a')
    a.href = videoSrc.value
    a.target = '_blank'
    a.rel = 'noopener'
    a.download = `${videoDetail.value?.vod_name || 'video'}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleScroll = () => {
    if (!videoContainerRef.value || !isPlaying.value) return
    const scrollY = window.scrollY || document.documentElement.scrollTop
    isVideoFloating.value = scrollY > 100
  }

  return {
    isPlaying,
    isVideoFloating,
    videoContainerRef,
    videoEl,
    hasVideoError,
    videoErrorMessage,
    isVideoPlayed,
    canShowDownload,
    cleanupVideoPlayer,
    stopPlayback,
    setupVideoSource,
    beginPlayback,
    handleVideoError,
    handleDownloadVideo,
    handleScroll,
  }
}
