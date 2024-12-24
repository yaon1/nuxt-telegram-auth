export default defineNuxtConfig({
  modules: ['../src/module'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  telegramAuth: {
    botUsername: 'your_bot',
  },
})
