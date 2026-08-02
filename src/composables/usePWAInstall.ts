import { ref, onMounted, onBeforeUnmount } from 'vue'

export function usePWAInstall() {
  const deferredPrompt = ref<Event | null>(null)
  const isInstallable = ref(false)

  function onBeforeInstallPrompt(e: Event) {
    e.preventDefault()
    deferredPrompt.value = e
    isInstallable.value = true
  }

  function onAppInstalled() {
    deferredPrompt.value = null
    isInstallable.value = false
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  })

  async function install() {
    const prompt = deferredPrompt.value as any
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice
    deferredPrompt.value = null
    isInstallable.value = false
  }

  return { isInstallable, install }
}
