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
  let playbackSession = 0

  const canShowDownload = computed(
    () => isPlaying.value && !!videoSrc.value && !hasVideoError.value,
  )

  const releaseVideoResources = () => {
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

  // 使所有尚未完成的异步播放器初始化失效，防止旧视频在切换后重新开始播放。
  const cleanupVideoPlayer = () => {
    playbackSession += 1
    releaseVideoResources()
  }

  const stopPlayback = () => {
    cleanupVideoPlayer()
    isPlaying.value = false
  }

  const isCurrentPlayback = (
    session: number,
    media?: HTMLVideoElement | null,
    player?: Hls,
  ) =>
    session === playbackSession &&
    isPlaying.value &&
    (!media || videoEl.value === media) &&
    (!player || hls.value === player)

  const setupVideoSource = async (src: string, session = playbackSession) => {
    const media = videoEl.value
    if (!media || !isCurrentPlayback(session, media)) return

    let videoUrl = src
    if (!videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
      videoUrl = `${BASE_URL}/${videoUrl}`
    }
    if (videoUrl.includes('localhost') && !src.includes('localhost')) {
      videoUrl = `${BASE_URL}/${src}`
    }

    isVideoPlayed.value = false

    media.setAttribute('playsinline', 'true')
    media.setAttribute('webkit-playsinline', 'true')
    media.setAttribute('x5-playsinline', 'true')
    media.setAttribute('x5-video-player-type', 'h5')
    media.setAttribute('x5-video-player-fullscreen', 'false')

    if (videoUrl.includes('.m3u8')) {
      if (media.canPlayType('application/vnd.apple.mpegurl')) {
        media.src = videoUrl
        return
      }

      const { default: HlsLib } = await import('hls.js')
      if (!isCurrentPlayback(session, media)) return

      if (!HlsLib.isSupported()) {
        media.src = videoUrl
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
      if (!isCurrentPlayback(session, media)) {
        newHls.destroy()
        return
      }
      hls.value = newHls

      newHls.on(HlsLib.Events.ERROR, (_event, data) => {
        if (!isCurrentPlayback(session, media, newHls)) return
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
            hls.value = null
        }
      })

      try {
        newHls.loadSource(videoUrl)
        newHls.attachMedia(media)
        newHls.on(HlsLib.Events.MANIFEST_PARSED, () => {
          if (isCurrentPlayback(session, media, newHls)) {
            media.play().catch(() => {})
          }
        })
      } catch (error: unknown) {
        if (!isCurrentPlayback(session, media, newHls)) return
        hasVideoError.value = true
        videoErrorMessage.value =
          '加载视频源失败: ' + (error instanceof Error ? error.message : '未知错误')
      }
    } else {
      media.src = videoUrl
    }
  }

  const beginPlayback = async (recordWatchHistory: () => Promise<boolean>) => {
    const session = ++playbackSession
    releaseVideoResources()
    isPlaying.value = false

    const canPlay = await recordWatchHistory()
    if (!canPlay || session !== playbackSession) return false

    hasVideoError.value = false
    videoErrorMessage.value = ''
    isPlaying.value = true

    playbackSetupTimer = setTimeout(() => {
      playbackSetupTimer = null
      if (session === playbackSession && isPlaying.value) {
        void setupVideoSource(videoSrc.value, session)
      }
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
