# nuxt-telegram-auth

**Вход через Telegram для Nuxt 4 (и 3.16+) за пять минут — на сайте и внутри Telegram Mini Apps, без своей БД и OAuth-сервера.** Кладёте кнопку, а на сервере получаете проверенного пользователя в зашифрованной cookie-сессии. Подпись Telegram проверяется на сервере, поэтому подделать вход, отредактировав данные в браузере, нельзя.

- `<TelegramLoginButton>`: официальный Login Widget в виде компонента.
- Проверка подписи и «свежести» на **Web Crypto**: работает в Node, Bun, Deno, Cloudflare и Vercel Edge.
- Зашифрованная `httpOnly`-cookie, база данных не нужна.
- `useTelegramAuth()` на клиенте и `requireTelegramUser(event)` на сервере, оба импортируются автоматически.
- **Mini Apps**: вход по `initData` одной строкой, тема Telegram в CSS-переменных, `MainButton`, `BackButton`, вибрация.
- Middleware для защиты страниц, allow-list, хуки для записи пользователей в БД, защита от CSRF и open redirect.

## Пример использования

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const { user, loggedIn, fetchSession, logout } = useTelegramAuth()
await fetchSession() // работает и при SSR
</script>

<template>
  <p v-if="loggedIn">Привет, {{ user.first_name }}! <button @click="logout">Выйти</button></p>
  <TelegramLoginButton v-else :corner-radius="8" request-access />
</template>
```

```ts
// server/api/orders.get.ts
export default defineEventHandler(async (event) => {
  const user = await requireTelegramUser(event) // 401, если не залогинен
  return getOrdersFor(user.id)
})
```

## Защита страниц

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'telegram-auth' }) // гости уходят на /login?redirect=/dashboard
</script>
```

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'telegram-guest' }) // вошедших отправляет дальше по ?redirect=
</script>
```

Middleware работают и при SSR: защищённая страница не отрендерится на сервере для гостя.

## Вход через редирект

```vue
<TelegramLoginButton mode="redirect" redirect-to="/dashboard" />
```

Telegram перенаправит браузер на `/api/_auth/telegram/callback`, модуль проверит подпись, создаст сессию и вернёт пользователя на `redirect-to`. Принимаются только относительные пути, поэтому через параметр нельзя увести пользователя на чужой сайт.

## Telegram Mini Apps

```ts
// nuxt.config.ts
telegramAuth: { botUsername: 'my_bot', webApp: true, cookie: { name: 'tg', sameSite: 'none' } }
```

```vue
<script setup lang="ts">
const { isMiniApp, signIn, user, haptic } = useTelegramWebApp({ expand: true })
useWebAppTheme() // --tg-bg-color, --tg-text-color, --tg-button-color …
useMainButton('Оформить заказ', checkout, cartNotEmpty)
useBackButton(() => router.back())

