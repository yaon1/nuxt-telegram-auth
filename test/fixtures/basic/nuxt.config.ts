import TelegramAuth from '../../../src/module'

export default defineNuxtConfig({
  modules: [TelegramAuth],
  compatibilityDate: '2025-07-15',
  telegramAuth: {
    botUsername: 'test_bot',
    botToken: '123:test-token',
    sessionPassword: 'a-very-long-session-password-for-tests!!',
    allowedUsers: [42, 7, 13, '@ada'],
  },
})
