// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { useMainButton } from '../src/runtime/composables/useMainButton'
import { useWebAppTheme } from '../src/runtime/composables/useWebAppTheme'

afterEach(() => {
  delete window.Telegram
})

it('copies theme params into CSS variables and follows theme changes', () => {
  let onTheme: (() => void) | undefined
  const app = {
    colorScheme: 'dark',
    themeParams: { bg_color: '#000000', button_text_color: '#ffffff' },
    onEvent: vi.fn((_: string, cb: () => void) => (onTheme = cb)),
    offEvent: vi.fn(),
  }
  window.Telegram = { WebApp: app as never }

  const w = mount(defineComponent(() => (useWebAppTheme(), () => null)))
  const style = document.documentElement.style
  expect(style.getPropertyValue('--tg-bg-color')).toBe('#000000')
  expect(style.getPropertyValue('--tg-button-text-color')).toBe('#ffffff')
  expect(document.documentElement.dataset.tgColorScheme).toBe('dark')

  app.themeParams.bg_color = '#ffffff'
  onTheme?.()
  expect(style.getPropertyValue('--tg-bg-color')).toBe('#ffffff')
  w.unmount()
  expect(app.offEvent).toHaveBeenCalledWith('themeChanged', onTheme)
})

it('drives the MainButton and cleans up', async () => {
  const MainButton = { setText: vi.fn(), show: vi.fn(), hide: vi.fn(), onClick: vi.fn(), offClick: vi.fn() }
  window.Telegram = { WebApp: { MainButton } as never }
  const valid = ref(false)
  const submit = vi.fn()

  const w = mount(defineComponent(() => (useMainButton('Оплатить', submit, valid), () => null)))
  expect(MainButton.setText).toHaveBeenCalledWith('Оплатить')
  expect(MainButton.hide).toHaveBeenCalled()
  expect(MainButton.onClick).toHaveBeenCalledWith(submit)

  valid.value = true
  await nextTick()
  expect(MainButton.show).toHaveBeenCalled()

  w.unmount()
  expect(MainButton.offClick).toHaveBeenCalledWith(submit)
})
