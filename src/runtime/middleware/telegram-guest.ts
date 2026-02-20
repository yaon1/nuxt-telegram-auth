import { defineNuxtRouteMiddleware, navigateTo } from '#imports'
import { useTelegramAuth } from '../composables/useTelegramAuth'

/** For login pages: signed-in users are sent on to `?redirect=` (or home) instead. */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetchSession } = useTelegramAuth()
  if (!loggedIn.value) await fetchSession()
  if (loggedIn.value) {
    const target = typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/') && !to.query.redirect.startsWith('//') ? to.query.redirect : '/'
    return navigateTo(target)
  }
})
