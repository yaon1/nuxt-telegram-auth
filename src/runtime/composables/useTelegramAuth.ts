import { computed } from 'vue'
import type { TelegramUser } from '../server/utils/verify'
import { useRequestFetch, useRuntimeConfig, useState } from '#imports'

export function useTelegramAuth() {
  const { apiBase } = useRuntimeConfig().public.telegramAuth
  const user = useState<TelegramUser | null>('telegram-auth:user', () => null)
  const request = useRequestFetch()
  const pending = useState('telegram-auth:pending', () => false)
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
  }

  return { user, loggedIn: computed(() => user.value !== null), pending, error, fetchSession, login, loginWithWebApp, logout }
}
