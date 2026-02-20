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
  onEvent?(event: string, handler: () => void): void
  offEvent?(event: string, handler: () => void): void
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
  }
  BackButton?: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void }
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
export function useTelegramWebApp(options: { expand?: boolean } = {}) {
  const webApp = ref<TelegramWebApp | null>(null)
  const { login: _login, ...auth } = useTelegramAuth()

  onMounted(() => {
    const app = window.Telegram?.WebApp
    // initData is empty when the script is loaded in a normal browser tab.
    if (app && app.initData) {
      webApp.value = app
      app.ready()
      // Mini Apps open half-height on mobile; most apps want the full viewport.
      if (options.expand) app.expand()
    }
  })

  async function signIn() {
    if (!webApp.value) throw new Error('Not running inside a Telegram Mini App')
    return auth.loginWithWebApp(webApp.value.initData)
  }

  /** Haptic feedback; silently does nothing outside Telegram. */
  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'light') => webApp.value?.HapticFeedback?.impactOccurred(style),
    notify: (type: 'error' | 'success' | 'warning') => webApp.value?.HapticFeedback?.notificationOccurred(type),
  }

  return {
    webApp,
    haptic,
    close: () => webApp.value?.close(),
    isMiniApp: computed(() => webApp.value !== null),
    colorScheme: computed(() => webApp.value?.colorScheme ?? null),
    signIn,
    ...auth,
  }
}
