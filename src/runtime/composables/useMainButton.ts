import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

/**
 * Shows Telegram's native bottom button while the component is mounted.
 * `text` may be reactive; `visible` lets a form hide it until it's valid.
 */
export function useMainButton(text: Ref<string> | string, onClick: () => void, visible?: Ref<boolean>): void {
  const button = () => window.Telegram?.WebApp?.MainButton
  const sync = () => {
    const b = button()
    if (!b) return
    b.setText(typeof text === 'string' ? text : text.value)
    if (visible === undefined || visible.value) b.show()
    else b.hide()
  }

  onMounted(() => {
    sync()
    button()?.onClick(onClick)
  })
  if (typeof text !== 'string') watch(text, sync)
  if (visible) watch(visible, sync)
  onBeforeUnmount(() => {
    button()?.offClick(onClick)
    button()?.hide()
  })
}
