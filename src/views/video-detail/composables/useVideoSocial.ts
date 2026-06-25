import { ref, type Ref } from 'vue'
import { updateUserLog, updateVideoDigg } from '@/api/fetch-api'
import type { VideoDetail } from '@/api/fetch-api'
import { buildShareUrl, isLoginRequiredResult } from '../utils'
import type { useVideoDetailAuth } from './useVideoDetailAuth'
import type { useVideoDetailUser } from './useVideoDetailUser'

type UserApi = ReturnType<typeof useVideoDetailUser>
type AuthApi = ReturnType<typeof useVideoDetailAuth>

export function useVideoSocial(
  videoDetail: Ref<VideoDetail | null>,
  userApi: UserApi,
  authApi: AuthApi,
) {
  const isDiggLoading = ref(false)
  const isDigged = ref(false)
  const isCollectLoading = ref(false)
  const isCollected = ref(false)

  const resetSocialState = () => {
    isDigged.value = false
    isDiggLoading.value = false
    isCollected.value = false
    isCollectLoading.value = false
  }

  const handleDigg = async () => {
    if (isDiggLoading.value || isDigged.value) {
      showToast({ message: '您已经点过赞了', position: 'top', duration: 2000 })
      return
    }
    if (!videoDetail.value?.vod_id) return

    try {
      isDiggLoading.value = true
      const result = await updateVideoDigg({
        mid: 1,
        id: videoDetail.value.vod_id,
        type: 'up',
      })
      if (result?.code === 1) {
        isDigged.value = true
        showToast({ message: '点赞成功', position: 'top', duration: 2000, icon: 'checked' })
        if (result.data?.up) {
          videoDetail.value.vod_up = result.data.up
        } else {
          videoDetail.value.vod_up = (Number(videoDetail.value.vod_up) || 0) + 1
        }
      } else {
        showToast({
          message: result?.msg || '点赞失败，请稍后再试',
          position: 'top',
          duration: 2000,
          icon: 'cross',
        })
      }
    } catch (error: unknown) {
      showToast({
        message: error instanceof Error ? error.message : '点赞失败，请稍后再试',
        position: 'top',
        duration: 2000,
        icon: 'cross',
      })
    } finally {
      isDiggLoading.value = false
    }
  }

  const handleCollect = async () => {
    if (isCollectLoading.value || !videoDetail.value?.vod_id) return

    try {
      isCollectLoading.value = true
      const action = isCollected.value ? 'del' : 'set'
      const result = await updateUserLog({
        mid: 1,
        id: videoDetail.value.vod_id,
        type: 2,
        ac: action,
      })

      if (result?.code === 1) {
        isCollected.value = !isCollected.value
        showToast({
          message: isCollected.value ? '已加入收藏' : '已取消收藏',
          position: 'top',
          duration: 2000,
          icon: isCollected.value ? 'success' : 'info',
        })
      } else if (isLoginRequiredResult(result)) {
        authApi.promptLogin('收藏功能需要登录，是否前往登录？')
      } else {
        showToast({
          message: result?.msg || '操作失败，请稍后再试',
          position: 'top',
          duration: 2000,
          icon: 'cross',
        })
      }
    } catch (error: unknown) {
      showToast({
        message: error instanceof Error ? error.message : '操作失败，请稍后再试',
        position: 'top',
        duration: 2000,
        icon: 'cross',
      })
    } finally {
      isCollectLoading.value = false
    }
  }

  const shareVideo = () => {
    if (!userApi.userStore.isLoggedIn) {
      authApi.promptLogin('分享功能需要登录，是否前往登录？')
      return
    }

    const shareUrl = buildShareUrl(userApi.userInfo.value?.rec_code || '')

    const copyWithExecCommand = (text: string) => {
      const tempInput = document.createElement('input')
      tempInput.value = text
      document.body.appendChild(tempInput)
      tempInput.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(tempInput)
      return successful
    }

    const showCopiedDialog = () => {
      showDialog({
        title: '分享链接已复制',
        message:
          '链接已复制到剪贴板，可以发送给好友了！\n\n温馨提示：分享成功后，如果观影次数未增加，可以点击"刷新"按钮来更新最新次数。',
        confirmButtonText: '我知道了',
        confirmButtonColor: '#ff9500',
        className: 'dark-dialog',
      })
    }

    if (copyWithExecCommand(shareUrl)) {
      showCopiedDialog()
      return
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(showCopiedDialog)
        .catch(() => {
          showToast({ message: '复制失败，请手动分享链接', position: 'top', duration: 3000 })
        })
    } else {
      showToast({ message: '复制失败，请手动分享链接', position: 'top', duration: 3000 })
    }
  }

  return {
    isDiggLoading,
    isDigged,
    isCollectLoading,
    isCollected,
    resetSocialState,
    handleDigg,
    handleCollect,
    shareVideo,
  }
}
