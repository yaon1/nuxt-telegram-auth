// Mini App storefront: signs in from initData and tracks referrals from start_param.
export default defineNuxtConfig({
  modules: ['nuxt-telegram-auth'],
  compatibilityDate: '2025-07-15',
  telegramAuth: {
    botUsername: 'acme_shop_bot',
    webApp: true,
    cookie: { name: 'shop', sameSite: 'none' },
  },
})