onMounted(() => isMiniApp.value && signIn())
</script>
```

`signIn()` отправляет `initData` на сервер, где проверяется HMAC-подпись, и создаёт ту же cookie-сессию, что и Login Widget. Поэтому `requireTelegramUser` одинаково работает для сайта и Mini App. Mini App открывается во фрейме Telegram, поэтому cookie нужен `SameSite=None`.

## Проверка без токена бота

Если данные Mini App проверяет другой сервис, у которого нет токена бота, используйте Ed25519-подпись:

```ts
const result = await verifyWebAppSignature(initData, 7342037359 /* id бота */)
if (result.ok) console.log(result.data.user)
```

Публичный ключ Telegram уже встроен; для тестового окружения передайте `{ publicKeyHex }`.

## Только свои

```ts
telegramAuth: { allowedUsers: [123456789, '@lead_dev', 'ops_bot_admin'] }
```

Остальные получат 403 ещё до создания сессии. Удобно для админок и внутренних инструментов.

## Хуки: пользователи в своей БД

```ts
// server/plugins/users.ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('telegram-auth:login', async ({ user, startParam }) => {
    if (await db.bans.has(user.id)) throw createError({ statusCode: 403, statusMessage: 'Banned' }) // вето
    await db.users.upsert({ id: user.id, name: user.first_name, referral: startParam })
  })
  nitro.hooks.hook('telegram-auth:logout', ({ user }) => audit.log('logout', user.id))
})
```

`startParam` — это параметр из диплинка `t.me/my_bot/app?startapp=ref_42`, удобно для реферальных кодов.

## Серверные обработчики

```ts
// server/api/orders.get.ts
export default defineTelegramAuthHandler(async (event, user) => {
  return db.orders.findMany({ where: { userId: user.id } }) // гость получит 401
})
```

Также доступны `requireTelegramUser(event)`, `getTelegramUser(event)`, `verifyTelegramLogin()`, `verifyWebAppInitData()` и `verifyWebAppSignature()`.

## Локальная разработка без Telegram

Виджет не работает на `localhost`, поэтому в dev-режиме есть вход без Telegram:

```ts
const { devLogin } = useTelegramAuth()
await devLogin({ id: 42, first_name: 'Ada' })
```

Маршрут `/api/_auth/telegram/dev-login` регистрируется только в `nuxi dev` и отсутствует в продакшен-сборке.

## Установка

```bash
npm i nuxt-telegram-auth
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-telegram-auth'],
  telegramAuth: { botUsername: 'my_bot' },
})
```

```bash
# .env
NUXT_TELEGRAM_AUTH_BOT_TOKEN=123456:ABC...
NUXT_TELEGRAM_AUTH_SESSION_PASSWORD=случайная-строка-минимум-32-символа
```

В @BotFather выполните `/setdomain` и укажите домен сайта, иначе виджет не отрисуется.

## Опции

| Опция | По умолчанию | |
|---|---|---|
| `botUsername` | — | Имя бота без `@` |
| `botToken` | — | Лучше через `NUXT_TELEGRAM_AUTH_BOT_TOKEN` |
| `sessionPassword` | — | Не короче 32 символов, через `NUXT_TELEGRAM_AUTH_SESSION_PASSWORD` |
| `authMaxAge` | `86400` | Максимальный возраст данных Login Widget, секунды |
| `webAppMaxAge` | `3600` | Максимальный возраст `initData` Mini App, секунды |
| `sessionMaxAge` | `2592000` | Срок жизни сессии; продлевается при активности |
| `allowedUsers` | `[]` | id или username, которым разрешён вход |
| `redirectTo` | `/login` | Куда middleware `telegram-auth` отправляет гостей |
| `webApp` | `false` | Подключить `telegram-web-app.js` |
| `cookie` | `{ name: 'nuxt-telegram-auth', sameSite: 'lax' }` | Имя, домен, SameSite и Secure для cookie |
| `apiBase` | `/api/_auth/telegram` | Префикс маршрутов `login`, `webapp`, `callback`, `session`, `logout` |

## Безопасность

| Угроза | Что делает модуль |
|---|---|
| Подделка данных пользователя | HMAC-SHA256 подпись Telegram проверяется на сервере, сравнение за константное время |
| Повтор старых данных | `auth_date` не старше `authMaxAge` / `webAppMaxAge` |
| Login CSRF | POST-маршруты отклоняют чужой `Origin` |
| Open redirect | `redirect` принимает только относительные пути |
| Кража сессии через JS | cookie `httpOnly`, `Secure` в продакшене, содержимое зашифровано |

## Деплой

Модуль использует только Web Crypto и `h3`, поэтому работает на любом пресете Nitro: Node, Bun, Deno, Cloudflare Workers/Pages, Vercel и Netlify Edge.

```bash
NITRO_PRESET=cloudflare_pages nuxi build
wrangler pages secret put NUXT_TELEGRAM_AUTH_BOT_TOKEN
wrangler pages secret put NUXT_TELEGRAM_AUTH_SESSION_PASSWORD
```

## Разработка

```bash
npm i
cp playground/.env.example playground/.env
npm run dev:prepare
npm run dev
npm test
```

## Лицензия

MIT
