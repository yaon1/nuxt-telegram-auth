// Internal admin panel: only two Telegram accounts may sign in, every page is protected.
export default defineNuxtConfig({
  modules: ['nuxt-telegram-auth'],
  compatibilityDate: '2025-07-15',
  telegramAuth: {
    botUsername: 'acme_admin_bot',
    allowedUsers: ['@cto', 123456789],
    redirectTo: '/login',
  },
})
