import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports'
import { useTelegramAuth } from '../composables/useTelegramAuth'

/**
 * Named route middleware: `definePageMeta({ middleware: 'telegram-auth' })`.
 * Unauthenticated visitors go to `redirectTo` with the original path in `?redirect=`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { redirectTo } = useRuntimeConfig().public.telegramAuth
  const { loggedIn, fetchSession } = useTelegramAuth()

  if (!loggedIn.value) await fetchSession()
  if (!loggedIn.value && to.path !== redirectTo) {
    return navigateTo({ path: redirectTo, query: { redirect: to.fullPath } })
  }
})
