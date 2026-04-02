import {
  addComponent,
  addImports,
  addRouteMiddleware,
  addServerHandler,
  addServerImports,
  createResolver,
  defineNuxtModule,
  useLogger,
} from '@nuxt/kit'
import { defu } from 'defu'

export type { TelegramUser } from './runtime/server/utils/verify'
export type { WebAppInitData, WebAppUser } from './runtime/server/utils/webapp'
export type { TelegramWebApp } from './runtime/composables/useTelegramWebApp'

export interface ModuleOptions {
  /** Bot token from @BotFather. Prefer NUXT_TELEGRAM_AUTH_BOT_TOKEN. */
  botToken: string
  /** Bot username without "@", shown in the widget. */
  botUsername: string
  /** ≥32 chars, used to seal the session cookie. Prefer NUXT_TELEGRAM_AUTH_SESSION_PASSWORD. */
  sessionPassword: string
  /** Reject widget payloads older than this many seconds. */
  authMaxAge: number
  /** Reject Mini App init data older than this many seconds; it's resent on every launch, so keep it short. */
  webAppMaxAge: number
  /** Session cookie lifetime in seconds. */
  sessionMaxAge: number
  /** Prefix for the server routes. */
  apiBase: string
  /** Load telegram-web-app.js in <head> so `useTelegramWebApp()` works inside Mini Apps. */
  webApp: boolean
  /** Where the `telegram-auth` middleware sends visitors who are not logged in. */
  redirectTo: string
  /** Restrict sign-in to these Telegram ids or usernames; empty allows everyone. */
  allowedUsers: (string | number)[]
  /** Session cookie settings. */
  cookie: { name: string; domain?: string; sameSite: 'lax' | 'strict' | 'none'; secure?: boolean }
}

export default defineNuxtModule<ModuleOptions>({
  meta: { name: 'nuxt-telegram-auth', configKey: 'telegramAuth', compatibility: { nuxt: '>=3.16.0' } },
  defaults: {
    botToken: '',
    botUsername: '',
    sessionPassword: '',
    authMaxAge: 86_400,
    webAppMaxAge: 3600,
    sessionMaxAge: 60 * 60 * 24 * 30,
    apiBase: '/api/_auth/telegram',
    webApp: false,
    redirectTo: '/login',
    allowedUsers: [],
    cookie: { name: 'nuxt-telegram-auth', sameSite: 'lax' },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const logger = useLogger('nuxt-telegram-auth')

    nuxt.options.runtimeConfig.telegramAuth = defu(nuxt.options.runtimeConfig.telegramAuth, {
      botToken: options.botToken,
      sessionPassword: options.sessionPassword,
      authMaxAge: options.authMaxAge,
      webAppMaxAge: options.webAppMaxAge,
      sessionMaxAge: options.sessionMaxAge,
      allowedUsers: options.allowedUsers,
      cookie: options.cookie,
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

    if (options.sessionPassword && options.sessionPassword.length < 32) {
      logger.warn('`telegramAuth.sessionPassword` is shorter than 32 characters; sessions will fail at runtime.')
    }

    if (!options.botUsername && !nuxt.options._prepare) {
      logger.warn('`telegramAuth.botUsername` is empty; the login widget will not render.')
    }

    for (const [route, method] of [
      ['login', 'post'],
      ['webapp', 'post'],
      ['callback', 'get'],
      ['session', 'get'],
      ['logout', 'post'],
    ] as const) {
      addServerHandler({ route: `${options.apiBase}/${route}`, method, handler: resolve(`./runtime/server/api/${route}.${method}`) })
    }

    if (nuxt.options.dev) {
      addServerHandler({ route: `${options.apiBase}/dev-login`, method: 'post', handler: resolve('./runtime/server/api/dev-login.post') })
    }

    addServerImports([
      { name: 'requireTelegramUser', from: resolve('./runtime/server/utils/session') },
      { name: 'getTelegramUser', from: resolve('./runtime/server/utils/session') },
      { name: 'verifyTelegramLogin', from: resolve('./runtime/server/utils/verify') },
      { name: 'defineTelegramAuthHandler', from: resolve('./runtime/server/utils/handler') },
      { name: 'verifyWebAppInitData', from: resolve('./runtime/server/utils/webapp') },
      { name: 'verifyWebAppSignature', from: resolve('./runtime/server/utils/webapp-signature') },
    ])
    addImports([
      { name: 'useTelegramAuth', from: resolve('./runtime/composables/useTelegramAuth') },
      { name: 'useTelegramWebApp', from: resolve('./runtime/composables/useTelegramWebApp') },
      { name: 'useWebAppTheme', from: resolve('./runtime/composables/useWebAppTheme') },
      { name: 'useMainButton', from: resolve('./runtime/composables/useMainButton') },
      { name: 'useBackButton', from: resolve('./runtime/composables/useBackButton') },
    ])
    addRouteMiddleware({ name: 'telegram-auth', path: resolve('./runtime/middleware/telegram-auth') })
    addRouteMiddleware({ name: 'telegram-guest', path: resolve('./runtime/middleware/telegram-guest') })
    addComponent({ name: 'TelegramLoginButton', filePath: resolve('./runtime/components/TelegramLoginButton.vue') })
  },
})

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'telegram-auth:login': (payload: {
      user: import('./runtime/server/utils/verify').TelegramUser
      event: import('h3').H3Event
      startParam?: string
    }) => void | Promise<void>
    'telegram-auth:logout': (payload: {
      user: import('./runtime/server/utils/verify').TelegramUser
      event: import('h3').H3Event
    }) => void | Promise<void>
  }
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    telegramAuth: Pick<
      ModuleOptions,
      'botToken' | 'sessionPassword' | 'authMaxAge' | 'webAppMaxAge' | 'sessionMaxAge' | 'allowedUsers' | 'cookie'
    >
  }
  interface PublicRuntimeConfig {
    telegramAuth: Pick<ModuleOptions, 'botUsername' | 'apiBase' | 'redirectTo'>
  }
}
