import { computed, onMounted, ref } from 'vue'
import { useTelegramAuth } from './useTelegramAuth'

/** The subset of `window.Telegram.WebApp` this module relies on. */
export interface TelegramWebApp {
  initData: string
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  platform: string
  ready(): void
  expand(): void
  close(): void
  HapticFeedback?: { impactOccurred(style: 'light' | 'medium' | 'heavy'): void }
  MainButton?: { setText(text: string): void; show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

/**
 * Access to the Mini App runtime plus one-call sign-in. `webApp` is null outside Telegram
 * (or during SSR), so pages can render a normal login fallback.
 */
export function useTelegramWebApp() {
  const webApp = ref<TelegramWebApp | null>(null)
  const { login: _login, ...auth } = useTelegramAuth()

  onMounted(() => {
    const app = window.Telegram?.WebApp
    // initData is empty when the script is loaded in a normal browser tab.
    if (app && app.initData) {
      webApp.value = app
      app.ready()
    }
  })

  async function signIn() {
    if (!webApp.value) throw new Error('Not running inside a Telegram Mini App')
    return auth.loginWithWebApp(webApp.value.initData)
  }

  return {
    webApp,
    isMiniApp: computed(() => webApp.value !== null),
    colorScheme: computed(() => webApp.value?.colorScheme ?? null),
    signIn,
    ...auth,
  }
}
