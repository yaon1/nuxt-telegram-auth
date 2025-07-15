import { onBeforeUnmount, onMounted } from 'vue'

/** Shows Telegram's back arrow in the header while mounted, e.g. on nested pages. */
export function useBackButton(onBack: () => void): void {
  onMounted(() => {
    const b = window.Telegram?.WebApp?.BackButton
    b?.onClick(onBack)
    b?.show()
  })
  onBeforeUnmount(() => {
    const b = window.Telegram?.WebApp?.BackButton
    b?.offClick(onBack)
    b?.hide()
  })
}
