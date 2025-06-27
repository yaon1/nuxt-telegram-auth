import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Mirrors Telegram's theme into CSS variables (`--tg-bg-color`, `--tg-text-color`, …)
 * on <html>, and keeps them in sync when the user switches theme in Telegram.
 */
export function useWebAppTheme(prefix = '--tg-'): void {
  const apply = () => {
    const app = window.Telegram?.WebApp
    if (!app) return
    const root = document.documentElement
    for (const [key, value] of Object.entries(app.themeParams ?? {})) {
      root.style.setProperty(`${prefix}${key.replace(/_/g, '-')}`, value)
    }
    root.dataset.tgColorScheme = app.colorScheme
  }

  onMounted(() => {
    apply()
    window.Telegram?.WebApp?.onEvent?.('themeChanged', apply)
  })
  onBeforeUnmount(() => window.Telegram?.WebApp?.offEvent?.('themeChanged', apply))
}
