import { computed } from 'vue'
import type { TelegramUser } from '../server/utils/verify'
import { useRequestFetch, useRuntimeConfig, useState } from '#imports'

export function useTelegramAuth() {
  const { apiBase } = useRuntimeConfig().public.telegramAuth
  const user = useState<TelegramUser | null>('telegram-auth:user', () => null)
  const request = useRequestFetch()

  async function fetchSession(): Promise<TelegramUser | null> {
    user.value = (await request<{ user: TelegramUser | null }>(`${apiBase}/session`)).user
    return user.value
  }

  async function login(widgetData: Record<string, unknown>): Promise<TelegramUser> {
    user.value = await $fetch<TelegramUser>(`${apiBase}/login`, { method: 'POST', body: widgetData })
    return user.value
  }

  async function loginWithWebApp(initData: string): Promise<TelegramUser> {
    user.value = await $fetch<TelegramUser>(`${apiBase}/webapp`, { method: 'POST', body: { initData } })
    return user.value
  }

  async function logout(): Promise<void> {
    await $fetch(`${apiBase}/logout`, { method: 'POST' })
    user.value = null
  }

  return { user, loggedIn: computed(() => user.value !== null), fetchSession, login, loginWithWebApp, logout }
}
