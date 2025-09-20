<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import type { TelegramUser } from '../server/utils/verify'
import { useRuntimeConfig } from '#imports'
import { useTelegramAuth } from '../composables/useTelegramAuth'

const props = withDefaults(
  defineProps<{
    size?: 'large' | 'medium' | 'small'
    cornerRadius?: number
    showAvatar?: boolean
    requestAccess?: boolean
    lang?: string
    /** 'redirect' sends the browser to the callback route instead of using a JS callback. */
    mode?: 'callback' | 'redirect'
    /** Where to land after a redirect-mode login. */
    redirectTo?: string
  }>(),
  { size: 'large', cornerRadius: undefined, showAvatar: true, requestAccess: false, lang: undefined, mode: 'callback', redirectTo: '/' },
)
const emit = defineEmits<{ login: [user: TelegramUser]; error: [error: unknown] }>()

const { botUsername, apiBase } = useRuntimeConfig().public.telegramAuth
const { login } = useTelegramAuth()
const container = ref<HTMLElement>()
const loaded = ref(false)
// The widget calls a global function by name, so each instance registers a unique one.
const callback = `__telegramAuth_${useId().replace(/\W/g, '')}`

onMounted(() => {
  ;(window as unknown as Record<string, unknown>)[callback] = async (data: Record<string, unknown>) => {
    try {
      emit('login', await login(data))
    } catch (error) {
      emit('error', error)
    }
  }

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.dataset.telegramLogin = botUsername
  script.dataset.size = props.size
  script.dataset.userpic = String(props.showAvatar)
  if (props.mode === 'redirect') {
    script.dataset.authUrl = `${location.origin}${apiBase}/callback?redirect=${encodeURIComponent(props.redirectTo)}`
  } else {
    script.dataset.onauth = `${callback}(user)`
  }
  if (props.cornerRadius !== undefined) script.dataset.radius = String(props.cornerRadius)
  if (props.requestAccess) script.dataset.requestAccess = 'write'
  if (props.lang) script.dataset.lang = props.lang
  script.onload = () => (loaded.value = true)
  script.onerror = () => emit('error', new Error('Could not load telegram-widget.js (blocked or offline)'))
  container.value?.appendChild(script)
})

onBeforeUnmount(() => {
  delete (window as unknown as Record<string, unknown>)[callback]
})
</script>

<template>
  <div class="telegram-login-button">
    <!-- Shown until Telegram's script renders the iframe; useful for a skeleton or a "loading" hint. -->
    <slot v-if="!loaded" name="loading" />
    <div ref="container" />
  </div>
</template>
