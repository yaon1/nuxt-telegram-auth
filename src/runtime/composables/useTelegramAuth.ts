import { computed } from 'vue'
import type { TelegramUser } from '../server/utils/verify'
import { useRequestFetch, useRuntimeConfig, useState } from '#imports'

let channel: BroadcastChannel | null | undefined

/** Shared channel so signing out in one tab signs out the others. */
function broadcast(): BroadcastChannel | null {
  if (channel !== undefined) return channel
  channel = import.meta.client && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('nuxt-telegram-auth') : null
  return channel
}

export function useTelegramAuth() {
  const { apiBase } = useRuntimeConfig().public.telegramAuth
  const user = useState<TelegramUser | null>('telegram-auth:user', () => null)
  const request = useRequestFetch()
  const pending = useState('telegram-auth:pending', () => false)
  const listening = useState('telegram-auth:listening', () => false)
  if (import.meta.client && !listening.value) {
    listening.value = true
    broadcast()?.addEventListener('message', (e) => {
      if (e.data === 'logout') user.value = null
    })
  }
  const error = useState<string | null>('telegram-auth:error', () => null)

  /** Runs an auth request, tracking `pending` and turning failures into a readable `error`. */
  async function track<R>(task: () => Promise<R>): Promise<R> {
    pending.value = true
    error.value = null
    try {
      return await task()
    } catch (e) {
      const data = e as { data?: { statusMessage?: string }; statusMessage?: string }
      error.value = data.data?.statusMessage ?? data.statusMessage ?? 'Sign-in failed'
      throw e
    } finally {
      pending.value = false
    }
  }

  async function fetchSession(): Promise<TelegramUser | null> {
    user.value = (await request<{ user: TelegramUser | null }>(`${apiBase}/session`)).user
    return user.value
  }

  async function login(widgetData: Record<string, unknown>): Promise<TelegramUser> {
    user.value = await track(() => $fetch<TelegramUser>(`${apiBase}/login`, { method: 'POST', body: widgetData }))
    return user.value
  }

  async function loginWithWebApp(initData: string): Promise<TelegramUser> {
    user.value = await track(() => $fetch<TelegramUser>(`${apiBase}/webapp`, { method: 'POST', body: { initData } }))
    return user.value
  }

  async function logout(): Promise<void> {
    await $fetch(`${apiBase}/logout`, { method: 'POST' })
    user.value = null
    broadcast()?.postMessage('logout')
  }

  return { user, loggedIn: computed(() => user.value !== null), pending, error, fetchSession, login, loginWithWebApp, logout }
}
