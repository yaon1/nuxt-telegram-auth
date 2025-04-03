import { addComponent, addImports, addRouteMiddleware, addServerHandler, addServerImports, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
  /** Bot token from @BotFather. Prefer NUXT_TELEGRAM_AUTH_BOT_TOKEN. */
  botToken: string
  /** Bot username without "@", shown in the widget. */
  botUsername: string
  /** ≥32 chars, used to seal the session cookie. Prefer NUXT_TELEGRAM_AUTH_SESSION_PASSWORD. */
  sessionPassword: string
  /** Reject widget payloads older than this many seconds. */
  authMaxAge: number
  /** Session cookie lifetime in seconds. */
  sessionMaxAge: number
  /** Prefix for the server routes. */
  apiBase: string
  /** Load telegram-web-app.js in <head> so `useTelegramWebApp()` works inside Mini Apps. */
  webApp: boolean
  /** Where the `telegram-auth` middleware sends visitors who are not logged in. */
  redirectTo: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: { name: 'nuxt-telegram-auth', configKey: 'telegramAuth', compatibility: { nuxt: '>=3.16.0' } },
  defaults: {
    botToken: '',
    botUsername: '',
    sessionPassword: '',
    authMaxAge: 86_400,
    sessionMaxAge: 60 * 60 * 24 * 30,
    apiBase: '/api/_auth/telegram',
    webApp: false,
    redirectTo: '/login',
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const logger = useLogger('nuxt-telegram-auth')

    nuxt.options.runtimeConfig.telegramAuth = defu(nuxt.options.runtimeConfig.telegramAuth, {
      botToken: options.botToken,
      sessionPassword: options.sessionPassword,
      authMaxAge: options.authMaxAge,
      sessionMaxAge: options.sessionMaxAge,
    })
    nuxt.options.runtimeConfig.public.telegramAuth = defu(nuxt.options.runtimeConfig.public.telegramAuth, {
      botUsername: options.botUsername,
      apiBase: options.apiBase,
      redirectTo: options.redirectTo,
    })

    if (options.webApp) {
      nuxt.options.app.head.script ||= []
      nuxt.options.app.head.script.push({ src: 'https://telegram.org/js/telegram-web-app.js', tagPriority: 'critical' })
    }

    if (!options.botUsername && !nuxt.options._prepare) {
      logger.warn('`telegramAuth.botUsername` is empty; the login widget will not render.')
    }

    for (const [route, method] of [['login', 'post'], ['webapp', 'post'], ['session', 'get'], ['logout', 'post']] as const) {
      addServerHandler({ route: `${options.apiBase}/${route}`, method, handler: resolve(`./runtime/server/api/${route}.${method}`) })
    }

    addServerImports([
      { name: 'requireTelegramUser', from: resolve('./runtime/server/utils/session') },
      { name: 'getTelegramUser', from: resolve('./runtime/server/utils/session') },
      { name: 'verifyTelegramLogin', from: resolve('./runtime/server/utils/verify') },
      { name: 'verifyWebAppInitData', from: resolve('./runtime/server/utils/webapp') },
    ])
    addImports([
      { name: 'useTelegramAuth', from: resolve('./runtime/composables/useTelegramAuth') },
      { name: 'useTelegramWebApp', from: resolve('./runtime/composables/useTelegramWebApp') },
    ])
    addRouteMiddleware({ name: 'telegram-auth', path: resolve('./runtime/middleware/telegram-auth') })
    addComponent({ name: 'TelegramLoginButton', filePath: resolve('./runtime/components/TelegramLoginButton.vue') })
  },
})

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    telegramAuth: Pick<ModuleOptions, 'botToken' | 'sessionPassword' | 'authMaxAge' | 'sessionMaxAge'>
  }
  interface PublicRuntimeConfig {
    telegramAuth: Pick<ModuleOptions, 'botUsername' | 'apiBase' | 'redirectTo'>
  }
}
